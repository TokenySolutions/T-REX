import Web3 from 'web3';

import log from "./helpers/logger";
import EVMRevert from "./helpers/VMExceptionRevert";

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const should = require("chai")
  .use(require("chai-as-promised"))
  .should();

const ClaimTypesRegistry = artifacts.require("../contracts/registry/ClaimTypesRegistry.sol");
const IdentityRegistry = artifacts.require("../contracts/registry/IdentityRegistry.sol");
const TrustedIssuersRegistry = artifacts.require("../contracts/registry/TrustedIssuersRegistry.sol");
const ClaimHolder = artifacts.require("../contracts/identity/ClaimHolder.sol");
const Token = artifacts.require("../contracts/token/Token.sol");

contract('Token', accounts => {
  let claimTypesRegistry;
  let identityRegistry;
  let trustedIssuersRegistry;
  let claimIssuerContract;
  let token;
  let signerKey = web3.utils.keccak256(accounts[5]);

  const tokeny = accounts[0];
  const claimIssuer = accounts[1];
  const user1 = accounts[2];
  const user2 = accounts[3];

  let user1Contract;
  let user2Contract;

  beforeEach(async () => {
    //Tokeny deploying token
    claimTypesRegistry = await ClaimTypesRegistry.new({ from: tokeny });
    identityRegistry = await IdentityRegistry.new({ from: tokeny });
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({ from: tokeny });
    token = await Token.new(user1, tokeny, 100, trustedIssuersRegistry.address, claimTypesRegistry.address, identityRegistry.address, { from: tokeny });

    //Claim issuer deploying identity contract
    claimIssuerContract = await ClaimHolder.new({ from: claimIssuer });

    //Claim issuer adds claim signer key to his contract
    await claimIssuerContract.addKey(signerKey, 3, 1, { from: claimIssuer }).should.be.fulfilled;

    //Tokeny adds trusted claim Type to claim types registry
    await claimTypesRegistry.addClaimType(7, { from: tokeny }).should.be.fulfilled;

    //Tokeny adds trusted claim Issuer to claimIssuer registry
    await trustedIssuersRegistry.addTrustedIssuer(claimIssuerContract.address, 1, { from: tokeny }).should.be.fulfilled;

    //user1 deploys his identity contract
    user1Contract = await ClaimHolder.new({ from: user1 });

    //user2 deploys his identity contract
    user2Contract = await ClaimHolder.new({ from: user2 });

    //identity contracts are registered in identity registry
    await identityRegistry.registerIdentity(user1, user1Contract.address).should.be.fulfilled;
    await identityRegistry.registerIdentity(user2, user2Contract.address).should.be.fulfilled;


    //user1 gets signature from claim issuer
    let hexedData1 = await web3.utils.asciiToHex("Yea no, this guy is totes legit");
    let hashedDataToSign1 = await web3.utils.soliditySha3(
      user1Contract.address, //identity contract address
      7, //ClaimType
      hexedData1,
    );

    let signature1 = await web3.eth.sign(hashedDataToSign1, accounts[5]);


    //user1 adds claim to identity contract
    await user1Contract.addClaim(7, 1, claimIssuerContract.address, signature1, hexedData1, "", { from: user1 });

    //user2 gets signature from claim issuer
    let hexedData2 = await web3.utils.asciiToHex("Yea no, this guy is totes legit");
    let hashedDataToSign2 = await web3.utils.soliditySha3(
      user2Contract.address, //identity contract address
      7, //ClaimType
      hexedData2,
    );

    let signature2 = await web3.eth.sign(hashedDataToSign2, accounts[5]);

    //user1 adds claim to identity contract
    await user2Contract.addClaim(7, 1, claimIssuerContract.address, signature2, hexedData2, "", { from: user2 }).should.be.fulfilled;

  })

  it('Successful Token transfer', async () => {
    await token.allowDisvisableToken({ from: tokeny });
    let tx = await token.transfer(user2, 30000000000000000000, { from: user1 }).should.be.fulfilled;
    log(`Cumulative gas cost for token transfer ${tx.receipt.gasUsed}`);

    let balance1 = await token.balanceOf(user1);
    let balance2 = await token.balanceOf(user2);
    log(`user1 balance: ${balance1}`)
    log(`user2 balance: ${balance2}`)
  })

  it('Token transfer fails if claim signer key is removed from trusted claim issuer contract', async () => {
    await token.allowDisvisableToken({ from: tokeny });
    await claimIssuerContract.removeKey(signerKey, { from: claimIssuer });
    await token.transfer(user2, 30000000000000000000, { from: user1 }).should.be.rejectedWith(EVMRevert);
    let balance1 = await token.balanceOf(user1);
    let balance2 = await token.balanceOf(user2);
    log(`user1 balance: ${balance1}`)
    log(`user2 balance: ${balance2}`)
  })

  it('Token transfer fails if a users identity is removed from identity registry', async () => {
    await token.allowDisvisableToken({ from: tokeny });
    await identityRegistry.deleteIdentity(user1, { from: tokeny });
    await token.transfer(user2, 30000000000000000000, { from: user1 }).should.be.rejectedWith(EVMRevert);
    let balance1 = await token.balanceOf(user1);
    let balance2 = await token.balanceOf(user2);
    log(`user1 balance: ${balance1}`)
    log(`user2 balance: ${balance2}`)

  })

  it('Token transfer fails if claimType is removed from claimType registry', async () => {
    await token.allowDisvisableToken({ from: tokeny });
    await claimTypesRegistry.removeClaimType(7, { from: tokeny });
    await claimTypesRegistry.addClaimType(8, { from: tokeny });
    await token.transfer(user2, 30000000000000000000, { from: user1 }).should.be.rejectedWith(EVMRevert);
    let balance1 = await token.balanceOf(user1);
    let balance2 = await token.balanceOf(user2);
    log(`user1 balance: ${balance1}`)
    log(`user2 balance: ${balance2}`)
  })

  it('Token transfer fails if trusted claim issuer is removed from claimIssuers registry', async () => {
    await token.allowDisvisableToken({ from: tokeny });
    await trustedIssuersRegistry.removeTrustedIssuer(1, { from: tokeny })
    await token.transfer(user2, 30000000000000000000, { from: user1 }).should.be.rejectedWith(EVMRevert);
    let balance1 = await token.balanceOf(user1);
    let balance2 = await token.balanceOf(user2);
    log(`user1 balance: ${balance1}`)
    log(`user2 balance: ${balance2}`)
  })
})

