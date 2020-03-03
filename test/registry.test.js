require('chai')
  .use(require('chai-as-promised'))
  .should();
const log = require('./helpers/logger');
const EVMRevert = require('./helpers/VMExceptionRevert');

const ClaimTopicsRegistry = artifacts.require('../contracts/registry/ClaimTopicsRegistry.sol');
const IdentityRegistry = artifacts.require('../contracts/registry/IdentityRegistry.sol');
const TrustedIssuersRegistry = artifacts.require('../contracts/registry/TrustedIssuersRegistry.sol');
const ClaimHolder = artifacts.require('@onchain-id/solidity/contracts/Identity.sol');
const IssuerIdentity = artifacts.require('@onchain-id/solidity/contracts/ClaimIssuer.sol');

contract('ClaimTopicsRegistry', accounts => {
  let claimTopicsRegistry;

  beforeEach(async () => {
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: accounts[0] });
    await claimTopicsRegistry.addClaimTopic(1);
  });

  it('Add claimTopic should pass if valid claim topic is provided', async () => {
    await claimTopicsRegistry.addClaimTopic(2).should.be.fulfilled;
  });

  it('Add claimTopic should fail if called by non-owner', async () => {
    await claimTopicsRegistry.addClaimTopic(2, { from: accounts[1] }).should.be.rejectedWith(EVMRevert);
  });

  it('Add claimTopic should fail if claim topic provided is not unique', async () => {
    await claimTopicsRegistry.addClaimTopic(1).should.be.rejectedWith(EVMRevert);
  });

  it('Remove claimTopic should pass if the claim topic provided exists', async () => {
    await claimTopicsRegistry.addClaimTopic(2).should.be.fulfilled;
    await claimTopicsRegistry.removeClaimTopic(2).should.be.fulfilled;
  });

  it('Add claimTopic should fail if called by non-owner', async () => {
    await claimTopicsRegistry.addClaimTopic(2, { from: accounts[1] }).should.be.rejectedWith(EVMRevert);
  });
});

contract('IdentityRegistry', accounts => {
  let trustedIssuersRegistry;
  let claimTopicsRegistry;
  let identityRegistry;
  let claimHolder;
  let claimHolder2;
  let claimHolder3;
  let claimHolder4;
  let claimHolder5;
  let claimHolder6;
  let claimHolder7;
  let claimHolder8;
  let claimHolder9;

  beforeEach(async () => {
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({
      from: accounts[0],
    });
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: accounts[0] });
    identityRegistry = await IdentityRegistry.new(trustedIssuersRegistry.address, claimTopicsRegistry.address, { from: accounts[0] });
    claimHolder = await ClaimHolder.new({ from: accounts[1] });
    claimHolder2 = await ClaimHolder.new({ from: accounts[2] });
    await identityRegistry.addAgentOnIdentityRegistryContract(accounts[0]);
    await identityRegistry.registerIdentity(accounts[1], claimHolder.address, 91);
  });

  it('getIdentityOfWallet should return identity of a registered investor', async () => {
    const identity1 = await identityRegistry.getIdentityOfWallet(accounts[1]).should.be.fulfilled;
    identity1.toString().should.equal(claimHolder.address);
  });

  it('getInvestorCountryOfWallet should return country of a registered investor', async () => {
    const country1 = await identityRegistry.getInvestorCountryOfWallet(accounts[1]).should.be.fulfilled;
    country1.toString().should.equal('91');
  });

  it('getIssuersRegistry should return the issuers registry linked to the identity registry', async () => {
    const registry1 = await identityRegistry.getIssuersRegistry().should.be.fulfilled;
    registry1.toString().should.equal(trustedIssuersRegistry.address);
  });

  it('getTopicsRegistry should return the topics registry linked to the identity registry', async () => {
    const registry1 = await identityRegistry.getTopicsRegistry().should.be.fulfilled;
    registry1.toString().should.equal(claimTopicsRegistry.address);
  });

  it('Register Identity passes for unique identity', async () => {
    await identityRegistry.registerIdentity(accounts[2], claimHolder2.address, 91).should.be.fulfilled;
    const registered = await identityRegistry.contains(accounts[2]);
    registered.toString().should.equal('true');
  });

  it('Register Identity should fail if user address already exists', async () => {
    claimHolder3 = await ClaimHolder.new({ from: accounts[1] });
    await identityRegistry.registerIdentity(accounts[1], claimHolder3.address, 91).should.be.rejectedWith(EVMRevert);
  });

  it('Update Identity should pass if valid parameters are provided', async () => {
    claimHolder3 = await ClaimHolder.new({ from: accounts[1] });
    await identityRegistry.updateIdentity(accounts[1], claimHolder3.address).should.be.fulfilled;
    const updated = await identityRegistry.getIdentityOfWallet(accounts[1]);
    updated.toString().should.equal(claimHolder3.address);
  });

  it('Update Identity should fail if user address does not exist already', async () => {
    await identityRegistry.updateIdentity(accounts[2], claimHolder2.address).should.be.rejectedWith(EVMRevert);
  });

  it('Delete identity should pass if valid user address is provided', async () => {
    await identityRegistry.deleteIdentity(accounts[1]).should.be.fulfilled;
    const registered = await identityRegistry.contains(accounts[1]);
    registered.toString().should.equal('false');
  });

  it('Delete Identity should fail if provided user is not valid', async () => {
    await identityRegistry.deleteIdentity(accounts[2]).should.be.rejectedWith(EVMRevert);
  });

  it('Updates the country for a registered identity', async () => {
    await identityRegistry.updateCountry(accounts[1], 101, {
      from: accounts[0],
    }).should.be.fulfilled;
    const country = await identityRegistry.getInvestorCountryOfWallet(accounts[1]);
    country.toString().should.equal('101');
  });

  it('Updates the Claim Topics Registry', async () => {
    const newClaimTopicsRegistry = await ClaimTopicsRegistry.new({
      from: accounts[0],
    });
    await identityRegistry.setClaimTopicsRegistry(newClaimTopicsRegistry.address, { from: accounts[0] });
    const idReg = await identityRegistry.getTopicsRegistry();
    idReg.toString().should.equal(newClaimTopicsRegistry.address);
  });

  it('Updates the Trusted Issuers Registry', async () => {
    const newTrustedIssuersRegistry = await TrustedIssuersRegistry.new({
      from: accounts[0],
    });
    await identityRegistry.setTrustedIssuersRegistry(newTrustedIssuersRegistry.address, { from: accounts[0] });
    const trustReg = await identityRegistry.getIssuersRegistry();
    trustReg.toString().should.equal(newTrustedIssuersRegistry.address);
  });

  it('Register Identity should fail if zero address provided', async () => {
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    await identityRegistry.registerIdentity(accounts[1], zeroAddress, 91).should.be.rejectedWith(EVMRevert);
  });

  it('Update Identity should fail if zero address provided', async () => {
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    await identityRegistry.updateIdentity(accounts[1], zeroAddress).should.be.rejectedWith(EVMRevert);
  });

  it('Update country should fail if no identity exists', async () => {
    await identityRegistry.updateCountry(accounts[2], 101).should.be.rejectedWith(EVMRevert);
  });

  it('Should return false if no identity exists', async () => {
    const result = await identityRegistry.contains(accounts[3]);
    result.should.equal(false);
  });

  it('Should process a batch of 2 identity registration transactions', async () => {
    claimHolder3 = await ClaimHolder.new({ from: accounts[3] });
    await identityRegistry.batchRegisterIdentity([accounts[2], accounts[3]], [claimHolder2.address, claimHolder3.address], [91, 101]);
    const registered1 = await identityRegistry.contains(accounts[2]);
    const registered2 = await identityRegistry.contains(accounts[3]);
    registered1.toString().should.equal('true');
    registered2.toString().should.equal('true');
  });

  it('Should process a batch of 8 identity registration transactions', async () => {
    claimHolder3 = await ClaimHolder.new({ from: accounts[3] });
    claimHolder4 = await ClaimHolder.new({ from: accounts[4] });
    claimHolder5 = await ClaimHolder.new({ from: accounts[5] });
    claimHolder6 = await ClaimHolder.new({ from: accounts[6] });
    claimHolder7 = await ClaimHolder.new({ from: accounts[7] });
    claimHolder8 = await ClaimHolder.new({ from: accounts[8] });
    claimHolder9 = await ClaimHolder.new({ from: accounts[9] });
    await identityRegistry.batchRegisterIdentity(
      [accounts[2], accounts[3], accounts[4], accounts[5], accounts[6], accounts[7], accounts[8], accounts[9]],
      [
        claimHolder2.address,
        claimHolder3.address,
        claimHolder4.address,
        claimHolder5.address,
        claimHolder6.address,
        claimHolder7.address,
        claimHolder8.address,
        claimHolder9.address,
      ],
      [91, 101, 91, 101, 91, 101, 91, 101],
    );
    const registered1 = await identityRegistry.contains(accounts[2]);
    const registered2 = await identityRegistry.contains(accounts[3]);
    const registered3 = await identityRegistry.contains(accounts[4]);
    const registered4 = await identityRegistry.contains(accounts[5]);
    const registered5 = await identityRegistry.contains(accounts[6]);
    const registered6 = await identityRegistry.contains(accounts[7]);
    const registered7 = await identityRegistry.contains(accounts[8]);
    const registered8 = await identityRegistry.contains(accounts[9]);
    registered1.toString().should.equal('true');
    registered2.toString().should.equal('true');
    registered3.toString().should.equal('true');
    registered4.toString().should.equal('true');
    registered5.toString().should.equal('true');
    registered6.toString().should.equal('true');
    registered7.toString().should.equal('true');
    registered8.toString().should.equal('true');
  });

  it('Should remove agent from identity registry contract', async () => {
    let newAgent = accounts[3];
    await identityRegistry.addAgentOnIdentityRegistryContract(newAgent, { from: accounts[0] }).should.be.fulfilled;
    (await identityRegistry.isAgent(newAgent)).should.equal(true);
    await identityRegistry.removeAgentOnIdentityRegistryContract(newAgent, { from: accounts[0] }).should.be.fulfilled;
    (await identityRegistry.isAgent(newAgent)).should.equal(false);
  });
});

contract('TrustedIssuersRegistry', accounts => {
  let trustedIssuersRegistry;
  let trustedIssuer1;
  let trustedIssuer2;

  beforeEach(async () => {
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({
      from: accounts[0],
    });
    trustedIssuer1 = await IssuerIdentity.new({ from: accounts[1] });
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer1.address, 1, [1]);
  });

  it('Add trusted issuer should pass if valid credentials are provided', async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer2.address, 2, [2]).should.be.fulfilled;
    const issuers = await trustedIssuersRegistry.getTrustedIssuers();
    log(`Issuers are: ${issuers}`);
  });

  it('Add trusted issuer should fail if invalid credentials are provided', async () => {
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    await trustedIssuersRegistry.addTrustedIssuer(zeroAddress, 2, [2]).should.be.rejectedWith(EVMRevert);
  });

  it('Add trusted Issuer should fail if trusted issuer index provided already exists', async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer2.address, 1, [2]).should.be.rejectedWith(EVMRevert);
  });

  it('Add trusted Issuer should fail if trusted issuer address provided already exists', async () => {
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer1.address, 2, [2]).should.be.rejectedWith(EVMRevert);
  });

  it('Remove trusted issuer should pass if a trusted issuer exists', async () => {
    await trustedIssuersRegistry.removeTrustedIssuer(1).should.be.fulfilled;
  });

  it('Remove trusted issuer should fail if a trusted issuer does not exist', async () => {
    await trustedIssuersRegistry.removeTrustedIssuer(2).should.be.rejectedWith(EVMRevert);
  });

  it('Add trusted Issuer should fail if trusted issuer index provided is invalid', async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer2.address, 0, [2]).should.be.rejectedWith(EVMRevert);
  });

  it('Add trusted Issuer should fail if no claim topic is provided', async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer2.address, 1, []).should.be.rejectedWith(EVMRevert);
  });

  it('Should update trusted issuer if a trusted issuer exists', async () => {
    const newTrustedIssuer = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry.updateIssuerContract(1, newTrustedIssuer.address, [2]).should.be.fulfilled;
  });

  it('Should revert update trusted issuer if no claim topic provided', async () => {
    const newTrustedIssuer = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry.updateIssuerContract(1, newTrustedIssuer.address, []).should.be.rejectedWith(EVMRevert);
  });

  it('Should revert update trusted issuer if trusted issuer does not exist', async () => {
    await trustedIssuersRegistry.updateIssuerContract(0, trustedIssuer1.address, [2]).should.be.rejectedWith(EVMRevert);
    await trustedIssuersRegistry.updateIssuerContract(2, trustedIssuer1.address, [2]).should.be.rejectedWith(EVMRevert);
  });

  it('Should revert update trusted issuer if trusted issuer address is already registered', async () => {
    await trustedIssuersRegistry.updateIssuerContract(1, trustedIssuer1.address, [2]).should.be.rejectedWith(EVMRevert);
  });

  it('Should return true if trusted issuer exists at an index', async () => {
    await trustedIssuersRegistry.getTrustedIssuer(1).should.be.fulfilled;
  });

  it('Should return claim topics if trusted issuer exist', async () => {
    const claimTopics = await trustedIssuersRegistry.getTrustedIssuerClaimTopics(1);
    log(`Claim topics ${claimTopics}`);
  });

  it('Should revert if no trusted issuer exist at given index', async () => {
    await trustedIssuersRegistry.getTrustedIssuer(2).should.be.rejectedWith(EVMRevert);
  });

  it('Remove trusted issuer should fail if index is invalid', async () => {
    await trustedIssuersRegistry.getTrustedIssuer(0).should.be.rejectedWith(EVMRevert);
    await trustedIssuersRegistry.removeTrustedIssuer(0).should.be.rejectedWith(EVMRevert);
  });

  it('Remove trusted issuer should pass if a trusted issuer exist', async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer2.address, 2, [0, 2]).should.be.fulfilled;
    await trustedIssuersRegistry.removeTrustedIssuer(2).should.be.fulfilled;
  });

  it('Should revert if index is invalid', async () => {
    await trustedIssuersRegistry.getTrustedIssuerClaimTopics(0).should.be.rejectedWith(EVMRevert);
  });

  it('Should revert if no trusted issuer exists at given index', async () => {
    await trustedIssuersRegistry.getTrustedIssuerClaimTopics(2).should.be.rejectedWith(EVMRevert);
  });

  it('Should revert if claim topic is invalid', async () => {
    await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 0).should.be.rejectedWith(EVMRevert);
  });

  it('Should return false if trusted issuer does not have claim topic', async () => {
    const result = await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 2).should.be.fulfilled;
    result.should.equal(false);
  });
});
