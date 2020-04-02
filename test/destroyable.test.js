require('chai')
  .use(require('chai-as-promised'))
  .should();

const ClaimTopicsRegistry = artifacts.require('../contracts/registry/ClaimTopicsRegistry.sol');
const IdentityRegistry = artifacts.require('../contracts/registry/IdentityRegistry.sol');
const TrustedIssuersRegistry = artifacts.require('../contracts/registry/TrustedIssuersRegistry.sol');
const ClaimHolder = artifacts.require('@onchain-id/solidity/contracts/Identity.sol');
const Token = artifacts.require('../contracts/token/Token.sol');
const Compliance = artifacts.require('../contracts/compliance/DefaultCompliance.sol');
const IdentityRegistryStorage = artifacts.require('../contracts/registry/IdentityRegistryStorage.sol');

contract('Destruct', accounts => {
  let claimTopicsRegistry;
  let identityRegistry;
  let trustedIssuersRegistry;
  let identityRegistryStorage;
  let token;
  let defaultCompliance;
  let tokenName;
  let tokenSymbol;
  let tokenDecimals;
  let tokenVersion;
  let tokenOnchainID;

  const tokeny = accounts[0];

  beforeEach(async () => {
    // Tokeny deploying token

    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: tokeny });
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({ from: tokeny });
    defaultCompliance = await Compliance.new({ from: tokeny });
    identityRegistryStorage = await IdentityRegistryStorage.new({ from: tokeny });
    identityRegistry = await IdentityRegistry.new(trustedIssuersRegistry.address, claimTopicsRegistry.address, identityRegistryStorage.address, {
      from: tokeny,
    });
    tokenOnchainID = await ClaimHolder.new({ from: tokeny });
    tokenName = 'TREXDINO';
    tokenSymbol = 'TREX';
    tokenDecimals = '0';
    tokenVersion = '1.2';
    token = await Token.new(
      identityRegistry.address,
      defaultCompliance.address,
      tokenName,
      tokenSymbol,
      tokenDecimals,
      tokenVersion,
      tokenOnchainID.address,
      { from: tokeny },
    );
  });

  it('name returns the name of the token', async () => {
    const name1 = await token.name().should.be.fulfilled;
    name1.toString().should.equal('TREXDINO');
  });

  it('should destroy the token contract', async () => {
    await token.setDestroyAuthorization(true);
    await token.destroyContract();
    await token.name().should.be.rejected;
  });

  it('should destroy the Identity Registry contract and make it impossible to call', async () => {
    await identityRegistry.setDestroyAuthorization(true);
    await identityRegistry.destroyContract();
    await identityRegistry.isVerified('0x0000000000000000000000000000000000000000').should.be.rejected;
  });

  it('should destroy the Global Identity Registry contract and make it impossible to call', async () => {
    await identityRegistryStorage.setDestroyAuthorization(true);
    await identityRegistryStorage.destroyContract();
    await identityRegistryStorage.storedIdentity('0x0000000000000000000000000000000000000000').should.be.rejected;
  });

  it('should destroy the ClaimTopics Registry contract and make it impossible to call', async () => {
    await claimTopicsRegistry.setDestroyAuthorization(true);
    await claimTopicsRegistry.destroyContract();
    await claimTopicsRegistry.getClaimTopics().should.be.rejected;
  });

  it('should destroy the TrustedIssuers Registry contract and make it impossible to call', async () => {
    await trustedIssuersRegistry.setDestroyAuthorization(true);
    await trustedIssuersRegistry.destroyContract();
    await trustedIssuersRegistry.isTrustedIssuer('0x0000000000000000000000000000000000000000').should.be.rejected;
  });

  it('should destroy the Compliance and make it impossible to call', async () => {
    await defaultCompliance.setDestroyAuthorization(true);
    await defaultCompliance.destroyContract();
    await defaultCompliance.canTransfer('0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', 100).should.be
      .rejected;
  });
});
