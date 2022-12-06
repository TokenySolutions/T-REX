const log = require('./helpers/logger');
require('chai').use(require('chai-as-promised')).should();
const EVMRevert = require('./helpers/VMExceptionRevert');
const { deployIdentityProxy } = require('./helpers/proxy');

const {
  ClaimTopicsRegistry,
  ClaimTopicsRegistryProxy,
  IdentityRegistry,
  TrustedIssuersRegistry,
  TrustedIssuersRegistryProxy,
  IssuerIdentity,
  IdentityRegistryStorage,
  Implementation,
  IdentityRegistryProxy,
  IdentityRegistryStorageProxy,
} = require('./helpers/artifacts');

contract('ClaimTopicsRegistry', (accounts) => {
  let claimTopicsRegistry;

  before(async () => {
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: accounts[0] });
    // Implementation
    const implementationSC = await Implementation.new({ from: accounts[0] });

    await implementationSC.setCTRImplementation(claimTopicsRegistry.address, { from: accounts[0] });

    // Ctr
    const ctrProxy = await ClaimTopicsRegistryProxy.new(implementationSC.address, { from: accounts[0] });

    claimTopicsRegistry = await ClaimTopicsRegistry.at(ctrProxy.address);
    await claimTopicsRegistry.addClaimTopic(1);
  });

  it('Add claimTopic should pass if valid claim topic is provided', async () => {
    const tx = await claimTopicsRegistry.addClaimTopic(2).should.be.fulfilled;
    log(`${tx.receipt.gasUsed} gas units used to add a required Claim Topic`);
    // reset initial state
    await claimTopicsRegistry.removeClaimTopic(2).should.be.fulfilled;
  });

  it('Add claimTopic should fail if called by non-owner', async () => {
    await claimTopicsRegistry.addClaimTopic(2, { from: accounts[1] }).should.be.rejectedWith(EVMRevert);
  });

  it('Add claimTopic should fail if claim topic provided is not unique', async () => {
    await claimTopicsRegistry.addClaimTopic(1).should.be.rejectedWith(EVMRevert);
  });

  it('Remove claimTopic should pass if the claim topic provided exists', async () => {
    const tx1 = await claimTopicsRegistry.addClaimTopic(2).should.be.fulfilled;
    log(`${tx1.receipt.gasUsed} gas units used to add a required Claim Topic`);
    const tx2 = await claimTopicsRegistry.removeClaimTopic(2).should.be.fulfilled;
    log(`${tx2.receipt.gasUsed} gas units used to remove a required Claim Topic`);
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
  let implementationSC;
  let claimHolder;
  let claimHolder2;
  let claimHolder3;
  let claimHolder4;
  let claimHolder5;
  let claimHolder6;
  let claimHolder7;
  let claimHolder8;
  let claimHolder9;

  before(async () => {
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({ from: accounts[0] });
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: accounts[0] });
    identityRegistryStorage = await IdentityRegistryStorage.new({ from: accounts[0] });
    identityRegistry = await IdentityRegistry.new({ from: accounts[0] });

    // Implementation
    implementationSC = await Implementation.new({ from: accounts[0] });

    await implementationSC.setCTRImplementation(claimTopicsRegistry.address);

    await implementationSC.setTIRImplementation(trustedIssuersRegistry.address);

    await implementationSC.setIRSImplementation(identityRegistryStorage.address);

    await implementationSC.setIRImplementation(identityRegistry.address);

    // Ctr
    const ctrProxy = await ClaimTopicsRegistryProxy.new(implementationSC.address, { from: accounts[0] });

    claimTopicsRegistry = await ClaimTopicsRegistry.at(ctrProxy.address);

    // Tir
    const tirProxy = await TrustedIssuersRegistryProxy.new(implementationSC.address, { from: accounts[0] });

    trustedIssuersRegistry = await TrustedIssuersRegistry.at(tirProxy.address);

    // Irs
    const irsProxy = await IdentityRegistryStorageProxy.new(implementationSC.address, { from: accounts[0] });

    identityRegistryStorage = await IdentityRegistryStorage.at(irsProxy.address);

    // Ir

    const irProxy = await IdentityRegistryProxy.new(
      implementationSC.address,
      trustedIssuersRegistry.address,
      claimTopicsRegistry.address,
      identityRegistryStorage.address,
      {
        from: accounts[0],
      },
    );

    identityRegistry = await IdentityRegistry.at(irProxy.address);

    claimHolder = await deployIdentityProxy(accounts[1]);
    claimHolder2 = await deployIdentityProxy(accounts[2]);
    await identityRegistryStorage.bindIdentityRegistry(identityRegistry.address, { from: accounts[0] });
    await identityRegistry.addAgent(accounts[0], { from: accounts[0] });
    await identityRegistry.registerIdentity(accounts[1], claimHolder.address, 91, { from: accounts[0] });
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

    // reset initial state
    await identityRegistryStorage.removeAgent(identityRegistry.address, { from: accounts[0] }).should.be.fulfilled;
    await identityRegistryStorage.bindIdentityRegistry(identityRegistry.address, { from: accounts[0] }).should.be.fulfilled;
  });

  it('should bind and unbind identity registry from storage', async () => {
    const irProxy1 = await IdentityRegistryProxy.new(
      implementationSC.address,
      trustedIssuersRegistry.address,
      claimTopicsRegistry.address,
      identityRegistryStorage.address,
      {
        from: accounts[0],
      },
    );

    const identityRegistry1 = await IdentityRegistry.at(irProxy1.address);

    // cannot bind from a wallet that is not owner of IRS
    await identityRegistryStorage.bindIdentityRegistry(identityRegistry1.address, { from: accounts[5] }).should.be.rejectedWith(EVMRevert);
    await identityRegistryStorage.bindIdentityRegistry(identityRegistry1.address, { from: accounts[0] }).should.be.fulfilled;
    (await identityRegistryStorage.linkedIdentityRegistries()).toString().should.equal(`${identityRegistry.address},${identityRegistry1.address}`);
    // cannot unbind from a wallet that is not owner of IRS
    await identityRegistryStorage.unbindIdentityRegistry(identityRegistry1.address, { from: accounts[5] }).should.be.rejectedWith(EVMRevert);
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
    const tx = await identityRegistry.registerIdentity(accounts[2], claimHolder2.address, 91, { from: accounts[0] }).should.be.fulfilled;
    log(`${tx.receipt.gasUsed} gas units used to register an Identity`);
    const registered = await identityRegistry.contains(accounts[2]);
    registered.toString().should.equal('true');
    // reset initial state
    await identityRegistry.deleteIdentity(accounts[2], { from: accounts[0] }).should.be.fulfilled;
  });

  it('Register Identity should fail if user address already exists', async () => {
    claimHolder3 = await deployIdentityProxy(accounts[3]);
    await identityRegistry.registerIdentity(accounts[1], claimHolder3.address, 91, { from: accounts[0] }).should.be.rejectedWith(EVMRevert);
  });

  it('Update Identity should pass if valid parameters are provided', async () => {
    claimHolder3 = await deployIdentityProxy(accounts[3]);
    const tx = await identityRegistry.updateIdentity(accounts[1], claimHolder3.address, { from: accounts[0] }).should.be.fulfilled;
    log(`${tx.receipt.gasUsed} gas units used to update an Identity`);
    const updated = await identityRegistry.identity(accounts[1]);
    updated.toString().should.equal(claimHolder3.address);
    // reset initial state
    await identityRegistry.updateIdentity(accounts[1], claimHolder.address, { from: accounts[0] }).should.be.fulfilled;
  });

  it('Update Identity should fail if user address does not exist already', async () => {
    await identityRegistry.updateIdentity(accounts[2], claimHolder2.address).should.be.rejectedWith(EVMRevert);
  });

  it('Delete identity should pass if valid user address is provided', async () => {
    const tx = await identityRegistry.deleteIdentity(accounts[1]).should.be.fulfilled;
    log(`${tx.receipt.gasUsed} gas units used to delete an Identity`);
    const registered = await identityRegistry.contains(accounts[1]);
    registered.toString().should.equal('false');
    // reset initial state
    await identityRegistry.registerIdentity(accounts[1], claimHolder.address, 91, { from: accounts[0] });
  });

  it('Delete Identity should fail if provided user is not valid', async () => {
    await identityRegistry.deleteIdentity(accounts[2]).should.be.rejectedWith(EVMRevert);
  });

  it('Updates the country for a registered identity', async () => {
    const tx = await identityRegistry.updateCountry(accounts[1], 101, {
      from: accounts[0],
    }).should.be.fulfilled;
    log(`${tx.receipt.gasUsed} gas units used to update an Identity's country`);
    const country = await identityRegistry.investorCountry(accounts[1]);
    country.toString().should.equal('101');
    // reset initial state
    await identityRegistry.updateCountry(accounts[1], 91, {
      from: accounts[0],
    }).should.be.fulfilled;
  });

  it('Updates the Claim Topics Registry', async () => {
    const newCtrProxy = await ClaimTopicsRegistryProxy.new(implementationSC.address, { from: accounts[0] });

    const newClaimTopicsRegistry = await ClaimTopicsRegistry.at(newCtrProxy.address);
    const tx = await identityRegistry.setClaimTopicsRegistry(newClaimTopicsRegistry.address, { from: accounts[0] });
    log(`${tx.receipt.gasUsed} gas units used to update the Claim Topics Registry`);
    const idReg = await identityRegistry.topicsRegistry();
    idReg.toString().should.equal(newClaimTopicsRegistry.address);
    // reset initial state
    await identityRegistry.setClaimTopicsRegistry(claimTopicsRegistry.address, { from: accounts[0] });
  });

  it('Updates the Trusted Issuers Registry', async () => {
    // TrustedIssuersRegistry Proxy
    const newTirProxy = await TrustedIssuersRegistryProxy.new(implementationSC.address, { from: accounts[0] });

    const newTrustedIssuersRegistry = await TrustedIssuersRegistry.at(newTirProxy.address);
    const tx = await identityRegistry.setTrustedIssuersRegistry(newTrustedIssuersRegistry.address, { from: accounts[0] });
    log(`${tx.receipt.gasUsed} gas units used to update the Trusted Issuers Registry`);
    const trustReg = await identityRegistry.issuersRegistry();
    trustReg.toString().should.equal(newTrustedIssuersRegistry.address);
    // reset initial state
    await identityRegistry.setTrustedIssuersRegistry(trustedIssuersRegistry.address, { from: accounts[0] });
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

  it('Should process a batch of 8 identity registration transactions', async () => {
    claimHolder3 = await deployIdentityProxy(accounts[3]);
    claimHolder4 = await deployIdentityProxy(accounts[4]);
    claimHolder5 = await deployIdentityProxy(accounts[5]);
    claimHolder6 = await deployIdentityProxy(accounts[6]);
    claimHolder7 = await deployIdentityProxy(accounts[7]);
    claimHolder8 = await deployIdentityProxy(accounts[8]);
    claimHolder9 = await deployIdentityProxy(accounts[9]);
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
      { from: accounts[0] },
    );
    log(`${tx.receipt.gasUsed} gas units used to process a batch to register 8 identities`);
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
    // reset initial state
    await identityRegistry.deleteIdentity(accounts[2], { from: accounts[0] });
    await identityRegistry.deleteIdentity(accounts[3], { from: accounts[0] });
    await identityRegistry.deleteIdentity(accounts[4], { from: accounts[0] });
    await identityRegistry.deleteIdentity(accounts[5], { from: accounts[0] });
    await identityRegistry.deleteIdentity(accounts[6], { from: accounts[0] });
    await identityRegistry.deleteIdentity(accounts[7], { from: accounts[0] });
    await identityRegistry.deleteIdentity(accounts[8], { from: accounts[0] });
    await identityRegistry.deleteIdentity(accounts[9], { from: accounts[0] });
  });

  it('Should remove agent from identity registry contract', async () => {
    const newAgent = accounts[3];
    const tx1 = await identityRegistry.addAgent(newAgent, { from: accounts[0] }).should.be.fulfilled;
    log(`${tx1.receipt.gasUsed} gas units used to Add an Agent`);
    (await identityRegistry.isAgent(newAgent)).should.equal(true);
    const tx2 = await identityRegistry.removeAgent(newAgent, { from: accounts[0] }).should.be.fulfilled;
    log(`${tx2.receipt.gasUsed} gas units used to Remove an Agent`);

    (await identityRegistry.isAgent(newAgent)).should.equal(false);
  });
});

contract('TrustedIssuersRegistry', (accounts) => {
  let trustedIssuersRegistry;
  let trustedIssuer1;
  let trustedIssuer2;

  before(async () => {
    // Declaration
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({ from: accounts[0] });

    // Implementation
    const implementationSC = await Implementation.new({ from: accounts[0] });

    await implementationSC.setTIRImplementation(trustedIssuersRegistry.address, { from: accounts[0] });

    // Tir
    const tirProxy = await TrustedIssuersRegistryProxy.new(implementationSC.address, { from: accounts[0] });

    trustedIssuersRegistry = await TrustedIssuersRegistry.at(tirProxy.address);
    trustedIssuer1 = await IssuerIdentity.new(accounts[1], { from: accounts[1] });
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer1.address, [1], { from: accounts[0] });
    trustedIssuer2 = await IssuerIdentity.new(accounts[2], { from: accounts[2] });
  });

  it('Add trusted issuer should pass if valid credentials are provided', async () => {
    const tx = await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer2.address, [2], { from: accounts[0] }).should.be.fulfilled;
    log(`${tx.receipt.gasUsed} gas units used to add a Trusted Issuer`);
    // reset initial state
    await trustedIssuersRegistry.removeTrustedIssuer(trustedIssuer2.address, { from: accounts[0] }).should.be.fulfilled;
  });

  it('Add trusted Issuer should fail if trusted issuer address provided already exists', async () => {
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer1.address, [2], { from: accounts[0] }).should.be.rejectedWith(EVMRevert);
  });

  it('Remove trusted issuer should pass if a trusted issuer exists', async () => {
    expect(await trustedIssuersRegistry.isTrustedIssuer(trustedIssuer1.address)).to.be.true;
    const tx = await trustedIssuersRegistry.removeTrustedIssuer(trustedIssuer1.address, { from: accounts[0] }).should.be.fulfilled;
    log(`${tx.receipt.gasUsed} gas units used to remove a Trusted Issuer`);
    expect(await trustedIssuersRegistry.isTrustedIssuer(trustedIssuer1.address)).to.be.false;
    // reset initial state
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer1.address, [2], { from: accounts[0] }).should.be.fulfilled;
  });

  it('Remove trusted issuer should fail if a trusted issuer does not exist', async () => {
    await trustedIssuersRegistry.removeTrustedIssuer(trustedIssuer2.address).should.be.rejectedWith(EVMRevert);
  });

  it('Add trusted Issuer should fail if no claim topic is provided', async () => {
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer2.address, []).should.be.rejectedWith(EVMRevert);
  });

  it('Should update claim topics if a trusted issuer exists', async () => {
    const tx = await trustedIssuersRegistry.updateIssuerClaimTopics(trustedIssuer1.address, [2, 7, 8], { from: accounts[0] }).should.be.fulfilled;

    (await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 1)).should.equal(false);
    (await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 2)).should.equal(true);
    (await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 7)).should.equal(true);
    (await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 8)).should.equal(true);
    log(`${tx.receipt.gasUsed} gas units used to update a Trusted Issuer's claim topics (3)`);
    // reset initial state
    await trustedIssuersRegistry.updateIssuerClaimTopics(trustedIssuer1.address, [1], { from: accounts[0] }).should.be.fulfilled;
  });

  it('Should revert claim topics update if trusted issuer does not exist', async () => {
    await trustedIssuersRegistry.updateIssuerClaimTopics(trustedIssuer2.address, [2, 7, 8], { from: accounts[0] }).should.be.rejectedWith(EVMRevert);
  });

  it('Should revert claim topics update if claim topics set is empty', async () => {
    await trustedIssuersRegistry.updateIssuerClaimTopics(trustedIssuer1.address, [], { from: accounts[0] }).should.be.rejectedWith(EVMRevert);
    (await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 1)).should.equal(true);
  });

  it('Remove trusted issuer should fail if trusted issuer is not registered', async () => {
    await trustedIssuersRegistry.removeTrustedIssuer(trustedIssuer2.address, { from: accounts[0] }).should.be.rejectedWith(EVMRevert);
  });

  it('Remove trusted issuer should pass if a trusted issuer exist', async () => {
    const tx1 = await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer2.address, [0, 2], { from: accounts[0] }).should.be.fulfilled;
    log(`${tx1.receipt.gasUsed} gas units used to add a Trusted Issuer`);
    const tx2 = await trustedIssuersRegistry.removeTrustedIssuer(trustedIssuer2.address, { from: accounts[0] }).should.be.fulfilled;
    log(`${tx2.receipt.gasUsed} gas units used to remove a Trusted Issuer`);
  });

  it('Should revert if trusted issuer is invalid', async () => {
    await trustedIssuersRegistry.getTrustedIssuerClaimTopics(trustedIssuer2.address).should.be.rejectedWith(EVMRevert);
  });

  it('Should return false if trusted issuer does not have claim topic', async () => {
    const result = await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 2).should.be.fulfilled;
    result.should.equal(false);
  });

  it('Should return false if trusted issuer is not registered', async () => {
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
