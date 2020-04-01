require('chai')
  .use(require('chai-as-promised'))
  .should();

const ClaimTopicsRegistry = artifacts.require('../contracts/registry/ClaimTopicsRegistry.sol');
const IdentityRegistry = artifacts.require('../contracts/registry/IdentityRegistry.sol');
const TrustedIssuersRegistry = artifacts.require('../contracts/registry/TrustedIssuersRegistry.sol');
const ClaimHolder = artifacts.require('@onchain-id/solidity/contracts/Identity.sol');
const Token = artifacts.require('../contracts/token/Token.sol');
const Compliance = artifacts.require('../contracts/compliance/DefaultCompliance.sol');

contract('Token', accounts => {
  let claimTopicsRegistry;
  let identityRegistry;
  let trustedIssuersRegistry;
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
    identityRegistry = await IdentityRegistry.new(trustedIssuersRegistry.address, claimTopicsRegistry.address, { from: tokeny });
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

  it('should destroy the ClaimTopics Registry contract and make it impossible to call', async () => {
    await claimTopicsRegistry.setDestroyAuthorization(true);
    await claimTopicsRegistry.destroyContract();
    await claimTopicsRegistry.addClaimTopic(1).should.be.rejected;
  });

  it('should destroy the TrustedIssuers Registry contract and make it impossible to call', async () => {
    await trustedIssuersRegistry.setDestroyAuthorization(true);
    await trustedIssuersRegistry.destroyContract();
    await trustedIssuersRegistry.isTrustedIssuer('0x0000000000000000000000000000000000000000').should.be.rejected;
  });
  //
  // it('version returns the version of the token', async () => {
  //   const version1 = await token.version().should.be.fulfilled;
  //   version1.toString().should.equal('1.2');
  // });
  //
  // it('onchainID returns the onchainID address of the token', async () => {
  //   const onchainID1 = await token.onchainID().should.be.fulfilled;
  //   onchainID1.toString().should.equal(tokenOnchainID.address);
  // });
  //
  // it('Successful Token transfer', async () => {
  //   limitCompliance = await LimitCompliance.new(token.address, 1000, {
  //     from: tokeny,
  //   }).should.be.fulfilled;
  //
  //   const tx1 = await token.setCompliance(limitCompliance.address).should.be.fulfilled;
  //   log(`Cumulative gas cost for setting compliance ${tx1.receipt.gasUsed}`);
  //
  //   const tx = await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
  //   log(`Cumulative gas cost for token transfer ${tx.receipt.gasUsed}`);
  //
  //   const balance1 = await token.balanceOf(user1);
  //   const balance2 = await token.balanceOf(user2);
  //   balance1.toString().should.equal('700');
  //   balance2.toString().should.equal('300');
  // });
  //
  // it('Successful Burn the tokens', async () => {
  //   const tx = await token.burn(user1, 300, { from: agent }).should.be.fulfilled;
  //   log(`Cumulative gas cost for token transfer ${tx.receipt.gasUsed}`);
  //
  //   const balance1 = await token.balanceOf(user1);
  //   balance1.toString().should.equal('700');
  // });
  //
  // it('Should not update token holders if participants already hold tokens', async () => {
  //   user3Contract = await ClaimHolder.new({ from: accounts[4] });
  //   await identityRegistry.registerIdentity(accounts[4], user3Contract.address, 91, {
  //     from: agent,
  //   }).should.be.fulfilled;
  //
  //   // user3 gets signature from claim issuer
  //   hexedData3 = await web3.utils.asciiToHex('Yea no, this guy is totes legit');
  //   const hashedDataToSign3 = web3.utils.keccak256(
  //     web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [user3Contract.address, 7, hexedData3]),
  //   );
  //
  //   signature3 = (await signer.sign(hashedDataToSign3)).signature;
  //
  //   // user1 adds claim to identity contract
  //   await user3Contract.addClaim(7, 1, claimIssuerContract.address, signature3, hexedData3, '', { from: accounts[4] });
  //
  //   await token.mint(accounts[4], 500, { from: agent });
  //
  //   await token.transfer(accounts[4], 300, { from: user1 }).should.be.fulfilled;
  // });
  //
  // it('Token transfer fails if claim signer key is removed from trusted claim issuer contract', async () => {
  //   await claimIssuerContract.removeKey(signerKey, 3, { from: claimIssuer });
  //   await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
  //   const balance1 = await token.balanceOf(user1);
  //   const balance2 = await token.balanceOf(user2);
  //   balance1.toString().should.equal('1000');
  //   balance2.toString().should.equal('0');
  // });
  //
  // it('Token transfer fails if a users identity is removed from identity registry', async () => {
  //   await identityRegistry.deleteIdentity(user2, { from: agent });
  //   await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
  //   const balance1 = await token.balanceOf(user1);
  //   const balance2 = await token.balanceOf(user2);
  //   balance1.toString().should.equal('1000');
  //   balance2.toString().should.equal('0');
  // });
  //
  // it('Token transfer fails if claimTopic is removed from claimTopic registry', async () => {
  //   await claimTopicsRegistry.removeClaimTopic(7, { from: tokeny });
  //   await claimTopicsRegistry.addClaimTopic(8, { from: tokeny });
  //   await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
  //   const balance1 = await token.balanceOf(user1);
  //   const balance2 = await token.balanceOf(user2);
  //   balance1.toString().should.equal('1000');
  //   balance2.toString().should.equal('0');
  // });
  //
  // it('Token transfer fails if trusted claim issuer is removed from claimIssuers registry', async () => {
  //   await trustedIssuersRegistry.removeTrustedIssuer(1, { from: tokeny });
  //   await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
  //   const balance1 = await token.balanceOf(user1);
  //   const balance2 = await token.balanceOf(user2);
  //   balance1.toString().should.equal('1000');
  //   balance2.toString().should.equal('0');
  // });
});
