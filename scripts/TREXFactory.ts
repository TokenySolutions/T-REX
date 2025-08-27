import hre from "hardhat";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import OnchainID from '@onchain-id/solidity';

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
    
    // Deploy contracts without constructor parameters (they use init functions)
    const claimTopicsRegistry = await hre.ethers.deployContract('ClaimTopicsRegistry', deployer);
    await claimTopicsRegistry.deployed();
    console.log("ClaimTopicsRegistry deployed:", claimTopicsRegistry.address);
    
    const trustedIssuersRegistry = await hre.ethers.deployContract('TrustedIssuersRegistry', deployer);
    await trustedIssuersRegistry.deployed();
    console.log("TrustedIssuersRegistry deployed:", trustedIssuersRegistry.address);
    
    const identityRegistryStorage = await hre.ethers.deployContract('IdentityRegistryStorage', deployer);
    await identityRegistryStorage.deployed();
    console.log("IdentityRegistryStorage deployed:", identityRegistryStorage.address);
    
    const identityRegistry = await hre.ethers.deployContract('IdentityRegistry', deployer);
    await identityRegistry.deployed();
    console.log("IdentityRegistry deployed:", identityRegistry.address);
    
    const modularCompliance = await hre.ethers.deployContract('ModularCompliance', deployer);
    await modularCompliance.deployed();
    console.log("ModularCompliance deployed:", modularCompliance.address);

    const token = await hre.ethers.deployContract('Token', deployer);
    await token.deployed();
    console.log("Token deployed:", token.address);

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

    console.log("Deploying Token OnchainID directly...");
    const tokenOID = await new hre.ethers.ContractFactory(
      OnchainID.contracts.Identity.abi,
      OnchainID.contracts.Identity.bytecode,
      deployer
    ).deploy(deployer.address, true);
    await tokenOID.deployed();
    console.log("Token OnchainID deployed:", tokenOID.address);

    console.log("Deploying TREX Implementation Authority...");
    // Deploy with trexFactory as zero address due to circular dependency
    const trexImplementationAuthority = await hre.ethers.deployContract(
      'TREXImplementationAuthority',
      [true, hre.ethers.constants.AddressZero, hre.ethers.constants.AddressZero],
      deployer
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
      tokenImplementation: token.address,
      ctrImplementation: claimTopicsRegistry.address,
      irImplementation: identityRegistry.address,
      irsImplementation: identityRegistryStorage.address,
      tirImplementation: trustedIssuersRegistry.address,
      mcImplementation: modularCompliance.address,
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

    console.log("Setting TREX Factory reference in Implementation Authority...");
    await trexImplementationAuthority.connect(deployer).setTREXFactory(trexFactory.address);
    console.log("TREX Factory reference set");

    console.log("Deploying Agent Manager...");
    const agentManager = await hre.ethers.deployContract('AgentManager', [token.address], deployer);
    await agentManager.deployed();
    console.log("Agent Manager deployed:", agentManager.address);

    // Initialize contracts using their init functions
    console.log("Initializing contracts...");

    // Initialize ClaimTopicsRegistry (no parameters)
    await claimTopicsRegistry.connect(deployer).init();
    console.log("ClaimTopicsRegistry initialized");

    // Initialize TrustedIssuersRegistry (no parameters)
    await trustedIssuersRegistry.connect(deployer).init();
    console.log("TrustedIssuersRegistry initialized");

    // Initialize IdentityRegistryStorage (no parameters)
    await identityRegistryStorage.connect(deployer).init();
    console.log("IdentityRegistryStorage initialized");

    // Initialize IdentityRegistry (with parameters: _trustedIssuersRegistry, _claimTopicsRegistry, _identityStorage)
    await identityRegistry.connect(deployer).init(
      trustedIssuersRegistry.address,
      claimTopicsRegistry.address,
      identityRegistryStorage.address
    );
    console.log("IdentityRegistry initialized");

    // Initialize ModularCompliance (no parameters)
    await modularCompliance.connect(deployer).init();
    console.log("ModularCompliance initialized");

    // Initialize Token (with parameters: _identityRegistry, _compliance, _name, _symbol, _decimals, _onchainID)
    const tokenName = 'TREXDINO';
    const tokenSymbol = 'TREX';
    const tokenDecimals = 0;
    
    await token.connect(deployer).init(
      identityRegistry.address,
      modularCompliance.address,
      tokenName,
      tokenSymbol,
      tokenDecimals,
      tokenOID.address
    );
    console.log("Token initialized");

    console.log("Linking factories...");
    await identityFactory.connect(deployer).addTokenFactory(trexFactory.address);
    console.log("Factories linked");

    console.log("Setting up registry bindings...");
    await identityRegistryStorage.connect(deployer).bindIdentityRegistry(identityRegistry.address);
    await token.connect(deployer).addAgent(deployer.address);
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
    console.log("Deployer added as agent to Identity Registry");
    await identityRegistry.connect(deployer).addAgent(token.address);
    console.log("Token contract added as agent to Identity Registry");
    await identityRegistry.connect(deployer).addAgent(agentManager.address);
    console.log("Agent Manager added as agent to Identity Registry");
    await token.connect(deployer).addAgent(agentManager.address);
    console.log("Agent Manager added as agent to Token");
    await agentManager.connect(deployer).addAgentAdmin(deployer.address);
    console.log("Deployer added as Agent Manager admin");
    console.log("Agents configured");

    console.log("\n=== DEPLOYMENT SUMMARY ===");
    
    console.log("\nFactory Contracts:");
    console.log("TREXFactory:", trexFactory.address);
    console.log("IdFactory:", identityFactory.address);
    console.log("TREXImplementationAuthority:", trexImplementationAuthority.address);

    console.log("\nCore TREX Contracts (Direct Implementation):");
    console.log("Token:", token.address);
    console.log("Identity Registry:", identityRegistry.address);
    console.log("Identity Registry Storage:", identityRegistryStorage.address);
    console.log("Trusted Issuers Registry:", trustedIssuersRegistry.address);
    console.log("Claim Topics Registry:", claimTopicsRegistry.address);
    console.log("Modular Compliance:", modularCompliance.address);
    console.log("Agent Manager:", agentManager.address);

    console.log("\nOnchainID Contracts:");
    console.log("Identity Implementation:", identityImplementation.address);
    console.log("Identity Implementation Authority:", identityImplementationAuthority.address);
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