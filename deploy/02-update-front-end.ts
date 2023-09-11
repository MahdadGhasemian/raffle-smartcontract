import {
  developmentLocalNetworkNameOnMetaMask,
  frontEndAbiFile,
  frontEndContractsFile,
} from "../helper-hardhat-config";
import fs from "fs";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const UpdateFronEnd = process.env.UPDATE_FRONT_END;

type ContractAddressType = {
  chainId: number;
  networkName: string;
  contractAddress: string;
};

const updateUI: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { network, deployments, ethers } = hre;
  const chainId = network.config.chainId;
  const networkName = network.name;

  if (UpdateFronEnd) {
    console.log("Writing to front end...");

    const RaffleDeployment = await deployments.get("Raffle");
    const RaffleAddress = RaffleDeployment.address;
    const raffle = await ethers.getContractAt("Raffle", RaffleAddress);

    let contractAddresses: Array<ContractAddressType> = JSON.parse(
      fs.readFileSync(frontEndContractsFile, "utf8") || "[]"
    );
    const foundIndex = contractAddresses.findIndex(
      (contract) => contract.networkName === networkName
    );
    const newContract = {
      chainId: chainId!,
      networkName,
      networkName2: developmentLocalNetworkNameOnMetaMask[networkName],
      contractAddress: RaffleAddress,
    };

    if (foundIndex >= 0) {
      contractAddresses[foundIndex] = newContract;
    } else {
      contractAddresses.push(newContract);
    }

    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses));
    fs.writeFileSync(frontEndAbiFile, raffle.interface.formatJson());
    console.log("Front end written!");
  }
};
export default updateUI;
updateUI.tags = ["all", "frontend"];
