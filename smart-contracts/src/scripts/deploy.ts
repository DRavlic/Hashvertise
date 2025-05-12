import { ethers } from "hardhat";

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log("Deploying Hashvertise contract on network:", network.name);

  const hashvertise = await ethers.deployContract("Hashvertise");
  await hashvertise.waitForDeployment();

  const address = await hashvertise.getAddress();
  console.log(`Hashvertise deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
