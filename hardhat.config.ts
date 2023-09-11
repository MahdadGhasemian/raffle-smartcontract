// ** Imports
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "./tasks/block-number";
import "./tasks/accounts";
import "./tasks/reset";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-deploy";

// ** Read evns
dotenv.config();

// ** Variables
const SOLIDITY_VERSION = String(process.env.SOLIDITY_VERSION);
const LOCAL_RPC_URL = process.env.LOCAL_RPC_URL;
const LOCAL_PRIVATE_KEY = String(process.env.LOCAL_PRIVATE_KEY);
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const SEPOLIA_PRIVATE_KEY = String(process.env.SEPOLIA_PRIVATE_KEY);
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const COINMARKET_API_KEY = process.env.COINMARKET_API_KEY;

/**
 * Hardhat Config
 */
const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: SOLIDITY_VERSION,
      },
      {
        version: "0.8.0",
      },
      {
        version: "0.4.24",
      },
    ],
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      // Thanks Hardhat!
      chainId: 31337,
      saveDeployments: true,
    },
    localhost: {
      url: `${LOCAL_RPC_URL}`,
      accounts: [LOCAL_PRIVATE_KEY],
      saveDeployments: true,
      chainId: 1337,
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
      saveDeployments: true,
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: true,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    coinmarketcap: COINMARKET_API_KEY,
    // token: "MATIC",
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    },
    player: {
      default: 1,
    },
  },
  mocha: {
    timeout: 300000, // 300 seconds max for running tests
  },
};

export default config;
