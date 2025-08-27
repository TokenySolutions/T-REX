import hre from "hardhat";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import OnchainID from '@onchain-id/solidity';
import { BigNumber } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

/// We could probz do a better job with batching deployments buut oh well this is fine for now :XD

const DEPOSIT_LIMIT = BigInt('340282366920938463463374607431768211455');

function validateBytecode(bytecode: string): boolean {
  if (!bytecode || bytecode === '0x') throw new Error('Invalid bytecode: empty');
  if (!bytecode.startsWith('0x')) throw new Error('Bytecode must start with 0x');
  const cleanBytecode = bytecode.slice(2);
  if (cleanBytecode.length % 2 !== 0) throw new Error('Bytecode must have even number of hex characters');
  return true;
}

async function uploadCode(api: ApiPromise, contractName: string, bytecode: string, signer: any): Promise<string> {
  validateBytecode(bytecode);

  const reviveApi = (api.call as any).reviveApi;
  if (!reviveApi?.uploadCode) throw new Error('reviveApi.uploadCode not available');

  const result = await reviveApi.uploadCode(
    signer.address,
    bytecode,
    DEPOSIT_LIMIT.toString()
  );

  if (result.isOk) {
    const { codeHash } = result.asOk;
    console.log(`${contractName} bytecode uploaded. Code hash: ${codeHash.toString()}`);
    return codeHash.toString();
  } else {
    throw new Error(`Upload failed: ${JSON.stringify(result.asErr.toHuman())}`);
  }
}

async function deployIdentityProxy(implementationAuthority: string, managementKey: string, deployer: any) {
  const identity = await new hre.ethers.ContractFactory(
    OnchainID.contracts.IdentityProxy.abi, 
    OnchainID.contracts.IdentityProxy.bytecode, 
    deployer
  ).deploy(implementationAuthority, managementKey);
  await identity.deployed();

  return hre.ethers.getContractAt('Identity', identity.address, deployer);
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const aliceWallet = hre.ethers.Wallet.createRandom();
  const bobWallet = hre.ethers.Wallet.createRandom();
  const charlieWallet = hre.ethers.Wallet.createRandom();
  console.log("Created test wallets:");
  console.log("Alice:", aliceWallet.address);
  console.log("Bob:", bobWallet.address);
  console.log("Charlie:", charlieWallet.address);

  const provider = new WsProvider('ws://localhost:9944');
  const api = await ApiPromise.create({ provider });
  await api.isReady;

  const keyring = new Keyring({ type: 'sr25519' });
  const signer = keyring.addFromUri('//Alice');
  console.log('Substrate signer:', signer.address);

  try {
    const contractsToUpload = [
      'ClaimTopicsRegistry',
      'TrustedIssuersRegistry', 
      'IdentityRegistryStorage',
      'IdentityRegistry',
      'ModularCompliance',
      'Token',
      'TREXImplementationAuthority',
      'TREXFactory',
      'AgentManager'
    ];

    const codeHashes: Record<string, string> = {};
    for (const contractName of contractsToUpload) {
      try {
        const factory = await hre.ethers.getContractFactory(contractName);
        codeHashes[contractName] = await uploadCode(api, contractName, factory.bytecode, signer);
      } catch (error: any) {
        console.log(`Warning: Could not upload ${contractName}: ${error.message}`);
      }
    }

    console.log("Deploying implementation contracts...");
    const claimTopicsRegistryImplementation = await hre.ethers.deployContract('ClaimTopicsRegistry', deployer);
    await claimTopicsRegistryImplementation.deployed();
    console.log("ClaimTopicsRegistry implementation deployed:", claimTopicsRegistryImplementation.address);
    
    const trustedIssuersRegistryImplementation = await hre.ethers.deployContract('TrustedIssuersRegistry', deployer);  
    await trustedIssuersRegistryImplementation.deployed();
    console.log("TrustedIssuersRegistry implementation deployed:", trustedIssuersRegistryImplementation.address);
    
    const identityRegistryStorageImplementation = await hre.ethers.deployContract('IdentityRegistryStorage', deployer);
    await identityRegistryStorageImplementation.deployed();
    console.log("IdentityRegistryStorage implementation deployed:", identityRegistryStorageImplementation.address);
    
    const identityRegistryImplementation = await hre.ethers.deployContract('IdentityRegistry', deployer);
    await identityRegistryImplementation.deployed();
    console.log("IdentityRegistry implementation deployed:", identityRegistryImplementation.address);
    
    const modularComplianceImplementation = await hre.ethers.deployContract('ModularCompliance', deployer);
    await modularComplianceImplementation.deployed();
    console.log("ModularCompliance implementation deployed:", modularComplianceImplementation.address);
    
    const tokenImplementation = await hre.ethers.deployContract('Token', deployer);
    await tokenImplementation.deployed();
    console.log("Token implementation deployed:", tokenImplementation.address);
    
    const identityImplementation = await new hre.ethers.ContractFactory(
      OnchainID.contracts.Identity.abi,
      OnchainID.contracts.Identity.bytecode,
      deployer,
    ).deploy(deployer.address, true);
    await identityImplementation.deployed();
    console.log("Identity implementation deployed:", identityImplementation.address);

    console.log("Deploying OnchainID contracts...");
    const identityImplementationAuthority = await new hre.ethers.ContractFactory(
      OnchainID.contracts.ImplementationAuthority.abi,
      OnchainID.contracts.ImplementationAuthority.bytecode,
      deployer,
    ).deploy(identityImplementation.address);
    await identityImplementationAuthority.deployed();
    console.log("Identity Implementation Authority deployed:", identityImplementationAuthority.address);

    const identityFactory = await new hre.ethers.ContractFactory(
      OnchainID.contracts.Factory.abi, 
      OnchainID.contracts.Factory.bytecode, 
      deployer
    ).deploy(identityImplementationAuthority.address);
    await identityFactory.deployed();
    console.log("Identity Factory deployed:", identityFactory.address);

    console.log("Deploying TREX Implementation Authority...");
    const trexImplementationAuthority = await hre.ethers.deployContract(
      'TREXImplementationAuthority',
      [true, hre.ethers.constants.AddressZero, hre.ethers.constants.AddressZero],
      deployer,
    );
    await trexImplementationAuthority.deployed();
    console.log("TREX Implementation Authority deployed:", trexImplementationAuthority.address);
    
    console.log("Adding TREX version to Implementation Authority...");
    const versionStruct = {
      major: 4,
      minor: 0,
      patch: 0,
    };
    const contractsStruct = {
      tokenImplementation: tokenImplementation.address,
      ctrImplementation: claimTopicsRegistryImplementation.address,
      irImplementation: identityRegistryImplementation.address,
      irsImplementation: identityRegistryStorageImplementation.address,
      tirImplementation: trustedIssuersRegistryImplementation.address,
      mcImplementation: modularComplianceImplementation.address,
    };
    await trexImplementationAuthority.connect(deployer).addAndUseTREXVersion(versionStruct, contractsStruct);
    console.log("TREX version 4.0.0 added and activated");

    console.log("Deploying TREX Factory...");
    const trexFactory = await hre.ethers.deployContract(
      'TREXFactory', 
      [trexImplementationAuthority.address, identityFactory.address], 
      deployer
    );
    await trexFactory.deployed();
    console.log("TREX Factory deployed:", trexFactory.address);
    
    console.log("Linking factories...");
    await identityFactory.connect(deployer).addTokenFactory(trexFactory.address);
    console.log("Factories linked");

    console.log("Deploying proxy contracts...");
    const claimTopicsRegistry = await hre.ethers
      .deployContract('ClaimTopicsRegistryProxy', [trexImplementationAuthority.address], deployer)
      .then(async (proxy) => {
        await proxy.deployed();
        console.log("ClaimTopicsRegistry proxy deployed:", proxy.address);
        return hre.ethers.getContractAt('ClaimTopicsRegistry', proxy.address);
      });

    const trustedIssuersRegistry = await hre.ethers
      .deployContract('TrustedIssuersRegistryProxy', [trexImplementationAuthority.address], deployer)
      .then(async (proxy) => {
        await proxy.deployed();
        console.log("TrustedIssuersRegistry proxy deployed:", proxy.address);
        return hre.ethers.getContractAt('TrustedIssuersRegistry', proxy.address);
      });

    const identityRegistryStorage = await hre.ethers
      .deployContract('IdentityRegistryStorageProxy', [trexImplementationAuthority.address], deployer)
      .then(async (proxy) => {
        await proxy.deployed();
        console.log("IdentityRegistryStorage proxy deployed:", proxy.address);
        return hre.ethers.getContractAt('IdentityRegistryStorage', proxy.address);
      });

    const defaultCompliance = await hre.ethers.deployContract('DefaultCompliance', deployer);
    await defaultCompliance.deployed();
    console.log("DefaultCompliance deployed:", defaultCompliance.address);

    const identityRegistry = await hre.ethers
      .deployContract(
        'IdentityRegistryProxy',
        [trexImplementationAuthority.address, trustedIssuersRegistry.address, claimTopicsRegistry.address, identityRegistryStorage.address],
        deployer,
      )
      .then(async (proxy) => {
        await proxy.deployed();
        console.log("IdentityRegistry proxy deployed:", proxy.address);
        return hre.ethers.getContractAt('IdentityRegistry', proxy.address);
      });

    console.log("Deploying Token OnchainID...");
    const tokenOID = await deployIdentityProxy(identityImplementationAuthority.address, deployer.address, deployer);
    console.log("Token OnchainID deployed:", tokenOID.address);
    
    console.log("Deploying Token proxy...");
    const tokenName = 'TREXDINO';
    const tokenSymbol = 'TREX';
    const tokenDecimals = BigNumber.from('0');
    const token = await hre.ethers
      .deployContract(
        'TokenProxy',
        [
          trexImplementationAuthority.address,
          identityRegistry.address,
          defaultCompliance.address,
          tokenName,
          tokenSymbol,
          tokenDecimals,
          tokenOID.address,
        ],
        deployer,
      )
      .then(async (proxy) => {
        await proxy.deployed();
        console.log("Token proxy deployed:", proxy.address);
        return hre.ethers.getContractAt('Token', proxy.address);
      });

    console.log("Deploying Agent Manager...");
    const agentManager = await hre.ethers.deployContract('AgentManager', [token.address], deployer);
    await agentManager.deployed();
    console.log("Agent Manager deployed:", agentManager.address);

    console.log("Setting up registry bindings...");
    await identityRegistryStorage.connect(deployer).bindIdentityRegistry(identityRegistry.address);
    await token.connect(deployer).addAgent(deployer.address);
    console.log("Registry bindings complete");

    console.log("Setting up claim topics...");
    const claimTopics = [hre.ethers.utils.id('CLAIM_TOPIC')];
    await claimTopicsRegistry.connect(deployer).addClaimTopic(claimTopics[0]);
    console.log("Claim topics added");

    console.log("Deploying Claim Issuer...");
    const claimIssuerContract = await hre.ethers.deployContract('ClaimIssuer', [deployer.address], deployer);
    await claimIssuerContract.deployed();
    console.log("Claim Issuer deployed:", claimIssuerContract.address);
    
    console.log("Adding key to Claim Issuer...");
    await claimIssuerContract
      .connect(deployer)
      .addKey(hre.ethers.utils.keccak256(hre.ethers.utils.defaultAbiCoder.encode(['address'], [deployer.address])), 3, 1);
    console.log("Claim Issuer key added");

    console.log("Adding trusted issuer...");
    await trustedIssuersRegistry.connect(deployer).addTrustedIssuer(claimIssuerContract.address, claimTopics);
    console.log("Trusted issuer added");

    console.log("Creating user identities...");
    const aliceIdentity = await deployIdentityProxy(identityImplementationAuthority.address, deployer.address, deployer);
    console.log("Alice identity deployed:", aliceIdentity.address);
    
    await aliceIdentity
      .connect(deployer)
      .addKey(hre.ethers.utils.keccak256(hre.ethers.utils.defaultAbiCoder.encode(['address'], [deployer.address])), 2, 1);
    console.log("Alice identity key added");
    
    const bobIdentity = await deployIdentityProxy(identityImplementationAuthority.address, deployer.address, deployer);
    console.log("Bob identity deployed:", bobIdentity.address);
    
    const charlieIdentity = await deployIdentityProxy(identityImplementationAuthority.address, deployer.address, deployer);
    console.log("Charlie identity deployed:", charlieIdentity.address);

    console.log("Setting up agents...");
    await identityRegistry.connect(deployer).addAgent(deployer.address);
    await identityRegistry.connect(deployer).addAgent(token.address);
    console.log("Agents added to Identity Registry");

    console.log("Registering identities...");
    await identityRegistry
      .connect(deployer)
      .batchRegisterIdentity([aliceWallet.address, bobWallet.address], [aliceIdentity.address, bobIdentity.address], [42, 666]);
    console.log("Identities registered");

    console.log("Creating and adding claims...");
    const claimForAlice = {
      data: hre.ethers.utils.hexlify(hre.ethers.utils.toUtf8Bytes('Some claim public data.')),
      issuer: claimIssuerContract.address,
      topic: claimTopics[0],
      scheme: 1,
      identity: aliceIdentity.address,
      signature: '',
    };
    claimForAlice.signature = await deployer.signMessage(
      hre.ethers.utils.arrayify(
        hre.ethers.utils.keccak256(
          hre.ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'bytes'], [claimForAlice.identity, claimForAlice.topic, claimForAlice.data]),
        ),
      ),
    );

    await aliceIdentity
      .connect(deployer)
      .addClaim(claimForAlice.topic, claimForAlice.scheme, claimForAlice.issuer, claimForAlice.signature, claimForAlice.data, '');
    console.log("Alice claim added");

    const claimForBob = {
      data: hre.ethers.utils.hexlify(hre.ethers.utils.toUtf8Bytes('Some claim public data.')),
      issuer: claimIssuerContract.address,
      topic: claimTopics[0],
      scheme: 1,
      identity: bobIdentity.address,
      signature: '',
    };
    claimForBob.signature = await deployer.signMessage(
      hre.ethers.utils.arrayify(
        hre.ethers.utils.keccak256(
          hre.ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'bytes'], [claimForBob.identity, claimForBob.topic, claimForBob.data]),
        ),
      ),
    );

    await bobIdentity
      .connect(deployer)
      .addClaim(claimForBob.topic, claimForBob.scheme, claimForBob.issuer, claimForBob.signature, claimForBob.data, '');
    console.log("Bob claim added");

    console.log("Minting tokens...");
    await token.connect(deployer).mint(aliceWallet.address, 1000);
    await token.connect(deployer).mint(bobWallet.address, 500);
    console.log("Tokens minted");

    console.log("Funding test wallets with ETH...");
    await deployer.sendTransaction({
      to: aliceWallet.address,
      value: hre.ethers.utils.parseEther("1.0")
    });
    await deployer.sendTransaction({
      to: bobWallet.address,
      value: hre.ethers.utils.parseEther("1.0")
    });
    await deployer.sendTransaction({
      to: charlieWallet.address,
      value: hre.ethers.utils.parseEther("1.0")
    });
    console.log("Test wallets funded with 1 ETH each");

    console.log("Configuring agents...");
    await agentManager.connect(deployer).addAgentAdmin(deployer.address);
    console.log("Deployer added as Agent Manager admin");
    
    await token.connect(deployer).addAgent(agentManager.address);
    console.log("Agent Manager added as agent to Token");
    
    await identityRegistry.connect(deployer).addAgent(agentManager.address);
    console.log("Agent Manager added as agent to Identity Registry");

    console.log("Unpausing token...");
    await token.connect(deployer).unpause();
    console.log("Token unpaused");

    console.log("\n=== DEPLOYMENT SUMMARY ===");
    
    console.log("\nFactory Contracts:");
    console.log("TREXFactory:", trexFactory.address);
    console.log("IdFactory:", identityFactory.address);
    console.log("TREXImplementationAuthority:", trexImplementationAuthority.address);

    console.log("\nCore TREX Contracts (Proxy):");
    console.log("Token:", token.address);
    console.log("Identity Registry:", identityRegistry.address);
    console.log("Identity Registry Storage:", identityRegistryStorage.address);
    console.log("Trusted Issuers Registry:", trustedIssuersRegistry.address);
    console.log("Claim Topics Registry:", claimTopicsRegistry.address);
    console.log("Default Compliance:", defaultCompliance.address);
    console.log("Agent Manager:", agentManager.address);

    console.log("\nOnchainID Contracts:");
    console.log("Identity Implementation:", identityImplementation.address);
    console.log("Identity Implementation Authority:", identityImplementationAuthority.address);
    console.log("Token OnchainID:", tokenOID.address);
    console.log("Claim Issuer:", claimIssuerContract.address);

    console.log("\nUser Identities:");
    console.log("Alice Identity:", aliceIdentity.address);
    console.log("Bob Identity:", bobIdentity.address);
    console.log("Charlie Identity:", charlieIdentity.address);

    console.log("\nTest Wallet Private Keys:");
    console.log("Alice Private Key:", aliceWallet.privateKey);
    console.log("Bob Private Key:", bobWallet.privateKey);
    console.log("Charlie Private Key:", charlieWallet.privateKey);

    console.log("\nSaving deployment information...");
    const network = await hre.ethers.provider.getNetwork();
    const chainId = network.chainId;
    
    const deploymentDir = path.join(process.cwd(), 'deployment');
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
      console.log("Created deployment directory");
    }

    const deploymentData = {
      chainId: chainId,
      network: hre.network.name,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      factories: {
        trexFactory: trexFactory.address,
        identityFactory: identityFactory.address,
      },
      authorities: {
        trexImplementationAuthority: trexImplementationAuthority.address,
        identityImplementationAuthority: identityImplementationAuthority.address,
      },
      implementations: {
        identityImplementation: identityImplementation.address,
        claimTopicsRegistryImplementation: claimTopicsRegistryImplementation.address,
        trustedIssuersRegistryImplementation: trustedIssuersRegistryImplementation.address,
        identityRegistryStorageImplementation: identityRegistryStorageImplementation.address,
        identityRegistryImplementation: identityRegistryImplementation.address,
        modularComplianceImplementation: modularComplianceImplementation.address,
        tokenImplementation: tokenImplementation.address,
      },
      suite: {
        token: token.address,
        identityRegistry: identityRegistry.address,
        identityRegistryStorage: identityRegistryStorage.address,
        trustedIssuersRegistry: trustedIssuersRegistry.address,
        claimTopicsRegistry: claimTopicsRegistry.address,
        defaultCompliance: defaultCompliance.address,
        agentManager: agentManager.address,
        tokenOID: tokenOID.address,
        claimIssuerContract: claimIssuerContract.address,
      },
      testWallets: {
        alice: {
          address: aliceWallet.address,
          privateKey: aliceWallet.privateKey,
          identity: aliceIdentity.address,
        },
        bob: {
          address: bobWallet.address,
          privateKey: bobWallet.privateKey,
          identity: bobIdentity.address,
        },
        charlie: {
          address: charlieWallet.address,
          privateKey: charlieWallet.privateKey,
          identity: charlieIdentity.address,
        },
      },
      tokenInfo: {
        name: 'TREXDINO',
        symbol: 'TREX',
        decimals: 0,
      },
    };

    const deploymentFile = path.join(deploymentDir, `${chainId}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    console.log(`Deployment saved to: ${deploymentFile}`);
  } finally {
    await api.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});