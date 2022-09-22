const { deployIdentityProxy } = require('./helpers/proxy');
const EVMRevert = require('./helpers/VMExceptionRevert');
require('chai').use(require('chai-as-promised')).should();
const {
  ClaimTopicsRegistry,
  CountryAllowModule,
  ModularCompliance,
  CountryRestrictModule,
  IdentityRegistry,
  IdentityRegistryStorage,
  Implementation,
  IssuerIdentity,
  Token,
  TrustedIssuersRegistry,
  TREXFactory,
  IdentityRegistryStorageProxy,
} = require('./helpers/artifacts');

contract('Factory', (accounts) => {
  let claimTopicsRegistry;
  let caModule;
  let identityRegistry;
  let identityRegistryStorage;
  let trustedIssuersRegistry;
  let token;
  let modularCompliance;
  let crModule;
  let tokenDetails;
  let claimDetails;
  let factory;
  let claimIssuerContract;
  let implementationSC;
  const signer = web3.eth.accounts.create();
  const signerKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', signer.address));
  const tokeny = accounts[0];
  const claimIssuer = accounts[1];
  const user1 = accounts[2];
  const user2 = accounts[3];
  const claimTopics = [7];
  let user1Contract;
  let user2Contract;
  const agent = accounts[8];

  beforeEach(async () => {
    // Tokeny deploying all implementations
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: tokeny });
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({ from: tokeny });
    identityRegistryStorage = await IdentityRegistryStorage.new({ from: tokeny });
    identityRegistry = await IdentityRegistry.new({ from: tokeny });
    modularCompliance = await ModularCompliance.new({ from: tokeny });
    token = await Token.new({ from: tokeny });

    // setting the implementation authority
    implementationSC = await Implementation.new({ from: tokeny });
    await implementationSC.setCTRImplementation(claimTopicsRegistry.address);
    await implementationSC.setTIRImplementation(trustedIssuersRegistry.address);
    await implementationSC.setIRSImplementation(identityRegistryStorage.address);
    await implementationSC.setIRImplementation(identityRegistry.address);
    await implementationSC.setTokenImplementation(token.address);
    await implementationSC.setMCImplementation(modularCompliance.address);

    // deploy Factory
    factory = await TREXFactory.new(implementationSC.address, { from: tokeny });

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

    // deploy modules
    crModule = await CountryRestrictModule.new({ from: tokeny });
    caModule = await CountryAllowModule.new({ from: tokeny });
  });

  it('Should deploy a token and load contracts', async () => {
    // token details
    tokenDetails = {
      owner: tokeny,
      name: 'TREXDINO',
      symbol: 'TREX',
      decimals: 8,
      irs: '0x0000000000000000000000000000000000000000',
      ONCHAINID: '0x0000000000000000000000000000000000000042',
      irAgents: [tokeny, agent],
      tokenAgents: [tokeny, agent],
      complianceModules: [],
      complianceSettings: [],
    };

    // claim details
    claimDetails = { claimTopics: claimTopics, issuers: [claimIssuerContract.address], issuerClaims: [claimTopics] };

    // deploy token on Factory
    await factory.deployTREXSuite('test', tokenDetails, claimDetails, { from: tokeny }).should.be.fulfilled;

    // cannot deploy twice the same salt
    await factory.deployTREXSuite('test', tokenDetails, claimDetails, { from: tokeny }).should.be.rejectedWith(EVMRevert);

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

    // test that settings passed properly

    (await token.name()).toString().should.equal('TREXDINO');
    (await token.decimals()).toString().should.equal('8');
    (await token.symbol()).toString().should.equal('TREX');
    (await token.onchainID()).toString().should.equal('0x0000000000000000000000000000000000000042');
    (await token.isAgent(tokeny)).toString().should.equal('true');
    (await token.isAgent(agent)).toString().should.equal('true');
    (await identityRegistry.isAgent(tokeny)).toString().should.equal('true');
    (await identityRegistry.isAgent(agent)).toString().should.equal('true');
    (await modularCompliance.isModuleBound(crModule.address)).toString().should.equal('false');
    (await modularCompliance.isModuleBound(caModule.address)).toString().should.equal('false');
    (await trustedIssuersRegistry.hasClaimTopic(claimIssuerContract.address, 1)).should.equal(false);
    (await trustedIssuersRegistry.hasClaimTopic(claimIssuerContract.address, 7)).should.equal(true);
    (await trustedIssuersRegistry.isTrustedIssuer(claimIssuerContract.address)).should.equal(true);
    (await claimTopicsRegistry.getClaimTopics()).toString().should.equal('7');

    // test contract ownership recovery function on the irs deployed
    await factory.recoverContractOwnership(identityRegistryStorage.address, tokeny, { from: tokeny }).should.be.fulfilled;
  });
  it('Should deploy a token with compliance modules properly set', async () => {
    // compliance modules settings
    const callData1 = caModule.contract.methods.addAllowedCountry(1).encodeABI();
    const callData2 = caModule.contract.methods.addAllowedCountry(2).encodeABI();
    const callData3 = crModule.contract.methods.addCountryRestriction(3).encodeABI();
    const callData4 = crModule.contract.methods.addCountryRestriction(4).encodeABI();

    // token details
    tokenDetails = {
      owner: tokeny,
      name: 'TREXDINO',
      symbol: 'TREX',
      decimals: 8,
      irs: '0x0000000000000000000000000000000000000000',
      ONCHAINID: '0x0000000000000000000000000000000000000042',
      irAgents: [tokeny, agent],
      tokenAgents: [tokeny, agent],
      complianceModules: [caModule.address, caModule.address, crModule.address, crModule.address],
      complianceSettings: [callData1, callData2, callData3, callData4],
    };

    // claim details
    claimDetails = { claimTopics: claimTopics, issuers: [claimIssuerContract.address], issuerClaims: [claimTopics] };

    // deploy token on Factory
    await factory.deployTREXSuite('test2', tokenDetails, claimDetails, { from: tokeny }).should.be.fulfilled;

    // load contracts for testing purpose
    const tokenAddress = await factory.getToken('test2');
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

    // test that modules are set properly
    (await crModule.isComplianceBound(modularCompliance.address)).toString().should.equal('true');
    (await crModule.isCountryRestricted(modularCompliance.address, 3)).toString().should.equal('true');
    (await crModule.isCountryRestricted(modularCompliance.address, 4)).toString().should.equal('true');
    (await caModule.isComplianceBound(modularCompliance.address)).toString().should.equal('true');
    (await caModule.isCountryAllowed(modularCompliance.address, 1)).toString().should.equal('true');
    (await caModule.isCountryAllowed(modularCompliance.address, 2)).toString().should.equal('true');
  });
  it('Should deploy a token with an existing IRS', async () => {
    // pre-deploy IRS
    const irsProxy = await IdentityRegistryStorageProxy.new(implementationSC.address, { from: tokeny });
    const identityRegistryStorage2 = await IdentityRegistryStorage.at(irsProxy.address);
    await identityRegistryStorage2.transferOwnership(factory.address, { from: tokeny });

    // token details
    tokenDetails = {
      owner: tokeny,
      name: 'TREXDINO',
      symbol: 'TREX',
      decimals: 8,
      irs: identityRegistryStorage2.address,
      ONCHAINID: '0x0000000000000000000000000000000000000042',
      irAgents: [tokeny, agent],
      tokenAgents: [tokeny, agent],
      complianceModules: [],
      complianceSettings: [],
    };

    // claim details
    claimDetails = { claimTopics: claimTopics, issuers: [claimIssuerContract.address], issuerClaims: [claimTopics] };

    // deploy token on Factory
    await factory.deployTREXSuite('test', tokenDetails, claimDetails, { from: tokeny }).should.be.fulfilled;

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

    // test that the proper storage was used

    (await identityRegistry.identityStorage()).toString().should.equal(identityRegistryStorage2.address);
  });
  it('deployment should fail if claim parameters are not set properly', async () => {
    // token details
    tokenDetails = {
      owner: tokeny,
      name: 'TREXDINO',
      symbol: 'TREX',
      decimals: 8,
      irs: '0x0000000000000000000000000000000000000000',
      ONCHAINID: '0x0000000000000000000000000000000000000042',
      irAgents: [tokeny, agent],
      tokenAgents: [tokeny, agent],
      complianceModules: [],
      complianceSettings: [],
    };

    // claim details
    claimDetails = { claimTopics: claimTopics, issuers: [claimIssuerContract.address], issuerClaims: [[]] };

    // deploy token on Factory
    await factory.deployTREXSuite('test', tokenDetails, claimDetails, { from: tokeny }).should.be.rejectedWith(EVMRevert);
  });
});
