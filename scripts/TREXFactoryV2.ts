import hre from "hardhat";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import OnchainID from '@onchain-id/solidity';
import { BN } from '@polkadot/util';
import type { WeightV2 } from '@polkadot/types/interfaces';

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

async function deployContract(api: ApiPromise, contractName: string, bytecode: string, signer: any): Promise<string> {
  const hash = await uploadCode(api, contractName, bytecode, signer);
  const codeHash = api.createType('H256', hash);

  const maxBlock = api.consts.system.blockWeights?.maxBlock;
  if (!maxBlock) throw new Error('Chain does not expose maxBlock weights');

  const defaultGasLimit = api.registry.createType('WeightV2', maxBlock) as WeightV2;

  const res = await api.tx.revive.instantiate(
    0,
    defaultGasLimit,
    0,
    codeHash,
    "0x",
    null
  ).paymentInfo(signer.address);

  type Weight = {
    refTime: string;
    proofSize: string;
  }
  const weight = res.toHuman().weight as unknown as Weight;
  const finalGasLimit = api.registry.createType('WeightV2', {
    refTime: new BN(weight.refTime.replace(/,/g, '')).muln(0.4).toString(),
    proofSize: new BN(weight.proofSize.replace(/,/g, '')).muln(0.2).toString()
  }) as WeightV2;

  const tx = api.tx.revive.instantiate(
    0,
    finalGasLimit,
    DEPOSIT_LIMIT,
    codeHash,
    "0x",
    null
  );

  return new Promise<string>((resolve, reject) => {
    tx.signAndSend(signer, (event: any) => {
      if (event.dispatchError) {
        if (event.dispatchError.isModule) {
          const decoded = api.registry.findMetaError(event.dispatchError.asModule);
          console.error(`Error: ${decoded.section}.${decoded.name} – ${decoded.docs.join(' ')}`);
        } else {
          console.error(event.dispatchError.toString());
        }
        return reject(event.dispatchError);
      }

      if (event.status.isInBlock || event.status.isFinalized) {
        console.log(`${event.status.type} at ${event.status.isInBlock ? event.status.asInBlock.toString() : event.status.asFinalized.toString()}`);
        const inst = event.events.find(({ event }: { event: any }) => event.method === 'Instantiated');
        if (inst) {
          const contractAddress = inst.event.data[1].toString();
          console.log(`${contractName} instantiated at:`, contractAddress);
          resolve(contractAddress);
        } else {
          reject(new Error("Contract instantiated, but no Instantiated event found"));
        }
      }
    });
  });
}

async function deployIdentityProxy(implementationAuthority: string, managementKey: string, deployer: any) {
  const identity = await new hre.ethers.ContractFactory(
    OnchainID.contracts.IdentityProxy.abi,
    OnchainID.contracts.IdentityProxy.bytecode,
    deployer
  ).deploy(implementationAuthority, managementKey);
  await identity.deployed();
  return hre.ethers.getContractAt(OnchainID.contracts.Identity.abi, identity.address, deployer);
}

async function deployClaimIssuer(initialManagementKey: string, signer: any) {
  const claimIssuer = await new hre.ethers.ContractFactory(
    OnchainID.contracts.ClaimIssuer.abi,
    OnchainID.contracts.ClaimIssuer.bytecode,
    signer
  ).deploy(initialManagementKey);
  await claimIssuer.deployed();
  return hre.ethers.getContractAt(OnchainID.contracts.ClaimIssuer.abi, claimIssuer.address, signer);
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const provider = new WsProvider('ws://localhost:9944');
  const api = await ApiPromise.create({ provider });
  await api.isReady;

  const keyring = new Keyring({ type: 'sr25519' });
  const signer = keyring.addFromUri('//Alice');
  console.log('Substrate signer:', signer.address);

  try {
    const contractsToUpload = [
      'TrustedIssuersRegistryProxy',
      'ClaimTopicsRegistryProxy',
      'ModularComplianceProxy',
      'IdentityRegistryStorageProxy',
      'IdentityRegistryProxy',
      'TokenProxy',
      'TREXImplementationAuthority',
      'TREXFactory',
      'ModularCompliance',
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
    // Here we just using a different way to deploy the contracts the other script uses hardhat this
    // Approach checks if the results are the same as we had issues with the actual implementations
    // Not working well just the Token contract
    const claimTopicsFactory = await hre.ethers.getContractFactory('ClaimTopicsRegistry');
    const claimTopicsRegistryImplementation = await deployContract(api, 'ClaimTopicsRegistry', claimTopicsFactory.bytecode, signer);
    console.log("ClaimTopicsRegistry Implementation:", claimTopicsRegistryImplementation);

    const trustedIssuersFactory = await hre.ethers.getContractFactory('TrustedIssuersRegistry');
    const trustedIssuersRegistryImplementation = await deployContract(api, 'TrustedIssuersRegistry', trustedIssuersFactory.bytecode, signer);
    console.log("TrustedIssuersRegistry Implementation:", trustedIssuersRegistryImplementation);

    const identityRegistryStorageFactory = await hre.ethers.getContractFactory('IdentityRegistryStorage');
    const identityRegistryStorageImplementation = await deployContract(api, 'IdentityRegistryStorage', identityRegistryStorageFactory.bytecode, signer);
    console.log("IdentityRegistryStorage Implementation:", identityRegistryStorageImplementation);

    const identityRegistryFactory = await hre.ethers.getContractFactory('IdentityRegistry');
    const identityRegistryImplementation = await deployContract(api, 'IdentityRegistry', identityRegistryFactory.bytecode, signer);
    console.log("IdentityRegistry Implementation:", identityRegistryImplementation);

    const modularComplianceFactory = await hre.ethers.getContractFactory('ModularCompliance');
    const modularComplianceImplementation = await deployContract(api, 'ModularCompliance', modularComplianceFactory.bytecode, signer);
    console.log("ModularCompliance Implementation:", modularComplianceImplementation);

    const tokenFactory = await hre.ethers.getContractFactory('Token');
    const tokenImplementation = await deployContract(api, 'Token', tokenFactory.bytecode, signer);
    console.log("Token Implementation:", tokenImplementation);
    console.log("Deploying OnchainID contracts...");
    const identityImplementation = await new hre.ethers.ContractFactory(
      OnchainID.contracts.Identity.abi,
      OnchainID.contracts.Identity.bytecode,
      deployer
    ).deploy(deployer.address, true);
    await identityImplementation.deployed();
    console.log("Identity Implementation deployed:", identityImplementation.address);

    const identityImplementationAuthority = await new hre.ethers.ContractFactory(
      OnchainID.contracts.ImplementationAuthority.abi,
      OnchainID.contracts.ImplementationAuthority.bytecode,
      deployer
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
      deployer
    );
    await trexImplementationAuthority.deployed();
    console.log("TREX Implementation Authority deployed:", trexImplementationAuthority.address);

    console.log("Adding TREX version...");
    const versionStruct = {
      major: 4,
      minor: 0,
      patch: 0,
    };
    const contractsStruct = {
      tokenImplementation: tokenImplementation,
      ctrImplementation: claimTopicsRegistryImplementation,
      irImplementation: identityRegistryImplementation,
      irsImplementation: identityRegistryStorageImplementation,
      tirImplementation: trustedIssuersRegistryImplementation,
      mcImplementation: modularComplianceImplementation,
    };
    await trexImplementationAuthority.connect(deployer).addAndUseTREXVersion(versionStruct, contractsStruct);
    console.log("TREX version 4.0.0 added");

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
    const claimTopicsRegistryProxy = await hre.ethers.deployContract(
      'ClaimTopicsRegistryProxy',
      [trexImplementationAuthority.address],
      deployer
    );
    await claimTopicsRegistryProxy.deployed();
    const claimTopicsRegistry = await hre.ethers.getContractAt('ClaimTopicsRegistry', claimTopicsRegistryProxy.address);
    console.log("ClaimTopicsRegistry proxy deployed:", claimTopicsRegistryProxy.address);

    const trustedIssuersRegistryProxy = await hre.ethers.deployContract(
      'TrustedIssuersRegistryProxy',
      [trexImplementationAuthority.address],
      deployer
    );
    await trustedIssuersRegistryProxy.deployed();
    const trustedIssuersRegistry = await hre.ethers.getContractAt('TrustedIssuersRegistry', trustedIssuersRegistryProxy.address);
    console.log("TrustedIssuersRegistry proxy deployed:", trustedIssuersRegistryProxy.address);

    const identityRegistryStorageProxy = await hre.ethers.deployContract(
      'IdentityRegistryStorageProxy',
      [trexImplementationAuthority.address],
      deployer
    );
    await identityRegistryStorageProxy.deployed();

    const identityRegistryStorage = await hre.ethers.getContractAt('IdentityRegistryStorage', identityRegistryStorageProxy.address);
    console.log("IdentityRegistryStorage proxy deployed:", identityRegistryStorageProxy.address);

    const modularComplianceProxy = await hre.ethers.deployContract(
      'ModularComplianceProxy',
      [trexImplementationAuthority.address],
      deployer
    );
    await modularComplianceProxy.deployed();
    const modularCompliance = await hre.ethers.getContractAt('ModularCompliance', modularComplianceProxy.address);
    console.log("ModularCompliance proxy deployed:", modularComplianceProxy.address);

    const identityRegistryProxy = await hre.ethers.deployContract(
      'IdentityRegistryProxy',
      [trexImplementationAuthority.address, trustedIssuersRegistryProxy.address, claimTopicsRegistryProxy.address, identityRegistryStorageProxy.address],
      deployer
    );
    await identityRegistryProxy.deployed();
    const identityRegistry = await hre.ethers.getContractAt('IdentityRegistry', identityRegistryProxy.address);
    console.log("IdentityRegistry proxy deployed:", identityRegistryProxy.address);

    console.log("Deploying Token OnchainID...");
    const tokenOID = await deployIdentityProxy(
      identityImplementationAuthority.address,
      deployer.address,
      deployer
    );
    console.log("Token OnchainID deployed:", tokenOID.address);

    console.log("Deploying Token...");
    const tokenName = 'TREXDINO';
    const tokenSymbol = 'TREX';
    const tokenDecimals = 0;

    const implementationAddress = await trexImplementationAuthority.getTokenImplementation();
    const tokenn = await hre.ethers.getContractAt("Token", implementationAddress);
    try {
      const version = await tokenn.version();
      console.log("Token version:", version);
    } catch (e) {
      console.log("Cannot call TOKEN_VERSION - implementation not instantiated!", e.message);
    }

    const tokenProxy = await hre.ethers.deployContract(
      'TokenProxy',
      [trexImplementationAuthority.address, identityRegistryProxy.address,
      modularComplianceProxy.address,
        tokenName,
        tokenSymbol,
        tokenDecimals,
      tokenOID.address],
      deployer
    );
    await tokenProxy.deployed();
    console.log("Token Proxy deployed:", tokenProxy.address);
    const proxyToken = await hre.ethers.getContractAt('Token', tokenProxy.address, deployer);
    try {
      // Checking if the version was updated correctly
      const version = await proxyToken.version();
      console.log("Token version:", version);
    } catch (e) {
      console.log("Cannot call TOKEN_VERSION - implementation not instantiated!", e.message);
    }

    console.log("Deploying Agent Manager...");
    const agentManager = await hre.ethers.deployContract('AgentManager', [tokenProxy.address], deployer);
    await agentManager.deployed();
    console.log("Agent Manager deployed:", agentManager.address);

    console.log("Setting up registry bindings...");
    await identityRegistryStorage.connect(deployer).bindIdentityRegistry(identityRegistryProxy.address);
    await tokenProxy.connect(deployer).addAgent(deployer.address);
    console.log("Registry bindings complete");

    console.log("Setting up claim topics...");
    const claimTopics = [hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes('CLAIM_TOPIC'))];
    await claimTopicsRegistry.connect(deployer).addClaimTopic(claimTopics[0]);
    console.log("Claim topics added");

    console.log("Deploying Claim Issuer...");
    const claimIssuerContract = await deployClaimIssuer(deployer.address, deployer);
    console.log("Claim Issuer deployed:", claimIssuerContract.address);
    await claimIssuerContract
      .connect(deployer)
      .addKey(hre.ethers.utils.keccak256(hre.ethers.utils.defaultAbiCoder.encode(['address'], [deployer.address])), 3, 1);
    console.log("Claim Issuer key added");

    console.log("Adding trusted issuer...");
    await trustedIssuersRegistry.connect(deployer).addTrustedIssuer(claimIssuerContract.address, claimTopics);
    console.log("Trusted issuer added");

    console.log("Setting up agents...");
    await identityRegistry.connect(deployer).addAgent(deployer.address);
    await identityRegistry.connect(deployer).addAgent(tokenProxy.address);
    await identityRegistry.connect(deployer).addAgent(agentManager.address);
    await tokenProxy.connect(deployer).addAgent(agentManager.address);
    await agentManager.connect(deployer).addAgentAdmin(deployer.address);
    console.log("Agents configured");

    console.log("\nFactory Contracts:");
    console.log("TREXFactory:", trexFactory.address);
    console.log("IdFactory:", identityFactory.address);
    console.log("TREXImplementationAuthority:", trexImplementationAuthority.address);

    console.log("\nImplementation Contracts:");
    console.log("Token:", tokenImplementation);
    console.log("ClaimTopicsRegistry:", claimTopicsRegistryImplementation);
    console.log("TrustedIssuersRegistry:", trustedIssuersRegistryImplementation);
    console.log("IdentityRegistryStorage:", identityRegistryStorageImplementation);
    console.log("IdentityRegistry:", identityRegistryImplementation);
    console.log("ModularCompliance:", modularComplianceImplementation);
    console.log("Identity:", identityImplementation.address);

    console.log("\nDeployed TREX Suite:");
    console.log("Token:", tokenProxy.address);
    console.log("Identity Registry:", identityRegistryProxy.address);
    console.log("Identity Registry Storage:", identityRegistryStorageProxy.address);
    console.log("Trusted Issuers Registry:", trustedIssuersRegistryProxy.address);
    console.log("Claim Topics Registry:", claimTopicsRegistryProxy.address);
    console.log("Modular Compliance:", modularComplianceProxy.address);
    console.log("Agent Manager:", agentManager.address);
    console.log("Token OnchainID:", tokenOID.address);
    console.log("Claim Issuer:", claimIssuerContract.address);

  } finally {
    await api.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
