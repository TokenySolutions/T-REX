import hre from "hardhat";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import OnchainID from "@onchain-id/solidity";
import { BigNumber } from "ethers";
import * as fs from "fs";
import * as path from "path";

const DEPOSIT_LIMIT = BigInt("340282366920938463463374607431768211455");
const wallets: { pubAddress: string; privateKey: string }[] = [];

function validateBytecode(bytecode: string): boolean {
  if (!bytecode || bytecode === "0x") throw new Error("Invalid bytecode: empty");
  if (!bytecode.startsWith("0x")) throw new Error("Bytecode must start with 0x");
  const cleanBytecode = bytecode.slice(2);
  if (cleanBytecode.length % 2 !== 0) throw new Error("Bytecode must have even number of hex characters");
  return true;
}

async function uploadCode(api: ApiPromise, contractName: string, bytecode: string, signer: any): Promise<string> {
  validateBytecode(bytecode);
  const reviveApi = (api.call as any).reviveApi;
  if (!reviveApi?.uploadCode) throw new Error("reviveApi.uploadCode not available");
  const result = await reviveApi.uploadCode(signer.address, bytecode, DEPOSIT_LIMIT.toString());
  if (result.isOk) {
    const { codeHash } = result.asOk;
    console.log(`${contractName} bytecode uploaded. Code hash: ${codeHash.toString()}`);
    return codeHash.toString();
  } else {
    throw new Error(`Upload failed: ${JSON.stringify(result.asErr.toHuman())}`);
  }
}

async function deployIdentityProxy(implementationAuthority: string, managementKey: string, deployer: any) {
  const identityProxy = await new hre.ethers.ContractFactory(
    OnchainID.contracts.IdentityProxy.abi,
    OnchainID.contracts.IdentityProxy.bytecode,
    deployer
  ).deploy(implementationAuthority, managementKey);
  await identityProxy.deployed();
  return hre.ethers.getContractAt("Identity", identityProxy.address, deployer);
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const aliceWallet = hre.ethers.Wallet.createRandom();
  const bobWallet = hre.ethers.Wallet.createRandom();
  const charlieWallet = hre.ethers.Wallet.createRandom();
  for (let i = 0; i < 30; i++) {
    const wallet = hre.ethers.Wallet.createRandom();
    wallets.push({
      pubAddress: wallet.address,
      privateKey: wallet.privateKey
    });
  }

  console.log("Created test wallets:");
  console.log("Alice:", aliceWallet.address);
  console.log("Bob:", bobWallet.address);
  console.log("Charlie:", charlieWallet.address);

  const provider = new WsProvider("ws://localhost:9944");
  const api = await ApiPromise.create({ provider });
  await api.isReady;

  const keyring = new Keyring({ type: "sr25519" });
  const signer = keyring.addFromUri("//Alice");
  console.log("Substrate signer:", signer.address);

  try {
    const contractsToUpload = [
      "ClaimTopicsRegistry",
      "TrustedIssuersRegistry",
      "IdentityRegistryStorage",
      "IdentityRegistry",
      "ModularCompliance",
      "Token",
      "TREXImplementationAuthority",
      "TREXFactory",
      "AgentManager"
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

    console.log("Deploying implementations...");
    const claimTopicsRegistryImplementation = await hre.ethers.deployContract("ClaimTopicsRegistry", deployer);
    await claimTopicsRegistryImplementation.deployed();
    console.log("ClaimTopicsRegistry implementation deployed:", claimTopicsRegistryImplementation.address);

    const trustedIssuersRegistryImplementation = await hre.ethers.deployContract("TrustedIssuersRegistry", deployer);
    await trustedIssuersRegistryImplementation.deployed();
    console.log("TrustedIssuersRegistry implementation deployed:", trustedIssuersRegistryImplementation.address);

    const identityRegistryStorageImplementation = await hre.ethers.deployContract("IdentityRegistryStorage", deployer);
    await identityRegistryStorageImplementation.deployed();
    console.log("IdentityRegistryStorage implementation deployed:", identityRegistryStorageImplementation.address);

    const identityRegistryImplementation = await hre.ethers.deployContract("IdentityRegistry", deployer);
    await identityRegistryImplementation.deployed();
    console.log("IdentityRegistry implementation deployed:", identityRegistryImplementation.address);

    const modularComplianceImplementation = await hre.ethers.deployContract("ModularCompliance", deployer);
    await modularComplianceImplementation.deployed();
    console.log("ModularCompliance implementation deployed (for IA version tuple):", modularComplianceImplementation.address);

    const tokenImplementation = await hre.ethers.deployContract("Token", deployer);
    await tokenImplementation.deployed();
    console.log("Token implementation deployed:", tokenImplementation.address);

    const identityImplementation = await new hre.ethers.ContractFactory(
      OnchainID.contracts.Identity.abi,
      OnchainID.contracts.Identity.bytecode,
      deployer
    ).deploy(deployer.address, true);
    await identityImplementation.deployed();
    console.log("Identity implementation deployed:", identityImplementation.address);

    console.log("Deploying OnchainID contracts...");
    const identityImplementationAuthority = await new hre.ethers.ContractFactory(
      OnchainID.contracts.ImplementationAuthority.abi,
      OnchainID.contracts.ImplementationAuthority.bytecode,
      deployer
    ).deploy(identityImplementation.address);
    await identityImplementationAuthority.deployed();
    console.log("Identity ImplementationAuthority deployed:", identityImplementationAuthority.address);

    const identityFactory = await new hre.ethers.ContractFactory(
      OnchainID.contracts.Factory.abi,
      OnchainID.contracts.Factory.bytecode,
      deployer
    ).deploy(identityImplementationAuthority.address);
    await identityFactory.deployed();
    console.log("Identity Factory deployed:", identityFactory.address);

    console.log("Deploying TREX ImplementationAuthority...");
    const trexImplementationAuthority = await hre.ethers.deployContract(
      "TREXImplementationAuthority",
      [true, hre.ethers.constants.AddressZero, hre.ethers.constants.AddressZero],
      deployer
    );
    await trexImplementationAuthority.deployed();
    console.log("TREX ImplementationAuthority deployed:", trexImplementationAuthority.address);

    console.log("Adding TREX version to ImplementationAuthority...");
    const versionStruct = { major: 4, minor: 0, patch: 0 };
    const contractsStruct = {
      tokenImplementation: tokenImplementation.address,
      ctrImplementation: claimTopicsRegistryImplementation.address,
      irImplementation: identityRegistryImplementation.address,
      irsImplementation: identityRegistryStorageImplementation.address,
      tirImplementation: trustedIssuersRegistryImplementation.address,
      mcImplementation: modularComplianceImplementation.address
    };
    await trexImplementationAuthority.connect(deployer).addAndUseTREXVersion(versionStruct, contractsStruct);
    console.log("TREX version 4.0.0 added and activated");

    console.log("Deploying TREX Factory...");
    const trexFactory = await hre.ethers.deployContract("TREXFactory", [trexImplementationAuthority.address, identityFactory.address], deployer);
    await trexFactory.deployed();
    console.log("TREX Factory deployed:", trexFactory.address);

    console.log("Linking factories...");
    await identityFactory.connect(deployer).addTokenFactory(trexFactory.address);
    console.log("Factories linked");

    console.log("Deploying proxy contracts...");
    const claimTopicsRegistryProxy = await hre.ethers
      .deployContract("ClaimTopicsRegistryProxy", [trexImplementationAuthority.address], deployer)
      .then(async (proxy: { deployed: () => any; address: any; }) => {
        await proxy.deployed();
        console.log("ClaimTopicsRegistry Proxy deployed:", proxy.address);
        return hre.ethers.getContractAt("ClaimTopicsRegistry", proxy.address);
      });

    const trustedIssuersRegistryProxy = await hre.ethers
      .deployContract("TrustedIssuersRegistryProxy", [trexImplementationAuthority.address], deployer)
      .then(async (proxy: { deployed: () => any; address: any; }) => {
        await proxy.deployed();
        console.log("TrustedIssuersRegistry Proxy deployed:", proxy.address);
        return hre.ethers.getContractAt("TrustedIssuersRegistry", proxy.address);
      });

    const identityRegistryStorageProxy = await hre.ethers
      .deployContract("IdentityRegistryStorageProxy", [trexImplementationAuthority.address], deployer)
      .then(async (proxy: { deployed: () => any; address: any; }) => {
        await proxy.deployed();
        console.log("IdentityRegistryStorage Proxy deployed:", proxy.address);
        return hre.ethers.getContractAt("IdentityRegistryStorage", proxy.address);
      });

    const identityRegistryProxy = await hre.ethers
      .deployContract(
        "IdentityRegistryProxy",
        [trexImplementationAuthority.address, trustedIssuersRegistryProxy.address, claimTopicsRegistryProxy.address, identityRegistryStorageProxy.address],
        deployer
      )
      .then(async (proxy: { deployed: () => any; address: any; }) => {
        await proxy.deployed();
        console.log("IdentityRegistry Proxy deployed:", proxy.address);
        return hre.ethers.getContractAt("IdentityRegistry", proxy.address);
      });

    console.log("Deploying DefaultCompliance...");
    const defaultCompliance = await hre.ethers.deployContract("DefaultCompliance", deployer);
    await defaultCompliance.deployed();
    console.log("DefaultCompliance deployed:", defaultCompliance.address);

    console.log("Deploying Token OnchainID (IdentityProxy)...");
    const tokenOID = await deployIdentityProxy(identityImplementationAuthority.address, deployer.address, deployer);
    console.log("Token Identity Proxy deployed at (access via Identity ABI):", tokenOID.address);

    console.log("Deploying Token Proxy...");
    const tokenName = "TREXDINO";
    const tokenSymbol = "TREX";
    const tokenDecimals = BigNumber.from("0");
    const tokenProxy = await hre.ethers
      .deployContract(
        "TokenProxy",
        [
          trexImplementationAuthority.address,
          identityRegistryProxy.address,
          defaultCompliance.address,
          tokenName,
          tokenSymbol,
          tokenDecimals,
          tokenOID.address
        ],
        deployer
      )
      .then(async (proxy: { deployed: () => any; address: any; }) => {
        await proxy.deployed();
        console.log("Token Proxy deployed:", proxy.address);
        return hre.ethers.getContractAt("Token", proxy.address);
      });

    console.log("Deploying AgentManager...");
    const agentManager = await hre.ethers.deployContract("AgentManager", [tokenProxy.address], deployer);
    await agentManager.deployed();
    console.log("AgentManager deployed:", agentManager.address);

    console.log("Setting up registry bindings...");
    await identityRegistryStorageProxy.connect(deployer).bindIdentityRegistry(identityRegistryProxy.address);
    await tokenProxy.connect(deployer).addAgent(deployer.address);
    console.log("Registry bindings complete");

    console.log("Setting up claim topics...");
    const claimTopics = [hre.ethers.utils.id("CLAIM_TOPIC")];
    await claimTopicsRegistryProxy.connect(deployer).addClaimTopic(claimTopics[0]);
    console.log("Claim topics added");

    console.log("Deploying ClaimIssuer...");
    const claimIssuerContract = await hre.ethers.deployContract("ClaimIssuer", [deployer.address], deployer);
    await claimIssuerContract.deployed();
    console.log("ClaimIssuer deployed:", claimIssuerContract.address);

    console.log("Adding key to ClaimIssuer...");
    await claimIssuerContract
      .connect(deployer)
      .addKey(hre.ethers.utils.keccak256(hre.ethers.utils.defaultAbiCoder.encode(["address"], [deployer.address])), 3, 1);
    console.log("ClaimIssuer key added");

    console.log("Adding trusted issuer...");
    await trustedIssuersRegistryProxy.connect(deployer).addTrustedIssuer(claimIssuerContract.address, claimTopics);
    console.log("Trusted issuer added");

    console.log("Creating user identities (IdentityProxy)...");
    const aliceIdentityProxy = await deployIdentityProxy(identityImplementationAuthority.address, deployer.address, deployer);
    console.log("Alice Identity Proxy deployed:", aliceIdentityProxy.address);

    await aliceIdentityProxy
      .connect(deployer)
      .addKey(hre.ethers.utils.keccak256(hre.ethers.utils.defaultAbiCoder.encode(["address"], [deployer.address])), 2, 1);
    console.log("Alice identity key added");

    const bobIdentityProxy = await deployIdentityProxy(identityImplementationAuthority.address, deployer.address, deployer);
    console.log("Bob Identity Proxy deployed:", bobIdentityProxy.address);

    const charlieIdentityProxy = await deployIdentityProxy(identityImplementationAuthority.address, deployer.address, deployer);
    console.log("Charlie Identity Proxy deployed:", charlieIdentityProxy.address);

    console.log("Setting up agents...");
    await identityRegistryProxy.connect(deployer).addAgent(deployer.address);
    await identityRegistryProxy.connect(deployer).addAgent(tokenProxy.address);
    console.log("Agents added to IdentityRegistry (Proxy)");

    console.log("Registering identities...");
    await identityRegistryProxy
      .connect(deployer)
      .batchRegisterIdentity([aliceWallet.address, bobWallet.address], [aliceIdentityProxy.address, bobIdentityProxy.address], [42, 666]);
    console.log("Identities registered");

    console.log("Creating and adding claims...");
    const claimForAlice = {
      data: hre.ethers.utils.hexlify(hre.ethers.utils.toUtf8Bytes("Some claim public data.")),
      issuer: claimIssuerContract.address,
      topic: claimTopics[0],
      scheme: 1,
      identity: aliceIdentityProxy.address,
      signature: ""
    };
    claimForAlice.signature = await deployer.signMessage(
      hre.ethers.utils.arrayify(
        hre.ethers.utils.keccak256(
          hre.ethers.utils.defaultAbiCoder.encode(["address", "uint256", "bytes"], [claimForAlice.identity, claimForAlice.topic, claimForAlice.data])
        )
      )
    );

    await aliceIdentityProxy
      .connect(deployer)
      .addClaim(claimForAlice.topic, claimForAlice.scheme, claimForAlice.issuer, claimForAlice.signature, claimForAlice.data, "");
    console.log("Alice claim added");

    const claimForBob = {
      data: hre.ethers.utils.hexlify(hre.ethers.utils.toUtf8Bytes("Some claim public data.")),
      issuer: claimIssuerContract.address,
      topic: claimTopics[0],
      scheme: 1,
      identity: bobIdentityProxy.address,
      signature: ""
    };
    claimForBob.signature = await deployer.signMessage(
      hre.ethers.utils.arrayify(
        hre.ethers.utils.keccak256(
          hre.ethers.utils.defaultAbiCoder.encode(["address", "uint256", "bytes"], [claimForBob.identity, claimForBob.topic, claimForBob.data])
        )
      )
    );

    await bobIdentityProxy
      .connect(deployer)
      .addClaim(claimForBob.topic, claimForBob.scheme, claimForBob.issuer, claimForBob.signature, claimForBob.data, "");
    console.log("Bob claim added");

    console.log("Minting tokens...");
    await tokenProxy.connect(deployer).mint(aliceWallet.address, 1000);
    await tokenProxy.connect(deployer).mint(bobWallet.address, 500);
    console.log("Tokens minted");

    console.log("Funding test wallets with ETH...");
    await deployer.sendTransaction({ to: aliceWallet.address, value: hre.ethers.utils.parseEther("1000000.0") });
    await deployer.sendTransaction({ to: bobWallet.address, value: hre.ethers.utils.parseEther("1000000.0") });
    await deployer.sendTransaction({ to: charlieWallet.address, value: hre.ethers.utils.parseEther("1000000.0") });
    for (const w of wallets) {
      await deployer.sendTransaction({ to: w.pubAddress, value: hre.ethers.utils.parseEther("1000000.0") });
    }

    console.log("Test wallets funded");
    console.log("Configuring agents...");
    await agentManager.connect(deployer).addAgentAdmin(deployer.address);
    console.log("Deployer added as AgentManager admin");

    await tokenProxy.connect(deployer).addAgent(agentManager.address);
    console.log("AgentManager added as agent to Token (Proxy)");

    await identityRegistryProxy.connect(deployer).addAgent(agentManager.address);
    console.log("AgentManager added as agent to IdentityRegistry (Proxy)");

    console.log("Unpausing token (Proxy)...");
    await tokenProxy.connect(deployer).unpause();
    console.log("Token unpaused");

    console.log("\n=== DEPLOYMENT SUMMARY ===");
    console.log("\nFactory Contracts:");
    console.log("TREXFactory:", trexFactory.address);
    console.log("IdentityFactory:", identityFactory.address);
    console.log("TREX ImplementationAuthority:", trexImplementationAuthority.address);

    console.log("\nCore TREX Contracts (Proxies):");
    console.log("Token Proxy:", tokenProxy.address);
    console.log("IdentityRegistry Proxy:", identityRegistryProxy.address);
    console.log("IdentityRegistryStorage Proxy:", identityRegistryStorageProxy.address);
    console.log("TrustedIssuersRegistry Proxy:", trustedIssuersRegistryProxy.address);
    console.log("ClaimTopicsRegistry Proxy:", claimTopicsRegistryProxy.address);
    console.log("DefaultCompliance:", defaultCompliance.address);
    console.log("AgentManager:", agentManager.address);

    console.log("\nOnchainID Contracts:");
    console.log("Identity Implementation:", identityImplementation.address);
    console.log("Identity ImplementationAuthority:", identityImplementationAuthority.address);
    console.log("Token Identity Proxy (access via Identity ABI):", tokenOID.address);
    console.log("ClaimIssuer:", claimIssuerContract.address);

    console.log("\nUser Identity Proxies:");
    console.log("Alice Identity Proxy:", aliceIdentityProxy.address);
    console.log("Bob Identity Proxy:", bobIdentityProxy.address);
    console.log("Charlie Identity Proxy:", charlieIdentityProxy.address);

    console.log("\nTest Wallet Private Keys:");
    console.log("Alice Private Key:", aliceWallet.privateKey);
    console.log("Bob Private Key:", bobWallet.privateKey);
    console.log("Charlie Private Key:", charlieWallet.privateKey);

    console.log("\nSaving deployment information...");
    const network = await hre.ethers.provider.getNetwork();
    const chainId = network.chainId;

    const deploymentDir = path.join(process.cwd(), "deployment");
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
        identityFactory: identityFactory.address
      },
      authorities: {
        trexImplementationAuthority: trexImplementationAuthority.address,
        identityImplementationAuthority: identityImplementationAuthority.address
      },
      implementations: {
        identityImplementation: identityImplementation.address,
        claimTopicsRegistryImplementation: claimTopicsRegistryImplementation.address,
        trustedIssuersRegistryImplementation: trustedIssuersRegistryImplementation.address,
        identityRegistryStorageImplementation: identityRegistryStorageImplementation.address,
        identityRegistryImplementation: identityRegistryImplementation.address,
        modularComplianceImplementation: modularComplianceImplementation.address,
        tokenImplementation: tokenImplementation.address
      },
      suite: {
        tokenProxy: tokenProxy.address,
        identityRegistryProxy: identityRegistryProxy.address,
        identityRegistryStorageProxy: identityRegistryStorageProxy.address,
        trustedIssuersRegistryProxy: trustedIssuersRegistryProxy.address,
        claimTopicsRegistryProxy: claimTopicsRegistryProxy.address,
        defaultCompliance: defaultCompliance.address,
        agentManager: agentManager.address,
        tokenOIDProxy: tokenOID.address,
        trustedIssuer: claimIssuerContract.address
      },
      testWallets: {
        alice: {
          address: aliceWallet.address,
          privateKey: aliceWallet.privateKey,
          identityProxy: aliceIdentityProxy.address
        },
        bob: {
          address: bobWallet.address,
          privateKey: bobWallet.privateKey,
          identityProxy: bobIdentityProxy.address
        },
        charlie: {
          address: charlieWallet.address,
          privateKey: charlieWallet.privateKey,
          identityProxy: charlieIdentityProxy.address
        }
      },
      tokenInfo: {
        name: tokenName,
        symbol: tokenSymbol,
        decimals: 18
      },
      wallets
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
