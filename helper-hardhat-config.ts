import { ethers } from "hardhat";

export interface networkConfigItem {
  subscriptionId?: string;
  gasLane?: string;
  keepersUpdateInterval?: string;
  raffleEntranceFee?: string;
  callbackGasLimit?: string;
  vrfCoordinatorV2?: string;
}

export interface networkConfigInfo {
  [key: string]: networkConfigItem;
}

export const networkConfig: networkConfigInfo = {
  localhost: {
    subscriptionId: "4921",
    gasLane:
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // 30 gwei
    keepersUpdateInterval: "30",
    raffleEntranceFee: ethers.parseEther("0.01").toString(), // 0.01 ETH
    callbackGasLimit: "500000", // 500,000 gas
  },
  hardhat: {
    subscriptionId: "4921",
    gasLane:
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // 30 gwei
    keepersUpdateInterval: "30",
    raffleEntranceFee: ethers.parseEther("0.01").toString(), // 0.01 ETH
    callbackGasLimit: "500000", // 500,000 gas
  },
  // Doc: https://docs.chain.link/vrf/v2/subscription/supported-networks#sepolia-testnet
  sepolia: {
    subscriptionId: "4921",
    gasLane:
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // 30 gwei
    keepersUpdateInterval: "30",
    raffleEntranceFee: ethers.parseEther("0.01").toString(), // 0.01 ETH
    callbackGasLimit: "500000", // 500,000 gas
    vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
  },
};

export const developmentChains = ["hardhat", "localhost"];
export const developmentLocalNetworkNameOnMetaMask: {
  [key: string]: string;
  hardhat: string;
  localhost: string;
  sepolia: string;
} = {
  hardhat: "chain 31337",
  localhost: "chain 1337",
  sepolia: "chain 11155111",
};
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6;
export const frontEndContractsFile =
  "../raffle-ui/src/constants/contractAddresses.json";
export const frontEndAbiFile = "../raffle-ui/src/constants/abi.json";
