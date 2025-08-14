import { ethers } from "hardhat";

export async function deployComplianceFixture() {
  const [deployer, aliceWallet, bobWallet, anotherWallet] =
    await ethers.getSigners();

  const compliance = await ethers.deployContract("ModularCompliance");
  await compliance.init();

  return {
    accounts: {
      deployer,
      aliceWallet,
      bobWallet,
      anotherWallet,
    },
    suite: {
      compliance,
    },
  };
}
