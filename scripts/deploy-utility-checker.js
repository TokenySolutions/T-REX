const hre = require("hardhat");

async function main() {
  const UtilityChecker = await hre.ethers.getContractFactory("UtilityChecker");
  const utilityChecker = await UtilityChecker.deploy();

  await utilityChecker.waitForDeployment();

  const address = await utilityChecker.getAddress();
  console.log("UtilityChecker deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
