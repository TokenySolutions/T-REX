const ClaimIssuer = require('./build/contracts/ClaimIssuer');
const ClaimTopicsRegistry = require('./build/contracts/ClaimTopicsRegistry');
const DefaultCompliance = require('./build/contracts/DefaultCompliance');
const IdentityRegistry = require('./build/contracts/IdentityRegistry');
const IdentityRegistryStorage = require('./build/contracts/IdentityRegistryStorage');
const IClaimIssuer = require('./build/contracts/IClaimIssuer');
const IClaimTopicsRegistry = require('./build/contracts/IClaimTopicsRegistry');
const ICompliance = require('./build/contracts/ICompliance');
const IIdentityRegistry = require('./build/contracts/IIdentityRegistry');
const IIdentityRegistryStorage = require('./build/contracts/IIdentityRegistryStorage');
const IToken = require('./build/contracts/IToken');
const ITrustedIssuersRegistry = require('./build/contracts/ITrustedIssuersRegistry');
const Token = require('./build/contracts/Token');
const TrustedIssuersRegistry = require('./build/contracts/TrustedIssuersRegistry');

module.exports = {
  contracts: {
    ClaimTopicsRegistry,
    DefaultCompliance,
    IdentityRegistry,
    IdentityRegistryStorage,
    Token,
    TrustedIssuersRegistry,
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
