const Web3 = require('web3');
require('chai')
  .use(require('chai-as-promised'))
  .should();
const EVMRevert = require('./helpers/VMExceptionRevert');

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

const ClaimTopicsRegistry = artifacts.require('../contracts/registry/ClaimTopicsRegistry.sol');
const IdentityRegistry = artifacts.require('../contracts/registry/IdentityRegistry.sol');
const TrustedIssuersRegistry = artifacts.require('../contracts/registry/TrustedIssuersRegistry.sol');
const ClaimHolder = artifacts.require('@onchain-id/solidity/contracts/Identity.sol');
const IssuerIdentity = artifacts.require('@onchain-id/solidity/contracts/ClaimIssuer.sol');
const Token = artifacts.require('../contracts/token/Token.sol');
const Compliance = artifacts.require('../contracts/compliance/DefaultCompliance.sol');
const OwnerManager = artifacts.require('../contracts/roles/OwnerManager.sol');

contract('Owner Manager', accounts => {
  let claimTopicsRegistry;
  let identityRegistry;
  let trustedIssuersRegistry;
  let claimIssuerContract;
  let token;
  let ownerManager;
  let defaultCompliance;
  let tokenName;
  let tokenSymbol;
  let tokenDecimals;
  let tokenVersion;
  let tokenOnchainID;
  const signer = web3.eth.accounts.create();
  const signerKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', signer.address));

  const tokeny = accounts[0];
  const claimIssuer = accounts[1];
  const user1 = accounts[2];
  const user2 = accounts[3];
  const claimTopics = [1, 7, 3];
  let user1Contract;
  let user2Contract;

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
    ownerManager = await OwnerManager.new(token.address, { from: tokeny });

    // Tokeny adds trusted claim Topic to claim topics registry
    await claimTopicsRegistry.addClaimTopic(7, { from: tokeny }).should.be.fulfilled;

    // Claim issuer deploying identity contract
    claimIssuerContract = await IssuerIdentity.new({ from: claimIssuer });

    // Claim issuer adds claim signer key to his contract
    await claimIssuerContract.addKey(signerKey, 3, 1, { from: claimIssuer }).should.be.fulfilled;

    // Tokeny adds trusted claim Issuer to claimIssuer registry
    await trustedIssuersRegistry.addTrustedIssuer(claimIssuerContract.address, 1, claimTopics, { from: tokeny }).should.be.fulfilled;

    // user1 deploys his identity contract
    user1Contract = await ClaimHolder.new({ from: user1 });

    // user2 deploys his identity contract
    user2Contract = await ClaimHolder.new({ from: user2 });

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
    await token.transferOwnershipOnTokenContract(ownerManager.address, { from: tokeny });
    await identityRegistry.transferOwnershipOnIdentityRegistryContract(ownerManager.address, { from: tokeny });
    await claimTopicsRegistry.transferOwnershipOnClaimTopicsRegistryContract(ownerManager.address, { from: tokeny });
    await trustedIssuersRegistry.transferOwnershipOnIssuersRegistryContract(ownerManager.address, { from: tokeny });
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
    const identityRegistry2 = await IdentityRegistry.new(trustedIssuersRegistry.address, claimTopicsRegistry.address, { from: registrySetter });
    // set identity registry on the token contract
    await ownerManager.callSetIdentityRegistry(identityRegistry2.address, registrySetterID.address, { from: registrySetter });
    (await token.getIdentityRegistry()).should.be.equal(identityRegistry2.address);
    // should not work if wallet is not set as management key on the onchainID
    await ownerManager
      .callSetIdentityRegistry(identityRegistry2.address, registrySetterID.address, { from: tokeny })
      .should.be.rejectedWith(EVMRevert);
    (await token.getIdentityRegistry()).should.be.equal(identityRegistry2.address);
  });

  it('Should set topics registry only if onchainID is registered as registryAddressSetter', async () => {
    const registrySetter = user1;
    const registrySetterID = user1Contract;
    await ownerManager.addRegistryAddressSetter(registrySetterID.address, { from: tokeny });
    (await ownerManager.isRegistryAddressSetter(registrySetterID.address)).should.be.equal(true);
    // create new claim topics registry contract
    const claimTopicsRegistry2 = await ClaimTopicsRegistry.new({ from: registrySetter });
    // set claim topics registry on the identity registry contract
    await ownerManager.callSetClaimTopicsRegistry(claimTopicsRegistry2.address, registrySetterID.address, { from: registrySetter });
    (await identityRegistry.getTopicsRegistry()).should.be.equal(claimTopicsRegistry2.address);
    // should not work if wallet is not set as management key on the onchainID
    await ownerManager
      .callSetClaimTopicsRegistry(claimTopicsRegistry2.address, registrySetterID.address, { from: tokeny })
      .should.be.rejectedWith(EVMRevert);
    (await identityRegistry.getTopicsRegistry()).should.be.equal(claimTopicsRegistry2.address);
  });

  it('Should set trusted issuers registry only if onchainID is registered as registryAddressSetter', async () => {
    const registrySetter = user1;
    const registrySetterID = user1Contract;
    await ownerManager.addRegistryAddressSetter(registrySetterID.address, { from: tokeny });
    (await ownerManager.isRegistryAddressSetter(registrySetterID.address)).should.be.equal(true);
    // create new trusted issuers registry contract
    const trustedIssuersRegistry2 = await TrustedIssuersRegistry.new({ from: registrySetter });
    // set trusted issuers registry on the identity registry contract
    await ownerManager.callSetTrustedIssuersRegistry(trustedIssuersRegistry2.address, registrySetterID.address, { from: registrySetter });
    (await identityRegistry.getIssuersRegistry()).should.be.equal(trustedIssuersRegistry2.address);
    // should not work if wallet is not set as management key on the onchainID
    await ownerManager
      .callSetTrustedIssuersRegistry(trustedIssuersRegistry2.address, registrySetterID.address, { from: tokeny })
      .should.be.rejectedWith(EVMRevert);
    (await identityRegistry.getIssuersRegistry()).should.be.equal(trustedIssuersRegistry2.address);
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
    (await token.getCompliance()).should.be.equal(compliance2.address);
    // should not work if wallet is not set as management key on the onchainID
    await ownerManager.callSetCompliance(compliance2.address, complianceSetterID.address, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    (await token.getCompliance()).should.be.equal(compliance2.address);
  });
});
