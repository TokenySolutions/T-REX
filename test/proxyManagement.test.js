const log = require('./helpers/logger');
require('chai').use(require('chai-as-promised')).should();
const EVMRevert = require('./helpers/VMExceptionRevert');
const { deployIdentityProxy } = require('./helpers/proxy');
const {
  ClaimTopicsRegistry,
  IdentityRegistry,
  TrustedIssuersRegistry,
  IssuerIdentity,
  Token,
  IdentityRegistryStorage,
  Implementation,
  ModularCompliance,
  TREXFactory,
  IAFactory,
  TokenProxy,
} = require('./helpers/artifacts');

contract('ProxyManagement', (accounts) => {
  let claimTopicsRegistry;
  let identityRegistry;
  let identityRegistryStorage;
  let trustedIssuersRegistry;
  let claimIssuerContract;
  let tokenDetails;
  let claimDetails;
  let factory;
  let token;
  let implementationSC;
  let auxiliaryIA;
  let modularCompliance;
  let versionStruct;
  let contractsStruct;
  let iaFactory;
  const signer = web3.eth.accounts.create();
  const signerKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', signer.address));
  const tokeny = accounts[0];
  const claimIssuer = accounts[1];
  const user1 = accounts[2];
  const user2 = accounts[3];
  const tokenIssuer = accounts[4];
  let user1Contract;
  let user2Contract;
  const agent = accounts[8];

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

    // deploy Factory
    factory = await TREXFactory.new(implementationSC.address, { from: tokeny });

    iaFactory = await IAFactory.new(factory.address, { from: tokeny });
    // deploy an auxiliary IA contract
    auxiliaryIA = await Implementation.new(false, factory.address, '0x0000000000000000000000000000000000000000', {
      from: agent,
    });

    // deploy Claim Issuer contract
    claimIssuerContract = await IssuerIdentity.new(claimIssuer, { from: claimIssuer });
    await claimIssuerContract.addKey(signerKey, 3, 1, { from: claimIssuer }).should.be.fulfilled;

    // users deploy their identity contracts
    user1Contract = await deployIdentityProxy(user1);
    user2Contract = await deployIdentityProxy(user2);

    // user1 gets signature from claim issuer
    const hexedData1 = await web3.utils.asciiToHex('kyc approved');
    const hashedDataToSign1 = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [user1Contract.address, 7, hexedData1]),
    );
    const signature1 = (await signer.sign(hashedDataToSign1)).signature;

    // user1 adds claim to identity contract
    await user1Contract.addClaim(7, 1, claimIssuerContract.address, signature1, hexedData1, '', { from: user1 });

    // user2 gets signature from claim issuer
    const hexedData2 = await web3.utils.asciiToHex('kyc approved');
    const hashedDataToSign2 = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [user2Contract.address, 7, hexedData2]),
    );
    const signature2 = (await signer.sign(hashedDataToSign2)).signature;

    // user2 adds claim to identity contract
    await user2Contract.addClaim(7, 1, claimIssuerContract.address, signature2, hexedData2, '', { from: user2 }).should.be.fulfilled;

    // token details
    tokenDetails = {
      owner: tokenIssuer,
      name: 'TREXDINO',
      symbol: 'TREX',
      decimals: 8,
      irs: '0x0000000000000000000000000000000000000000',
      ONCHAINID: '0x0000000000000000000000000000000000000042',
      irAgents: [tokenIssuer, agent],
      tokenAgents: [tokenIssuer, agent],
      complianceModules: [],
      complianceSettings: [],
    };

    // claim details
    claimDetails = { claimTopics: [7], issuers: [claimIssuerContract.address], issuerClaims: [[7]] };

    // deploy token on Factory
    await factory.deployTREXSuite('test', tokenDetails, claimDetails, { from: tokeny });

    // load contracts for testing purpose
    const tokenAddress = await factory.getToken('test');
    token = await Token.at(tokenAddress);
    const identityRegistryAddress = await token.identityRegistry();
    identityRegistry = await IdentityRegistry.at(identityRegistryAddress);
    const modularComplianceAddress = await token.compliance();
    modularCompliance = await ModularCompliance.at(modularComplianceAddress);
    const claimTopicsRegistryAddress = await identityRegistry.topicsRegistry();
    claimTopicsRegistry = await ClaimTopicsRegistry.at(claimTopicsRegistryAddress);
    const trustedIssuersRegistryAddress = await identityRegistry.issuersRegistry();
    trustedIssuersRegistry = await TrustedIssuersRegistry.at(trustedIssuersRegistryAddress);
    const identityRegistryStorageAddress = await identityRegistry.identityStorage();
    identityRegistryStorage = await IdentityRegistryStorage.at(identityRegistryStorageAddress);

    // register identities of users
    await identityRegistry.registerIdentity(user1, user1Contract.address, 91, {
      from: agent,
    }).should.be.fulfilled;
    await identityRegistry.registerIdentity(user2, user2Contract.address, 101, {
      from: agent,
    }).should.be.fulfilled;

    // initial supply minting
    await token.mint(user1, 1000, { from: agent });

    // unpause the token
    await token.unpause({ from: agent });
    await factory.recoverContractOwnership(identityRegistryStorage.address, tokenIssuer, { from: tokeny });
  });

  it('setTREXFactory tests', async () => {
    await auxiliaryIA.setTREXFactory(factory.address, { from: agent }).should.be.rejectedWith(EVMRevert);
    await implementationSC.setTREXFactory(factory.address, { from: agent }).should.be.rejectedWith(EVMRevert);
    await implementationSC.setTREXFactory(factory.address, { from: tokeny }).should.be.fulfilled;
    const result = await implementationSC.getTREXFactory();
    result.should.equal(factory.address);
  });

  it('setIAFactory tests', async () => {
    await auxiliaryIA.setIAFactory('0x0000000000000000000000000000000000000000', { from: agent }).should.be.rejectedWith(EVMRevert);
    await implementationSC.setIAFactory('0x0000000000000000000000000000000000000000', { from: agent }).should.be.rejectedWith(EVMRevert);
    await implementationSC.setIAFactory('0x0000000000000000000000000000000000000000', { from: tokeny }).should.be.fulfilled;
    await implementationSC.setIAFactory(iaFactory.address, { from: tokeny }).should.be.fulfilled;
  });

  it('test IAFactory', async () => {
    await iaFactory.deployIA(token.address, { from: tokenIssuer }).should.be.rejectedWith(EVMRevert);
  });

  it('addTREXVersion tests', async () => {
    versionStruct = { major: 4, minor: 0, patch: 1 };
    await auxiliaryIA.addTREXVersion(versionStruct, contractsStruct, { from: agent }).should.be.rejectedWith(EVMRevert);
    await implementationSC.addTREXVersion(versionStruct, contractsStruct, { from: tokeny }).should.be.fulfilled;
    versionStruct = { major: 4, minor: 0, patch: 2 };
    await implementationSC.addTREXVersion(versionStruct, contractsStruct, { from: agent }).should.be.rejectedWith(EVMRevert);
    await implementationSC.addTREXVersion(versionStruct, contractsStruct, { from: tokeny }).should.be.fulfilled;
    versionStruct = { major: 4, minor: 0, patch: 3 };
    await implementationSC.addTREXVersion(versionStruct, contractsStruct, { from: tokeny }).should.be.fulfilled;
    versionStruct = { major: 4, minor: 0, patch: 4 };
    await implementationSC.addTREXVersion(versionStruct, contractsStruct, { from: tokeny }).should.be.fulfilled;
    await implementationSC.addTREXVersion(versionStruct, contractsStruct, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    versionStruct = { major: 4, minor: 0, patch: 5 };
    const badContractsStruct = {
      tokenImplementation: token.address,
      ctrImplementation: claimTopicsRegistry.address,
      irImplementation: identityRegistry.address,
      irsImplementation: '0x0000000000000000000000000000000000000000',
      tirImplementation: trustedIssuersRegistry.address,
      mcImplementation: modularCompliance.address,
    };
    await implementationSC.addTREXVersion(versionStruct, badContractsStruct, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    await implementationSC.addTREXVersion(versionStruct, contractsStruct, { from: tokeny }).should.be.fulfilled;
  });

  it('fetchVersion tests', async () => {
    await implementationSC.fetchVersion({ major: 4, minor: 0, patch: 2 }, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    const tx = await auxiliaryIA.fetchVersion({ major: 4, minor: 0, patch: 2 }, { from: agent }).should.be.fulfilled;
    log(`${tx.receipt.gasUsed} gas units used to fetch 1 version`);
  });

  it('useTREXVersion tests', async () => {
    versionStruct = { major: 4, minor: 0, patch: 2 };
    await implementationSC.useTREXVersion(versionStruct, { from: tokeny }).should.be.fulfilled;
    await auxiliaryIA.useTREXVersion(versionStruct, { from: agent }).should.be.fulfilled;
    const result1 = await implementationSC.getCurrentVersion();
    result1[0].should.equal(versionStruct.major.toString());
    result1[1].should.equal(versionStruct.minor.toString());
    result1[2].should.equal(versionStruct.patch.toString());
    const result2 = await auxiliaryIA.getCurrentVersion();
    result2[0].should.equal(versionStruct.major.toString());
    result2[1].should.equal(versionStruct.minor.toString());
    result2[2].should.equal(versionStruct.patch.toString());
    const result3 = await implementationSC.getContracts(versionStruct);
    result3[0].should.equal(contractsStruct.tokenImplementation.toString());
    result3[1].should.equal(contractsStruct.ctrImplementation.toString());
    result3[2].should.equal(contractsStruct.irImplementation.toString());
    result3[3].should.equal(contractsStruct.irsImplementation.toString());
    result3[4].should.equal(contractsStruct.tirImplementation.toString());
    result3[5].should.equal(contractsStruct.mcImplementation.toString());
    const result4 = await auxiliaryIA.getContracts(versionStruct);
    result4[0].should.equal(contractsStruct.tokenImplementation.toString());
    result4[1].should.equal(contractsStruct.ctrImplementation.toString());
    result4[2].should.equal(contractsStruct.irImplementation.toString());
    result4[3].should.equal(contractsStruct.irsImplementation.toString());
    result4[4].should.equal(contractsStruct.tirImplementation.toString());
    result4[5].should.equal(contractsStruct.mcImplementation.toString());
    await auxiliaryIA.useTREXVersion(versionStruct, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    await implementationSC.useTREXVersion(versionStruct, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    versionStruct = { major: 4, minor: 0, patch: 6 };
    await implementationSC.useTREXVersion(versionStruct, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    await auxiliaryIA.useTREXVersion(versionStruct, { from: tokeny }).should.be.rejectedWith(EVMRevert);
  });

  it('test changeImplementationAuthority function', async () => {
    await implementationSC
      .changeImplementationAuthority(token.address, '0x0000000000000000000000000000000000000000', { from: tokeny })
      .should.be.rejectedWith(EVMRevert);
    await implementationSC.changeImplementationAuthority(token.address, auxiliaryIA.address, { from: tokenIssuer }).should.be.rejectedWith(EVMRevert);
    await implementationSC.changeImplementationAuthority(token.address, '0x0000000000000000000000000000000000000000', { from: tokenIssuer }).should.be
      .fulfilled;
    const tokenProxy = await TokenProxy.at(token.address);
    const newIAAddress = await tokenProxy.getImplementationAuthority();
    const newIA = await Implementation.at(newIAAddress);
    await newIA
      .changeImplementationAuthority(token.address, '0x0000000000000000000000000000000000000000', { from: tokenIssuer })
      .should.be.rejectedWith(EVMRevert);
    await newIA.fetchVersion({ major: 4, minor: 0, patch: 2 }, { from: tokenIssuer }).should.be.rejectedWith(EVMRevert);
    await newIA.useTREXVersion({ major: 4, minor: 0, patch: 4 }, { from: tokenIssuer }).should.be.rejectedWith(EVMRevert);
    await newIA.fetchVersion({ major: 4, minor: 0, patch: 4 }, { from: tokenIssuer }).should.be.fulfilled;
    await newIA.useTREXVersion({ major: 4, minor: 0, patch: 4 }, { from: tokenIssuer }).should.be.fulfilled;
    await newIA.changeImplementationAuthority(token.address, implementationSC.address, { from: tokenIssuer }).should.be.rejectedWith(EVMRevert);
    await newIA.useTREXVersion({ major: 4, minor: 0, patch: 2 }, { from: tokenIssuer }).should.be.fulfilled;
    const fakeRefIA = await Implementation.new(true, factory.address, iaFactory.address, { from: tokenIssuer });
    await fakeRefIA.addTREXVersion({ major: 4, minor: 0, patch: 2 }, contractsStruct, { from: tokenIssuer }).should.be.fulfilled;
    await fakeRefIA.useTREXVersion({ major: 4, minor: 0, patch: 2 }, { from: tokenIssuer }).should.be.fulfilled;
    await newIA.changeImplementationAuthority(token.address, fakeRefIA.address, { from: tokenIssuer }).should.be.rejectedWith(EVMRevert);
    await newIA
      .changeImplementationAuthority('0x0000000000000000000000000000000000000000', implementationSC.address, { from: tokenIssuer })
      .should.be.rejectedWith(EVMRevert);
    await newIA.changeImplementationAuthority(token.address, implementationSC.address, { from: tokenIssuer }).should.be.fulfilled;
    await identityRegistryStorage.transferOwnership(factory.address, { from: tokenIssuer }).should.be.fulfilled;
    tokenDetails = {
      owner: tokenIssuer,
      name: 'TREXDINO',
      symbol: 'TREX',
      decimals: 8,
      irs: identityRegistryStorage.address,
      ONCHAINID: '0x0000000000000000000000000000000000000042',
      irAgents: [tokenIssuer, agent],
      tokenAgents: [tokenIssuer, agent],
      complianceModules: [],
      complianceSettings: [],
    };
    await factory.deployTREXSuite('test2', tokenDetails, claimDetails, { from: tokeny });
    const tokenAddress2 = await factory.getToken('test2');
    const token2 = await Token.at(tokenAddress2);
    await factory.recoverContractOwnership(identityRegistryStorage.address, tokenIssuer, { from: tokeny });
    await implementationSC.changeImplementationAuthority(token.address, newIA.address, { from: tokenIssuer }).should.be.fulfilled;
    await implementationSC.changeImplementationAuthority(token2.address, newIA.address, { from: tokenIssuer }).should.be.fulfilled;
  });
});
