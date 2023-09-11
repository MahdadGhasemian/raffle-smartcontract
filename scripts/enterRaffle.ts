import { deployments, ethers } from "hardhat";

async function enterRaffle() {
  const RaffleDeployment = await deployments.get("Raffle");
  const RaffleAddress = RaffleDeployment.address;
  console.log({ RaffleAddress });
  const raffle = await ethers.getContractAt("Raffle", RaffleAddress);

  const entranceFee = await raffle.getEntranceFee();
  await raffle.enterRaffle({ value: entranceFee + BigInt(1) });
  const allPlayersCount = await raffle.getNumberOfPlayers();
  console.log(`Entered! - All Players: ${allPlayersCount}`);
}

enterRaffle()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
