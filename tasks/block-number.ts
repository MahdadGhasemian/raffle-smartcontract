// ** Imports
import { task } from "hardhat/config";

/**
 * block-number
 * * Example: npx hardhat block-number
 */
task("block-number", "Prints the current block number").setAction(
  async (taskArgs, hre) => {
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log(`Current block number: ${blockNumber}`);
  }
);
