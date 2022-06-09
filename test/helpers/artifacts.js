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

// PROXY
const TokenProxy = artifacts.require('../contracts/proxy/TokenProxy.sol');
const ClaimTopicsRegistryProxy = artifacts.require('../contracts/proxy/ClaimTopicsRegistryProxy.sol');
const IdentityRegistryProxy = artifacts.require('../contracts/proxy/IdentityRegistryProxy.sol');
const IdentityRegistryStorageProxy = artifacts.require('../contracts/proxy/IdentityRegistryStorageProxy.sol');
const TrustedIssuersRegistryProxy = artifacts.require('../contracts/proxy/TrustedIssuersRegistryProxy.sol');
const Implementation = artifacts.require('../contracts/proxy/authority/TREXImplementationAuthority.sol');

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
};
