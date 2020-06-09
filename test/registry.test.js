const fetch = require('node-fetch');
const log = require('./helpers/logger');
require('chai').use(require('chai-as-promised')).should();
const EVMRevert = require('./helpers/VMExceptionRevert');

const ClaimTopicsRegistry = artifacts.require('../contracts/registry/ClaimTopicsRegistry.sol');
const IdentityRegistry = artifacts.require('../contracts/registry/IdentityRegistry.sol');
const TrustedIssuersRegistry = artifacts.require('../contracts/registry/TrustedIssuersRegistry.sol');
const ClaimHolder = artifacts.require('@onchain-id/solidity/contracts/Identity.sol');
const IssuerIdentity = artifacts.require('@onchain-id/solidity/contracts/ClaimIssuer.sol');
const IdentityRegistryStorage = artifacts.require('../contracts/registry/IdentityRegistryStorage.sol');
let gasAverage;

const gWeiToETH = 1 / 1000000000;
function calculateETH(gasUnits) {
  return Math.round(gasUnits * gWeiToETH * gasAverage * 10000) / 10000;
}

contract('ClaimTopicsRegistry', (accounts) => {
  let claimTopicsRegistry;

  beforeEach(async () => {
    gasAverage = await fetch('https://ethgasstation.info/json/ethgasAPI.json')
      .then((resp) => resp.json())
      .then((data) => data.average);
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: accounts[0] });
    await claimTopicsRegistry.addClaimTopic(1);
  });

  it('Add claimTopic should pass if valid claim topic is provided', async () => {
    const tx = await claimTopicsRegistry.addClaimTopic(2).should.be.fulfilled;
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to add a required Claim Topic`);
  });

  it('Add claimTopic should fail if called by non-owner', async () => {
    await claimTopicsRegistry.addClaimTopic(2, { from: accounts[1] }).should.be.rejectedWith(EVMRevert);
  });

  it('Add claimTopic should fail if claim topic provided is not unique', async () => {
    await claimTopicsRegistry.addClaimTopic(1).should.be.rejectedWith(EVMRevert);
  });

  it('Remove claimTopic should pass if the claim topic provided exists', async () => {
    const tx1 = await claimTopicsRegistry.addClaimTopic(2).should.be.fulfilled;
    log(`[${calculateETH(tx1.receipt.gasUsed)} ETH] --> GAS fees used to add a required Claim Topic`);
    const tx2 = await claimTopicsRegistry.removeClaimTopic(2).should.be.fulfilled;
    log(`[${calculateETH(tx2.receipt.gasUsed)} ETH] --> GAS fees used to remove a required Claim Topic`);
  });

  it('Add claimTopic should fail if called by non-owner', async () => {
    await claimTopicsRegistry.addClaimTopic(2, { from: accounts[1] }).should.be.rejectedWith(EVMRevert);
  });
});

contract('IdentityRegistry', (accounts) => {
  let trustedIssuersRegistry;
  let claimTopicsRegistry;
  let identityRegistry;
  let identityRegistryStorage;
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
    gasAverage = await fetch('https://ethgasstation.info/json/ethgasAPI.json')
      .then((resp) => resp.json())
      .then((data) => data.average);
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({
      from: accounts[0],
    });
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: accounts[0] });
    identityRegistryStorage = await IdentityRegistryStorage.new({ from: accounts[0] });
    identityRegistry = await IdentityRegistry.new(trustedIssuersRegistry.address, claimTopicsRegistry.address, identityRegistryStorage.address, {
      from: accounts[0],
    });
    claimHolder = await ClaimHolder.new({ from: accounts[1] });
    claimHolder2 = await ClaimHolder.new({ from: accounts[2] });
    await identityRegistryStorage.bindIdentityRegistry(identityRegistry.address, { from: accounts[0] });
    await identityRegistry.addAgentOnIdentityRegistryContract(accounts[0]);
    await identityRegistry.registerIdentity(accounts[1], claimHolder.address, 91);
  });

  it('identityStorage should return the address of the identity registry storage contract', async () => {
    (await identityRegistry.identityStorage()).toString().should.equal(identityRegistryStorage.address);
  });

  it('unbind identity registry should revert if there is no identity registry bound', async () => {
    // unbind identity contract
    await identityRegistryStorage.unbindIdentityRegistry(identityRegistry.address, { from: accounts[0] }).should.be.fulfilled;

    // adds the identity registry contract as agent without binding
    await identityRegistryStorage.addAgent(identityRegistry.address, { from: accounts[0] }).should.be.fulfilled;

    // unbind should fail as identity registry is agent but not bound
    await identityRegistryStorage.unbindIdentityRegistry(identityRegistry.address, { from: accounts[0] }).should.be.rejectedWith(EVMRevert);
  });

  it('should bind and unbind identity registry from storage', async () => {
    const identityRegistry1 = await IdentityRegistry.new(
      trustedIssuersRegistry.address,
      claimTopicsRegistry.address,
      identityRegistryStorage.address,
      { from: accounts[0] },
    );
    await identityRegistryStorage.bindIdentityRegistry(identityRegistry1.address, { from: accounts[0] }).should.be.fulfilled;
    (await identityRegistryStorage.linkedIdentityRegistries()).toString().should.equal(`${identityRegistry.address},${identityRegistry1.address}`);
    await identityRegistryStorage.unbindIdentityRegistry(identityRegistry1.address, { from: accounts[0] }).should.be.fulfilled;
    (await identityRegistryStorage.linkedIdentityRegistries()).toString().should.equal(identityRegistry.address);
  });

  it('identity should return identity of a registered investor', async () => {
    const identity1 = await identityRegistry.identity(accounts[1]).should.be.fulfilled;
    identity1.toString().should.equal(claimHolder.address);
  });

  it('investorCountry should return country of a registered investor', async () => {
    const country1 = await identityRegistry.investorCountry(accounts[1]).should.be.fulfilled;
    country1.toString().should.equal('91');
  });

  it('issuersRegistry should return the issuers registry linked to the identity registry', async () => {
    const registry1 = await identityRegistry.issuersRegistry().should.be.fulfilled;
    registry1.toString().should.equal(trustedIssuersRegistry.address);
  });

  it('topicsRegistry should return the topics registry linked to the identity registry', async () => {
    const registry1 = await identityRegistry.topicsRegistry().should.be.fulfilled;
    registry1.toString().should.equal(claimTopicsRegistry.address);
  });

  it('Register Identity passes for unique identity', async () => {
    const tx = await identityRegistry.registerIdentity(accounts[2], claimHolder2.address, 91).should.be.fulfilled;
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to register an Identity`);
    const registered = await identityRegistry.contains(accounts[2]);
    registered.toString().should.equal('true');
  });

  it('Register Identity should fail if user address already exists', async () => {
    claimHolder3 = await ClaimHolder.new({ from: accounts[1] });
    await identityRegistry.registerIdentity(accounts[1], claimHolder3.address, 91).should.be.rejectedWith(EVMRevert);
  });

  it('Update Identity should pass if valid parameters are provided', async () => {
    claimHolder3 = await ClaimHolder.new({ from: accounts[1] });
    const tx = await identityRegistry.updateIdentity(accounts[1], claimHolder3.address).should.be.fulfilled;
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to update an Identity`);
    const updated = await identityRegistry.identity(accounts[1]);
    updated.toString().should.equal(claimHolder3.address);
  });

  it('Update Identity should fail if user address does not exist already', async () => {
    await identityRegistry.updateIdentity(accounts[2], claimHolder2.address).should.be.rejectedWith(EVMRevert);
  });

  it('Delete identity should pass if valid user address is provided', async () => {
    const tx = await identityRegistry.deleteIdentity(accounts[1]).should.be.fulfilled;
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to delete an Identity`);
    const registered = await identityRegistry.contains(accounts[1]);
    registered.toString().should.equal('false');
  });

  it('Delete Identity should fail if provided user is not valid', async () => {
    await identityRegistry.deleteIdentity(accounts[2]).should.be.rejectedWith(EVMRevert);
  });

  it('Updates the country for a registered identity', async () => {
    const tx = await identityRegistry.updateCountry(accounts[1], 101, {
      from: accounts[0],
    }).should.be.fulfilled;
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to update an Identity's country`);
    const country = await identityRegistry.investorCountry(accounts[1]);
    country.toString().should.equal('101');
  });

  it('Updates the Claim Topics Registry', async () => {
    const newClaimTopicsRegistry = await ClaimTopicsRegistry.new({
      from: accounts[0],
    });
    const tx = await identityRegistry.setClaimTopicsRegistry(newClaimTopicsRegistry.address, { from: accounts[0] });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to update the Claim Topics Registry`);
    const idReg = await identityRegistry.topicsRegistry();
    idReg.toString().should.equal(newClaimTopicsRegistry.address);
  });

  it('Updates the Trusted Issuers Registry', async () => {
    const newTrustedIssuersRegistry = await TrustedIssuersRegistry.new({
      from: accounts[0],
    });
    const tx = await identityRegistry.setTrustedIssuersRegistry(newTrustedIssuersRegistry.address, { from: accounts[0] });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to update the Trusted Issuers Registry`);
    const trustReg = await identityRegistry.issuersRegistry();
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
    const tx = await identityRegistry.batchRegisterIdentity([accounts[2], accounts[3]], [claimHolder2.address, claimHolder3.address], [91, 101]);
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to process a batch to register 2 identities`);
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
    const tx = await identityRegistry.batchRegisterIdentity(
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
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to process a batch to register 8 identities`);
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
    const newAgent = accounts[3];
    const tx1 = await identityRegistry.addAgentOnIdentityRegistryContract(newAgent, { from: accounts[0] }).should.be.fulfilled;
    log(`[${calculateETH(tx1.receipt.gasUsed)} ETH] --> GAS fees used to Add an Agent`);
    (await identityRegistry.isAgent(newAgent)).should.equal(true);
    const tx2 = await identityRegistry.removeAgentOnIdentityRegistryContract(newAgent, { from: accounts[0] }).should.be.fulfilled;
    log(`[${calculateETH(tx2.receipt.gasUsed)} ETH] --> GAS fees used to Remove an Agent`);

    (await identityRegistry.isAgent(newAgent)).should.equal(false);
  });
});

contract('TrustedIssuersRegistry', (accounts) => {
  let trustedIssuersRegistry;
  let trustedIssuer1;
  let trustedIssuer2;

  beforeEach(async () => {
    gasAverage = await fetch('https://ethgasstation.info/json/ethgasAPI.json')
      .then((resp) => resp.json())
      .then((data) => data.average);
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({
      from: accounts[0],
    });
    trustedIssuer1 = await IssuerIdentity.new({ from: accounts[1] });
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer1.address, [1]);
  });

  it('Add trusted issuer should pass if valid credentials are provided', async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    const tx = await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer2.address, [2]).should.be.fulfilled;
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to add a Trusted Issuer`);
  });

  it('Add trusted Issuer should fail if trusted issuer address provided already exists', async () => {
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer1.address, [2]).should.be.rejectedWith(EVMRevert);
  });

  it('Remove trusted issuer should pass if a trusted issuer exists', async () => {
    expect(await trustedIssuersRegistry.isTrustedIssuer(trustedIssuer1.address)).to.be.true;
    const tx = await trustedIssuersRegistry.removeTrustedIssuer(trustedIssuer1.address).should.be.fulfilled;
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to remove a Trusted Issuer`);
    expect(await trustedIssuersRegistry.isTrustedIssuer(trustedIssuer1.address)).to.be.false;
  });

  it('Remove trusted issuer should fail if a trusted issuer does not exist', async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry.removeTrustedIssuer(trustedIssuer2.address).should.be.rejectedWith(EVMRevert);
  });

  it('Add trusted Issuer should fail if no claim topic is provided', async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer2.address, []).should.be.rejectedWith(EVMRevert);
  });

  it('Should update claim topics if a trusted issuer exists', async () => {
    const tx = await trustedIssuersRegistry.updateIssuerClaimTopics(trustedIssuer1.address, [2, 7, 8]).should.be.fulfilled;

    (await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 1)).should.equal(false);
    (await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 2)).should.equal(true);
    (await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 7)).should.equal(true);
    (await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 8)).should.equal(true);
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to update a Trusted Issuer's claim topics (3)`);
  });

  it('Should revert claim topics update if trusted issuer does not exist', async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry.updateIssuerClaimTopics(trustedIssuer2.address, [2, 7, 8]).should.be.rejectedWith(EVMRevert);
  });

  it('Should revert claim topics update if claim topics set is empty', async () => {
    await trustedIssuersRegistry.updateIssuerClaimTopics(trustedIssuer1.address, []).should.be.rejectedWith(EVMRevert);
    (await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 1)).should.equal(true);
  });

  it('Remove trusted issuer should fail if trusted issuer is not registered', async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry.removeTrustedIssuer(trustedIssuer2.address).should.be.rejectedWith(EVMRevert);
  });

  it('Remove trusted issuer should pass if a trusted issuer exist', async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    const tx1 = await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer2.address, [0, 2]).should.be.fulfilled;
    log(`[${calculateETH(tx1.receipt.gasUsed)} ETH] --> GAS fees used to add a Trusted Issuer`);
    const tx2 = await trustedIssuersRegistry.removeTrustedIssuer(trustedIssuer2.address).should.be.fulfilled;
    log(`[${calculateETH(tx2.receipt.gasUsed)} ETH] --> GAS fees used to remove a Trusted Issuer`);
  });

  it('Should revert if trusted issuer is invalid', async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry.getTrustedIssuerClaimTopics(trustedIssuer2.address).should.be.rejectedWith(EVMRevert);
  });

  it('Should return false if trusted issuer does not have claim topic', async () => {
    const result = await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 2).should.be.fulfilled;
    result.should.equal(false);
  });

  it('Should return false if trusted issuer is not registered', async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    const result = await trustedIssuersRegistry.isTrustedIssuer(trustedIssuer2.address).should.be.fulfilled;
    result.should.equal(false);
  });

  it('Should return trusted issuer claim topics', async () => {
    const result = await trustedIssuersRegistry.getTrustedIssuerClaimTopics(trustedIssuer1.address).should.be.fulfilled;
    result.toString().should.equal('1');
  });

  it('Should return trusted issuers', async () => {
    const result = await trustedIssuersRegistry.getTrustedIssuers();
    result.toString().should.equal(trustedIssuer1.address);
  });
});
