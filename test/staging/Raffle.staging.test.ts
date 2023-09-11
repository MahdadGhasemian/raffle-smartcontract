// ** Imports
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { Raffle, VRFCoordinatorV2Mock } from "../../typechain-types";
import { Deployment } from "hardhat-deploy/types";
import fetchDataEvent from "../../utils/fetchDataEvent";

// ** Variables
const CONTRACT_ADDRESS = String(process.env.CONTRACT_ADDRESS);

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Staging Tests", function () {
      /* Variables */
      let RaffleDeployment: Deployment;
      let raffle: Raffle;
      let raffleEntranceFee: string;
      let deployer: string;
      let contractAddress;

      /**
       *
       */
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        if (CONTRACT_ADDRESS) {
          contractAddress = CONTRACT_ADDRESS;
        } else {
          const allDeployment = await deployments.fixture(["all"]);
          RaffleDeployment = allDeployment.Raffle;
          contractAddress = RaffleDeployment.address;
        }

        console.log({
          contractAddress,
          deployer,
        });
        raffle = await ethers.getContractAt("Raffle", contractAddress);
        raffleEntranceFee = (await raffle.getEntranceFee()).toString();
      });

      /**
       *
       */
      describe("fulfillRandomWords", function () {
        it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async () => {
          const startingTimeStamp = await raffle.getLastTimeStamp();
          const accounts = await ethers.getSigners();

          // Setting up Listerner ...
          await new Promise(async (resolve, reject) => {
            let winnerStartingBalance: bigint;

            // @ts-ignore
            raffle.once("WinnerPicked", async () => {
              console.log("WinnerPicked event fired!");
              try {
                // asserts
                const recentWinner = await raffle.getRecentWinner();
                const raffleState = await raffle.getRaffleState();
                const winnerEndingBalance = await ethers.provider.getBalance(
                  accounts[0]
                );
                const endingTimeStamp = await raffle.getLastTimeStamp();

                await expect(raffle.getPlayer(0)).to.be.rejected;
                assert.equal(recentWinner.toString(), accounts[0].address);
                assert.equal(raffleState.toString(), "0");
                assert.equal(
                  winnerEndingBalance.toString(),
                  (
                    BigInt(winnerStartingBalance) + BigInt(raffleEntranceFee)
                  ).toString()
                );
                assert(endingTimeStamp > startingTimeStamp);
                console.log("Finished");
                resolve("OK");
              } catch (error) {
                console.error(error);
                reject(error);
              }
            });

            // entering the raffle
            console.log("Entering Raffle...");
            const tx = await raffle.enterRaffle({ value: raffleEntranceFee });
            await tx.wait(1);
            winnerStartingBalance = await ethers.provider.getBalance(
              accounts[0]
            );
          });
        });
      });
    });
