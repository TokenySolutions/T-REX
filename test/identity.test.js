const Web3 = require('web3');
const fetch = require('node-fetch');
require('chai')
  .use(require('chai-as-promised'))
  .should();
const EVMRevert = require('./helpers/VMExceptionRevert');
const log = require('./helpers/logger');

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
const ClaimHolder = artifacts.require('@onchain-id/solidity/contracts/Identity.sol');
let gasAverage;
const gWeiToETH = 1 / 1000000000;
function calculateETH(gasUnits) {
  return Math.round(gasUnits * gWeiToETH * gasAverage * 10000) / 10000;
}

contract('Identity', accounts => {
  let claimHolder;
  const key = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', accounts[0]));

  beforeEach(async () => {
    gasAverage = await fetch('https://ethgasstation.info/json/ethgasAPI.json')
      .then(resp => resp.json())
      .then(data => data.average);
    claimHolder = await ClaimHolder.new({ from: accounts[0] });
    await claimHolder.addClaim(1, 1, accounts[5], '0x24', '0x12', '');
  });

  it('Should have a management key by default when contract is deployed', async () => {
    const status = await claimHolder.keyHasPurpose(key, 1);
    status.should.equal(true);
  });

  it('Add key should pass if key is unique and identity contract has management key', async () => {
    const newKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', accounts[1]));
    const tx = await claimHolder.addKey(newKey, 3, 1).should.be.fulfilled;
    log(`[${calculateETH(tx.receipt.gasUsed)}] --> GAS fees used to add a Management Key`);
  });

  it('Add key should fail function triggered by non-owner', async () => {
    const newKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', accounts[1]));
    await claimHolder.addKey(newKey, 3, 1, { from: accounts[1] }).should.be.rejectedWith(EVMRevert);
  });

  it('Add key should fail if the provided key purpose already exists', async () => {
    await claimHolder.addKey(key, 1, 1).should.be.rejectedWith(EVMRevert);
  });

  it('Add key should fail if there is no management key in the identity contract', async () => {
    await claimHolder.removeKey(key, 1);
    await claimHolder.addKey(key, 2, 1).should.be.rejectedWith(EVMRevert);
  });

  it('Remove key should pass if key is present in the contract', async () => {
    const tx = await claimHolder.removeKey(key, 1).should.be.fulfilled;
    log(`[${calculateETH(tx.receipt.gasUsed)}] --> GAS fees used to remove a Management Key`);
  });

  it('Remove key should fail if triggered by non-owner', async () => {
    await claimHolder.removeKey(key, 1, { from: accounts[1] }).should.be.rejectedWith(EVMRevert);
  });

  it('Remove key should if key provided doesnt exist', async () => {
    const newKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', accounts[1]));
    await claimHolder.removeKey(newKey, 1).should.be.rejectedWith(EVMRevert);
  });

  it('Remove key should fail if there is no management key in the identity contract', async () => {
    const newKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', accounts[1]));
    await claimHolder.addKey(newKey, 3, 1);
    await claimHolder.removeKey(key, 1);
    await claimHolder.removeKey(newKey, 1).should.be.rejectedWith(EVMRevert);
  });

  it('Add claim by identity deployer must be succesfull', async () => {
    const tx = await claimHolder.addClaim(2, 1, accounts[6], '0x2454', '0x12', '', { from: accounts[0] }).should.be.fulfilled;
    log(`[${calculateETH(tx.receipt.gasUsed)}] --> GAS fees used to add a Claim`);
  });

  it('Add claim should fail if triggered by non-owner', async () => {
    await claimHolder.addClaim(2, 1, accounts[6], '0x2454', '0x12', '', { from: accounts[1] }).should.be.rejectedWith(EVMRevert);
  });

  it('Add claim should fail if sender does not have management key', async () => {
    await claimHolder.removeKey(key, 1);
    await claimHolder.addClaim(2, 1, accounts[6], '0x2454', '0x12', '').should.be.rejectedWith(EVMRevert);
  });

  it('Remove claim must be succesful if the claimId provided is present', async () => {
    const claimId = web3.utils.keccak256(web3.eth.abi.encodeParameters(['address', 'uint'], [accounts[5], 1]));
    const tx = await claimHolder.removeClaim(claimId).should.be.fulfilled;
    log(`[${calculateETH(tx.receipt.gasUsed)}] --> GAS fees used to remove a Claim`);
  });

  it('Remove claim must fail if triggered by non-owner', async () => {
    const claimId = web3.utils.keccak256(web3.eth.abi.encodeParameters(['address', 'uint'], [accounts[5], 1]));
    await claimHolder.removeClaim(claimId, { from: accounts[1] }).should.be.rejectedWith(EVMRevert);
  });
});
