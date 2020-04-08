const Web3 = require('web3');
const fetch = require('node-fetch');
const log = require('./helpers/logger');
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
const LimitCompliance = artifacts.require('../contracts/compliance/LimitHolder.sol');
const IdentityRegistryStorage = artifacts.require('../contracts/registry/IdentityRegistryStorage.sol');
let gasAverage;

const gWeiToETH = 1 / 1000000000;
function calculateETH(gasUnits) {
  return Math.round(gasUnits * gWeiToETH * gasAverage * 10000) / 10000;
}

contract('Compliance', accounts => {
  let claimTopicsRegistry;
  let identityRegistry;
  let identityRegistryStorage;
  let trustedIssuersRegistry;
  let claimIssuerContract;
  let token;
  let defaultCompliance;
  let limitCompliance;
  let tokenName;
  let tokenSymbol;
  let tokenDecimals;
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
  const agent = accounts[8];

  beforeEach(async () => {
    gasAverage = await fetch('https://ethgasstation.info/json/ethgasAPI.json')
      .then(resp => resp.json())
      .then(data => data.average);
    // Tokeny deploying token
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: tokeny });
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({ from: tokeny });
    defaultCompliance = await Compliance.new({ from: tokeny });
    identityRegistryStorage = await IdentityRegistryStorage.new({ from: tokeny });
    identityRegistry = await IdentityRegistry.new(trustedIssuersRegistry.address, claimTopicsRegistry.address, identityRegistryStorage.address, {
      from: tokeny,
    });
    tokenOnchainID = await ClaimHolder.new({ from: tokeny });
    tokenName = 'TREXDINO';
    tokenSymbol = 'TREX';
    tokenDecimals = '0';
    token = await Token.new(identityRegistry.address, defaultCompliance.address, tokenName, tokenSymbol, tokenDecimals, tokenOnchainID.address, {
      from: tokeny,
    });
    limitCompliance = await LimitCompliance.new(token.address, 2, { from: tokeny });
    await identityRegistryStorage.bindIdentityRegistry(identityRegistry.address, { from: tokeny });
    await token.addAgent(agent, { from: tokeny });
    // Tokeny adds trusted claim Topic to claim topics registry
    await claimTopicsRegistry.addClaimTopic(7, { from: tokeny }).should.be.fulfilled;
    // Claim issuer deploying identity contract
    claimIssuerContract = await IssuerIdentity.new({ from: claimIssuer });
    // Claim issuer adds claim signer key to his contract
    await claimIssuerContract.addKey(signerKey, 3, 1, { from: claimIssuer }).should.be.fulfilled;
    // Tokeny adds trusted claim Issuer to claimIssuer registry
    await trustedIssuersRegistry.addTrustedIssuer(claimIssuerContract.address, claimTopics, { from: tokeny }).should.be.fulfilled;
    // user1 deploys his identity contract
    user1Contract = await ClaimHolder.new({ from: user1 });
    // user2 deploys his identity contract
    user2Contract = await ClaimHolder.new({ from: user2 });
    // identity contracts are registered in identity registry
    await identityRegistry.addAgent(agent, { from: tokeny });
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
    await token.setCompliance(limitCompliance.address, { from: tokeny });
    await limitCompliance.addAgent(token.address, { from: tokeny });
    await limitCompliance.addAgent(agent, { from: tokeny });
  });

  it('compliance should be changed to limit holder.', async () => {
    (await token.compliance()).should.be.equal(limitCompliance.address);
  });

  it('Should update the token holders when minted', async () => {
    await token.mint(user1, 1000, { from: agent });
    await token.mint(user2, 100, { from: agent });
    const holderCount = await limitCompliance.holderCount();
    holderCount.toString().should.be.equal('2');
  });

  it('Should set the holder limit', async () => {
    // should be rejected if not called by an agent
    await limitCompliance.setHolderLimit(1000, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    // should work if called by an agent
    const tx = await limitCompliance.setHolderLimit(1000, { from: agent });
    const holderLimit1 = await limitCompliance.getHolderLimit();
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to set the holder limit`);
    holderLimit1.toString().should.be.equal('1000');
  });

  it('Should retreive the token holders list', async () => {
    await token.mint(user1, 1000, { from: agent });
    await token.mint(user2, 100, { from: agent });
    (await limitCompliance.holderAt(0)).should.be.equal(user1);
    (await limitCompliance.holderAt(1)).should.be.equal(user2);
    await limitCompliance.holderAt(2).should.be.rejectedWith(EVMRevert);
  });

  it('Should update the token holders when token burnt', async () => {
    await token.mint(user1, 1000, { from: agent });
    await token.mint(user2, 100, { from: agent });
    const holderCount = await limitCompliance.holderCount();
    holderCount.toString().should.be.equal('2');
    await token.burn(user2, 100, { from: agent });
    const newHolderCount = await limitCompliance.holderCount();
    newHolderCount.toString().should.be.equal('1');
  });

  it('Should not update the token holders when balance is not reducing to zero', async () => {
    await token.mint(user1, 1000, { from: agent });
    await token.mint(user2, 100, { from: agent });
    const holderCount = await limitCompliance.holderCount();
    holderCount.toString().should.be.equal('2');
    await token.burn(user1, 50, { from: agent });
    const newHolderCount = await limitCompliance.holderCount();
    newHolderCount.toString().should.be.equal(holderCount.toString());
  });

  it('Should mint if holder limit do not exceed', async () => {
    await token.mint(user1, 1000, { from: agent });
    await token.mint(user2, 100, { from: agent });
    const user = accounts[4];
    // tokeny deploys a identity contract for user
    const userContract = await ClaimHolder.new({ from: tokeny });

    // identity contracts are registered in identity registry
    await identityRegistry.registerIdentity(user, userContract.address, 91, { from: agent }).should.be.fulfilled;

    // user gets signature from claim issuer
    const hexedData = await web3.utils.asciiToHex('Yea no, this guy is totes legit');

    const hashedDataToSign = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [userContract.address, 7, hexedData]),
    );

    const signature = (await signer.sign(hashedDataToSign)).signature;

    // tokeny adds claim to identity contract
    await userContract.addClaim(7, 1, claimIssuerContract.address, signature, hexedData, '', { from: tokeny });

    // tokeny mint the tokens to the user
    await token.mint(user, 1000, { from: agent }).should.be.rejectedWith(EVMRevert);
  });

  it('Should revert if no tokens minted', async () => {
    await token.mint(user1, 0, { from: agent }).should.be.rejectedWith(EVMRevert);
  });

  it('Should give holder count by country code', async () => {
    await token.mint(user1, 1000, { from: agent });
    (await limitCompliance.getShareholderCountByCountry(91)).toString().should.be.equal('1');
  });

  it('Should allow transfer if holder limit is not exceeding', async () => {
    await token.mint(user1, 1500, { from: agent });

    const user3 = accounts[4];
    // tokeny deploys a identity contract for user
    const userContract = await ClaimHolder.new({ from: tokeny });
    // identity contracts are registered in identity registry
    await identityRegistry.registerIdentity(user3, userContract.address, 91, { from: agent }).should.be.fulfilled;

    // user gets signature from claim issuer
    const hexedData = await web3.utils.asciiToHex('Yea no, this guy is totes legit');

    const hashedDataToSign = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [userContract.address, 7, hexedData]),
    );

    const signature = (await signer.sign(hashedDataToSign)).signature;

    // tokeny adds claim to identity contract
    await userContract.addClaim(7, 1, claimIssuerContract.address, signature, hexedData, '', { from: tokeny });

    await token.transfer(user2, 500, { from: user1 }).should.be.fulfilled;
    await token.transfer(user3, 500, { from: user1 }).should.be.rejectedWith(EVMRevert);
  });

  it('Should not update shareholder count if user is an existing holder.', async () => {
    await token.mint(user1, 1000, { from: agent }).should.be.fulfilled;
    await token.mint(user2, 1000, { from: agent }).should.be.fulfilled;
    (await limitCompliance.holderCount()).toString().should.equal('2');
    await token.transfer(user2, 500, { from: user1 }).should.be.fulfilled;
    (await limitCompliance.holderCount()).toString().should.equal('2');
  });

  it('Should transfer ownership of the compliance contract', async () => {
    const tx = await limitCompliance.transferOwnershipOnComplianceContract(user1, { from: tokeny }).should.be.fulfilled;
    (await limitCompliance.owner()).should.equal(user1);
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to transfer Compliance ownership`);
  });
});
