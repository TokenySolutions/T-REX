import Web3 from 'web3';
import keccak256 from 'keccak256';
import log from "./helpers/logger";
import EVMRevert from "./helpers/VMExceptionRevert";

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const should = require("chai")
  .use(require("chai-as-promised"))
  .should();

const ClaimTopicsRegistry = artifacts.require("../contracts/registry/ClaimTopicsRegistry.sol");
const IdentityRegistry = artifacts.require("../contracts/registry/IdentityRegistry.sol");
const TrustedIssuersRegistry = artifacts.require("../contracts/registry/TrustedIssuersRegistry.sol");
const ClaimHolder = artifacts.require("../contracts/identity/ClaimHolder.sol");
const IssuerIdentity = artifacts.require("../contracts/claimIssuer/ClaimIssuer.sol");
const Token = artifacts.require("../contracts/token/Token.sol");
const Compliance = artifacts.require("../contracts/compliance/DefaultCompliance.sol")
const LimitCompliance = artifacts.require("../contracts/compliance/LimitHolder.sol")

contract('Token', accounts => {
  let claimTopicsRegistry;
  let identityRegistry;
  let trustedIssuersRegistry;
  let claimIssuerContract;
  let token;
  let defaultCompliance;
  let limitCompliance
  let signerKey = web3.utils.keccak256(accounts[5]);

  const tokeny = accounts[0];
  const claimIssuer = accounts[1];
  const user1 = accounts[2];
  const user2 = accounts[3];
  const claimTopics = [1, 7, 3];
  let user1Contract;
  let user2Contract;
  const agent = accounts[8];

  beforeEach(async () => {
    //Tokeny deploying token
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: tokeny });
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({ from: tokeny });
    defaultCompliance = await Compliance.new({ from:tokeny });
    identityRegistry = await IdentityRegistry.new(trustedIssuersRegistry.address, claimTopicsRegistry.address, { from: tokeny });
    token = await Token.new(identityRegistry.address, defaultCompliance.address, claimTopicsRegistry.address, { from: tokeny });
    await token.addAgent(agent);
    //Tokeny adds trusted claim Topic to claim topics registry
    await claimTopicsRegistry.addClaimTopic(7, { from: tokeny }).should.be.fulfilled;

    //Claim issuer deploying identity contract
    claimIssuerContract = await IssuerIdentity.new({ from: claimIssuer });

    //Claim issuer adds claim signer key to his contract
    await claimIssuerContract.addKey(signerKey, 3, 1, { from: claimIssuer }).should.be.fulfilled;

    //Tokeny adds trusted claim Issuer to claimIssuer registry
    await trustedIssuersRegistry.addTrustedIssuer(claimIssuerContract.address, 1, claimTopics, { from: tokeny }).should.be.fulfilled;

    //user1 deploys his identity contract
    user1Contract = await ClaimHolder.new({ from: user1 });

    //user2 deploys his identity contract
    user2Contract = await ClaimHolder.new({ from: user2 });

    //identity contracts are registered in identity registry
    await identityRegistry.addAgent(agent);
    await identityRegistry.registerIdentity(user1, user1Contract.address, 91, { from: agent }).should.be.fulfilled;
    await identityRegistry.registerIdentity(user2, user2Contract.address, 101, { from: agent }).should.be.fulfilled;


    //user1 gets signature from claim issuer
    let hexedData1 = await web3.utils.asciiToHex("Yea no, this guy is totes legit");
    let hashedDataToSign1 = await web3.utils.soliditySha3(
      user1Contract.address, //identity contract address
      7, //ClaimTopic
      hexedData1,
    );

    let signature1 = await web3.eth.sign(hashedDataToSign1, accounts[5]);


    //user1 adds claim to identity contract
    await user1Contract.addClaim(7, 1, claimIssuerContract.address, signature1, hexedData1, "", { from: user1 });

    //user2 gets signature from claim issuer
    let hexedData2 = await web3.utils.asciiToHex("Yea no, this guy is totes legit");
    let hashedDataToSign2 = await web3.utils.soliditySha3(
      user2Contract.address, //identity contract address
      7, //ClaimTopic
      hexedData2,
    );

    let signature2 = await web3.eth.sign(hashedDataToSign2, accounts[5]);

    //user2 adds claim to identity contract
    await user2Contract.addClaim(7, 1, claimIssuerContract.address, signature2, hexedData2, "", { from: user2 }).should.be.fulfilled;
   
    await token.mint(user1, 1000, { from: agent });
  })

  it('Successful Token transfer', async () => {

    limitCompliance = await LimitCompliance.new(token.address, 1000, { from:tokeny }).should.be.fulfilled;

    let tx1 = await token.setCompliance(limitCompliance.address).should.be.fulfilled;
    log(`Cumulative gas cost for setting compliance ${tx1.receipt.gasUsed}`);

    let tx = await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
    log(`Cumulative gas cost for token transfer ${tx.receipt.gasUsed}`);

    let balance1 = await token.balanceOf(user1);
    let balance2 = await token.balanceOf(user2);
    log(`user1 balance: ${balance1}`)
    log(`user2 balance: ${balance2}`)
  })

  it('Successful Burn the tokens', async () => {
    let balance1 = await token.balanceOf(user1);
    let tx = await token.burn(user1, 300, { from: agent }).should.be.fulfilled;
    log(`Cumulative gas cost for token transfer ${tx.receipt.gasUsed}`);

    
    let balance2 = await token.balanceOf(user1);
    log(`user1 balance: ${balance1}`)
    log(`user1 balance: ${balance2}`)
  })

  it('Tokens cannot be mint if they are paused', async () => {
    let balance1 = await token.balanceOf(user1);
    await token.pause({ from: agent });
    await token.mint(user1, 300, { from: agent }).should.be.rejectedWith(EVMRevert);
    
    let balance2 = await token.balanceOf(user1);
    log(`user1 balance: ${balance1}`)
    log(`user1 balance: ${balance2}`)
  })

  it('Token transfer fails if claim signer key is removed from trusted claim issuer contract', async () => {
    await claimIssuerContract.removeKey(signerKey, 3, { from: claimIssuer });
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    let balance1 = await token.balanceOf(user1);
    let balance2 = await token.balanceOf(user2);
    log(`user1 balance: ${balance1}`)
    log(`user2 balance: ${balance2}`)
  })

  it('Token transfer fails if a users identity is removed from identity registry', async () => {
    await identityRegistry.deleteIdentity(user2, { from: agent });
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    let balance1 = await token.balanceOf(user1);
    let balance2 = await token.balanceOf(user2);
    log(`user1 balance: ${balance1}`)
    log(`user2 balance: ${balance2}`)

  })

  it('Token transfer fails if claimTopic is removed from claimTopic registry', async () => {
    await claimTopicsRegistry.removeClaimTopic(7, { from: tokeny });
    await claimTopicsRegistry.addClaimTopic(8, { from: tokeny });
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    let balance1 = await token.balanceOf(user1);
    let balance2 = await token.balanceOf(user2);
    log(`user1 balance: ${balance1}`)
    log(`user2 balance: ${balance2}`)
  })

  it('Token transfer fails if trusted claim issuer is removed from claimIssuers registry', async () => {
    await trustedIssuersRegistry.removeTrustedIssuer(1, { from: tokeny })
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    let balance1 = await token.balanceOf(user1);
    let balance2 = await token.balanceOf(user2);
    log(`user1 balance: ${balance1}`)
    log(`user2 balance: ${balance2}`)
  })

  it('Token transfer passes if ClaimTopicRegistry has no claim', async () => {
    //Tokeny remove trusted claim Topic to claim topics registry
    await claimTopicsRegistry.removeClaimTopic(7, { from: tokeny }).should.be.fulfilled;
    await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
    let balance1 = await token.balanceOf(user1);
    let balance2 = await token.balanceOf(user2);
    log(`user1 balance: ${balance1}`)
    log(`user2 balance: ${balance2}`)
  })

  it('Token transfer fails if ClaimTopicRegistry have some claims but no trusted issuer is added', async () => {
    //Tokeny remove trusted claim Issuer to claimIssuer registry
    await trustedIssuersRegistry.removeTrustedIssuer(1, { from: tokeny }).should.be.fulfilled;
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    let balance1 = await token.balanceOf(user1);
    let balance2 = await token.balanceOf(user2);
    log(`user1 balance: ${balance1}`)
    log(`user2 balance: ${balance2}`)
  })

  it('Token transfer fails if claimId is revoked', async () => {
    //Tokeny adds trusted claim Topic to claim topics registry
    await claimTopicsRegistry.addClaimTopic(3, { from: tokeny }).should.be.fulfilled;
    
   //user2 gets signature from claim issuer
   let hexedData2 = await web3.utils.asciiToHex("Yea no, this guy is totes legit");
   let hashedDataToSign2 = await web3.utils.soliditySha3(
     user2Contract.address, //identity contract address
     3, //ClaimTopic
     hexedData2,
   );

   let signature2 = await web3.eth.sign(hashedDataToSign2, accounts[5]);

   //user2 adds claim to identity contract
   await user2Contract.addClaim(3, 1, claimIssuerContract.address, signature2, hexedData2, "", { from: user2 }).should.be.fulfilled;

    
    let claimIds = await user2Contract.getClaimIdsByTopic(7);
    await claimIssuerContract.revokeClaim(claimIds[0], user2Contract.address, { from: claimIssuer });
    log(`user1 balance: ${await token.balanceOf(user1)}`);
    await token.transfer(user2, 300, { from: user1 }).should.be.rejectedWith(EVMRevert);
    let balance1 = await token.balanceOf(user1);
    log(`user1 balance: ${balance1}`)
  })

  it('Token transfer passes if same topic claim added by different issuer', async () => {
    let claimIssuer2 = accounts[6];
    //Claim issuer deploying identity contract
    let claimIssuer2Contract = await IssuerIdentity.new({ from: claimIssuer2 });

    //Claim issuer adds claim signer key to his contract
    await claimIssuer2Contract.addKey(signerKey, 3, 1, { from: claimIssuer2 }).should.be.fulfilled;

    //Tokeny adds trusted claim Issuer to claimIssuer registry
    await trustedIssuersRegistry.addTrustedIssuer(claimIssuer2Contract.address, 2, claimTopics, { from: tokeny }).should.be.fulfilled;

    //Tokeny adds trusted claim Topic to claim topics registry
    await claimTopicsRegistry.addClaimTopic(3, { from: tokeny }).should.be.fulfilled;
    
   //user2 gets signature from claim issuer
   let hexedData2 = await web3.utils.asciiToHex("Yea no, this guy is totes legit");
   let hashedDataToSign2 = await web3.utils.soliditySha3(
     user2Contract.address, //identity contract address
     3, //ClaimTopic
     hexedData2,
   );

   let signature2 = await web3.eth.sign(hashedDataToSign2, accounts[5]);

   //user2 adds claim to identity contract
   await user2Contract.addClaim(3, 1, claimIssuerContract.address, signature2, hexedData2, "", { from: user2 }).should.be.fulfilled;

   //user2 adds claim to identity contract
   await user2Contract.addClaim(3, 1, claimIssuer2Contract.address, signature2, hexedData2, "", { from: user2 }).should.be.fulfilled;

    log(`user1 balance: ${await token.balanceOf(user1)}`);
    await token.transfer(user2, 300, { from: user1 }).should.be.fulfilled;
    let balance1 = await token.balanceOf(user1);
    log(`user1 balance: ${balance1}`)
  })

  it('Recover the lost wallet tokens if tokeny or issuer has management key', async () => {

    //tokeny deploys a identity contract for accounts[7 ]
    let user11Contract = await ClaimHolder.new({ from: tokeny });

    //identity contracts are registered in identity registry
    await identityRegistry.registerIdentity(accounts[7], user11Contract.address, 91, { from: agent }).should.be.fulfilled;


    //user1 gets signature from claim issuer
    let hexedData11 = await web3.utils.asciiToHex("Yea no, this guy is totes legit");
    let hashedDataToSign11 = await web3.utils.soliditySha3(
      user11Contract.address, //identity contract address
      7, //ClaimTopic
      hexedData11,
    );

    let signature11 = await web3.eth.sign(hashedDataToSign11, accounts[5]);


    // tokeny adds claim to identity contract
    await user11Contract.addClaim(7, 1, claimIssuerContract.address, signature11, hexedData11, "", { from: tokeny });
    
    // tokeny mint the tokens to the accounts[7]
    await token.mint(accounts[7], 1000, { from: agent });

    // tokeny add token contract as the owner of identityRegistry
    await identityRegistry.addAgent(token.address, { from: tokeny });
    
    // tokeny recover the lost wallet of accounts[7]
    await token.recoveryAddress(accounts[7], accounts[8], user11Contract.address, { from: agent }).should.be.fulfilled;
    let balance1 = await token.balanceOf(accounts[7]);
    let balance2 = await token.balanceOf(accounts[8]);
    log(`accounts[7] balance: ${balance1}`)
    log(`accounts[8] balance: ${balance2}`)
  })

  it('Does not recover the lost wallet tokens if tokeny or issuer does not have management key', async () => {
    // tokeny add token contract as the owner of identityRegistry
    await identityRegistry.addAgent(token.address, { from: tokeny });

  
    // tokeny recover the lost wallet of user1
    await token.recoveryAddress(user1, accounts[8], user1Contract.address, { from: agent }).should.be.fulfilled;
    let balance1 = await token.balanceOf(user1);
    let balance2 = await token.balanceOf(accounts[8]);
    log(`user1 balance: ${balance1}`)
    log(`accounts[8] balance: ${balance2}`)
  })
})

