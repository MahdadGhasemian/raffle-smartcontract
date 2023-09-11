// ** Imports
import { task } from "hardhat/config";

/**
 * accounts
 * * Example: npx hardhat reset
 */
task("reset", "Hardhat Reset").setAction(async (taskArgs, hre) => {
  await hre.network.provider.send("hardhat_reset");
});
