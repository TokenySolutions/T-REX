const ClaimTopicsRegistry = artifacts.require('../contracts/registry/ClaimTopicsRegistry.sol');
const IdentityRegistry = artifacts.require('../contracts/registry/IdentityRegistry.sol');
const TrustedIssuersRegistry = artifacts.require('../contracts/registry/TrustedIssuersRegistry.sol');
const IssuerIdentity = artifacts.require('@onchain-id/solidity/contracts/ClaimIssuer.sol');
const Token = artifacts.require('Token.sol');
const Compliance = artifacts.require('../contracts/compliance/DefaultCompliance.sol');
const AgentManager = artifacts.require('../contracts/roles/AgentManager.sol');
const IdentityRegistryStorage = artifacts.require('../contracts/registry/IdentityRegistryStorage.sol');

// PROXY
const TokenProxy = artifacts.require('../contracts/proxy/TokenProxy.sol');
const ClaimTopicsRegistryProxy = artifacts.require('../contracts/proxy/ClaimTopicsRegistryProxy.sol');
const IdentityRegistryProxy = artifacts.require('../contracts/proxy/IdentityRegistryProxy.sol');
const IdentityRegistryStorageProxy = artifacts.require('../contracts/proxy/IdentityRegistryStorageProxy.sol');
const TrustedIssuersRegistryProxy = artifacts.require('../contracts/proxy/TrustedIssuersRegistryProxy.sol');

const Implementation = artifacts.require('../contracts/proxy/TREXImplementationAuthority.sol');
const OwnerManager = artifacts.require('../contracts/roles/OwnerManager.sol');
const LimitCompliance = artifacts.require('../contracts/compliance/LimitHolder.sol');

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
  LimitCompliance,
  ClaimTopicsRegistryProxy,
  IdentityRegistryProxy,
  IdentityRegistryStorageProxy,
  TrustedIssuersRegistryProxy,
};
