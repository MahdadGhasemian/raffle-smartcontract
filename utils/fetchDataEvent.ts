import { ContractTransactionReceipt } from "ethers";
import { ethers } from "hardhat";
import { ABI } from "hardhat-deploy/types";

const fetchDataEvent = (
  abi: ABI,
  transactionReceipt: ContractTransactionReceipt | null,
  logName: string,
  argIndex: number
) => {
  const iface = new ethers.Interface(abi);

  if (transactionReceipt) {
    for (const log of transactionReceipt.logs) {
      const mutableTopics = [...log.topics];
      const parsedLog = iface?.parseLog({
        topics: mutableTopics,
        data: log.data,
      });

      if (parsedLog && parsedLog.name === logName) {
        return parsedLog?.args[argIndex]?.toString();
      }
    }
  }
};

export default fetchDataEvent;
