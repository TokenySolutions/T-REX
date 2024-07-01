import { Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';
import OnchainID from '@onchain-id/solidity';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { IIdFactory } from '../../typechain-types';

export async function deployIdentityProxy(implementationAuthority: Contract['target'], managementKey: string, signer: Signer) {
  const identity = await new ethers.ContractFactory(OnchainID.contracts.IdentityProxy.abi, OnchainID.contracts.IdentityProxy.bytecode, signer).deploy(
    implementationAuthority,
    managementKey,
  );
  return ethers.getContractAt(OnchainID.contracts.Identity.abi, identity.target, signer);
}

export async function deployClaimIssuer(initialManagementKey: string, signer: Signer) {
  const claimIssuer = await new ethers.ContractFactory(OnchainID.contracts.ClaimIssuer.abi, OnchainID.contracts.ClaimIssuer.bytecode, signer).deploy(
    initialManagementKey,
  );
  return ethers.getContractAt(OnchainID.contracts.ClaimIssuer.abi, claimIssuer.target, signer);
}

export async function deployFullSuiteFixture() {
  const [deployer, tokenIssuer, tokenAgent, tokenAdmin, claimIssuer, aliceWallet, bobWallet, charlieWallet, davidWallet, anotherWallet] =
    await ethers.getSigners();
  const claimIssuerSigningKey = ethers.Wallet.createRandom();
  const aliceActionKey = ethers.Wallet.createRandom();
  // Deploy implementations
  const claimTopicsRegistryImplementation = await ethers.deployContract('ClaimTopicsRegistry', deployer);
  const trustedIssuersRegistryImplementation = await ethers.deployContract('TrustedIssuersRegistry', deployer);
  const identityRegistryStorageImplementation = await ethers.deployContract('IdentityRegistryStorage', deployer);
  const identityRegistryImplementation = await ethers.deployContract('IdentityRegistry', deployer);
  const modularComplianceImplementation = await ethers.deployContract('ModularCompliance', deployer);
  const tokenImplementation = await ethers.deployContract('Token', deployer);
  const identityImplementation = await new ethers.ContractFactory(
    OnchainID.contracts.Identity.abi,
    OnchainID.contracts.Identity.bytecode,
    deployer,
  ).deploy(deployer.address, true);
  const identityImplementationAuthority = await new ethers.ContractFactory(
    OnchainID.contracts.ImplementationAuthority.abi,
    OnchainID.contracts.ImplementationAuthority.bytecode,
    deployer,
  ).deploy(identityImplementation.target);
  const identityFactory = await new ethers.ContractFactory(OnchainID.contracts.Factory.abi, OnchainID.contracts.Factory.bytecode, deployer).deploy(
    identityImplementationAuthority.target,
  );
  const trexImplementationAuthority = await ethers.deployContract(
    'TREXImplementationAuthority',
    [true, ethers.ZeroAddress, ethers.ZeroAddress],
    deployer,
  );
  const versionStruct = {
    major: 4,
    minor: 0,
    patch: 0,
  };
  const contractsStruct = {
    tokenImplementation: tokenImplementation.target,
    ctrImplementation: claimTopicsRegistryImplementation.target,
    irImplementation: identityRegistryImplementation.target,
    irsImplementation: identityRegistryStorageImplementation.target,
    tirImplementation: trustedIssuersRegistryImplementation.target,
    mcImplementation: modularComplianceImplementation.target,
  };
  await trexImplementationAuthority.connect(deployer).addAndUseTREXVersion(versionStruct, contractsStruct);

  const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.target, identityFactory.target], deployer);
  await (identityFactory.connect(deployer) as IIdFactory).addTokenFactory(trexFactory.target);

  const claimTopicsRegistry = await ethers
    .deployContract('ClaimTopicsRegistryProxy', [trexImplementationAuthority.target], deployer)
    .then(async (proxy) => ethers.getContractAt('ClaimTopicsRegistry', proxy.target));
  const trustedIssuersRegistry = await ethers
    .deployContract('TrustedIssuersRegistryProxy', [trexImplementationAuthority.target], deployer)
    .then(async (proxy) => ethers.getContractAt('TrustedIssuersRegistry', proxy.target));
  const identityRegistryStorage = await ethers
    .deployContract('IdentityRegistryStorageProxy', [trexImplementationAuthority.target], deployer)
    .then(async (proxy) => ethers.getContractAt('IdentityRegistryStorage', proxy.target));
  const defaultCompliance = await ethers.deployContract('DefaultCompliance', deployer);

  const identityRegistry = await ethers
    .deployContract(
      'IdentityRegistryProxy',
      [trexImplementationAuthority.target, trustedIssuersRegistry.target, claimTopicsRegistry.target, identityRegistryStorage.target],
      deployer,
    )
    .then(async (proxy) => ethers.getContractAt('IdentityRegistry', proxy.target));

  const tokenOID = await deployIdentityProxy(identityImplementationAuthority.target, tokenIssuer.address, deployer);
  const tokenName = 'TREXDINO';
  const tokenSymbol = 'TREX';
  const tokenDecimals = 0n;
  const token = await ethers
    .deployContract(
      'TokenProxy',
      [trexImplementationAuthority.target, identityRegistry.target, defaultCompliance.target, tokenName, tokenSymbol, tokenDecimals, tokenOID.target],
      deployer,
    )
    .then(async (proxy) => ethers.getContractAt('Token', proxy.target));
  const agentManager = await ethers.deployContract('AgentManager', [token.target], tokenAgent);
  await identityRegistryStorage.connect(deployer).bindIdentityRegistry(identityRegistry.target);

  await token.connect(deployer).addAgent(tokenAgent.address);

  const claimTopics = [ethers.keccak256(ethers.toUtf8Bytes('CLAIM_TOPIC'))];
  await claimTopicsRegistry.connect(deployer).addClaimTopic(claimTopics[0]);

  const claimIssuerContract = await deployClaimIssuer(claimIssuer.address, claimIssuer);
  await claimIssuerContract
    .connect(claimIssuer)
    .addKey(ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address'], [claimIssuerSigningKey.address])), 3, 1);

  await trustedIssuersRegistry.connect(deployer).addTrustedIssuer(claimIssuerContract.target, claimTopics);

  const aliceIdentity = await deployIdentityProxy(identityImplementationAuthority.target, aliceWallet.address, deployer);
  await aliceIdentity
    .connect(aliceWallet)
    .addKey(ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceActionKey.address])), 2, 1);
  const bobIdentity = await deployIdentityProxy(identityImplementationAuthority.target, bobWallet.address, deployer);
  const charlieIdentity = await deployIdentityProxy(identityImplementationAuthority.target, charlieWallet.address, deployer);

  await identityRegistry.connect(deployer).addAgent(tokenAgent.address);
  await identityRegistry.connect(deployer).addAgent(token.target);

  await identityRegistry
    .connect(tokenAgent)
    .batchRegisterIdentity([aliceWallet.address, bobWallet.address], [aliceIdentity.target, bobIdentity.target], [42, 666]);

  const claimForAlice = {
    data: ethers.hexlify(ethers.toUtf8Bytes('Some claim public data.')),
    issuer: claimIssuerContract.target,
    topic: claimTopics[0],
    scheme: 1,
    identity: aliceIdentity.target,
    signature: '',
  };
  claimForAlice.signature = await claimIssuerSigningKey.signMessage(
    ethers.getBytes(
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [claimForAlice.identity, claimForAlice.topic, claimForAlice.data]),
      ),
    ),
  );

  await aliceIdentity
    .connect(aliceWallet)
    .addClaim(claimForAlice.topic, claimForAlice.scheme, claimForAlice.issuer, claimForAlice.signature, claimForAlice.data, '');

  const claimForBob = {
    data: ethers.hexlify(ethers.toUtf8Bytes('Some claim public data.')),
    issuer: claimIssuerContract.target,
    topic: claimTopics[0],
    scheme: 1,
    identity: bobIdentity.target,
    signature: '',
  };
  claimForBob.signature = await claimIssuerSigningKey.signMessage(
    ethers.getBytes(
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [claimForBob.identity, claimForBob.topic, claimForBob.data]),
      ),
    ),
  );

  await bobIdentity
    .connect(bobWallet)
    .addClaim(claimForBob.topic, claimForBob.scheme, claimForBob.issuer, claimForBob.signature, claimForBob.data, '');

  await token.connect(tokenAgent).mint(aliceWallet.address, 1000);
  await token.connect(tokenAgent).mint(bobWallet.address, 500);

  await agentManager.connect(tokenAgent).addAgentAdmin(tokenAdmin.address);
  await token.connect(deployer).addAgent(agentManager.target);
  await identityRegistry.connect(deployer).addAgent(agentManager.target);

  await token.connect(tokenAgent).unpause();

  return {
    accounts: {
      deployer,
      tokenIssuer,
      tokenAgent,
      tokenAdmin,
      claimIssuer,
      claimIssuerSigningKey,
      aliceActionKey,
      aliceWallet,
      bobWallet,
      charlieWallet,
      davidWallet,
      anotherWallet,
    },
    identities: {
      aliceIdentity,
      bobIdentity,
      charlieIdentity,
    },
    suite: {
      claimIssuerContract,
      claimTopicsRegistry,
      trustedIssuersRegistry,
      identityRegistryStorage,
      defaultCompliance,
      identityRegistry,
      tokenOID,
      token,
      agentManager,
    },
    authorities: {
      trexImplementationAuthority,
      identityImplementationAuthority,
    },
    factories: {
      trexFactory,
      identityFactory,
    },
    implementations: {
      identityImplementation,
      claimTopicsRegistryImplementation,
      trustedIssuersRegistryImplementation,
      identityRegistryStorageImplementation,
      identityRegistryImplementation,
      modularComplianceImplementation,
      tokenImplementation,
    },
  };
}

export async function deploySuiteWithModularCompliancesFixture() {
  const context = await loadFixture(deployFullSuiteFixture);
  const complianceProxy = await ethers.deployContract('ModularComplianceProxy', [context.authorities.trexImplementationAuthority.target]);
  const compliance = await ethers.getContractAt('ModularCompliance', complianceProxy.target);

  const complianceBeta = await ethers.deployContract('ModularCompliance');
  await complianceBeta.init();

  return {
    ...context,
    suite: {
      ...context.suite,
      compliance,
      complianceBeta,
    },
  };
}

export async function deploySuiteWithModuleComplianceBoundToWallet() {
  const context = await loadFixture(deployFullSuiteFixture);

  const compliance = await ethers.deployContract('ModularCompliance');
  await compliance.init();

  const complianceModuleA = await ethers.deployContract('CountryAllowModule');
  await compliance.addModule(complianceModuleA.target);
  const complianceModuleB = await ethers.deployContract('CountryAllowModule');
  await compliance.addModule(complianceModuleB.target);

  await compliance.bindToken(context.accounts.charlieWallet.address);

  return {
    ...context,
    suite: {
      ...context.suite,
      compliance,
      complianceModuleA,
      complianceModuleB,
    },
  };
}
