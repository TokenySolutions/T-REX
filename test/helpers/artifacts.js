const ClaimTopicsRegistry = artifacts.require('../contracts/registry/ClaimTopicsRegistry.sol');
const IdentityRegistry = artifacts.require('../contracts/registry/IdentityRegistry.sol');
const TrustedIssuersRegistry = artifacts.require('../contracts/registry/TrustedIssuersRegistry.sol');
const IssuerIdentity = artifacts.require('@onchain-id/solidity/contracts/ClaimIssuer.sol');
const Token = artifacts.require('Token.sol');
const Compliance = artifacts.require('../contracts/compliance/DefaultCompliance.sol');
const AgentManager = artifacts.require('../contracts/roles/AgentManager.sol');
const IdentityRegistryStorage = artifacts.require('../contracts/registry/IdentityRegistryStorage.sol');
const Proxy = artifacts.require('../contracts/proxy/TokenProxy.sol');
const Implementation = artifacts.require('ImplementationAuthority');
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
  Proxy,
  Implementation,
  OwnerManager,
  LimitCompliance,
};
