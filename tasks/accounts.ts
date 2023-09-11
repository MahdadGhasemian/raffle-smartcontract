// ** Imports
import { task } from "hardhat/config";

/**
 * accounts
 * * Example: npx hardhat accounts
 */
task("accounts", "Prints the list of accounts").setAction(
  async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
      console.log(account.address);
    }
  }
);
