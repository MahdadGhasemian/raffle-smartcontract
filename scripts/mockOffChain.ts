import { deployments, ethers, network } from "hardhat";
import { Raffle, VRFCoordinatorV2Mock } from "../typechain-types";
import fetchDataEvent from "../utils/fetchDataEvent";
import { Address } from "hardhat-deploy/types";

async function mockKeepers() {
  const RaffleDeployment = await deployments.get("Raffle");
  const RaffleAddress = RaffleDeployment.address;
  const raffle = await ethers.getContractAt("Raffle", RaffleAddress);

  const VRFCoordinatorV2MockDeployment = await deployments.get(
    "VRFCoordinatorV2Mock"
  );
  const VRFCoordinatorV2MockAddress = VRFCoordinatorV2MockDeployment.address;
  const vrfCoordinatorV2Mock = await ethers.getContractAt(
    "VRFCoordinatorV2Mock",
    VRFCoordinatorV2MockAddress
  );

  const checkData = ethers.keccak256(ethers.toUtf8Bytes(""));
  const { upkeepNeeded } = await raffle.checkUpkeep(checkData);
  console.log({ upkeepNeeded });

  if (upkeepNeeded) {
    const tx = await raffle.performUpkeep(checkData);
    const txReceipt = await tx.wait(1);
    // const requestId = txReceipt.events![1].args!.requestId;
    const requestId = fetchDataEvent(
      RaffleDeployment.abi,
      txReceipt,
      "RequestedRaffleWinner",
      0
    );

    console.log(`Performed upkeep with RequestId: ${requestId}`);
    // if (network.config.chainId == 31337) {
    await mockVrf(requestId, raffle, RaffleAddress, vrfCoordinatorV2Mock);
    // }
  } else {
    console.log("No upkeep needed!");
  }
}

async function mockVrf(
  requestId: any,
  raffle: Raffle,
  RaffleAddress: Address,
  vrfCoordinatorV2Mock: VRFCoordinatorV2Mock
) {
  console.log("We on a local network? Ok let's pretend...");
  await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, RaffleAddress);
  console.log("Responded!");
  const recentWinner = await raffle.getRecentWinner();
  console.log(`The winner is: ${recentWinner}`);
}

mockKeepers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
