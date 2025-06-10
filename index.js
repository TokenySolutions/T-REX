// Token
const IToken = require('./artifacts/contracts/token/IToken.sol/IToken.json');
const Token = require('./artifacts/contracts/token/Token.sol/Token.json');
const TokenStorage = require('./artifacts/contracts/token/TokenStorage.sol/TokenStorage.json');
// Roles
const AgentRole = require('./artifacts/contracts/roles/AgentRole.sol/AgentRole.json');
const AgentRoleUpgradeable = require('./artifacts/contracts/roles/AgentRoleUpgradeable.sol/AgentRoleUpgradeable.json');
const Roles = require('./artifacts/contracts/roles/Roles.sol/Roles.json');
// registry
const IClaimTopicsRegistry = require('./artifacts/contracts/registry/interface/IClaimTopicsRegistry.sol/IClaimTopicsRegistry.json');
const ClaimTopicsRegistry = require('./artifacts/contracts/registry/implementation/ClaimTopicsRegistry.sol/ClaimTopicsRegistry.json');
const IIdentityRegistry = require('./artifacts/contracts/registry/interface/IIdentityRegistry.sol/IIdentityRegistry.json');
const IdentityRegistry = require('./artifacts/contracts/registry/implementation/IdentityRegistry.sol/IdentityRegistry.json');
const IIdentityRegistryStorage = require('./artifacts/contracts/registry/interface/IIdentityRegistryStorage.sol/IIdentityRegistryStorage.json');
const IdentityRegistryStorage = require('./artifacts/contracts/registry/implementation/IdentityRegistryStorage.sol/IdentityRegistryStorage.json');
const ITrustedIssuersRegistry = require('./artifacts/contracts/registry/interface/ITrustedIssuersRegistry.sol/ITrustedIssuersRegistry.json');
const TrustedIssuersRegistry = require('./artifacts/contracts/registry/implementation/TrustedIssuersRegistry.sol/TrustedIssuersRegistry.json');
// registry/Storage
const CTRStorage = require('./artifacts/contracts/registry/storage/CTRStorage.sol/CTRStorage.json');
const IRSStorage = require('./artifacts/contracts/registry/storage/IRSStorage.sol/IRSStorage.json');
const IRStorage = require('./artifacts/contracts/registry/storage/IRStorage.sol/IRStorage.json');
const TIRStorage = require('./artifacts/contracts/registry/storage/TIRStorage.sol/TIRStorage.json');
// proxy
const IProxy = require('./artifacts/contracts/proxy/interface/IProxy.sol/IProxy.json');
const AbstractProxy = require('./artifacts/contracts/proxy/AbstractProxy.sol/AbstractProxy.json');
const ClaimTopicsRegistryProxy = require('./artifacts/contracts/proxy/ClaimTopicsRegistryProxy.sol/ClaimTopicsRegistryProxy.json');
const IdentityRegistryProxy = require('./artifacts/contracts/proxy/IdentityRegistryProxy.sol/IdentityRegistryProxy.json');
const IdentityRegistryStorageProxy = require('./artifacts/contracts/proxy/IdentityRegistryStorageProxy.sol/IdentityRegistryStorageProxy.json');
const ModularComplianceProxy = require('./artifacts/contracts/proxy/ModularComplianceProxy.sol/ModularComplianceProxy.json');
const TokenProxy = require('./artifacts/contracts/proxy/TokenProxy.sol/TokenProxy.json');
const TrustedIssuersRegistryProxy = require('./artifacts/contracts/proxy/TrustedIssuersRegistryProxy.sol/TrustedIssuersRegistryProxy.json');
// proxy/authority
const IAFactory = require('./artifacts/contracts/proxy/authority/IAFactory.sol/IAFactory.json');
const IIAFactory = require('./artifacts/contracts/proxy/authority/IIAFactory.sol/IIAFactory.json');
const ITREXImplementationAuthority = require('./artifacts/contracts/proxy/authority/ITREXImplementationAuthority.sol/ITREXImplementationAuthority.json');
const TREXImplementationAuthority = require('./artifacts/contracts/proxy/authority/TREXImplementationAuthority.sol/TREXImplementationAuthority.json');
// factory
const ITREXFactory = require('./artifacts/contracts/factory/ITREXFactory.sol/ITREXFactory.json');
const TREXFactory = require('./artifacts/contracts/factory/TREXFactory.sol/TREXFactory.json');
// gateway
const ITREXGateway = require('./artifacts/contracts/factory/ITREXGateway.sol/ITREXGateway.json');
const TREXGateway = require('./artifacts/contracts/factory/TREXGateway.sol/TREXGateway.json');
// compliance
const IModularCompliance = require('./artifacts/contracts/compliance/modular/IModularCompliance.sol/IModularCompliance.json');
const MCStorage = require('./artifacts/contracts/compliance/modular/MCStorage.sol/MCStorage.json');
const ModularCompliance = require('./artifacts/contracts/compliance/modular/ModularCompliance.sol/ModularCompliance.json');
// compliance/modular/modules
const IModule = require('./artifacts/contracts/compliance/modular/modules/IModule.sol/IModule.json');
const AbstractModule = require('./artifacts/contracts/compliance/modular/modules/AbstractModule.sol/AbstractModule.json');
const AbstractModuleUpgradeable = require('./artifacts/contracts/compliance/modular/modules/AbstractModuleUpgradeable.sol/AbstractModuleUpgradeable.json');
const ModuleProxy = require('./artifacts/contracts/compliance/modular/modules/ModuleProxy.sol/ModuleProxy.json');

module.exports = {
  contracts: {
    // Token
    Token,
    TokenStorage,
    // Roles
    AgentRole,
    AgentRoleUpgradeable,
    Roles,
    // registry
    ClaimTopicsRegistry,
    IdentityRegistry,
    IdentityRegistryStorage,
    TrustedIssuersRegistry,
    // registry/Storage
    CTRStorage,
    IRSStorage,
    IRStorage,
    TIRStorage,
    // proxy
    AbstractProxy,
    ClaimTopicsRegistryProxy,
    IdentityRegistryProxy,
    IdentityRegistryStorageProxy,
    ModularComplianceProxy,
    TokenProxy,
    TrustedIssuersRegistryProxy,
    // proxy/authority
    IAFactory,
    TREXImplementationAuthority,
    // factory
    TREXFactory,
    // gateway
    TREXGateway,
    // compliance
    MCStorage,
    ModularCompliance,
    // compliance/modular/modules
    AbstractModule,
    AbstractModuleUpgradeable,
    ModuleProxy,
  },
  interfaces: {
    IToken,
    IClaimTopicsRegistry,
    IIdentityRegistry,
    IIdentityRegistryStorage,
    ITrustedIssuersRegistry,
    IProxy,
    IIAFactory,
    ITREXImplementationAuthority,
    ITREXFactory,
    ITREXGateway,
    IModularCompliance,
    IModule,
  },
};
