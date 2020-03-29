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

contract('Token', accounts => {
  let claimTopicsRegistry;
  let identityRegistry;
  let trustedIssuersRegistry;
  let claimIssuerContract;
  let token;
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
  const user3 = accounts[4];
  const claimTopics = [1, 7, 3];
  let user1Contract;
  let user2Contract;
  let user3Contract;
  let signature3;
  let hexedData3;
  const agent = accounts[8];

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
    await token.addAgentOnTokenContract(agent, { from: tokeny });
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
    await identityRegistry.addAgentOnIdentityRegistryContract(agent, { from: tokeny });
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
  });

  it('decimals returns the number of decimals of the token', async () => {
    const decimals1 = await token.decimals().should.be.fulfilled;
    decimals1.toString().should.equal('0');
  });

  it('name returns the name of the token', async () => {
    const name1 = await token.name().should.be.fulfilled;
    name1.toString().should.equal('TREXDINO');
  });

  it('symbol returns the symbol of the token', async () => {
    const symbol1 = await token.symbol().should.be.fulfilled;
    symbol1.toString().should.equal('TREX');
  });

  it('version returns the version of the token', async () => {
    const version1 = await token.version().should.be.fulfilled;
    version1.toString().should.equal('1.2');
  });

  it('onchainID returns the onchainID address of the token', async () => {
    const onchainID1 = await token.onchainID().should.be.fulfilled;
    onchainID1.toString().should.equal(tokenOnchainID.address);
  });

  it('totalSupply returns the total supply of the token', async () => {
    const totalSupply = await token.totalSupply().should.be.fulfilled;
    totalSupply.toString().should.equal('1000');
  });

  it('should get compliance address for the token', async () => {
    const compliance = await token.compliance().should.be.fulfilled;
    compliance.should.equal(defaultCompliance.address);
  });

  it('allowance returns the approved amount of tokens', async () => {
    await token.approve('0x0000000000000000000000000000000000000000', 500, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await token.approve(user2, 500, { from: user1 }).should.be.fulfilled;
    const allowance = await token.allowance(user1, user2).should.be.fulfilled;
    allowance.toString().should.equal('500');
  });

  it('should increase allowance by the amount of tokens given', async () => {
    await token.approve(user2, 500, { from: user1 }).should.be.fulfilled;
    await token.increaseAllowance(user2, 100, { from: user1 });
    const allowance = await token.allowance(user1, user2).should.be.fulfilled;
    allowance.toString().should.equal('600');
  });

  it('should decrease allowance by the amount of tokens given', async () => {
    await token.approve(user2, 500, { from: user1 }).should.be.fulfilled;
    await token.decreaseAllowance(user2, 100, { from: user1 });
    const allowance = await token.allowance(user1, user2).should.be.fulfilled;
    allowance.toString().should.equal('400');
  });

  it('Successful Token transfer', async () => {
    // should revert if receiver is zero address
    await token.transfer('0x0000000000000000000000000000000000000000', 300, { from: user1 }).should.be.rejectedWith(EVMRevert);

    await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('700');
    balance2.toString().should.equal('300');
  });

  it('Successful Burn the tokens', async () => {
    // should revert if zero address given
    await token.burn('0x0000000000000000000000000000000000000000', 300, { from: agent }).should.be.rejectedWith(EVMRevert);

    await token.burn(user1, 300, { from: agent }).should.be.fulfilled;

    const balance1 = await token.balanceOf(user1);
    balance1.toString().should.equal('700');
  });

  it('Should remove agent from token contract', async () => {
    const newAgent = accounts[5];
    await token.addAgentOnTokenContract(newAgent, { from: tokeny }).should.be.fulfilled;
    (await token.isAgent(newAgent)).should.equal(true);
    await token.removeAgentOnTokenContract(newAgent, { from: tokeny }).should.be.fulfilled;
    (await token.isAgent(newAgent)).should.equal(false);
  });

  it('Should not update token holders if participants already hold tokens', async () => {
    user3Contract = await ClaimHolder.new({ from: accounts[4] });
    await identityRegistry.registerIdentity(accounts[4], user3Contract.address, 91, {
      from: agent,
    }).should.be.fulfilled;

    // user3 gets signature from claim issuer
    hexedData3 = await web3.utils.asciiToHex('Yea no, this guy is totes legit');
    const hashedDataToSign3 = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [user3Contract.address, 7, hexedData3]),
    );

    signature3 = (await signer.sign(hashedDataToSign3)).signature;

    // user1 adds claim to identity contract
    await user3Contract.addClaim(7, 1, claimIssuerContract.address, signature3, hexedData3, '', { from: accounts[4] });

    await token.mint(accounts[4], 500, { from: agent });

    await token.transfer(accounts[4], 300, { from: user1 }).should.be.fulfilled;
  });

  it('Token transfer fails if claim signer key is removed from trusted claim issuer contract', async () => {
    await claimIssuerContract.removeKey(signerKey, 3, { from: claimIssuer });
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');
  });

  it('Token transfer fails if a users identity is removed from identity registry', async () => {
    await identityRegistry.deleteIdentity(user2, { from: agent });
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');
  });

  it('Token transfer fails if claimTopic is removed from claimTopic registry', async () => {
    await claimTopicsRegistry.removeClaimTopic(7, { from: tokeny });
    await claimTopicsRegistry.addClaimTopic(8, { from: tokeny });
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');
  });

  it('Token transfer fails if trusted claim issuer is removed from claimIssuers registry', async () => {
    await trustedIssuersRegistry.removeTrustedIssuer(claimIssuerContract.address, { from: tokeny });
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');
  });

  it('Token transfer passes if ClaimTopicRegistry has no claim', async () => {
    // Tokeny remove trusted claim Topic to claim topics registry
    await claimTopicsRegistry.removeClaimTopic(7, { from: tokeny }).should.be.fulfilled;
    await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('700');
    balance2.toString().should.equal('300');
  });

  it('Token transfer fails if ClaimTopicRegistry have some claims but no trusted issuer is added', async () => {
    // Tokeny remove trusted claim Issuer to claimIssuer registry
    await trustedIssuersRegistry.removeTrustedIssuer(claimIssuerContract.address, { from: tokeny }).should.be.fulfilled;
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');
  });

  it('Token transfer fails if claimId is revoked', async () => {
    // Tokeny adds trusted claim Topic to claim topics registry
    await claimTopicsRegistry.addClaimTopic(3, { from: tokeny }).should.be.fulfilled;

    // user2 gets signature from claim issuer
    const hexedData2 = await web3.utils.asciiToHex('Yea no, this guy is totes legit');
    const hashedDataToSign2 = await web3.utils.soliditySha3(
      user2Contract.address, // identity contract address
      3, // ClaimTopic
      hexedData2,
    );

    const signature2 = (await signer.sign(hashedDataToSign2)).signature;

    // user2 adds claim to identity contract
    await user2Contract.addClaim(3, 1, claimIssuerContract.address, signature2, hexedData2, '', { from: user2 }).should.be.fulfilled;

    const claimIds = await user2Contract.getClaimIdsByTopic(7);
    await claimIssuerContract.revokeClaim(claimIds[0], user2Contract.address, {
      from: claimIssuer,
    });
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    balance1.toString().should.equal('1000');
  });

  it('Token transfer passes if same topic claim added by different issuer', async () => {
    const claimIssuer2 = accounts[6];
    // Claim issuer deploying identity contract
    const claimIssuer2Contract = await IssuerIdentity.new({ from: claimIssuer2 });

    // Claim issuer adds claim signer key to his contract
    await claimIssuer2Contract.addKey(signerKey, 3, 1, { from: claimIssuer2 }).should.be.fulfilled;

    // Tokeny adds trusted claim Issuer to claimIssuer registry
    await trustedIssuersRegistry.addTrustedIssuer(claimIssuer2Contract.address, claimTopics, { from: tokeny }).should.be.fulfilled;

    // Tokeny adds trusted claim Topic to claim topics registry
    await claimTopicsRegistry.addClaimTopic(3, { from: tokeny }).should.be.fulfilled;

    // user2 gets signature from claim issuer
    const hexedData2 = await web3.utils.asciiToHex('Yea no, this guy is totes legit');

    const hashedDataToSign2 = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [user2Contract.address, 3, hexedData2]),
    );

    const signature2 = (await signer.sign(hashedDataToSign2)).signature;

    // user2 adds claim to identity contract
    await user2Contract.addClaim(3, 1, claimIssuer2Contract.address, signature2, hexedData2, '', { from: user2 }).should.be.fulfilled;

    await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('700');
    balance2.toString().should.equal('300');
  });

  it('Token transfer fails if trusted issuer do not have claim topic', async () => {
    const claimIssuer2 = accounts[6];
    // Claim issuer deploying identity contract
    const claimIssuer2Contract = await IssuerIdentity.new({ from: claimIssuer2 });

    // Claim issuer adds claim signer key to his contract
    await claimIssuer2Contract.addKey(signerKey, 3, 1, { from: claimIssuer2 }).should.be.fulfilled;

    // Tokeny adds trusted claim Issuer to claimIssuer registry
    await trustedIssuersRegistry.addTrustedIssuer(claimIssuer2Contract.address, [0], { from: tokeny }).should.be.fulfilled;

    // Tokeny adds trusted claim Topic to claim topics registry
    await claimTopicsRegistry.addClaimTopic(3, { from: tokeny }).should.be.fulfilled;

    // user2 gets signature from claim issuer
    const hexedData2 = await web3.utils.asciiToHex('Yea no, this guy is totes legit');

    const hashedDataToSign2 = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [user2Contract.address, 3, hexedData2]),
    );

    const signature2 = (await signer.sign(hashedDataToSign2)).signature;

    // user2 adds claim to identity contract
    await user2Contract.addClaim(3, 1, claimIssuer2Contract.address, signature2, hexedData2, '', { from: user2 }).should.be.fulfilled;

    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');
  });

  it('Wallet recovery should be successful and freeze status should be transferred', async () => {
    // tokeny deploys a identity contract for accounts[7 ]
    const user11Contract = await ClaimHolder.new({ from: tokeny });

    // identity contracts are registered in identity registry
    await identityRegistry.registerIdentity(accounts[7], user11Contract.address, 91, { from: agent }).should.be.fulfilled;

    // user1 gets signature from claim issuer
    const hexedData11 = await web3.utils.asciiToHex('Yea no, this guy is totes legit');

    const hashedDataToSign11 = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [user11Contract.address, 7, hexedData11]),
    );

    const signature11 = (await signer.sign(hashedDataToSign11)).signature;

    // tokeny adds claim to identity contract
    await user11Contract.addClaim(7, 1, claimIssuerContract.address, signature11, hexedData11, '', { from: tokeny });

    // tokeny mint the tokens to the accounts[7]
    await token.mint(accounts[7], 1000, { from: agent });

    // tokeny add token contract as the owner of identityRegistry
    await identityRegistry.addAgentOnIdentityRegistryContract(token.address, { from: tokeny });

    // add management key of the new wallet on the onchainID
    const key = await web3.utils.keccak256(web3.eth.abi.encodeParameter('address', accounts[8]));
    await user11Contract.addKey(key, 1, 1, { from: tokeny });
    await token.setAddressFrozen(accounts[7], true, { from: agent });
    await token.freezePartialTokens(accounts[7], 200, { from: agent });

    // tokeny recover the lost wallet of accounts[7]
    await token.recoveryAddress(accounts[7], accounts[8], user11Contract.address, { from: agent }).should.be.fulfilled;
    const balance1 = await token.balanceOf(accounts[7]);
    const balance2 = await token.balanceOf(accounts[8]);
    balance1.toString().should.equal('0');
    balance2.toString().should.equal('1000');
    const frozenTokens1 = await token.getFrozenTokens(accounts[8]);
    const frozenAddr1 = await token.isFrozen(accounts[8]);
    frozenTokens1.toString().should.equal('200');
    frozenAddr1.toString().should.equal('true');
  });

  it('Wallet recovery should be successful if the new wallet has the management key of the onchainID', async () => {
    // tokeny deploys a identity contract for accounts[7 ]
    const user11Contract = await ClaimHolder.new({ from: tokeny });

    // identity contracts are registered in identity registry
    await identityRegistry.registerIdentity(accounts[7], user11Contract.address, 91, { from: agent }).should.be.fulfilled;

    // user1 gets signature from claim issuer
    const hexedData11 = await web3.utils.asciiToHex('Yea no, this guy is totes legit');

    const hashedDataToSign11 = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [user11Contract.address, 7, hexedData11]),
    );

    const signature11 = (await signer.sign(hashedDataToSign11)).signature;

    // tokeny adds claim to identity contract
    await user11Contract.addClaim(7, 1, claimIssuerContract.address, signature11, hexedData11, '', { from: tokeny });

    // tokeny mint the tokens to the accounts[7]
    await token.mint(accounts[7], 1000, { from: agent });

    // tokeny add token contract as the owner of identityRegistry
    await identityRegistry.addAgentOnIdentityRegistryContract(token.address, { from: tokeny });

    // add management key of the new wallet on the onchainID
    const key = await web3.utils.keccak256(web3.eth.abi.encodeParameter('address', accounts[8]));
    await user11Contract.addKey(key, 1, 1, { from: tokeny });

    // tokeny recover the lost wallet of accounts[7]
    await token.recoveryAddress(accounts[7], accounts[8], user11Contract.address, { from: agent }).should.be.fulfilled;
    const balance1 = await token.balanceOf(accounts[7]);
    const balance2 = await token.balanceOf(accounts[8]);
    balance1.toString().should.equal('0');
    balance2.toString().should.equal('1000');
    const frozenTokens1 = await token.getFrozenTokens(accounts[8]);
    const frozenAddr1 = await token.isFrozen(accounts[8]);
    frozenTokens1.toString().should.equal('0');
    frozenAddr1.toString().should.equal('false');
  });

  it('Recovery should fail if the new wallet does not have a management key on the onchainID', async () => {
    // tokeny deploys a identity contract for accounts[7 ]
    const user11Contract = await ClaimHolder.new({ from: tokeny });

    // identity contracts are registered in identity registry
    await identityRegistry.registerIdentity(accounts[7], user11Contract.address, 91, { from: agent }).should.be.fulfilled;

    // user1 gets signature from claim issuer
    const hexedData11 = await web3.utils.asciiToHex('Yea no, this guy is totes legit');

    const hashedDataToSign11 = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [user11Contract.address, 7, hexedData11]),
    );

    const signature11 = (await signer.sign(hashedDataToSign11)).signature;

    // tokeny adds claim to identity contract
    await user11Contract.addClaim(7, 1, claimIssuerContract.address, signature11, hexedData11, '', { from: tokeny });

    // tokeny mint the tokens to the accounts[7]
    await token.mint(accounts[7], 1000, { from: agent });

    // tokeny add token contract as the owner of identityRegistry
    await identityRegistry.addAgentOnIdentityRegistryContract(token.address, { from: tokeny });

    // tokeny recover the lost wallet of accounts[7]
    await token.recoveryAddress(accounts[7], accounts[8], user11Contract.address, { from: agent }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(accounts[7]);
    const balance2 = await token.balanceOf(accounts[8]);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');
  });

  it('Should revert freezing if amount exceeds available balance', async () => {
    await token.freezePartialTokens(user1, 1100, { from: agent }).should.be.rejectedWith(EVMRevert);
  });

  it('Should revert unfreezing if amount exceeds available balance', async () => {
    await token.unfreezePartialTokens(user1, 500, { from: agent }).should.be.rejectedWith(EVMRevert);
  });

  it('Token transfer fails if amount exceeds unfrozen tokens', async () => {
    await token.freezePartialTokens(user1, 800, { from: agent });
    const frozenTokens2 = await token.getFrozenTokens(user1);
    frozenTokens2.toString().should.equal('800');
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    balance1.toString().should.equal('1000');
  });

  it('Tokens transfer after unfreezing tokens', async () => {
    await token.freezePartialTokens(user1, 800, { from: agent });
    const frozenTokens1 = await token.getFrozenTokens(user1);
    await token.unfreezePartialTokens(user1, 500, { from: agent });
    const frozenTokens2 = await token.getFrozenTokens(user1);

    await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;

    const balance = await token.balanceOf(user1);
    frozenTokens1.toString().should.equal('800');
    frozenTokens2.toString().should.equal('300');
    balance.toString().should.equal('700');
  });

  it('Updates the token name', async () => {
    await token.setName('TREXDINO42');
    const newTokenName = await token.name();
    newTokenName.should.equal('TREXDINO42');
  });

  it('Updates the token symbol', async () => {
    await token.setSymbol('TREX42');
    const newTokenSymbol = await token.symbol();
    newTokenSymbol.should.equal('TREX42');
  });

  it('Updates the token onchainID', async () => {
    await token.setOnchainID('0x0000000000000000000000000000000000000001');
    const newTokenOnchainID = await token.onchainID();
    newTokenOnchainID.should.equal('0x0000000000000000000000000000000000000001');
  });

  it('Cannot mint if agent not added', async () => {
    await token.removeAgent(agent);
    await token.mint(user2, 1000, { from: agent }).should.be.rejectedWith(EVMRevert);
  });

  it('Cannot mint to zero address', async () => {
    await token.mint('0x0000000000000000000000000000000000000000', 1000, { from: agent }).should.be.rejectedWith(EVMRevert);
  });

  it('Successfuly transfers Token if sender approved', async () => {
    // should revert if zero address
    await token.approve('0x0000000000000000000000000000000000000000', 300, { from: user1 }).should.be.rejectedWith(EVMRevert);

    await token.approve(accounts[4], 300, { from: user1 }).should.be.fulfilled;

    await token.transferFrom(user1, user2, 300, { from: accounts[4] }).should.be.fulfilled;

    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('700');
    balance2.toString().should.equal('300');
  });

  it('Transfer fails if identity registry not verified', async () => {
    await token.approve(accounts[4], 300, { from: user1 }).should.be.fulfilled;

    await token.transferFrom(user1, accounts[4], 300, { from: accounts[4] }).should.be.rejectedWith(EVMRevert);
  });

  it('Token cannot be mint if identity is not verified', async () => {
    const balance1 = await token.balanceOf(user2);
    await identityRegistry.deleteIdentity(user2, { from: agent });
    await token.mint(user2, 300, { from: agent }).should.be.rejectedWith(EVMRevert);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('0');
    balance2.toString().should.equal('0');
  });

  it('Token transfer fails if trusted claim issuer is removed from claimIssuers registry', async () => {
    await trustedIssuersRegistry.removeTrustedIssuer(claimIssuerContract.address, { from: tokeny });
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');
  });

  it('should fail if lost wallet has no registered identity', async () => {
    const user11Contract = await ClaimHolder.new({ from: tokeny });
    await token
      .recoveryAddress(accounts[7], accounts[8], user11Contract.address, {
        from: agent,
      })
      .should.be.rejectedWith(EVMRevert);
  });

  it('Transfer from fails if amount exceeds unfrozen tokens', async () => {
    const balance1 = await token.balanceOf(user1);
    await token.freezePartialTokens(user1, 800, { from: agent });
    const frozenTokens2 = await token.getFrozenTokens(user1);
    await token.approve(accounts[4], 300, { from: user1 }).should.be.fulfilled;
    await token.transferFrom(user1, user2, 300, { from: accounts[4] }).should.be.rejectedWith(EVMRevert);
    const balance2 = await token.balanceOf(user1);
    balance1.toString().should.equal('1000');
    frozenTokens2.toString().should.equal('800');
    balance2.toString().should.equal('1000');
  });

  it('Transfer from passes after unfreezing tokens', async () => {
    await token.freezePartialTokens(user1, 800, { from: agent });
    const frozenTokens1 = await token.getFrozenTokens(user1);
    await token.unfreezePartialTokens(user1, 500, { from: agent });
    const frozenTokens2 = await token.getFrozenTokens(user1);
    await token.approve(accounts[4], 300, { from: user1 }).should.be.fulfilled;
    await token.transferFrom(user1, user2, 300, { from: accounts[4] }).should.be.fulfilled;
    const balance = await token.balanceOf(user1);
    frozenTokens1.toString().should.equal('800');
    frozenTokens2.toString().should.equal('300');
    balance.toString().should.equal('700');
  });

  it('Token transfer fails if address is frozen', async () => {
    await token.setAddressFrozen(user1, true, { from: agent });
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');
  });

  it('Token transfer from fails if address is frozen', async () => {
    await token.setAddressFrozen(user1, true, { from: agent });
    await token.approve(accounts[4], 300, { from: user1 }).should.be.fulfilled;
    await token.transferFrom(user1, user2, 300, { from: accounts[4] }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');
  });

  it('Updates identity registry if called by owner', async () => {
    const newIdentityRegistry = await IdentityRegistry.new(trustedIssuersRegistry.address, claimTopicsRegistry.address, { from: tokeny });
    await token.setIdentityRegistry(newIdentityRegistry.address, {
      from: tokeny,
    }).should.be.fulfilled;
  });

  it('Tokens cannot be transferred if paused', async () => {
    // transfer
    await token.pause({ from: agent });
    const isPaused = await token.paused();
    isPaused.should.equal(true);
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    let balance1 = await token.balanceOf(user1);
    let balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');

    // transfer from
    await token.approve(accounts[4], 300, { from: user1 }).should.be.fulfilled;
    await token.transferFrom(user1, user2, 300, { from: accounts[4] }).should.be.rejectedWith(EVMRevert);

    balance1 = await token.balanceOf(user1);
    balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');
  });

  it('Tokens can be transfered after unpausing', async () => {
    await token.unpause({ from: agent }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    await token.pause({ from: agent });
    let isPaused = await token.paused();
    isPaused.should.equal(true);
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await token.unpause({ from: agent });

    isPaused = await token.paused();
    isPaused.should.equal(false);
    await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
    const balance2 = await token.balanceOf(user1);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('700');
  });

  it('Successful forced transfer', async () => {
    await token.forcedTransfer(user1, user2, 300, { from: agent }).should.be.fulfilled;

    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('700');
    balance2.toString().should.equal('300');
  });

  it('Forced transfer successful between frozen addresses', async () => {
    await token.setAddressFrozen(user1, true, { from: agent });
    await token.setAddressFrozen(user2, true, { from: agent });
    await token.forcedTransfer(user1, user2, 300, { from: agent }).should.be.fulfilled;
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('700');
    balance2.toString().should.equal('300');
  });

  it('Forced transfer successful on paused token', async () => {
    await token.pause({ from: agent });
    const isPaused = await token.paused();
    isPaused.should.equal(true);
    await token.forcedTransfer(user1, user2, 300, { from: agent }).should.be.fulfilled;
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('700');
    balance2.toString().should.equal('300');
  });

  it('Forced transfer fails if sender is not agent', async () => {
    await token.forcedTransfer(user1, user2, 300, { from: accounts[4] }).should.be.rejectedWith(EVMRevert);
  });

  it('Forced transfer succeeds even if it exceeds partial freeze amount', async () => {
    await token.freezePartialTokens(user1, 800, { from: agent });
    await token.forcedTransfer(user1, user2, 300, { from: agent }).should.be.fulfilled;
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    const frozenTokens1 = await token.getFrozenTokens(user1);
    balance1.toString().should.equal('700');
    balance2.toString().should.equal('300');
    frozenTokens1.toString().should.equal('700');
  });

  it('Forced transfer fails if balance is not enough', async () => {
    await token.forcedTransfer(user1, user2, 1200, { from: agent }).should.be.rejectedWith(EVMRevert);
  });

  it('Forced transfer fails if identity is not verified', async () => {
    await token.forcedTransfer(user1, accounts[4], 300, { from: agent }).should.be.rejectedWith(EVMRevert);
  });

  it('Should proceed a batch of 2 mint transactions', async () => {
    await token.batchMint([user1, user2], [1000, 1000], { from: agent }).should.be.fulfilled;
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('2000');
    balance2.toString().should.equal('1000');
  });

  it('Should proceed a batch of 20 mint transactions', async () => {
    await token.batchMint(
      [user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1],
      [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
      { from: agent },
    ).should.be.fulfilled;
    const balance1 = await token.balanceOf(user1);
    balance1.toString().should.equal('1400');
  });

  it('batchMint should fail if not called by an agent', async () => {
    await token.batchMint([user1, user2], [1000, 1000], { from: user1 }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');
  });

  it('Should proceed a batch of 2 burn transactions', async () => {
    await token.batchMint([user1, user2], [1000, 1000], { from: agent }).should.be.fulfilled;
    await token.batchBurn([user1, user2], [1000, 1000], { from: agent }).should.be.fulfilled;
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');
  });

  it('Should proceed a batch of 20 burn transactions', async () => {
    await token.batchBurn(
      [user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1],
      [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
      { from: agent },
    ).should.be.fulfilled;
    const balance1 = await token.balanceOf(user1);
    balance1.toString().should.equal('600');
  });

  it('batchBurn should fail if not called by an agent', async () => {
    await token.batchMint([user1, user2], [1000, 1000], { from: agent }).should.be.fulfilled;
    await token.batchBurn([user1, user2], [1000, 1000], { from: user1 }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('2000');
    balance2.toString().should.equal('1000');
  });

  beforeEach(async () => {
    user3Contract = await ClaimHolder.new({ from: user3 });
    // user1 gets signature from claim issuer
    hexedData3 = await web3.utils.asciiToHex('Yea no, this guy is totes legit');
    const hashedDataToSign3 = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [user3Contract.address, 7, hexedData3]),
    );
    signature3 = (await signer.sign(hashedDataToSign3)).signature;
  });

  it('Should proceed a batch of 2 transfers', async () => {
    await identityRegistry.registerIdentity(user3, user3Contract.address, 91, {
      from: agent,
    }).should.be.fulfilled;
    // user1 adds claim to identity contract
    await user3Contract.addClaim(7, 1, claimIssuerContract.address, signature3, hexedData3, '', { from: user3 });
    await token.batchTransfer([user2, user3], [300, 200], {
      from: user1,
    }).should.be.fulfilled;
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    const balance3 = await token.balanceOf(user3);
    balance1.toString().should.equal('500');
    balance2.toString().should.equal('300');
    balance3.toString().should.equal('200');
  });

  it('Should proceed a batch of 20 transfers', async () => {
    await token.batchTransfer(
      [user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2],
      [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
      {
        from: user1,
      },
    ).should.be.fulfilled;
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('600');
    balance2.toString().should.equal('400');
  });

  it('Should proceed a batch of 2 forcedTransfer transactions', async () => {
    await identityRegistry.registerIdentity(user3, user3Contract.address, 91, {
      from: agent,
    }).should.be.fulfilled;
    // user1 adds claim to identity contract
    await user3Contract.addClaim(7, 1, claimIssuerContract.address, signature3, hexedData3, '', { from: user3 });
    await token.batchForcedTransfer([user1, user1], [user2, user3], [300, 200], {
      from: agent,
    }).should.be.fulfilled;
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    const balance3 = await token.balanceOf(user3);
    balance1.toString().should.equal('500');
    balance2.toString().should.equal('300');
    balance3.toString().should.equal('200');
  });

  it('Should proceed a batch of 20 forcedTransfer transactions', async () => {
    await token.batchForcedTransfer(
      [user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user1],
      [user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2],
      [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
      {
        from: agent,
      },
    ).should.be.fulfilled;
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('600');
    balance2.toString().should.equal('400');
  });

  it('batchforcedTransfer should fail if not called by an agent', async () => {
    await identityRegistry.registerIdentity(user3, user3Contract.address, 91, {
      from: agent,
    }).should.be.fulfilled;
    await user3Contract.addClaim(7, 1, claimIssuerContract.address, signature3, hexedData3, '', { from: user3 });
    await token
      .batchForcedTransfer([user1, user1], [user2, user3], [300, 200], {
        from: user1,
      })
      .should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    const balance3 = await token.balanceOf(user3);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');
    balance3.toString().should.equal('0');
  });

  it('Should freeze address in batch', async () => {
    await token.batchSetAddressFrozen([user1, user2], [true, true], {
      from: agent,
    });
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');
  });

  it('batchSetAddressFrozen should fail if not called by an agent', async () => {
    await token
      .batchSetAddressFrozen([user1, user2], [true, true], {
        from: user1,
      })
      .should.be.rejectedWith(EVMRevert);
    await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('700');
    balance2.toString().should.equal('300');
  });

  it('Should proceed a batch of 2 freezePartialTokens transactions', async () => {
    await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
    await token.batchFreezePartialTokens([user1, user2], [200, 200], {
      from: agent,
    });
    const frozenTokens1 = await token.getFrozenTokens(user1);
    const frozenTokens2 = await token.getFrozenTokens(user2);
    frozenTokens1.toString().should.equal('200');
    frozenTokens2.toString().should.equal('200');
    await token.transfer(user1, 300, { from: user2 }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('700');
    balance2.toString().should.equal('300');
  });

  it('Should proceed a batch of 20 freezePartialTokens transactions', async () => {
    await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
    await token.batchFreezePartialTokens(
      [user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2],
      [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
      {
        from: agent,
      },
    );
    const frozenTokens1 = await token.getFrozenTokens(user1);
    const frozenTokens2 = await token.getFrozenTokens(user2);
    frozenTokens1.toString().should.equal('200');
    frozenTokens2.toString().should.equal('200');
    await token.transfer(user1, 300, { from: user2 }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('700');
    balance2.toString().should.equal('300');
  });

  it('batchFreezePartialTokens should fail if not called by an agent', async () => {
    await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
    await token
      .batchFreezePartialTokens([user1, user2], [200, 200], {
        from: user1,
      })
      .should.be.rejectedWith(EVMRevert);
    const frozenTokens1 = await token.getFrozenTokens(user1);
    const frozenTokens2 = await token.getFrozenTokens(user2);
    frozenTokens1.toString().should.equal('0');
    frozenTokens2.toString().should.equal('0');
    await token.transfer(user1, 300, { from: user2 }).should.be.fulfilled;
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('1000');
    balance2.toString().should.equal('0');
  });

  it('Should proceed a batch of 2 unfreezePartialTokens transactions', async () => {
    await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
    await token.batchFreezePartialTokens([user1, user2], [200, 200], {
      from: agent,
    });
    await token.batchUnfreezePartialTokens([user1, user2], [200, 200], {
      from: agent,
    });
    const frozenTokens1 = await token.getFrozenTokens(user1);
    const frozenTokens2 = await token.getFrozenTokens(user2);
    frozenTokens1.toString().should.equal('0');
    frozenTokens2.toString().should.equal('0');
  });

  it('Should proceed a batch of 20 unfreezePartialTokens transactions', async () => {
    await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
    await token.batchFreezePartialTokens([user1, user2], [200, 200], {
      from: agent,
    });
    await token.batchUnfreezePartialTokens(
      [user1, user1, user1, user1, user1, user1, user1, user1, user1, user1, user2, user2, user2, user2, user2, user2, user2, user2, user2, user2],
      [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
      {
        from: agent,
      },
    );
    const frozenTokens1 = await token.getFrozenTokens(user1);
    const frozenTokens2 = await token.getFrozenTokens(user2);
    frozenTokens1.toString().should.equal('0');
    frozenTokens2.toString().should.equal('0');
  });

  it('batchUnfreezePartialTokens should fail if not called by an agent', async () => {
    await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
    await token.batchFreezePartialTokens([user1, user2], [200, 200], {
      from: agent,
    });
    await token
      .batchUnfreezePartialTokens([user1, user2], [200, 200], {
        from: user1,
      })
      .should.be.rejectedWith(EVMRevert);
    const frozenTokens1 = await token.getFrozenTokens(user1);
    const frozenTokens2 = await token.getFrozenTokens(user2);
    frozenTokens1.toString().should.equal('200');
    frozenTokens2.toString().should.equal('200');
    await token.transfer(user1, 100, { from: user2 }).should.be.fulfilled;
    await token.transfer(user1, 100, { from: user2 }).should.be.rejectedWith(EVMRevert);
    const balance1 = await token.balanceOf(user1);
    const balance2 = await token.balanceOf(user2);
    balance1.toString().should.equal('800');
    balance2.toString().should.equal('200');
  });
});
