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
  ModularCompliance,
  Token,
} = require('./helpers/artifacts');

contract('ClaimTopicsRegistry', (accounts) => {
  let trustedIssuersRegistry;
  let claimTopicsRegistry;
  let identityRegistry;
  let identityRegistryStorage;
  let implementationSC;
  let token;
  let modularCompliance;
  let contractsStruct;
  let versionStruct;

  before(async () => {
    // Tokeny deploying all implementations
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: accounts[0] });
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({ from: accounts[0] });
    identityRegistryStorage = await IdentityRegistryStorage.new({ from: accounts[0] });
    identityRegistry = await IdentityRegistry.new({ from: accounts[0] });
    modularCompliance = await ModularCompliance.new({ from: accounts[0] });
    token = await Token.new({ from: accounts[0] });

    // setting the implementation authority
    implementationSC = await Implementation.new(true, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', {
      from: accounts[0],
    });
    versionStruct = {
      major: 4,
      minor: 0,
      patch: 0,
    };
    contractsStruct = {
      tokenImplementation: token.address,
      ctrImplementation: claimTopicsRegistry.address,
      irImplementation: identityRegistry.address,
      irsImplementation: identityRegistryStorage.address,
      tirImplementation: trustedIssuersRegistry.address,
      mcImplementation: modularCompliance.address,
    };
    await implementationSC.addAndUseTREXVersion(versionStruct, contractsStruct, { from: accounts[0] });

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

  it('cannot add more than 15 claimTopics', async () => {
    await claimTopicsRegistry.addClaimTopic(2).should.be.fulfilled;
    await claimTopicsRegistry.addClaimTopic(3).should.be.fulfilled;
    await claimTopicsRegistry.addClaimTopic(4).should.be.fulfilled;
    await claimTopicsRegistry.addClaimTopic(5).should.be.fulfilled;
    await claimTopicsRegistry.addClaimTopic(6).should.be.fulfilled;
    await claimTopicsRegistry.addClaimTopic(7).should.be.fulfilled;
    await claimTopicsRegistry.addClaimTopic(8).should.be.fulfilled;
    await claimTopicsRegistry.addClaimTopic(9).should.be.fulfilled;
    await claimTopicsRegistry.addClaimTopic(10).should.be.fulfilled;
    await claimTopicsRegistry.addClaimTopic(11).should.be.fulfilled;
    await claimTopicsRegistry.addClaimTopic(12).should.be.fulfilled;
    await claimTopicsRegistry.addClaimTopic(13).should.be.fulfilled;
    await claimTopicsRegistry.addClaimTopic(14).should.be.fulfilled;
    await claimTopicsRegistry.addClaimTopic(15).should.be.fulfilled;
    await claimTopicsRegistry.addClaimTopic(16).should.be.rejectedWith(EVMRevert);
  });
});

contract('IdentityRegistry', (accounts) => {
  let trustedIssuersRegistry;
  let claimTopicsRegistry;
  let identityRegistry;
  let identityRegistryImplem;
  let identityRegistryStorage;
  let implementationSC;
  let token;
  let modularCompliance;
  let contractsStruct;
  let versionStruct;
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
    // Tokeny deploying all implementations
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: accounts[0] });
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({ from: accounts[0] });
    identityRegistryStorage = await IdentityRegistryStorage.new({ from: accounts[0] });
    identityRegistryImplem = await IdentityRegistry.new({ from: accounts[0] });
    modularCompliance = await ModularCompliance.new({ from: accounts[0] });
    token = await Token.new({ from: accounts[0] });

    // setting the implementation authority
    implementationSC = await Implementation.new(true, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', {
      from: accounts[0],
    });
    versionStruct = {
      major: 4,
      minor: 0,
      patch: 0,
    };
    contractsStruct = {
      tokenImplementation: token.address,
      ctrImplementation: claimTopicsRegistry.address,
      irImplementation: identityRegistryImplem.address,
      irsImplementation: identityRegistryStorage.address,
      tirImplementation: trustedIssuersRegistry.address,
      mcImplementation: modularCompliance.address,
    };
    await implementationSC.addAndUseTREXVersion(versionStruct, contractsStruct, { from: accounts[0] });

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

  it('init function checks', async () => {
    await identityRegistryImplem
      .init('0x0000000000000000000000000000000000000000', claimTopicsRegistry.address, identityRegistryStorage.address, {
        from: accounts[0],
      })
      .should.be.rejectedWith(EVMRevert);
    await identityRegistryImplem
      .init(trustedIssuersRegistry.address, '0x0000000000000000000000000000000000000000', identityRegistryStorage.address, {
        from: accounts[0],
      })
      .should.be.rejectedWith(EVMRevert);
    await identityRegistryImplem
      .init(trustedIssuersRegistry.address, claimTopicsRegistry.address, '0x0000000000000000000000000000000000000000', {
        from: accounts[0],
      })
      .should.be.rejectedWith(EVMRevert);
  });

  it('identityStorage should return the address of the identity registry storage contract', async () => {
    (await identityRegistry.identityStorage()).toString().should.equal(identityRegistryStorage.address);
  });

  it('setIdentityRegistryStorage test', async () => {
    await identityRegistry.setIdentityRegistryStorage(identityRegistryStorage.address, { from: accounts[0] }).should.be.fulfilled;
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

  describe('When replacing the identity registry storage', () => {
    describe('When calling as the owner of the identity registry', () => {
      it('Should revert for missing permissions', async () => {
        const newIrsProxy = await IdentityRegistryStorageProxy.new(implementationSC.address, { from: accounts[1] });
        const newIdentityRegistryStorage = await IdentityRegistryStorage.at(newIrsProxy.address);

        await identityRegistry
          .setIdentityRegistryStorage(newIdentityRegistryStorage.address, { from: accounts[1] })
          .should.be.rejectedWith(EVMRevert);
      });
    });

    describe('When calling as the owner of the identity registry', () => {
      it('Should replace the storage reference, and use the data of the new storage', async () => {
        expect(await identityRegistry.contains(accounts[1])).to.equal(true);

        const newIrsProxy = await IdentityRegistryStorageProxy.new(implementationSC.address, { from: accounts[0] });
        const newIdentityRegistryStorage = await IdentityRegistryStorage.at(newIrsProxy.address);

        const tx = await identityRegistry.setIdentityRegistryStorage(newIdentityRegistryStorage.address, { from: accounts[0] });
        log(`${tx.receipt.gasUsed} gas units used to replace the storage reference`);
        const updatedIdentityRegistryStorage = await identityRegistry.identityStorage();
        updatedIdentityRegistryStorage.toString().should.equal(newIdentityRegistryStorage.address);

        expect(await identityRegistry.contains(accounts[1])).to.equal(false);

        // Reset previous state
        await identityRegistry.setIdentityRegistryStorage(identityRegistryStorage.address, { from: accounts[0] });
        await identityRegistry.deleteIdentity(accounts[1], { from: accounts[0] });
      });
    });
  });

  describe('Method .isVerified', () => {
    describe('When the identity is registered', () => {
      const identityOwner = accounts[1];
      const claimIssuer = accounts[2];
      let identity;
      const claimTopic = 42;
      let trustedIssuer;
      const signer = web3.eth.accounts.create();
      const signerKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', signer.address));
      before(async () => {
        await claimTopicsRegistry.addClaimTopic(claimTopic, { from: accounts[0] });

        identity = await deployIdentityProxy(identityOwner);
        await identityRegistry.registerIdentity(identityOwner, identity.address, 33, { from: accounts[0] });

        trustedIssuer = await IssuerIdentity.new(claimIssuer, { from: claimIssuer });
        await trustedIssuer.addKey(signerKey, 3, 1, { from: claimIssuer }).should.be.fulfilled;

        await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer.address, [claimTopic], { from: accounts[0] });
      });

      describe('When there are no claim on the identity for the given topic and truster issuer', () => {
        it('Should return false', async () => {
          expect(await identityRegistry.isVerified(identityOwner)).to.equal(false);
        });
      });

      describe(
        'When there is a claim topic expected and a trusted issuer,' +
          'that is a claim issuer contract, and the identity has an invalid claim from it',
        () => {
          it('Should return false', async () => {
            await identity.addClaim(claimTopic, 1, trustedIssuer.address, '0x13', '0x10', '0x', { from: accounts[1] });

            expect(await identityRegistry.isVerified(identityOwner)).to.equal(false);

            const [claimId] = await identity.getClaimIdsByTopic(claimTopic);
            await identity.removeClaim(claimId, { from: accounts[1] });
          });
        },
      );

      // eslint-disable-next-line max-len
      describe('When there is a claim topic expected and a trusted issuer, that is not a claim issuer contract, and the identity has a claim from it', () => {
        it('Should return false', async () => {
          const otherContract = await deployIdentityProxy(accounts[4]);
          await identity.addClaim(claimTopic, 1, otherContract.address, '0x13', '0x10', '0x', { from: accounts[1] });
          expect(await identityRegistry.isVerified(identityOwner)).to.equal(false);

          const [claimId] = await identity.getClaimIdsByTopic(claimTopic);
          await identity.removeClaim(claimId, { from: accounts[1] });
        });
      });
    });
  });

  it('check isVerified function', async () => {
    const signer = web3.eth.accounts.create();
    const signerKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', signer.address));
    const claimIssuer = accounts[4];
    const user1 = accounts[5];
    const claimIssuer2 = accounts[6];
    // deploy Claim Issuer contracts
    const claimIssuerContract = await IssuerIdentity.new(claimIssuer, { from: claimIssuer });
    await claimIssuerContract.addKey(signerKey, 3, 1, { from: claimIssuer }).should.be.fulfilled;
    const claimIssuerContract2 = await IssuerIdentity.new(claimIssuer2, { from: claimIssuer2 });
    await claimIssuerContract2.addKey(signerKey, 3, 1, { from: claimIssuer2 }).should.be.fulfilled;

    // users deploy their identity contracts
    const user1Contract = await deployIdentityProxy(user1);

    // user1 gets signature from claim issuer
    const hexedData1 = await web3.utils.asciiToHex('kyc approved');
    const hashedDataToSign1 = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [user1Contract.address, 7, hexedData1]),
    );
    const signature1 = (await signer.sign(hashedDataToSign1)).signature;

    // good claim
    await user1Contract.addClaim(7, 1, claimIssuerContract.address, signature1, hexedData1, '', { from: user1 });
    // not ClaimIssuer contract (try/catch test)
    await user1Contract.addClaim(7, 1, user1Contract.address, signature1, hexedData1, '', { from: user1 });
    // bad signature from good trusted issuer
    await user1Contract.addClaim(7, 1, claimIssuerContract2.address, signature1, hexedData1, '', { from: user1 });
    await identityRegistry.registerIdentity(user1, user1Contract.address, 91, { from: accounts[0] }).should.be.fulfilled;
    await claimTopicsRegistry.addClaimTopic(7, { from: accounts[0] }).should.be.fulfilled;
    await trustedIssuersRegistry.addTrustedIssuer(user1Contract.address, [7], { from: accounts[0] }).should.be.fulfilled;
    await trustedIssuersRegistry.addTrustedIssuer(claimIssuerContract2.address, [7], { from: accounts[0] }).should.be.fulfilled;
    await trustedIssuersRegistry.addTrustedIssuer(claimIssuerContract.address, [7], { from: accounts[0] }).should.be.fulfilled;
    const result = await identityRegistry.isVerified(user1);
    result.should.equal(true);
  });

  it('test storage contract', async () => {
    const irsAgent = accounts[7];
    await identityRegistryStorage.addAgent(irsAgent, { from: accounts[0] });
    await identityRegistryStorage
      .modifyStoredInvestorCountry('0x0000000000000000000000000000000000000000', 12, { from: irsAgent })
      .should.be.rejectedWith(EVMRevert);
    await identityRegistryStorage
      .removeIdentityFromStorage('0x0000000000000000000000000000000000000000', { from: irsAgent })
      .should.be.rejectedWith(EVMRevert);
    await identityRegistryStorage
      .bindIdentityRegistry('0x0000000000000000000000000000000000000000', { from: accounts[0] })
      .should.be.rejectedWith(EVMRevert);
    await identityRegistryStorage
      .unbindIdentityRegistry('0x0000000000000000000000000000000000000000', { from: accounts[0] })
      .should.be.rejectedWith(EVMRevert);
  });

  it('Should revert if more than 300 Identity Registries bound to the storage', async () => {
    // eslint-disable-next-line no-plusplus
    for (let i = 1; i <= 299; i++) {
      // eslint-disable-next-line no-await-in-loop
      await identityRegistryStorage.bindIdentityRegistry(`0x0000000000000000000000000000000000000${i.toString().padStart(3, '0')}`, {
        from: accounts[0],
      }).should.be.fulfilled;
    }
    await identityRegistryStorage
      .bindIdentityRegistry('0x000000000000000000000000000000000000dead', {
        from: accounts[0],
      })
      .should.be.rejectedWith(EVMRevert);
  });
});

contract('TrustedIssuersRegistry', (accounts) => {
  let trustedIssuersRegistry;
  let claimTopicsRegistry;
  let identityRegistry;
  let identityRegistryStorage;
  let implementationSC;
  let token;
  let modularCompliance;
  let contractsStruct;
  let versionStruct;
  let trustedIssuer1;
  let trustedIssuer2;

  before(async () => {
    // Tokeny deploying all implementations
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: accounts[0] });
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({ from: accounts[0] });
    identityRegistryStorage = await IdentityRegistryStorage.new({ from: accounts[0] });
    identityRegistry = await IdentityRegistry.new({ from: accounts[0] });
    modularCompliance = await ModularCompliance.new({ from: accounts[0] });
    token = await Token.new({ from: accounts[0] });

    // setting the implementation authority
    implementationSC = await Implementation.new(true, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', {
      from: accounts[0],
    });
    versionStruct = {
      major: 4,
      minor: 0,
      patch: 0,
    };
    contractsStruct = {
      tokenImplementation: token.address,
      ctrImplementation: claimTopicsRegistry.address,
      irImplementation: identityRegistry.address,
      irsImplementation: identityRegistryStorage.address,
      tirImplementation: trustedIssuersRegistry.address,
      mcImplementation: modularCompliance.address,
    };
    await implementationSC.addAndUseTREXVersion(versionStruct, contractsStruct, { from: accounts[0] });

    // Tir
    const tirProxy = await TrustedIssuersRegistryProxy.new(implementationSC.address, { from: accounts[0] });

    trustedIssuersRegistry = await TrustedIssuersRegistry.at(tirProxy.address);
    trustedIssuer1 = await IssuerIdentity.new(accounts[1], { from: accounts[1] });
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer1.address, [1], { from: accounts[0] });
    trustedIssuer2 = await IssuerIdentity.new(accounts[2], { from: accounts[2] });
  });

  it('Add trusted issuer should pass if valid credentials are provided', async () => {
    await trustedIssuersRegistry
      .addTrustedIssuer('0x0000000000000000000000000000000000000000', [2], { from: accounts[0] })
      .should.be.rejectedWith(EVMRevert);
    const tooBigArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer2.address, tooBigArray, { from: accounts[0] }).should.be.rejectedWith(EVMRevert);
    const tx = await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer2.address, [2], { from: accounts[0] }).should.be.fulfilled;
    log(`${tx.receipt.gasUsed} gas units used to add a Trusted Issuer`);
    expect(await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(2)).to.deep.equal([trustedIssuer2.address]);
    // reset initial state
    await trustedIssuersRegistry.removeTrustedIssuer(trustedIssuer2.address, { from: accounts[0] }).should.be.fulfilled;
  });

  it('Add trusted Issuer should fail if trusted issuer address provided already exists', async () => {
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer1.address, [2], { from: accounts[0] }).should.be.rejectedWith(EVMRevert);
  });

  it('Remove trusted issuer should pass if a trusted issuer exists', async () => {
    expect(await trustedIssuersRegistry.isTrustedIssuer(trustedIssuer1.address)).to.be.true;
    const tx = await trustedIssuersRegistry.removeTrustedIssuer(trustedIssuer1.address, { from: accounts[0] }).should.be.fulfilled;
    expect(await trustedIssuersRegistry.isTrustedIssuer(trustedIssuer1.address)).to.be.false;
    expect(await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(2)).to.be.empty;
    log(`${tx.receipt.gasUsed} gas units used to remove a Trusted Issuer`);
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
    await trustedIssuersRegistry
      .updateIssuerClaimTopics('0x0000000000000000000000000000000000000000', [2, 7, 8], { from: accounts[0] })
      .should.be.rejectedWith(EVMRevert);
    const tooBigArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    await trustedIssuersRegistry
      .updateIssuerClaimTopics(trustedIssuer1.address, tooBigArray, { from: accounts[0] })
      .should.be.rejectedWith(EVMRevert);
    const tx = await trustedIssuersRegistry.updateIssuerClaimTopics(trustedIssuer1.address, [2, 7, 8], { from: accounts[0] }).should.be.fulfilled;
    await trustedIssuersRegistry.updateIssuerClaimTopics(trustedIssuer1.address, [2, 7, 8], { from: accounts[0] }).should.be.fulfilled;

    (await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 1)).should.equal(false);
    (await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 2)).should.equal(true);
    (await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 7)).should.equal(true);
    (await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 8)).should.equal(true);
    expect(await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(1)).to.be.empty;
    expect(await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(2)).to.deep.equal([trustedIssuer1.address]);
    expect(await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(7)).to.deep.equal([trustedIssuer1.address]);
    expect(await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(8)).to.deep.equal([trustedIssuer1.address]);
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
    const tx1 = await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer2.address, [0, 2, 1], { from: accounts[0] }).should.be.fulfilled;
    expect(await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(0)).to.deep.equal([trustedIssuer2.address]);
    expect(await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(2)).to.deep.equal([trustedIssuer2.address]);
    expect(await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(1)).to.deep.equal([trustedIssuer1.address, trustedIssuer2.address]);
    log(`${tx1.receipt.gasUsed} gas units used to add a Trusted Issuer`);
    await trustedIssuersRegistry
      .removeTrustedIssuer('0x0000000000000000000000000000000000000000', { from: accounts[0] })
      .should.be.rejectedWith(EVMRevert);
    const tx2 = await trustedIssuersRegistry.removeTrustedIssuer(trustedIssuer2.address, { from: accounts[0] }).should.be.fulfilled;
    expect(await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(0)).to.be.empty;
    expect(await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(2)).to.be.empty;
    expect(await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(1)).to.deep.equal([trustedIssuer1.address]);
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

  it('Should return trusted issuers for claim topic', async () => {
    expect(await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(1)).to.deep.equal([trustedIssuer1.address]);
    expect(await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(2)).to.be.empty;
  });

  it('should revert if more than 50 trusted issuers', async () => {
    // eslint-disable-next-line no-plusplus
    for (let i = 1; i <= 49; i++) {
      // eslint-disable-next-line no-await-in-loop
      await trustedIssuersRegistry.addTrustedIssuer(`0x00000000000000000000000000000000000000${i.toString().padStart(2, '0')}`, [2], {
        from: accounts[0],
      }).should.be.fulfilled;
    }

    // This should fail because there are already 50 trusted issuers
    await trustedIssuersRegistry
      .addTrustedIssuer('0x0000000000000000000000000000000000000050', [2], { from: accounts[0] })
      .should.be.rejectedWith(EVMRevert);
  });
});
