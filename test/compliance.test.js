const log = require('./helpers/logger');
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
  ApproveTransferTest,
  TREXFactory,
} = require('./helpers/artifacts');

contract('Compliance', (accounts) => {
  let claimTopicsRegistry;
  let caModule;
  let identityRegistry;
  let identityRegistryStorage;
  let trustedIssuersRegistry;
  let token;
  let implementationSC;
  let modularCompliance;
  let crModule;
  let tokenDetails;
  let claimDetails;
  let versionStruct;
  let contractsStruct;
  let factory;
  let claimIssuerContract;
  const signer = web3.eth.accounts.create();
  const signerKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', signer.address));
  const tokeny = accounts[0];
  const claimIssuer = accounts[1];
  const user1 = accounts[2];
  const user2 = accounts[3];
  const attacker = accounts[4];
  const claimTopics = [7];
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
    implementationSC = await Implementation.new({ from: tokeny });
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
    await implementationSC.useTREXVersion(versionStruct, contractsStruct, { from: tokeny });

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
  });

  it('Should add & test CountryRestrictModule', async () => {
    (await crModule.isComplianceBound(modularCompliance.address)).should.equal(false);
    await modularCompliance.addModule(crModule.address, { from: tokeny }).should.be.fulfilled;
    // Attacker registers themselves as compliance and tries to remove the other compliance from module
    await crModule.bindCompliance(attacker, { from: attacker });
    await crModule.unbindCompliance(modularCompliance.address, { from: attacker }).should.be.rejectedWith(EVMRevert);
    // Attacker can only remove himself from the list of bound compliance contracts which is useless
    await crModule.unbindCompliance(attacker, { from: attacker }).should.be.fulfilled;
    await crModule.unbindCompliance(modularCompliance.address, { from: attacker }).should.be.rejectedWith(EVMRevert);
    (await crModule.isComplianceBound(modularCompliance.address)).toString().should.equal('true');
    (await crModule.isCountryRestricted(modularCompliance.address, 101)).toString().should.equal('false');
    const tx = await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
    log(`${tx.receipt.gasUsed} gas units used by a transfer with 1 compliance module to check`);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('700');
    balance2.toString().should.equal('300');
    const callData = crModule.contract.methods.addCountryRestriction(101).encodeABI();
    const tx2 = await modularCompliance.callModuleFunction(callData, crModule.address, { from: tokeny }).should.be.fulfilled;
    log(`${tx2.receipt.gasUsed} gas units used to add a restricted country`);
    (await crModule.isCountryRestricted(modularCompliance.address, 101)).toString().should.equal('true');
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith('Transfer not possible.');

    const callDataRemove = crModule.contract.methods.removeCountryRestriction(101).encodeABI();
    const tx3 = await modularCompliance.callModuleFunction(callDataRemove, crModule.address, { from: tokeny }).should.be.fulfilled;
    log(`${tx3.receipt.gasUsed} gas units used to remove a restricted country`);
    await token.transfer(user1, 300, { from: user2 }).should.be.fulfilled;
    const balance3 = await token.balanceOf(user1);
    const balance4 = await token.balanceOf(user2);
    balance3.toString().should.equal('1000');
    balance4.toString().should.equal('0');

    // Add and remove allowed countries via batch operations
    const callDataAddBatch = crModule.contract.methods.batchRestrictCountries([101, 102, 103, 104, 105, 106, 107, 108, 109, 110]).encodeABI();
    const tx4 = await modularCompliance.callModuleFunction(callDataAddBatch, crModule.address, { from: tokeny }).should.be.fulfilled;
    log(`${tx4.receipt.gasUsed} gas units used to add a batch of 10 restricted countries`);
    (await crModule.isCountryRestricted(modularCompliance.address, 101)).should.equal(true);
    (await crModule.isCountryRestricted(modularCompliance.address, 102)).should.equal(true);
    (await crModule.isCountryRestricted(modularCompliance.address, 103)).should.equal(true);
    (await crModule.isCountryRestricted(modularCompliance.address, 104)).should.equal(true);
    (await crModule.isCountryRestricted(modularCompliance.address, 105)).should.equal(true);
    (await crModule.isCountryRestricted(modularCompliance.address, 106)).should.equal(true);
    (await crModule.isCountryRestricted(modularCompliance.address, 107)).should.equal(true);
    (await crModule.isCountryRestricted(modularCompliance.address, 108)).should.equal(true);
    (await crModule.isCountryRestricted(modularCompliance.address, 109)).should.equal(true);
    (await crModule.isCountryRestricted(modularCompliance.address, 110)).should.equal(true);

    const callDataRemoveBatch = crModule.contract.methods.batchUnrestrictCountries([101, 102, 103, 104, 105, 106, 107, 108, 109, 110]).encodeABI();
    const tx5 = await modularCompliance.callModuleFunction(callDataRemoveBatch, crModule.address, { from: tokeny }).should.be.fulfilled;
    log(`${tx5.receipt.gasUsed} gas units used to remove a batch of 10 restricted countries`);
    (await crModule.isCountryRestricted(modularCompliance.address, 101)).should.equal(false);
    (await crModule.isCountryRestricted(modularCompliance.address, 102)).should.equal(false);
    (await crModule.isCountryRestricted(modularCompliance.address, 103)).should.equal(false);
    (await crModule.isCountryRestricted(modularCompliance.address, 104)).should.equal(false);
    (await crModule.isCountryRestricted(modularCompliance.address, 105)).should.equal(false);
    (await crModule.isCountryRestricted(modularCompliance.address, 106)).should.equal(false);
    (await crModule.isCountryRestricted(modularCompliance.address, 107)).should.equal(false);
    (await crModule.isCountryRestricted(modularCompliance.address, 108)).should.equal(false);
    (await crModule.isCountryRestricted(modularCompliance.address, 109)).should.equal(false);
    (await crModule.isCountryRestricted(modularCompliance.address, 110)).should.equal(false);
    // remove module from compliance
    await modularCompliance.removeModule(crModule.address, { from: tokeny }).should.be.fulfilled;
  });
  it('should add & test CountryAllowModule', async () => {
    (await caModule.isComplianceBound(modularCompliance.address)).should.equal(false);
    await modularCompliance.addModule(caModule.address, { from: tokeny }).should.be.fulfilled;
    (await caModule.isComplianceBound(modularCompliance.address)).should.equal(true);
    // Test country restriction
    (await caModule.isCountryAllowed(modularCompliance.address, 101)).should.equal(false);
    let balanceUser1 = await token.balanceOf(user1);
    let balanceUser2 = await token.balanceOf(user2);
    balanceUser1.toString().should.equal('1000');
    balanceUser2.toString().should.equal('0');
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith('Transfer not possible.');

    const callData = caModule.contract.methods.addAllowedCountry(101).encodeABI();
    await modularCompliance.callModuleFunction(callData, caModule.address, { from: tokeny }).should.be.fulfilled;
    (await caModule.isCountryAllowed(modularCompliance.address, 101)).should.equal(true);

    await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
    balanceUser1 = await token.balanceOf(user1);
    balanceUser2 = await token.balanceOf(user2);
    balanceUser1.toString().should.equal('700');
    balanceUser2.toString().should.equal('300');
    // Remove allowed country from the module
    const callDataRemove = caModule.contract.methods.removeAllowedCountry(101).encodeABI();
    await modularCompliance.callModuleFunction(callDataRemove, caModule.address, { from: tokeny }).should.be.fulfilled;
    (await caModule.isCountryAllowed(modularCompliance.address, 101)).should.equal(false);
    // Add and remove allowed countries via batch operations
    const callDataAddBatch = caModule.contract.methods.batchAllowCountries([101, 102]).encodeABI();
    await modularCompliance.callModuleFunction(callDataAddBatch, caModule.address, { from: tokeny }).should.be.fulfilled;
    (await caModule.isCountryAllowed(modularCompliance.address, 101)).should.equal(true);
    (await caModule.isCountryAllowed(modularCompliance.address, 102)).should.equal(true);

    const callDataRemoveBatch = caModule.contract.methods.batchDisallowCountries([102]).encodeABI();
    await modularCompliance.callModuleFunction(callDataRemoveBatch, caModule.address, { from: tokeny }).should.be.fulfilled;
    (await caModule.isCountryAllowed(modularCompliance.address, 101)).should.equal(true);
    (await caModule.isCountryAllowed(modularCompliance.address, 102)).should.equal(false);
  });
  it('should test legacy feature of ApproveTransfer', async () => {
    const compliance = await ApproveTransferTest.new({ from: tokeny });
    await token.setCompliance(compliance.address, { from: tokeny });
    await compliance.bindToken(token.address, { from: tokeny });
    let balanceUser1 = await token.balanceOf(user1);
    let balanceUser2 = await token.balanceOf(user2);
    balanceUser1.toString().should.equal('700');
    balanceUser2.toString().should.equal('300');
    await token.transfer(user1, 300, { from: user2 }).should.be.rejected;
    await compliance.approveTransfer(user2, user1, 300, { from: tokeny }).should.be.fulfilled;
    await token.transfer(user1, 300, { from: user2 }).should.be.fulfilled;
    balanceUser1 = await token.balanceOf(user1);
    balanceUser2 = await token.balanceOf(user2);
    balanceUser1.toString().should.equal('1000');
    balanceUser2.toString().should.equal('0');
  });
});
