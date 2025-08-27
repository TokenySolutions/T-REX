import '@xyrusworx/hardhat-solidity-json';
import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';
import '@openzeppelin/hardhat-upgrades';
import 'solidity-coverage';
import '@nomiclabs/hardhat-solhint';
import '@primitivefi/hardhat-dodoc';
import "@parity/hardhat-polkadot";
import "@nomicfoundation/hardhat-viem";

require('dotenv').config()
const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: false,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.17"
      }
    ]
  },
  gasReporter: {
    enabled: true,
  },
  dodoc: {
    runOnCompile: false,
    debugMode: true,
    outputDir: "./docgen",
    freshOutput: true,
  },
  resolc: {
    version: "0.3.0",
    compilerSource: "binary",
    settings: {
      emitSourceDebugInfo: true,
      polkaVM: {
        memoryConfig: {
          stackSize: 32768 * 3,
        }
      },
      optimizer: {
        enabled: true,
      },
    }
  },
  networks: {
    hardhat: {
      polkavm: true,
      nodeConfig: {
        nodeBinaryPath: "./polkadot-sdk/target/release/substrate-node",
        rpcPort: 9944,
        dev: true,
      },
      adapterConfig: {
        adapterBinaryPath: './polkadot-sdk/target/release/eth-rpc',
        dev: true,
        adapterPort: 8545
      },
    },
    polkadotHubTestnet: {
      polkavm: true,
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
      accounts: [process.env.PRIVATE_KEY || ''],
    },
    westend: {
      polkavm: true,
      url: "https://westend-asset-hub-eth-rpc.polkadot.io",
      accounts: [process.env.PRIVATE_KEY || ''],
    },
    assetHub: {
      polkavm: true,
      url: "http://localhost:8545",
      accounts: [process.env.PRIVATE_KEY || ''],
    },
  },
};

export default config;
