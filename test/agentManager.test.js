const {
  AgentManager,
  ClaimTopicsRegistry,
  Compliance,
  IdentityRegistry,
  IdentityRegistryStorage,
  Implementation,
  IssuerIdentity,
  Token,
  TrustedIssuersRegistry,
  TokenProxy,
  IdentityRegistryStorageProxy,
  IdentityRegistryProxy,
  ClaimTopicsRegistryProxy,
  TrustedIssuersRegistryProxy,
  ModularCompliance,
} = require('./helpers/artifacts');

const { deployIdentityProxy } = require('./helpers/proxy');
const log = require('./helpers/logger');
require('chai').use(require('chai-as-promised')).should();
const EVMRevert = require('./helpers/VMExceptionRevert');

contract('Agent Manager', ([tokeny, claimIssuer, user1, user2, user3, agent, admin]) => {
  let claimTopicsRegistry;
  let identityRegistry;
  let identityRegistryStorage;
  let trustedIssuersRegistry;
  let claimIssuerContract;
  let token;
  let agentManager;
  let defaultCompliance;
  let tokenName;
  let tokenSymbol;
  let tokenDecimals;
  let tokenOnchainID;
  let versionStruct;
  let contractsStruct;
  let modularCompliance;
  const signer = web3.eth.accounts.create();
  const signerKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', signer.address));
  const tokenyKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', tokeny));
  const claimTopics = [1, 7, 3];
  let user1Contract;
  let user2Contract;
  const actionKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', user1));

  // Proxy
  let ctrProxy;
  let tirProxy;
  let irsProxy;
  let irProxy;
  let tokenProxy;

  let implementationSC;

  before(async () => {
    // Tokeny deploying all implementations
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: tokeny });
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({ from: tokeny });
    identityRegistryStorage = await IdentityRegistryStorage.new({ from: tokeny });
    identityRegistry = await IdentityRegistry.new({ from: tokeny });
    modularCompliance = await ModularCompliance.new({ from: tokeny });
    token = await Token.new({ from: tokeny });

    // setting the implementation authority
    implementationSC = await Implementation.new(true, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', {
      from: tokeny,
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
    await implementationSC.addAndUseTREXVersion(versionStruct, contractsStruct, { from: tokeny });

    // Ctr
    ctrProxy = await ClaimTopicsRegistryProxy.new(implementationSC.address, { from: tokeny });

    claimTopicsRegistry = await ClaimTopicsRegistry.at(ctrProxy.address);

    // Tir
    tirProxy = await TrustedIssuersRegistryProxy.new(implementationSC.address, { from: tokeny });

    trustedIssuersRegistry = await TrustedIssuersRegistry.at(tirProxy.address);

    // Compliance
    defaultCompliance = await Compliance.new({ from: tokeny });

    // Irs
    irsProxy = await IdentityRegistryStorageProxy.new(implementationSC.address, { from: tokeny });

    identityRegistryStorage = await IdentityRegistryStorage.at(irsProxy.address);

    // Ir

    irProxy = await IdentityRegistryProxy.new(
      implementationSC.address,
      trustedIssuersRegistry.address,
      claimTopicsRegistry.address,
      identityRegistryStorage.address,
      {
        from: tokeny,
      },
    );

    identityRegistry = await IdentityRegistry.at(irProxy.address);

    tokenOnchainID = await deployIdentityProxy(tokeny);
    tokenName = 'TREXDINO';
    tokenSymbol = 'TREX';
    tokenDecimals = '0';

    // Token
    tokenProxy = await TokenProxy.new(
      implementationSC.address,
      identityRegistry.address,
      defaultCompliance.address,
      tokenName,
      tokenSymbol,
      tokenDecimals,
      tokenOnchainID.address,
      { from: tokeny },
    );
    token = await Token.at(tokenProxy.address);

    agentManager = await AgentManager.new(token.address, { from: agent });
    await identityRegistryStorage.bindIdentityRegistry(identityRegistry.address, { from: tokeny });

    await token.addAgent(agent, { from: tokeny });

    // Tokeny adds trusted claim Topic to claim topics registry
    await claimTopicsRegistry.addClaimTopic(7, { from: tokeny }).should.be.fulfilled;

    // Claim issuer deploying identity contract
    claimIssuerContract = await IssuerIdentity.new(claimIssuer, { from: claimIssuer });

    // Claim issuer adds claim signer key to his contract
    await claimIssuerContract.addKey(signerKey, 3, 1, { from: claimIssuer }).should.be.fulfilled;

    // Tokeny adds trusted claim Issuer to claimIssuer registry
    await trustedIssuersRegistry.addTrustedIssuer(claimIssuerContract.address, claimTopics, { from: tokeny }).should.be.fulfilled;

    // user1 deploys his identity contract
    user1Contract = await deployIdentityProxy(user1);
    await user1Contract.addKey(actionKey, 2, 1, { from: user1 }).should.be.fulfilled;

    // user2 deploys his identity contract
    user2Contract = await deployIdentityProxy(user2);

    // identity contracts are registered in identity registry
    await identityRegistry.addAgent(agent, { from: tokeny });
    await identityRegistry.addAgent(token.address, { from: tokeny });
    await identityRegistry.registerIdentity(user1, user1Contract.address, 91, {
      from: agent,
    }).should.be.fulfilled;
    await identityRegistry.registerIdentity(user2, user2Contract.address, 101, {
      from: agent,
    }).should.be.fulfilled;

    // user1 gets signature from claim issuer
    const hexedData1 = await web3.utils.asciiToHex('Yea no, this guy is totes legit');
    const hashedDataToSign1 = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [user1Contract.address, 7, hexedData1]),
    );

    const signature1 = (await signer.sign(hashedDataToSign1)).signature;

    // user1 adds claim to identity contract
    await user1Contract.addClaim(7, 1, claimIssuerContract.address, signature1, hexedData1, '', { from: user1 });

    // user2 gets signature from claim issuer
    const hexedData2 = await web3.utils.asciiToHex('Yea no, this guy is totes legit');
    const hashedDataToSign2 = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [user2Contract.address, 7, hexedData2]),
    );

    const signature2 = (await signer.sign(hashedDataToSign2)).signature;

    // user2 adds claim to identity contract
    await user2Contract.addClaim(7, 1, claimIssuerContract.address, signature2, hexedData2, '', { from: user2 }).should.be.fulfilled;
    await token.mint(user1, 1000, { from: agent });
    await agentManager.addAgentAdmin(admin, { from: agent });
    await token.addAgent(agentManager.address, { from: tokeny });
    await identityRegistry.addAgent(agentManager.address, { from: tokeny });
    await token.unpause({ from: agent });
  });

  it('Should add & remove admin to the role manager', async () => {
    await agentManager.removeAgentAdmin(admin, { from: agent });
    (await agentManager.isAgentAdmin(admin)).should.be.equal(false);
    const tx = await agentManager.addAgentAdmin(admin, { from: agent });
    log(`${tx.receipt.gasUsed} gas units used to add an admin to the role manager`);
    (await agentManager.isAgentAdmin(admin)).should.be.equal(true);
  });

  it('Should perform mint & burn if called by Supply modifier', async () => {
    await agentManager.callMint(user2, 1000, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.callBurn(user1, 200, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addSupplyModifier(user1Contract.address, { from: admin });
    (await agentManager.isSupplyModifier(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.callMint(user2, 1000, user1Contract.address, { from: user1 });
    log(`${tx.receipt.gasUsed} gas units used to mint on a single user`);
    (await token.balanceOf(user2)).toString().should.be.equal('1000');
    const tx2 = await agentManager.callBurn(user2, 1000, user1Contract.address, { from: user1 });
    log(`${tx2.receipt.gasUsed} gas units used to perform a burn on a user`);
    (await token.balanceOf(user2)).toString().should.be.equal('0');
    // reset initial state
    await agentManager.removeSupplyModifier(user1Contract.address, { from: admin });
    (await agentManager.isSupplyModifier(user1Contract.address)).should.be.equal(false);
  });

  it('Should perform batch mint & batch burn if called by Supply modifier', async () => {
    await agentManager.callBatchMint([user1, user2], [100, 100], user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.callBatchBurn([user1, user1], [100, 100], user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addSupplyModifier(user1Contract.address, { from: admin });
    (await agentManager.isSupplyModifier(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.callBatchMint([user1, user2], [100, 100], user1Contract.address, { from: user1 });
    log(`${tx.receipt.gasUsed} gas units used to batch mint on 2 users`);
    (await token.balanceOf(user1)).toString().should.be.equal('1100');
    (await token.balanceOf(user2)).toString().should.be.equal('100');
    const tx2 = await agentManager.callBatchBurn([user1, user2], [100, 100], user1Contract.address, { from: user1 });
    (await token.balanceOf(user1)).toString().should.be.equal('1000');
    (await token.balanceOf(user2)).toString().should.be.equal('0');
    log(`${tx2.receipt.gasUsed} gas units used to perform batch burn on 2 users`);
    // reset initial state
    await agentManager.removeSupplyModifier(user1Contract.address, { from: admin });
    (await agentManager.isSupplyModifier(user1Contract.address)).should.be.equal(false);
  });

  it('Should remove supply admin from the role manager.', async () => {
    await agentManager.addSupplyModifier(user1Contract.address, { from: admin });
    (await agentManager.isSupplyModifier(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.removeSupplyModifier(user1Contract.address, { from: admin });
    log(`${tx.receipt.gasUsed} gas units used to remove admin supply from the role manager`);
    (await agentManager.isSupplyModifier(user1Contract.address)).should.be.equal(false);
  });

  it('Should perform forced transfer if called by transfer manager', async () => {
    await agentManager.callForcedTransfer(user1, user2, 200, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    (await agentManager.isTransferManager(user1Contract.address)).should.be.equal(false);
    await agentManager.addTransferManager(user1Contract.address, { from: admin });
    (await agentManager.isTransferManager(user1Contract.address)).should.be.equal(true);
    (await token.balanceOf(user1)).toString().should.be.equal('1000');
    (await token.balanceOf(user2)).toString().should.be.equal('0');

    const tx = await agentManager.callForcedTransfer(user1, user2, 200, user1Contract.address, { from: user1 });
    log(`${tx.receipt.gasUsed} gas units used from transfer manager to perform a forced Transfer `);
    (await token.balanceOf(user1)).toString().should.be.equal('800');
    (await token.balanceOf(user2)).toString().should.be.equal('200');
    // reset initial state
    await token.transfer(user1, 200, { from: user2 });
    await agentManager.removeTransferManager(user1Contract.address, { from: admin });
  });

  it('Should perform batch forced transfer if called by transfer manager', async () => {
    await agentManager
      .callBatchForcedTransfer([user1, user1], [user2, user2], [200, 100], user1Contract.address, { from: user1 })
      .should.be.rejectedWith(EVMRevert);
    await agentManager.addTransferManager(user1Contract.address, { from: admin });
    (await agentManager.isTransferManager(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.callBatchForcedTransfer([user1, user1], [user2, user2], [200, 100], user1Contract.address, { from: user1 });
    (await token.balanceOf(user1)).toString().should.be.equal('700');
    (await token.balanceOf(user2)).toString().should.be.equal('300');
    log(`${tx.receipt.gasUsed} gas units used to perform a batch forced Transfer on 2 users `);
    // reset initial state
    await token.transfer(user1, 300, { from: user2 });
    await agentManager.removeTransferManager(user1Contract.address, { from: admin });
  });

  it('Should remove transfer manager from the role manager', async () => {
    await agentManager.addTransferManager(user1Contract.address, { from: admin });
    (await agentManager.isTransferManager(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.removeTransferManager(user1Contract.address, { from: admin });
    log(`${tx.receipt.gasUsed} gas units used to remove a transfer Manager`);
    (await agentManager.isTransferManager(user1Contract.address)).should.be.equal(false);
  });

  it('Should freeze adress if called by freezer', async () => {
    await agentManager.callSetAddressFrozen(user1, true, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.callSetAddressFrozen(user1, true, user1Contract.address, { from: user1 });
    log(`${tx.receipt.gasUsed} gas units used to freeze an address`);
    (await token.isFrozen(user1)).should.be.equal(true);
    // reset initial state
    await agentManager.callSetAddressFrozen(user1, false, user1Contract.address, { from: user1 });
    await agentManager.removeFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(false);
  });

  it('Should freeze address in batch if called by freezer', async () => {
    await agentManager
      .callBatchSetAddressFrozen([user1, user2], [true, true], user1Contract.address, { from: user1 })
      .should.be.rejectedWith(EVMRevert);
    await agentManager.addFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.callBatchSetAddressFrozen([user1, user2], [true, true], user1Contract.address, { from: user1 });
    (await token.isFrozen(user1)).should.be.equal(true);
    (await token.isFrozen(user2)).should.be.equal(true);
    log(`${tx.receipt.gasUsed} gas units used to batch freeze 2 addresses`);
    // reset initial state
    await agentManager.callBatchSetAddressFrozen([user1, user2], [false, false], user1Contract.address, { from: user1 });
    await agentManager.removeFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(false);
  });

  it('Should freeze & unfreeze tokens partially if called by freezer', async () => {
    await agentManager.callFreezePartialTokens(user1, 200, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.callFreezePartialTokens(user1, 200, user1Contract.address, { from: user1 });
    (await token.getFrozenTokens(user1)).toString().should.be.equal('200');
    log(`${tx.receipt.gasUsed} gas units used to freeze tokens partially on an address`);
    const tx2 = await agentManager.callUnfreezePartialTokens(user1, 200, user1Contract.address, { from: user1 });
    log(`${tx2.receipt.gasUsed} gas units used to unfreeze tokens partially on an address`);
    (await token.getFrozenTokens(user1)).toString().should.be.equal('0');
    // reset initial state
    await agentManager.removeFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(false);
  });

  it('Should freeze & unfreeze partial tokens in batch if called by freezer', async () => {
    await agentManager
      .callBatchFreezePartialTokens([user1, user1], [200, 100], user1Contract.address, { from: user1 })
      .should.be.rejectedWith(EVMRevert);
    await agentManager
      .callBatchUnfreezePartialTokens([user1, user1], [200, 100], user1Contract.address, { from: user1 })
      .should.be.rejectedWith(EVMRevert);
    await agentManager.addFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(true);
    await agentManager
      .callBatchUnfreezePartialTokens([user1, user1], [200, 100], user1Contract.address, { from: user1 })
      .should.be.rejectedWith(EVMRevert);
    const tx = await agentManager.callBatchFreezePartialTokens([user1, user1], [200, 100], user1Contract.address, { from: user1 });
    (await token.getFrozenTokens(user1)).toString().should.be.equal('300');
    log(`${tx.receipt.gasUsed} gas units used to batch freeze tokens partially`);
    const tx2 = await agentManager.callBatchUnfreezePartialTokens([user1, user1], [200, 100], user1Contract.address, { from: user1 });
    (await token.getFrozenTokens(user1)).toString().should.be.equal('0');
    log(`${tx2.receipt.gasUsed} gas units used to batch unfreeze tokens`);
    // reset initial state
    await agentManager.removeFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(false);
  });

  it('Should pause & unpause token if called by freezer', async () => {
    await agentManager.callPause(user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.callPause(user1Contract.address, { from: user1 });
    log(`${tx.receipt.gasUsed} gas units used from Freezer to call Pause token`);
    (await token.paused()).should.be.equal(true);
    const tx2 = await agentManager.callUnpause(user1Contract.address, { from: user1 });
    (await token.paused()).should.be.equal(false);
    log(`${tx2.receipt.gasUsed} gas units used from Freezer to unpause token`);
    // reset initial state
    await agentManager.removeFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(false);
  });

  it('Should remove freezer from the role manager.', async () => {
    await agentManager.addFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.removeFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(false);
    log(`${tx.receipt.gasUsed} gas units used to remove Freezer from the role manager`);
  });

  it('Should recover address if called by recovery agent', async () => {
    await user2Contract.addKey(tokenyKey, 1, 1, { from: user2 }).should.be.fulfilled;
    const userKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', user3));
    await token.mint(user2, 1000, { from: agent });
    await user2Contract.addKey(userKey, 1, 1, { from: tokeny }).should.be.fulfilled;
    await agentManager
      .callRecoveryAddress(user2, user3, user2Contract.address, user1Contract.address, { from: user1 })
      .should.be.rejectedWith(EVMRevert);
    await agentManager.addRecoveryAgent(user1Contract.address, { from: admin });
    (await agentManager.isRecoveryAgent(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.callRecoveryAddress(user2, user3, user2Contract.address, user1Contract.address, { from: user1 });
    log(`${tx.receipt.gasUsed} gas units used by the recovery agent to recover an address`);
    const balance1 = await token.balanceOf(user2);
    const balance2 = await token.balanceOf(user3);
    balance1.toString().should.equal('0');
    balance2.toString().should.equal('1000');
    // reset initial state
    await agentManager.callRecoveryAddress(user3, user2, user2Contract.address, user1Contract.address, { from: user1 });
    await agentManager.removeRecoveryAgent(user1Contract.address, { from: admin });
    (await agentManager.isRecoveryAgent(user1Contract.address)).should.be.equal(false);
  });

  it('Should remove recovery agent from the role manager.', async () => {
    await agentManager.addRecoveryAgent(user1Contract.address, { from: admin });
    (await agentManager.isRecoveryAgent(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.removeRecoveryAgent(user1Contract.address, { from: admin });
    log(`${tx.receipt.gasUsed} gas units used to remove a recovery agent from the role manager`);
    (await agentManager.isRecoveryAgent(user1Contract.address)).should.be.equal(false);
  });

  it('Should add and remove compliance agent from the role manager.', async () => {
    const tx1 = await agentManager.addComplianceAgent(user1Contract.address, { from: admin });
    (await agentManager.isComplianceAgent(user1Contract.address)).should.be.equal(true);
    const tx2 = await agentManager.removeComplianceAgent(user1Contract.address, { from: admin });
    (await agentManager.isComplianceAgent(user1Contract.address)).should.be.equal(false);
    log(`${tx1.receipt.gasUsed} gas units used to add a compliance agent to the role manager`);
    log(`${tx2.receipt.gasUsed} gas units used to remove a compliance agent from the role manager`);
  });

  it('Should register & delete identity if called by whitelist manager', async () => {
    const identity = await deployIdentityProxy(admin);
    await agentManager.callRegisterIdentity(admin, identity.address, 100, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addWhiteListManager(user1Contract.address, { from: admin });
    (await agentManager.isWhiteListManager(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.callRegisterIdentity(admin, identity.address, 100, user1Contract.address, { from: user1 });
    log(`${tx.receipt.gasUsed} gas units used by Whitelist manager to register Identity`);
    const registered = await identityRegistry.contains(admin);
    registered.toString().should.equal('true');
    const tx2 = await agentManager.callDeleteIdentity(admin, user1Contract.address, { from: user1 });
    log(`${tx2.receipt.gasUsed} gas units used by whitelist Manager to delete Identity`);
    const result = await identityRegistry.contains(admin);
    result.should.equal(false);
    // reset initial state
    await agentManager.removeWhiteListManager(user1Contract.address, { from: admin });
    (await agentManager.isWhiteListManager(user1Contract.address)).should.be.equal(false);
  });

  it('Should update identity if called by whitelist manager', async () => {
    const newIdentity = await deployIdentityProxy(user2);
    await agentManager.callUpdateIdentity(user2, newIdentity.address, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addWhiteListManager(user1Contract.address, { from: admin });
    (await agentManager.isWhiteListManager(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.callUpdateIdentity(user2, newIdentity.address, user1Contract.address, { from: user1 });
    log(`${tx.receipt.gasUsed} gas units used by whitelist Manager to update Identity`);
    const updated = await identityRegistry.identity(user2);
    updated.toString().should.equal(newIdentity.address);
    // reset initial state
    await agentManager.callUpdateIdentity(user2, user2Contract.address, user1Contract.address, { from: user1 });
    await agentManager.removeWhiteListManager(user1Contract.address, { from: admin });
  });

  it('Should update country if called by whitelist manager', async () => {
    await agentManager.callUpdateCountry(user2, 84, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addWhiteListManager(user1Contract.address, { from: admin });
    (await agentManager.isWhiteListManager(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.callUpdateCountry(user2, 84, user1Contract.address, { from: user1 });
    log(`${tx.receipt.gasUsed} gas units used by whitelist Manager to update Country`);
    const country = await identityRegistry.investorCountry(user2);
    country.toString().should.equal('84');
    // reset initial state
    await agentManager.callUpdateCountry(user2, 101, user1Contract.address, { from: user1 });
    await agentManager.removeWhiteListManager(user1Contract.address, { from: admin });
  });

  it('Should remove whitelist manager from the role manager.', async () => {
    await agentManager.addWhiteListManager(user1Contract.address, { from: admin });
    (await agentManager.isWhiteListManager(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.removeWhiteListManager(user1Contract.address, { from: admin });
    log(`${tx.receipt.gasUsed} gas units used to remove whitelist Manager from role manager`);
    (await agentManager.isWhiteListManager(user1Contract.address)).should.be.equal(false);
  });

  it('Should not add or remove roles if not admin', async () => {
    await agentManager.addWhiteListManager(user1Contract.address, { from: tokeny }).should.be.rejectedWith(EVMRevert);
  });
});
