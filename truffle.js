module.exports = {
  networks: {
    "development": {
      host: "localhost",
      port: 8545,
      network_id: "*", // eslint-disable-line camelcase
      gas: 6721975,
      // gasPrice: 0x01
    },
    "coverage": {
      host: "localhost",
      network_id: "*", // eslint-disable-line camelcase
      port: 8555,
      gas: 0xffffffffff,
      gasPrice: 0x01
    },
    "testrpc": {
      host: "localhost",
      port: 8545,
      network_id: "*", // eslint-disable-line camelcase
      gas: 0xffffffffff,
      // gasPrice: 0x01
    },
    "ganache": {
      host: "localhost",
      port: 7545,
      network_id: "*",// eslint-disable-line camelcase
      gas: 0xffffffffff,
      // gasPrice: 0x01
    },
    //   "rinkeby": {
    //     network_id: 4,
    //     provider: engine,
    //     from: address,
    //     // gas: 8000000,
    //     // gasPrice: 0
    //   },
    //   "ropsten": {
    //     network_id: 3,
    //     provider: engine,
    //     from: address,
    //     // gas: 8000000,
    //     // gasPrice: 0
    //   },
    //   "mainnet": {
    //     network_id: 1,
    //     provider: engine,
    //     from: address,
    //     // gas: 8000000,
    //     // gasPrice: 0
    //   }
    // }
  },
  compilers: {
    solc: {
      version: '0.5.10'
    },
  },
};
