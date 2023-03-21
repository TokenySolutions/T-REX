const Identity = artifacts.require('@onchain-id/solidity/contracts/Identity.sol');
const IdentityImplementation = artifacts.require('@onchain-id/solidity/contracts/proxy/ImplementationAuthority.sol');
const onchainid = require('@onchain-id/solidity');

async function deployIdentityProxy(identityIssuer) {
  const identityImplementation = await Identity.new(identityIssuer, true, { from: identityIssuer });
  const implementation = await IdentityImplementation.new(identityImplementation.address);

  const contractProxy = new web3.eth.Contract(onchainid.contracts.IdentityProxy.abi);

  const proxy = contractProxy
    .deploy({
      data: onchainid.contracts.IdentityProxy.bytecode,
      arguments: [implementation.address, identityIssuer],
    })
    .send({
      from: identityIssuer,
      gas: 3000000,
      gasPrice: '80000000',
    })
    .then(
      (newContractInstance) => newContractInstance.options.address, // instance with the new contract address
    );
  return Identity.at(await proxy);
}

module.exports = {
  deployIdentityProxy,
};
