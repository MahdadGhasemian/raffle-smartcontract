// ** Imports
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { Raffle, VRFCoordinatorV2Mock } from "../../typechain-types";
import { Deployment } from "hardhat-deploy/types";
import fetchDataEvent from "../../utils/fetchDataEvent";
import { ethers as etherssthers } from "ethers";

/**
 *
 */
!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle", function () {
      /* Variables */
      let RaffleDeployment: Deployment;
      let VRFCoordinatorV2MockDeployment: Deployment;
      let raffle: Raffle;
      let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
      let player: SignerWithAddress;
      let raffleEntranceFee: string;
      let interval: string;
      let accounts: SignerWithAddress[];

      /**
       *
       */
      beforeEach(async () => {
        accounts = await ethers.getSigners();
        player = accounts[0];
        const allDeployment = await deployments.fixture(["all"]);
        RaffleDeployment = allDeployment.Raffle;
        VRFCoordinatorV2MockDeployment = allDeployment.VRFCoordinatorV2Mock;
        raffle = await ethers.getContractAt("Raffle", RaffleDeployment.address);
        vrfCoordinatorV2Mock = await ethers.getContractAt(
          "VRFCoordinatorV2Mock",
          VRFCoordinatorV2MockDeployment.address
        );

        raffleEntranceFee = (await raffle.getEntranceFee()).toString();
        interval = (await raffle.getInterval()).toString();
      });

      /**
       *
       */
      describe("constructor", async () => {
        it("Initializes the raffle correctly", async () => {
          const raffleState = (await raffle.getRaffleState()).toString();
          assert.equal(raffleState, "0");
          assert.equal(
            interval,
            networkConfig[network.name]["keepersUpdateInterval"]
          );
        });
      });

      /**
       *
       */
      describe("enterRaffle", function () {
        it("reverts when you don't pay enough", async () => {
          await expect(raffle.enterRaffle()).to.be.rejectedWith(
            "Raffle__SendMoreToEnterRaffle"
          );
        });
        it("records player when they enter", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          const contractPlayer = await raffle.getPlayer(0);
          assert.equal(player.address, contractPlayer);
        });
        it("emits event on enter", async () => {
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee })
          ).to.emit(raffle, "RaffleEnter");
        });
        it("doesn't allow entrance when raffle is calculating", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });

          // we pretend to be a keeper for a second
          await raffle.performUpkeep("0x");
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee })
          ).to.be.rejectedWith("Raffle__RaffleNotOpen");
        });
      });

      /**
       *
       */
      describe("checkUpkeep", async () => {
        it("returns false if people haven't sent any ETH", async () => {
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const { upkeepNeeded } = await raffle.checkUpkeep("0x");
          assert(!upkeepNeeded);
        });
        it("returns false if raffle isn't open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          await raffle.performUpkeep("0x");
          const raffleState = await raffle.getRaffleState();
          const { upkeepNeeded } = await raffle.checkUpkeep("0x");
          assert.equal(raffleState.toString() == "1", upkeepNeeded == false);
        });
        it("returns false if enough time hasn't passed", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) - 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.checkUpkeep("0x");
          assert(!upkeepNeeded);
        });
        it("returns true if enough time has passed, has players, eth, and is open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.checkUpkeep("0x");
          assert(upkeepNeeded);
        });
      });

      /**
       *
       */
      describe("performUpkeep", function () {
        it("can only run if checkupkeep is true", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const tx = await raffle.performUpkeep("0x");
          assert(tx);
        });
        it("reverts if checkup is false", async () => {
          await expect(raffle.performUpkeep("0x")).to.be.rejectedWith(
            "Raffle__UpkeepNotNeeded"
          );
        });
        it("updates the raffle state and emits a requestId", async () => {
          // Too many asserts in this test!
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const txResponse = await raffle.performUpkeep("0x");
          const txReceipt = await txResponse.wait(1);
          const raffleState = await raffle.getRaffleState();

          // const requestId = txReceipt!.events![1].args!.requestId;
          const requestId = fetchDataEvent(
            RaffleDeployment.abi,
            txReceipt,
            "RequestedRaffleWinner",
            0
          );

          assert(Number(requestId) > 0);
          assert(raffleState == ethers.toBigInt("1"));
        });
      });

      /**
       *
       */
      describe("fulfillRandomWords", function () {
        beforeEach(async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
        });
        it("can only be called after performupkeep", async () => {
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, RaffleDeployment.address)
          ).to.be.rejectedWith("nonexistent request");
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(1, RaffleDeployment.address)
          ).to.be.rejectedWith("nonexistent request");
        });
        // This test is too big...
        it("picks a winner, resets, and sends money", async () => {
          const additionalEntrances = 3;
          const startingIndex = 2;
          const startingBalance = await ethers.provider.getBalance(accounts[2]);
          for (
            let i = startingIndex;
            i < startingIndex + additionalEntrances;
            i++
          ) {
            raffle = await ethers.getContractAt(
              "Raffle",
              RaffleDeployment.address,
              accounts[i]
            );
            await raffle.enterRaffle({ value: raffleEntranceFee });
          }
          const startingTimeStamp = await raffle.getLastTimeStamp();

          await new Promise<void>(async (resolve, reject) => {
            // @ts-ignore
            raffle.on("WinnerPicked", async () => {
              console.log("WinnerPicked event fired!");
              try {
                // Now lets get the ending values...
                const recentWinner = await raffle.getRecentWinner();
                const raffleState = await raffle.getRaffleState();
                const winnerBalance = await ethers.provider.getBalance(
                  accounts[2]
                );
                const endingTimeStamp = await raffle.getLastTimeStamp();
                await expect(raffle.getPlayer(0)).to.be.reverted;
                assert.equal(recentWinner.toString(), accounts[2].address);
                assert.equal(raffleState.toString(), "0");
                assert(BigInt(winnerBalance) > BigInt(startingBalance));
                assert(endingTimeStamp > startingTimeStamp);
                resolve();
              } catch (e) {
                reject(e);
              }
            });

            const tx = await raffle.performUpkeep("0x");
            const txReceipt = await tx.wait(1);
            const requestId = fetchDataEvent(
              RaffleDeployment.abi,
              txReceipt,
              "RequestedRaffleWinner",
              0
            );
            await vrfCoordinatorV2Mock.fulfillRandomWords(
              requestId,
              RaffleDeployment.address
            );
          });
        });
      });
    });
