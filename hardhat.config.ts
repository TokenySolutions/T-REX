import '@xyrusworx/hardhat-solidity-json';
import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';
import 'solidity-coverage';
import '@nomiclabs/hardhat-solhint';
import '@primitivefi/hardhat-dodoc';
import '@nomiclabs/hardhat-etherscan';
import * as dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  gasReporter: {
    enabled: true,
  },
  dodoc: {
    runOnCompile: false,
    debugMode: true,
    outputDir: './docgen',
    freshOutput: true,
  },
  networks: {
    mumbai: {
      url: process.env.MUMBAI_RPC_URL,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL,
    },
    fuji: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      chainId: 43113,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    },
    avalanche: {
      url: process.env.AVALANCHE_RPC_URL,
      chainId: 43114,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_API_KEY!,
      polygon: process.env.POLYGONSCAN_API_KEY!,
      avalancheFujiTestnet: 'fuji',
      avalanche: 'avalanche',
      sepolia: process.env.ETHERSCAN_API_KEY!,
    },
  },
};

export default config;
