import Web3 from 'web3';

import log from "./helpers/logger";
import EVMRevert from "./helpers/VMExceptionRevert";

const should = require("chai")
  .use(require("chai-as-promised"))
  .should();

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const ClaimHolder = artifacts.require("../contracts/identity/ClaimHolder.sol");

contract('Identity', accounts => {
  let claimHolder;
  const key = web3.utils.keccak256(accounts[0]);

  beforeEach(async () => {
    claimHolder = await ClaimHolder.new({ from: accounts[0] });
    await claimHolder.addClaim(1, 1, accounts[5], "0x24", "0x12", "");
  });

  it('Should have a management key by default when contract is deployed', async () => {
    let status = await claimHolder.keyHasPurpose(key, 1);
    status.should.equal(true);
  })

  it('Add key should pass if key is unique and identity contract has management key', async () => {
    const newKey = web3.utils.keccak256(accounts[1]);
    let tx = await claimHolder.addKey(newKey, 3, 1).should.be.fulfilled;
    log(`Cumulative gas cost for key Addition ${tx.receipt.gasUsed}`);
  })

  it('Add key should fail function triggered by non-owner', async () => {
    const newKey = web3.utils.keccak256(accounts[1]);
    await claimHolder.addKey(newKey, 3, 1, { from: accounts[1] }).should.be.rejectedWith(EVMRevert);
  })

  it('Add key should fail if the provided key already exists', async () => {
    await claimHolder.addKey(key, 2, 1).should.be.rejectedWith(EVMRevert);
  })

  it('Add key should fail if there is no management key in the identity contract', async () => {
    await claimHolder.removeKey(key);
    await claimHolder.addKey(key, 2, 1).should.be.rejectedWith(EVMRevert);
  })

  it('Remove key should pass if key is present in the contract', async () => {
    let tx = await claimHolder.removeKey(key).should.be.fulfilled;
    log(`Cumulative gas cost for key Removal ${tx.receipt.gasUsed}`);
  })

  it('Remove key should fail if triggered by non-owner', async () => {
    await claimHolder.removeKey(key, { from: accounts[1] }).should.be.rejectedWith(EVMRevert);
  })

  it('Remove key should if key provided doesnt exist', async () => {
    const newKey = web3.utils.keccak256(accounts[1]);
    await claimHolder.removeKey(newKey).should.be.rejectedWith(EVMRevert);
  })

  it('Remove key should fail if there us no management key in the identity contract', async () => {
    const newKey = web3.utils.keccak256(accounts[1]);
    await claimHolder.addKey(newKey, 3, 1);
    await claimHolder.removeKey(key);
    await claimHolder.removeKey(newKey).should.be.rejectedWith(EVMRevert);
  })

  it('Add claim by identity deployer must be succesfull', async () => {
    let tx = await claimHolder.addClaim(2, 1, accounts[6], "0x2454", "0x12", "", { from: accounts[0] }).should.be.fulfilled;
    log(`Cumulative gas cost for claim Addition ${tx.receipt.gasUsed}`);
  })

  it('Add claim should fail if triggered by non-owner', async () => {
    await claimHolder.addClaim(2, 1, accounts[6], "0x2454", "0x12", "", { from: accounts[1] }).should.be.rejectedWith(EVMRevert);
  })

  it('Add claim should fail if sender does not have management key', async () => {
    await claimHolder.removeKey(key);
    await claimHolder.addClaim(2, 1, accounts[6], "0x2454", "0x12", "").should.be.rejectedWith(EVMRevert);
  })

  it('Remove claim must be succesful if the claimId provided is present', async () => {
    let claimId = await web3.utils.keccak256(accounts[5], 1);
    let tx = await claimHolder.removeClaim(claimId).should.be.fulfilled;
    log(`Cumulative gas cost for claim Removal ${tx.receipt.gasUsed}`);
  })

  it('Remove claim must fail if triggered by non-owner', async () => {
    let claimId = await web3.utils.keccak256(accounts[5], 1);
    await claimHolder.removeClaim(claimId, { from: accounts[1] }).should.be.rejectedWith(EVMRevert);
  })
})
