const ClaimTopicsRegistry = require('./build/contracts/ClaimTopicsRegistry');
const DefaultCompliance = require('./build/contracts/DefaultCompliance');
const IdentityRegistry = require('./build/contracts/IdentityRegistry');
const IdentityRegistryStorage = require('./build/contracts/IdentityRegistryStorage');
const IClaimTopicsRegistry = require('./build/contracts/IClaimTopicsRegistry');
const ICompliance = require('./build/contracts/ICompliance');
const IIdentityRegistry = require('./build/contracts/IIdentityRegistry');
const IIdentityRegistryStorage = require('./build/contracts/IIdentityRegistryStorage');
const IToken = require('./build/contracts/IToken');
const ITrustedIssuersRegistry = require('./build/contracts/ITrustedIssuersRegistry');
const Token = require('./build/contracts/Token');
const TrustedIssuersRegistry = require('./build/contracts/TrustedIssuersRegistry');
const DVDTransferManager = require('./build/contracts/DVDTransferManager');
const TestERC20 = require('./build/contracts/TestERC20');
const ImplementationAuthority = require('./build/contracts/ImplementationAuthority');
const TokenProxy = require('./build/contracts/TokenProxy');
const AgentManager = require('./build/contracts/AgentManager');
const OwnerManager = require('./build/contracts/OwnerManager');

module.exports = {
  contracts: {
    ClaimTopicsRegistry,
    DefaultCompliance,
    IdentityRegistry,
    IdentityRegistryStorage,
    Token,
    TrustedIssuersRegistry,
    DVDTransferManager,
    TestERC20,
    ImplementationAuthority,
    TokenProxy,
    AgentManager,
    OwnerManager,
  },
  interfaces: {
    IClaimTopicsRegistry,
    ICompliance,
    IIdentityRegistry,
    IIdentityRegistryStorage,
    IToken,
    ITrustedIssuersRegistry,
  },
};
