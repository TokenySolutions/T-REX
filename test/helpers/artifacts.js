const ClaimTopicsRegistry = artifacts.require('../contracts/registry/implementation/ClaimTopicsRegistry.sol');
const IdentityRegistry = artifacts.require('../contracts/registry/implementation/IdentityRegistry.sol');
const TrustedIssuersRegistry = artifacts.require('../contracts/registry/implementation/TrustedIssuersRegistry.sol');
const IssuerIdentity = artifacts.require('@onchain-id/solidity/contracts/ClaimIssuer.sol');
const Token = artifacts.require('../contracts/token/Token.sol');
const Compliance = artifacts.require('../contracts/compliance/legacy/DefaultCompliance.sol');
const AgentManager = artifacts.require('../contracts/roles/permissioning/agent/AgentManager.sol');
const IdentityRegistryStorage = artifacts.require('../contracts/registry/implementation/IdentityRegistryStorage.sol');
const OwnerManager = artifacts.require('../contracts/roles/permissioning/owner/OwnerManager.sol');
const DVDTransferManager = artifacts.require('../contracts/DVD/DVDTransferManager.sol');
const TestERC20 = artifacts.require('../contracts/DVD/TestERC20.sol');
const ModularCompliance = artifacts.require('../contracts/compliance/modular/ModularCompliance.sol');
const CountryRestrictModule = artifacts.require('../contracts/compliance/modular/modules/CountryRestrictModule.sol');
const CountryAllowModule = artifacts.require('../contracts/compliance/modular/modules/CountryAllowModule.sol');
const TREXFactory = artifacts.require('../contracts/factory/TREXFactory.sol');
const ApproveTransferTest = artifacts.require('../contracts/compliance/legacy/test/ApproveTransferTest.sol');

// PROXY
const TokenProxy = artifacts.require('../contracts/proxy/TokenProxy.sol');
const ClaimTopicsRegistryProxy = artifacts.require('../contracts/proxy/ClaimTopicsRegistryProxy.sol');
const IdentityRegistryProxy = artifacts.require('../contracts/proxy/IdentityRegistryProxy.sol');
const IdentityRegistryStorageProxy = artifacts.require('../contracts/proxy/IdentityRegistryStorageProxy.sol');
const TrustedIssuersRegistryProxy = artifacts.require('../contracts/proxy/TrustedIssuersRegistryProxy.sol');
const ModularComplianceProxy = artifacts.require('../contracts/proxy/ModularComplianceProxy.sol');
const Implementation = artifacts.require('../contracts/proxy/authority/TREXImplementationAuthority.sol');
const IAFactory = artifacts.require('../contracts/proxy/authority/IAFactory.sol');
const LegacyProxy = artifacts.require('../contracts/_testContracts/v_3_5_2/LegacyProxy.sol');
const LegacyIA = artifacts.require('../contracts/_testContracts/v_3_5_2/LegacyIA.sol');
const LegacyToken = artifacts.require('../contracts/_testContracts/v_3_5_2/LegacyToken_3_5_2.sol');

module.exports = {
  ClaimTopicsRegistry,
  IdentityRegistry,
  TrustedIssuersRegistry,
  IssuerIdentity,
  Token,
  Compliance,
  AgentManager,
  IdentityRegistryStorage,
  TokenProxy,
  Implementation,
  OwnerManager,
  ClaimTopicsRegistryProxy,
  IdentityRegistryProxy,
  IdentityRegistryStorageProxy,
  TrustedIssuersRegistryProxy,
  DVDTransferManager,
  TestERC20,
  ModularCompliance,
  CountryRestrictModule,
  CountryAllowModule,
  TREXFactory,
  ModularComplianceProxy,
  ApproveTransferTest,
  IAFactory,
  LegacyProxy,
  LegacyIA,
  LegacyToken,
};
