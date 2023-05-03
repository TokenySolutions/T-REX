require('chai').use(require('chai-as-promised')).should();
const EVMRevert = require('./helpers/VMExceptionRevert');

const { deployIdentityProxy } = require('./helpers/proxy');

const {
  ClaimTopicsRegistry,
  IdentityRegistry,
  TrustedIssuersRegistry,
  IssuerIdentity,
  Token,
  Compliance,
  OwnerManager,
  IdentityRegistryStorage,
  TokenProxy,
  Implementation,
  ClaimTopicsRegistryProxy,
  IdentityRegistryProxy,
  IdentityRegistryStorageProxy,
  TrustedIssuersRegistryProxy,
  ModularCompliance,
} = require('./helpers/artifacts');

contract('Owner Manager', (accounts) => {
  let claimTopicsRegistry;
  let identityRegistry;
  let identityRegistryStorage;
  let trustedIssuersRegistry;
  let claimIssuerContract;
  let token;
  let ownerManager;
  let defaultCompliance;
  let tokenName;
  let tokenSymbol;
  let tokenDecimals;
  let tokenOnchainID;
  let implementationSC;
  let versionStruct;
  let contractsStruct;
  let modularCompliance;
  const signer = web3.eth.accounts.create();
  const signerKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', signer.address));

  const tokeny = accounts[0];
  const claimIssuer = accounts[1];
  const user1 = accounts[2];
  const user2 = accounts[3];
  const claimTopics = [1, 7, 3];
  let user1Contract;
  let user2Contract;
  const actionKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', user1));

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
    const ctrProxy = await ClaimTopicsRegistryProxy.new(implementationSC.address, { from: tokeny });

    claimTopicsRegistry = await ClaimTopicsRegistry.at(ctrProxy.address);

    // Tir
    const tirProxy = await TrustedIssuersRegistryProxy.new(implementationSC.address, { from: tokeny });

    trustedIssuersRegistry = await TrustedIssuersRegistry.at(tirProxy.address);

    // Compliance
    defaultCompliance = await Compliance.new({ from: tokeny });

    // Irs
    const irsProxy = await IdentityRegistryStorageProxy.new(implementationSC.address, { from: tokeny });

    identityRegistryStorage = await IdentityRegistryStorage.at(irsProxy.address);

    // Ir

    const irProxy = await IdentityRegistryProxy.new(
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
    const tokenProxy = await TokenProxy.new(
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

    ownerManager = await OwnerManager.new(token.address, { from: tokeny });
    await identityRegistryStorage.bindIdentityRegistry(identityRegistry.address, { from: tokeny });
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

    // set ownerManager as owner of all contracts
    await ownerManager.addOwnerAdmin(tokeny, { from: tokeny });
    await identityRegistryStorage.transferOwnership(ownerManager.address, { from: tokeny });
    await token.transferOwnership(ownerManager.address, { from: tokeny });
    await identityRegistry.transferOwnership(ownerManager.address, { from: tokeny });
    await claimTopicsRegistry.transferOwnership(ownerManager.address, { from: tokeny });
    await trustedIssuersRegistry.transferOwnership(ownerManager.address, { from: tokeny });
    await defaultCompliance.transferOwnership(ownerManager.address, { from: tokeny });
  });

  it('Should add and remove ownerAdmin role on OwnerManager', async () => {
    const admin = accounts[6];
    // try to add role without being admin
    await ownerManager.addOwnerAdmin(admin, { from: user1 }).should.be.rejectedWith(EVMRevert);
    (await ownerManager.isOwnerAdmin(admin)).should.be.equal(false);
    // add role as admin
    await ownerManager.addOwnerAdmin(admin, { from: tokeny });
    (await ownerManager.isOwnerAdmin(admin)).should.be.equal(true);
    // try to remove role without being admin
    await ownerManager.removeOwnerAdmin(admin, { from: user1 }).should.be.rejectedWith(EVMRevert);
    (await ownerManager.isOwnerAdmin(admin)).should.be.equal(true);
    // remove role as admin
    await ownerManager.removeOwnerAdmin(admin, { from: tokeny });
    (await ownerManager.isOwnerAdmin(admin)).should.be.equal(false);
  });

  it('Should add and remove registryAddressSetter role on OwnerManager', async () => {
    const registrySetter = accounts[6];
    // try to add role without being admin
    await ownerManager.addRegistryAddressSetter(registrySetter, { from: user1 }).should.be.rejectedWith(EVMRevert);
    (await ownerManager.isRegistryAddressSetter(registrySetter)).should.be.equal(false);
    // add role as admin
    await ownerManager.addRegistryAddressSetter(registrySetter, { from: tokeny });
    (await ownerManager.isRegistryAddressSetter(registrySetter)).should.be.equal(true);
    // try to remove role without being admin
    await ownerManager.removeRegistryAddressSetter(registrySetter, { from: user1 }).should.be.rejectedWith(EVMRevert);
    (await ownerManager.isRegistryAddressSetter(registrySetter)).should.be.equal(true);
    // remove role as admin
    await ownerManager.removeRegistryAddressSetter(registrySetter, { from: tokeny });
    (await ownerManager.isRegistryAddressSetter(registrySetter)).should.be.equal(false);
  });

  it('Should add and remove complianceSetter role on OwnerManager', async () => {
    const complianceSetter = accounts[6];
    // try to add role without being admin
    await ownerManager.addComplianceSetter(complianceSetter, { from: user1 }).should.be.rejectedWith(EVMRevert);
    (await ownerManager.isComplianceSetter(complianceSetter)).should.be.equal(false);
    // add role as admin
    await ownerManager.addComplianceSetter(complianceSetter, { from: tokeny });
    (await ownerManager.isComplianceSetter(complianceSetter)).should.be.equal(true);
    // try to remove role without being admin
    await ownerManager.removeComplianceSetter(complianceSetter, { from: user1 }).should.be.rejectedWith(EVMRevert);
    (await ownerManager.isComplianceSetter(complianceSetter)).should.be.equal(true);
    // remove role as admin
    await ownerManager.removeComplianceSetter(complianceSetter, { from: tokeny });
    (await ownerManager.isComplianceSetter(complianceSetter)).should.be.equal(false);
  });

  it('Should add and remove claimRegistryManager role on OwnerManager', async () => {
    const claimRegistryManager = accounts[6];
    // try to add role without being admin
    await ownerManager.addClaimRegistryManager(claimRegistryManager, { from: user1 }).should.be.rejectedWith(EVMRevert);
    (await ownerManager.isClaimRegistryManager(claimRegistryManager)).should.be.equal(false);
    // add role as admin
    await ownerManager.addClaimRegistryManager(claimRegistryManager, { from: tokeny });
    (await ownerManager.isClaimRegistryManager(claimRegistryManager)).should.be.equal(true);
    // try to remove role without being admin
    await ownerManager.removeClaimRegistryManager(claimRegistryManager, { from: user1 }).should.be.rejectedWith(EVMRevert);
    (await ownerManager.isClaimRegistryManager(claimRegistryManager)).should.be.equal(true);
    // remove role as admin
    await ownerManager.removeClaimRegistryManager(claimRegistryManager, { from: tokeny });
    (await ownerManager.isClaimRegistryManager(claimRegistryManager)).should.be.equal(false);
  });

  it('Should add and remove issuersRegistryManager role on OwnerManager', async () => {
    const issuersRegistryManager = accounts[6];
    // try to add role without being admin
    await ownerManager.addIssuersRegistryManager(issuersRegistryManager, { from: user1 }).should.be.rejectedWith(EVMRevert);
    (await ownerManager.isIssuersRegistryManager(issuersRegistryManager)).should.be.equal(false);
    // add role as admin
    await ownerManager.addIssuersRegistryManager(issuersRegistryManager, { from: tokeny });
    (await ownerManager.isIssuersRegistryManager(issuersRegistryManager)).should.be.equal(true);
    // try to remove role without being admin
    await ownerManager.removeIssuersRegistryManager(issuersRegistryManager, { from: user1 }).should.be.rejectedWith(EVMRevert);
    (await ownerManager.isIssuersRegistryManager(issuersRegistryManager)).should.be.equal(true);
    // remove role as admin
    await ownerManager.removeIssuersRegistryManager(issuersRegistryManager, { from: tokeny });
    (await ownerManager.isIssuersRegistryManager(issuersRegistryManager)).should.be.equal(false);
  });

  it('Should add and remove tokenInfoManager role on OwnerManager', async () => {
    const tokenInfoManager = accounts[6];
    // try to add role without being admin
    await ownerManager.addTokenInfoManager(tokenInfoManager, { from: user1 }).should.be.rejectedWith(EVMRevert);
    (await ownerManager.isTokenInfoManager(tokenInfoManager)).should.be.equal(false);
    // add role as admin
    await ownerManager.addTokenInfoManager(tokenInfoManager, { from: tokeny });
    (await ownerManager.isTokenInfoManager(tokenInfoManager)).should.be.equal(true);
    // try to remove role without being admin
    await ownerManager.removeTokenInfoManager(tokenInfoManager, { from: user1 }).should.be.rejectedWith(EVMRevert);
    (await ownerManager.isTokenInfoManager(tokenInfoManager)).should.be.equal(true);
    // remove role as admin
    await ownerManager.removeTokenInfoManager(tokenInfoManager, { from: tokeny });
    (await ownerManager.isTokenInfoManager(tokenInfoManager)).should.be.equal(false);
  });

  it('Should set identity registry only if onchainID is registered as registryAddressSetter', async () => {
    const registrySetter = user1;
    const registrySetterID = user1Contract;
    await ownerManager.addRegistryAddressSetter(registrySetterID.address, { from: tokeny });
    (await ownerManager.isRegistryAddressSetter(registrySetterID.address)).should.be.equal(true);
    // create new identity registry contract
    const irProxy2 = await IdentityRegistryProxy.new(
      implementationSC.address,
      trustedIssuersRegistry.address,
      claimTopicsRegistry.address,
      identityRegistryStorage.address,
      {
        from: tokeny,
      },
    );

    const identityRegistry2 = await IdentityRegistry.at(irProxy2.address);

    // set identity registry on the token contract
    await ownerManager.callSetIdentityRegistry(identityRegistry2.address, registrySetterID.address, { from: registrySetter });
    (await token.identityRegistry()).should.be.equal(identityRegistry2.address);
    // should not work if wallet is not set as management key on the onchainID
    await ownerManager
      .callSetIdentityRegistry(identityRegistry2.address, registrySetterID.address, { from: tokeny })
      .should.be.rejectedWith(EVMRevert);
    (await token.identityRegistry()).should.be.equal(identityRegistry2.address);
    // reset initial state
    await ownerManager.callSetIdentityRegistry(identityRegistry.address, registrySetterID.address, { from: registrySetter });
    await ownerManager.removeRegistryAddressSetter(registrySetterID.address, { from: tokeny });
  });

  it('Should set topics registry only if onchainID is registered as registryAddressSetter', async () => {
    const registrySetter = user1;
    const registrySetterID = user1Contract;
    await ownerManager.addRegistryAddressSetter(registrySetterID.address, { from: tokeny });
    (await ownerManager.isRegistryAddressSetter(registrySetterID.address)).should.be.equal(true);
    // create new claim topics registry contract
    const ctrProxy2 = await ClaimTopicsRegistryProxy.new(implementationSC.address, { from: registrySetter });
    const claimTopicsRegistry2 = await ClaimTopicsRegistry.at(ctrProxy2.address);
    // set claim topics registry on the identity registry contract
    await ownerManager.callSetClaimTopicsRegistry(claimTopicsRegistry2.address, registrySetterID.address, { from: registrySetter });
    (await identityRegistry.topicsRegistry()).should.be.equal(claimTopicsRegistry2.address);
    // should not work if wallet is not set as management key on the onchainID
    await ownerManager
      .callSetClaimTopicsRegistry(claimTopicsRegistry2.address, registrySetterID.address, { from: tokeny })
      .should.be.rejectedWith(EVMRevert);
    (await identityRegistry.topicsRegistry()).should.be.equal(claimTopicsRegistry2.address);
    // reset initial state
    await ownerManager.callSetClaimTopicsRegistry(claimTopicsRegistry.address, registrySetterID.address, { from: registrySetter });
    await ownerManager.removeRegistryAddressSetter(registrySetterID.address, { from: tokeny });
  });

  it('Should set trusted issuers registry only if onchainID is registered as registryAddressSetter', async () => {
    const registrySetter = user1;
    const registrySetterID = user1Contract;
    await ownerManager.addRegistryAddressSetter(registrySetterID.address, { from: tokeny });
    (await ownerManager.isRegistryAddressSetter(registrySetterID.address)).should.be.equal(true);
    // create new trusted issuers registry contract
    const tirProxy2 = await TrustedIssuersRegistryProxy.new(implementationSC.address, { from: registrySetter });
    const trustedIssuersRegistry2 = await TrustedIssuersRegistry.at(tirProxy2.address);
    // set trusted issuers registry on the identity registry contract
    await ownerManager.callSetTrustedIssuersRegistry(trustedIssuersRegistry2.address, registrySetterID.address, { from: registrySetter });
    (await identityRegistry.issuersRegistry()).should.be.equal(trustedIssuersRegistry2.address);
    // should not work if wallet is not set as management key on the onchainID
    await ownerManager
      .callSetTrustedIssuersRegistry(trustedIssuersRegistry2.address, registrySetterID.address, { from: tokeny })
      .should.be.rejectedWith(EVMRevert);
    (await identityRegistry.issuersRegistry()).should.be.equal(trustedIssuersRegistry2.address);
    // reset initial state
    await ownerManager.callSetTrustedIssuersRegistry(trustedIssuersRegistry.address, registrySetterID.address, { from: registrySetter });
    await ownerManager.removeRegistryAddressSetter(registrySetterID.address, { from: tokeny });
  });

  it('Should set compliance contract only if onchainID is registered as registryAddressSetter', async () => {
    const complianceSetter = user1;
    const complianceSetterID = user1Contract;
    await ownerManager.addComplianceSetter(complianceSetterID.address, { from: tokeny });
    (await ownerManager.isComplianceSetter(complianceSetterID.address)).should.be.equal(true);
    // create new compliance contract
    const compliance2 = await Compliance.new({ from: complianceSetter });
    // set compliance on the token contract
    await ownerManager.callSetCompliance(compliance2.address, complianceSetterID.address, { from: complianceSetter });
    (await token.compliance()).should.be.equal(compliance2.address);
    // should not work if wallet is not set as management key on the onchainID
    await ownerManager.callSetCompliance(compliance2.address, complianceSetterID.address, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    (await token.compliance()).should.be.equal(compliance2.address);
    // reset initial state
    await ownerManager.callSetCompliance(defaultCompliance.address, complianceSetterID.address, { from: complianceSetter });
    await ownerManager.removeComplianceSetter(complianceSetterID.address, { from: tokeny });
  });

  it('Should add and remove trusted issuer from the registry only if onchainID is registered as IssuersRegistryManager', async () => {
    const issuersRegistryManager = user1;
    const issuersRegistryManagerID = user1Contract;
    const claimIssuer2 = accounts[6];
    const claimIssuerContract2 = await IssuerIdentity.new(claimIssuer2, { from: claimIssuer2 });
    // add new issuersRegistryManager
    await ownerManager.addIssuersRegistryManager(issuersRegistryManagerID.address, { from: tokeny });
    (await ownerManager.isIssuersRegistryManager(issuersRegistryManagerID.address)).should.be.equal(true);
    // add trusted issuer in the registry
    await ownerManager.callAddTrustedIssuer(claimIssuerContract2.address, claimTopics, issuersRegistryManagerID.address, {
      from: issuersRegistryManager,
    });
    (await trustedIssuersRegistry.isTrustedIssuer(claimIssuerContract2.address)).should.be.equal(true);
    // remove should not work if wallet is not set as management key on the onchainID
    await ownerManager
      .callRemoveTrustedIssuer(claimIssuerContract2.address, issuersRegistryManagerID.address, { from: tokeny })
      .should.be.rejectedWith(EVMRevert);
    (await trustedIssuersRegistry.isTrustedIssuer(claimIssuerContract2.address)).should.be.equal(true);
    // remove should work if wallet is set as management key on the onchainID
    await ownerManager.callRemoveTrustedIssuer(claimIssuerContract2.address, issuersRegistryManagerID.address, { from: issuersRegistryManager });
    (await trustedIssuersRegistry.isTrustedIssuer(claimIssuerContract2.address)).should.be.equal(false);
    // reset initial state
    await ownerManager.removeIssuersRegistryManager(issuersRegistryManagerID.address, { from: tokeny });
  });

  it('Should update trusted issuer claim topics only if onchainID is registered as IssuersRegistryManager', async () => {
    const issuersRegistryManager = user1;
    const issuersRegistryManagerID = user1Contract;
    const claimTopics2 = [4];
    // add new issuersRegistryManager
    await ownerManager.addIssuersRegistryManager(issuersRegistryManagerID.address, { from: tokeny });
    (await ownerManager.isIssuersRegistryManager(issuersRegistryManagerID.address)).should.be.equal(true);
    // update should not work if wallet is not set as management key on the onchainID
    await ownerManager
      .callUpdateIssuerClaimTopics(claimIssuerContract.address, claimTopics2, issuersRegistryManagerID.address, { from: tokeny })
      .should.be.rejectedWith(EVMRevert);
    (await trustedIssuersRegistry.hasClaimTopic(claimIssuerContract.address, 4)).should.be.equal(false);
    // update should work if wallet is set as management key on the onchainID
    await ownerManager.callUpdateIssuerClaimTopics(claimIssuerContract.address, claimTopics2, issuersRegistryManagerID.address, {
      from: issuersRegistryManager,
    });
    (await trustedIssuersRegistry.hasClaimTopic(claimIssuerContract.address, 4)).should.be.equal(true);
    // reset initial state
    await ownerManager.callUpdateIssuerClaimTopics(claimIssuerContract.address, claimTopics, issuersRegistryManagerID.address, {
      from: issuersRegistryManager,
    });
    await ownerManager.removeIssuersRegistryManager(issuersRegistryManagerID.address, { from: tokeny });
  });

  it('Should set token name only if onchainID is registered as TokenInfoManager', async () => {
    const tokenInfoManager = accounts[6];
    const tokenInfoManagerIdentity = await deployIdentityProxy(tokenInfoManager);
    // should revert if sender is not token info manager
    await ownerManager.callSetTokenName('TREXDINO1', tokenInfoManagerIdentity.address, { from: tokenInfoManager }).should.be.rejectedWith(EVMRevert);

    // should set information if sender is token info manager
    await ownerManager.addTokenInfoManager(tokenInfoManagerIdentity.address, { from: tokeny }).should.be.fulfilled;
    (await ownerManager.isTokenInfoManager(tokenInfoManagerIdentity.address)).should.be.equal(true);
    await ownerManager.callSetTokenName('TREXDINO1', tokenInfoManagerIdentity.address, { from: tokenInfoManager }).should.be.fulfilled;

    (await token.name()).should.equal('TREXDINO1');
    // reset initial state
    await ownerManager.callSetTokenName('TREXDINO', tokenInfoManagerIdentity.address, { from: tokenInfoManager }).should.be.fulfilled;
    await ownerManager.removeTokenInfoManager(tokenInfoManagerIdentity.address, { from: tokeny }).should.be.fulfilled;
  });

  it('Should set token onchain ID only if sender onchainID is registered as TokenInfoManager', async () => {
    const tokenInfoManager = accounts[6];
    const tokenInfoManagerIdentity = await deployIdentityProxy(tokenInfoManager);
    // should revert if sender is not token info manager
    await ownerManager
      .callSetTokenOnchainID('0x0000000000000000000000000000000000000000', tokenInfoManagerIdentity.address, { from: tokenInfoManager })
      .should.be.rejectedWith(EVMRevert);

    // should set information if sender is token info manager
    await ownerManager.addTokenInfoManager(tokenInfoManagerIdentity.address, { from: tokeny }).should.be.fulfilled;
    (await ownerManager.isTokenInfoManager(tokenInfoManagerIdentity.address)).should.be.equal(true);

    await ownerManager.callSetTokenOnchainID('0x0000000000000000000000000000000000000000', tokenInfoManagerIdentity.address, {
      from: tokenInfoManager,
    }).should.be.fulfilled;

    (await token.onchainID()).should.equal('0x0000000000000000000000000000000000000000');
    // reset initial state
    await ownerManager.callSetTokenOnchainID(tokenOnchainID.address, tokenInfoManagerIdentity.address, {
      from: tokenInfoManager,
    }).should.be.fulfilled;
    await ownerManager.removeTokenInfoManager(tokenInfoManagerIdentity.address, { from: tokeny }).should.be.fulfilled;
  });

  it('Should set token symbol only if onchainID is registered as TokenInfoManager', async () => {
    const tokenInfoManager = accounts[6];
    const tokenInfoManagerIdentity = await deployIdentityProxy(tokenInfoManager);
    // should revert if sender is not token info manager
    await ownerManager.callSetTokenSymbol('TREX1', tokenInfoManagerIdentity.address, { from: tokenInfoManager }).should.be.rejectedWith(EVMRevert);

    // should set information if sender is token info manager
    await ownerManager.addTokenInfoManager(tokenInfoManagerIdentity.address, { from: tokeny }).should.be.fulfilled;
    (await ownerManager.isTokenInfoManager(tokenInfoManagerIdentity.address)).should.be.equal(true);

    await ownerManager.callSetTokenSymbol('TREX1', tokenInfoManagerIdentity.address, { from: tokenInfoManager }).should.be.fulfilled;

    (await token.symbol()).should.equal('TREX1');
    // reset initial state
    await ownerManager.callSetTokenSymbol('TREX', tokenInfoManagerIdentity.address, { from: tokenInfoManager }).should.be.fulfilled;
    await ownerManager.removeTokenInfoManager(tokenInfoManagerIdentity.address, { from: tokeny }).should.be.fulfilled;
  });

  it('Should add & remove claim topic in the claim topics registry only if onchainID is registered as ClaimRegistryManager', async () => {
    const claimRegistryManager = accounts[6];
    const claimRegistryManagerIdentity = await deployIdentityProxy(claimRegistryManager);

    // should revert if sender is not claim registry manager
    await ownerManager.callAddClaimTopic(5, claimRegistryManagerIdentity.address, { from: claimRegistryManager }).should.be.rejectedWith(EVMRevert);

    // should add claim topic if sender is claim registry manager
    await ownerManager.addClaimRegistryManager(claimRegistryManagerIdentity.address, { from: tokeny });
    (await ownerManager.isClaimRegistryManager(claimRegistryManagerIdentity.address)).should.be.equal(true);
    await ownerManager.callAddClaimTopic(5, claimRegistryManagerIdentity.address, { from: claimRegistryManager }).should.be.fulfilled;
    // check if claim topic added
    const topic = await claimTopicsRegistry.getClaimTopics();
    topic[1].toString().should.equal('5');
    await ownerManager.callRemoveClaimTopic(5, claimRegistryManagerIdentity.address, { from: accounts[8] }).should.be.rejectedWith(EVMRevert);
    await ownerManager.callRemoveClaimTopic(5, claimRegistryManagerIdentity.address, { from: claimRegistryManager }).should.be.fulfilled;
    const topic2 = await claimTopicsRegistry.getClaimTopics();
    topic2.length.should.equal(1);
    // reset initial state
    await ownerManager.removeClaimRegistryManager(claimRegistryManagerIdentity.address, { from: tokeny });
  });

  it('Should add and remove agent in token contract', async () => {
    const newAgent = accounts[6];
    await ownerManager.callAddAgentOnTokenContract(newAgent, { from: tokeny }).should.be.fulfilled;
    (await token.isAgent(newAgent)).should.equal(true);
    await ownerManager.callRemoveAgentOnTokenContract(newAgent, { from: tokeny }).should.be.fulfilled;
    (await token.isAgent(newAgent)).should.equal(false);
  });

  it('Should add and remove agent in identity registry contract', async () => {
    const newAgent = accounts[6];
    await ownerManager.callAddAgentOnIdentityRegistryContract(newAgent, { from: tokeny }).should.be.fulfilled;
    (await identityRegistry.isAgent(newAgent)).should.equal(true);
    await ownerManager.callRemoveAgentOnIdentityRegistryContract(newAgent, { from: tokeny }).should.be.fulfilled;
    (await identityRegistry.isAgent(newAgent)).should.equal(false);
  });

  it('Should transfer ownership of compliance if called by compliance manager with custom function call', async () => {
    const newOwner = accounts[6];
    const complianceManager = user1;
    const complianceManagerID = user1Contract;
    await ownerManager.addComplianceManager(complianceManagerID.address, { from: tokeny });
    (await ownerManager.isComplianceManager(complianceManagerID.address)).should.be.equal(true);
    const callData = defaultCompliance.contract.methods.transferOwnership(newOwner).encodeABI();
    await ownerManager.callComplianceFunction(callData, complianceManagerID.address, { from: complianceManager }).should.be.fulfilled;
    (await defaultCompliance.owner()).should.equal(newOwner);
    // reset initial state
    await ownerManager.removeComplianceManager(complianceManagerID.address, { from: tokeny });
    await defaultCompliance.transferOwnership(ownerManager.address, { from: newOwner });
  });

  it('Should transfer ownership of contracts if called by admin', async () => {
    const newOwner = accounts[6];
    await ownerManager.callTransferOwnershipOnTokenContract(newOwner, { from: tokeny }).should.be.fulfilled;
    (await token.owner()).should.equal(newOwner);
    await ownerManager.callTransferOwnershipOnIdentityRegistryContract(newOwner, { from: tokeny }).should.be.fulfilled;
    (await identityRegistry.owner()).should.equal(newOwner);
    await ownerManager.callTransferOwnershipOnComplianceContract(newOwner, { from: tokeny }).should.be.fulfilled;
    (await defaultCompliance.owner()).should.equal(newOwner);
    await ownerManager.callTransferOwnershipOnClaimTopicsRegistryContract(newOwner, { from: tokeny }).should.be.fulfilled;
    (await claimTopicsRegistry.owner()).should.equal(newOwner);
    await ownerManager.callTransferOwnershipOnIssuersRegistryContract(newOwner, { from: tokeny }).should.be.fulfilled;
    (await trustedIssuersRegistry.owner()).should.equal(newOwner);
    // reset initial state
    await token.transferOwnership(ownerManager.address, { from: newOwner });
    await identityRegistry.transferOwnership(ownerManager.address, { from: newOwner });
    await defaultCompliance.transferOwnership(ownerManager.address, { from: newOwner });
    await claimTopicsRegistry.transferOwnership(ownerManager.address, { from: newOwner });
    await trustedIssuersRegistry.transferOwnership(ownerManager.address, { from: newOwner });
  });
});
