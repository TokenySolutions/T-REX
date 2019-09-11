const ClaimIssuer = require('./build/contracts/ClaimIssuer');
const ClaimTopicsRegistry = require('./build/contracts/ClaimTopicsRegistry');
const DefaultCompliance = require('./build/contracts/DefaultCompliance');
const IdentityRegistry = require('./build/contracts/IdentityRegistry');
const IClaimIssuer = require('./build/contracts/IClaimIssuer');
const IClaimTopicsRegistry = require('./build/contracts/IClaimTopicsRegistry');
const ICompliance = require('./build/contracts/ICompliance');
const IIdentityRegistry = require('./build/contracts/IIdentityRegistry');
const IToken = require('./build/contracts/IToken');
const ITrustedIssuersRegistry = require('./build/contracts/ITrustedIssuersRegistry');
const Token = require('./build/contracts/Token');
const TrustedIssuersRegistry = require('./build/contracts/TrustedIssuersRegistry');

module.exports = {
  contracts: {
    ClaimIssuer,
    ClaimTopicsRegistry,
    DefaultCompliance,
    IdentityRegistry,
    Token,
    TrustedIssuersRegistry,
  },
  interfaces: {
    IClaimIssuer,
    IClaimTopicsRegistry,
    ICompliance,
    IIdentityRegistry,
    IToken,
    ITrustedIssuersRegistry,
  },
};
