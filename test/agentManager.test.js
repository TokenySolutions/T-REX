const Web3 = require('web3');
const fetch = require('node-fetch');
const log = require('./helpers/logger');
require('chai')
  .use(require('chai-as-promised'))
  .should();
const EVMRevert = require('./helpers/VMExceptionRevert');

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

let gasAverage;

const gWeiToETH = 1 / 1000000000;
function calculateETH(gasUnits) {
  return Math.round(gasUnits * gWeiToETH * gasAverage * 10000) / 10000;
}

const ClaimTopicsRegistry = artifacts.require('../contracts/registry/ClaimTopicsRegistry.sol');
const IdentityRegistry = artifacts.require('../contracts/registry/IdentityRegistry.sol');
const TrustedIssuersRegistry = artifacts.require('../contracts/registry/TrustedIssuersRegistry.sol');
const ClaimHolder = artifacts.require('@onchain-id/solidity/contracts/Identity.sol');
const IssuerIdentity = artifacts.require('@onchain-id/solidity/contracts/ClaimIssuer.sol');
const Token = artifacts.require('../contracts/token/Token.sol');
const Compliance = artifacts.require('../contracts/compliance/DefaultCompliance.sol');
const AgentManager = artifacts.require('../contracts/roles/AgentManager.sol');
const IdentityRegistryStorage = artifacts.require('../contracts/registry/IdentityRegistryStorage.sol');

contract('Agent Manager', accounts => {
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
  const admin = accounts[4];

  beforeEach(async () => {
    // Tokeny deploying token
    gasAverage = await fetch('https://ethgasstation.info/json/ethgasAPI.json')
      .then(resp => resp.json())
      .then(data => data.average);
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
    agentManager = await AgentManager.new(token.address, { from: agent });
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

    await token.mint(user1, 1000, { from: agent });
    await agentManager.addAgentAdmin(admin, { from: agent });
  });

  it('Should add admin to the role manager.', async () => {
    const adminRole = accounts[6];
    (await agentManager.isAgentAdmin(adminRole)).should.be.equal(false);
    const tx = await agentManager.addAgentAdmin(adminRole, { from: agent });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to add an admin to the role manager`);
    (await agentManager.isAgentAdmin(adminRole)).should.be.equal(true);
  });

  it('Should remove admin from the role manager.', async () => {
    (await agentManager.isAgentAdmin(admin)).should.be.equal(true);
    const tx = await agentManager.removeAgentAdmin(admin, { from: agent });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to remove an admin to the role manager`);
    (await agentManager.isAgentAdmin(admin)).should.be.equal(false);
  });

  it('Should perform minting if called by Supply modifier', async () => {
    await agentManager.callMint(user2, 1000, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addSupplyModifier(user1Contract.address, { from: admin });
    (await agentManager.isSupplyModifier(user1Contract.address)).should.be.equal(true);
    await token.addAgent(agentManager.address, { from: tokeny });
    const tx = await agentManager.callMint(user2, 1000, user1Contract.address, { from: user1 });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to mint on a single user`);
    (await token.balanceOf(user2)).toString().should.be.equal('1000');
  });

  it('Should perform batch minting if called by Supply modifier', async () => {
    await agentManager.callBatchMint([user1, user2], [100, 100], user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addSupplyModifier(user1Contract.address, { from: admin });
    (await agentManager.isSupplyModifier(user1Contract.address)).should.be.equal(true);
    await token.addAgent(agentManager.address, { from: tokeny });
    const tx = await agentManager.callBatchMint([user1, user2], [100, 100], user1Contract.address, { from: user1 });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to batch mint on 2 users`);
    (await token.balanceOf(user1)).toString().should.be.equal('1100');
    (await token.balanceOf(user2)).toString().should.be.equal('100');
  });

  it('Should perform burn if called by Supply modifier', async () => {
    await agentManager.callBurn(user1, 200, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addSupplyModifier(user1Contract.address, { from: admin });
    (await agentManager.isSupplyModifier(user1Contract.address)).should.be.equal(true);
    await token.addAgent(agentManager.address, { from: tokeny });
    (await token.balanceOf(user1)).toString().should.be.equal('1000');
    const tx = await agentManager.callBurn(user1, 200, user1Contract.address, { from: user1 });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to perform a burn on a user`);
    (await token.balanceOf(user1)).toString().should.be.equal('800');
  });

  it('Should perform batch burning if called by Supply modifier', async () => {
    await agentManager.callBatchBurn([user1, user1], [100, 100], user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addSupplyModifier(user1Contract.address, { from: admin });
    (await agentManager.isSupplyModifier(user1Contract.address)).should.be.equal(true);
    await token.addAgent(agentManager.address, { from: tokeny });
    await agentManager.callMint(user2, 1000, user1Contract.address, { from: user1 });
    const tx = await agentManager.callBatchBurn([user1, user2], [100, 100], user1Contract.address, { from: user1 });
    (await token.balanceOf(user1)).toString().should.be.equal('900');
    (await token.balanceOf(user2)).toString().should.be.equal('900');
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to perform batch burn on 2 users`);
  });

  it('Should remove supply admin from the role manager.', async () => {
    await agentManager.addSupplyModifier(user1Contract.address, { from: admin });
    (await agentManager.isSupplyModifier(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.removeSupplyModifier(user1Contract.address, { from: admin });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to remove admin supply from the role manager`);
    (await agentManager.isSupplyModifier(user1Contract.address)).should.be.equal(false);
  });

  it('Should perform forced transfer if called by transfer manager', async () => {
    await agentManager.callForcedTransfer(user1, user2, 200, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    (await agentManager.isTransferManager(user1Contract.address)).should.be.equal(false);
    await agentManager.addTransferManager(user1Contract.address, { from: admin });
    (await agentManager.isTransferManager(user1Contract.address)).should.be.equal(true);
    await token.addAgent(agentManager.address, { from: tokeny });
    (await token.balanceOf(user1)).toString().should.be.equal('1000');
    (await token.balanceOf(user2)).toString().should.be.equal('0');

    const tx = await agentManager.callForcedTransfer(user1, user2, 200, user1Contract.address, { from: user1 });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used from transfer manager to perform a forced Transfer `);
    (await token.balanceOf(user1)).toString().should.be.equal('800');
    (await token.balanceOf(user2)).toString().should.be.equal('200');
  });

  it('Should perform batch forced transfer if called by transfer manager', async () => {
    await agentManager
      .callBatchForcedTransfer([user1, user2], [user2, user1], [200, 100], user1Contract.address, { from: user1 })
      .should.be.rejectedWith(EVMRevert);
    await agentManager.addTransferManager(user1Contract.address, { from: admin });
    (await agentManager.isTransferManager(user1Contract.address)).should.be.equal(true);
    await token.addAgent(agentManager.address, { from: tokeny });
    const tx = await agentManager.callBatchForcedTransfer([user1, user2], [user2, user1], [200, 100], user1Contract.address, { from: user1 });
    (await token.balanceOf(user1)).toString().should.be.equal('900');
    (await token.balanceOf(user2)).toString().should.be.equal('100');
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to perform a batch forced Transfer on 2 users `);
  });

  it('Should remove transfer manager from the role manager.', async () => {
    await agentManager.addTransferManager(user1Contract.address, { from: admin });
    (await agentManager.isTransferManager(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.removeTransferManager(user1Contract.address, { from: admin });
    (await agentManager.isTransferManager(user1Contract.address)).should.be.equal(false);
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to remove a transfer Manager`);
  });

  it('Should freeze adress if called by freezer', async () => {
    await agentManager.callSetAddressFrozen(user1, true, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(true);
    await token.addAgent(agentManager.address, { from: tokeny });
    const tx = await agentManager.callSetAddressFrozen(user1, true, user1Contract.address, { from: user1 });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to freeze an address`);
    (await token.isFrozen(user1)).should.be.equal(true);
  });

  it('Should freeze address in batch if called by freezer', async () => {
    await agentManager
      .callBatchSetAddressFrozen([user1, user2], [true, true], user1Contract.address, { from: user1 })
      .should.be.rejectedWith(EVMRevert);
    await agentManager.addFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(true);
    await token.addAgent(agentManager.address, { from: tokeny });
    const tx = await agentManager.callBatchSetAddressFrozen([user1, user2], [true, true], user1Contract.address, { from: user1 });
    (await token.isFrozen(user1)).should.be.equal(true);
    (await token.isFrozen(user2)).should.be.equal(true);
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to batchfreeze 2 addresses`);
  });
  it('Should freeze tokens partially if called by freezer', async () => {
    await agentManager.callFreezePartialTokens(user1, 200, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(true);
    await token.addAgent(agentManager.address, { from: tokeny });
    const tx = await agentManager.callFreezePartialTokens(user1, 200, user1Contract.address, { from: user1 });
    (await token.getFrozenTokens(user1)).toString().should.be.equal('200');
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to freeze tokens partially on an address`);
  });

  it('Should freeze partial tokens in batch if called by freezer', async () => {
    await agentManager
      .callBatchFreezePartialTokens([user1, user1], [200, 100], user1Contract.address, { from: user1 })
      .should.be.rejectedWith(EVMRevert);
    await agentManager.addFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(true);
    await token.addAgent(agentManager.address, { from: tokeny });
    const tx = await agentManager.callBatchFreezePartialTokens([user1, user1], [200, 100], user1Contract.address, { from: user1 });
    (await token.getFrozenTokens(user1)).toString().should.be.equal('300');
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to batch freeze tokens partially`);
  });

  it('Should unfreeze tokens partially if called by freezer', async () => {
    await agentManager.callUnfreezePartialTokens(user1, 200, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(true);
    await token.addAgent(agentManager.address, { from: tokeny });
    await agentManager.callFreezePartialTokens(user1, 200, user1Contract.address, { from: user1 });
    (await token.getFrozenTokens(user1)).toString().should.be.equal('200');
    const tx = await agentManager.callUnfreezePartialTokens(user1, 200, user1Contract.address, { from: user1 });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to unfreeze tokens partially on an address`);
    (await token.getFrozenTokens(user1)).toString().should.be.equal('0');
  });

  it('Should unfreeze partial tokens in batch if called by freezer', async () => {
    await agentManager
      .callBatchUnfreezePartialTokens([user1, user1], [200, 100], user1Contract.address, { from: user1 })
      .should.be.rejectedWith(EVMRevert);
    await agentManager.addFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(true);
    await token.addAgent(agentManager.address, { from: tokeny });
    (await token.getFrozenTokens(user1)).toString().should.be.equal('0');
    await agentManager.callBatchFreezePartialTokens([user1, user1], [200, 100], user1Contract.address, { from: user1 });
    const tx = await agentManager.callBatchUnfreezePartialTokens([user1, user1], [200, 100], user1Contract.address, { from: user1 });
    (await token.getFrozenTokens(user1)).toString().should.be.equal('0');
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to batch unfreeze tokens`);
  });

  it('Should pause token if called by freezer', async () => {
    await agentManager.callPause(user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(true);
    await token.addAgent(agentManager.address, { from: tokeny });
    const tx = await agentManager.callPause(user1Contract.address, { from: user1 });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used from Freezer to call Pause token`);
    (await token.paused()).should.be.equal(true);
  });

  it('Should unpause token if called by freezer', async () => {
    await agentManager.callUnpause(user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(true);
    await token.addAgent(agentManager.address, { from: tokeny });
    await agentManager.callPause(user1Contract.address, { from: user1 });
    (await token.paused()).should.be.equal(true);
    const tx = await agentManager.callUnpause(user1Contract.address, { from: user1 });
    (await token.paused()).should.be.equal(false);
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used from Freezer to unpause token`);
  });

  it('Should remove freezer from the role manager.', async () => {
    await agentManager.addFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.removeFreezer(user1Contract.address, { from: admin });
    (await agentManager.isFreezer(user1Contract.address)).should.be.equal(false);
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to remove Freezer from the role manager`);
  });

  it('Should recover address if called by recovery agent', async () => {
    const user = accounts[7];

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

    // tokeny mint the tokens to the accounts[7]
    await token.mint(user, 1000, { from: agent });

    // tokeny add token contract as the owner of identityRegistry
    await identityRegistry.addAgent(token.address, { from: tokeny });

    // add management key of the new wallet on the onchainID
    const key = await web3.utils.keccak256(web3.eth.abi.encodeParameter('address', accounts[8]));
    await userContract.addKey(key, 1, 1, { from: tokeny });

    const newWallet = accounts[8];
    // tokeny recover the lost wallet of accounts[7]
    await agentManager
      .callRecoveryAddress(user, newWallet, userContract.address, user1Contract.address, { from: user1 })
      .should.be.rejectedWith(EVMRevert);
    await agentManager.addRecoveryAgent(user1Contract.address, { from: admin });
    (await agentManager.isRecoveryAgent(user1Contract.address)).should.be.equal(true);
    await token.addAgent(agentManager.address, { from: tokeny });
    const tx = await agentManager.callRecoveryAddress(user, newWallet, userContract.address, user1Contract.address, { from: user1 });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used by the recovery agent to recover an address`);
    const balance1 = await token.balanceOf(user);
    const balance2 = await token.balanceOf(newWallet);
    balance1.toString().should.equal('0');
    balance2.toString().should.equal('1000');
  });

  it('Should remove recovery agent from the role manager.', async () => {
    await agentManager.addRecoveryAgent(user1Contract.address, { from: admin });
    (await agentManager.isRecoveryAgent(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.removeRecoveryAgent(user1Contract.address, { from: admin });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to remove a recovery agent from the role manager`);
    (await agentManager.isRecoveryAgent(user1Contract.address)).should.be.equal(false);
  });

  it('Should add and remove compliance agent from the role manager.', async () => {
    const tx1 = await agentManager.addComplianceAgent(user1Contract.address, { from: admin });
    (await agentManager.isComplianceAgent(user1Contract.address)).should.be.equal(true);
    const tx2 = await agentManager.removeComplianceAgent(user1Contract.address, { from: admin });
    (await agentManager.isComplianceAgent(user1Contract.address)).should.be.equal(false);
    log(`[${calculateETH(tx1.receipt.gasUsed)} ETH] --> GAS fees used to add a compliance agent to the role manager`);
    log(`[${calculateETH(tx2.receipt.gasUsed)} ETH] --> GAS fees used to remove a recovery agent from the role manager`);
  });

  it('Should register identity if called by whitelist manager', async () => {
    const newUser = accounts[6];
    const identity = await ClaimHolder.new({ from: accounts[6] });
    await agentManager.callRegisterIdentity(newUser, identity.address, 100, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addWhiteListManager(user1Contract.address, { from: admin });
    (await agentManager.isWhiteListManager(user1Contract.address)).should.be.equal(true);
    await identityRegistry.addAgent(agentManager.address, { from: tokeny });
    const tx = await agentManager.callRegisterIdentity(newUser, identity.address, 100, user1Contract.address, { from: user1 });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used by Whitelist manager to register Identity`);
    const registered = await identityRegistry.contains(newUser);
    registered.toString().should.equal('true');
  });

  it('Should update identity if called by whitelist manager', async () => {
    const newIdentity = await ClaimHolder.new({ from: user2 });
    await agentManager.callUpdateIdentity(user2, newIdentity.address, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addWhiteListManager(user1Contract.address, { from: admin });
    (await agentManager.isWhiteListManager(user1Contract.address)).should.be.equal(true);
    await identityRegistry.addAgent(agentManager.address, { from: tokeny });
    const tx = await agentManager.callUpdateIdentity(user2, newIdentity.address, user1Contract.address, { from: user1 });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used by whitelist Manager to update Identity`);
    const updated = await identityRegistry.identity(user2);
    updated.toString().should.equal(newIdentity.address);
  });

  it('Should update country if called by whitelist manager', async () => {
    await agentManager.callUpdateCountry(user2, 84, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addWhiteListManager(user1Contract.address, { from: admin });
    (await agentManager.isWhiteListManager(user1Contract.address)).should.be.equal(true);
    await identityRegistry.addAgent(agentManager.address, { from: tokeny });
    const tx = await agentManager.callUpdateCountry(user2, 84, user1Contract.address, { from: user1 });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used by whitelist Manager to update Country`);
    const country = await identityRegistry.investorCountry(user2);
    country.toString().should.equal('84');
  });

  it('Should delete identity if called by whitelist manager', async () => {
    await agentManager.callDeleteIdentity(user2, user1Contract.address, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await agentManager.addWhiteListManager(user1Contract.address, { from: admin });
    (await agentManager.isWhiteListManager(user1Contract.address)).should.be.equal(true);
    await identityRegistry.addAgent(agentManager.address, { from: tokeny });
    const tx = await agentManager.callDeleteIdentity(user2, user1Contract.address, { from: user1 });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used by whitelist Manager to delete Identity`);
    const result = await identityRegistry.contains(user2);
    result.should.equal(false);
  });

  it('Should remove whitelist manager from the role manager.', async () => {
    await agentManager.addWhiteListManager(user1Contract.address, { from: admin });
    (await agentManager.isWhiteListManager(user1Contract.address)).should.be.equal(true);
    const tx = await agentManager.removeWhiteListManager(user1Contract.address, { from: admin });
    log(`[${calculateETH(tx.receipt.gasUsed)} ETH] --> GAS fees used to remove whitelist Manager from role manager`);
    (await agentManager.isWhiteListManager(user1Contract.address)).should.be.equal(false);
  });

  it('Should not add or remove roles if not admin', async () => {
    await agentManager.addWhiteListManager(user1Contract.address, { from: tokeny }).should.be.rejectedWith(EVMRevert);
  });
});
