import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import verify from "../utils/verify";
import {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} from "../helper-hardhat-config";
import fetchDataEvent from "../utils/fetchDataEvent";
import { ethers } from "ethers";

const VRF_SUB_FUND_AMOUNT = ethers.parseEther("1");

const deployRaffle: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network, ethers } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId: number = network.config.chainId!;
  const networkName = network.name;
  let vrfCoordinatorV2Address: string | undefined,
    subscriptionId: string | undefined;

  if (developmentChains.includes(networkName)) {
    const vrfCoordinatorV2MockDeployment = await deployments.get(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorV2Address = vrfCoordinatorV2MockDeployment.address;
    const vrfCoordinatorV2Mock = await ethers.getContractAt(
      "VRFCoordinatorV2Mock",
      vrfCoordinatorV2Address
    );
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait(1);

    subscriptionId = fetchDataEvent(
      vrfCoordinatorV2MockDeployment.abi,
      transactionReceipt,
      "SubscriptionCreated",
      0
    );

    // Fund the subscription
    // Our mock makes it so we don't actually have to worry about sending fund
    if (subscriptionId) {
      const subscriptionIdValue: ethers.BigNumberish = subscriptionId;

      await vrfCoordinatorV2Mock.fundSubscription(
        subscriptionIdValue,
        VRF_SUB_FUND_AMOUNT
      );
    }
  } else {
    vrfCoordinatorV2Address = networkConfig[networkName].vrfCoordinatorV2!;
    subscriptionId = networkConfig[networkName]["subscriptionId"];
  }

  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS;

  log("----------------------------------------------------");
  log("Deploying Raffle and waiting for confirmations...");
  const args: any[] = [
    vrfCoordinatorV2Address,
    subscriptionId,
    networkConfig[networkName]["gasLane"],
    networkConfig[networkName]["keepersUpdateInterval"],
    networkConfig[networkName]["raffleEntranceFee"],
    networkConfig[networkName]["callbackGasLimit"],
  ];
  const raffle = await deploy("Raffle", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  });

  log(`Raffle deployed at ${raffle.address}`);
  if (
    !developmentChains.includes(networkName) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(raffle.address, args);
  }
};
export default deployRaffle;
deployRaffle.tags = ["all", "raffle"];
