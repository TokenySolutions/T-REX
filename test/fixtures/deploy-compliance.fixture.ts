import { ethers } from 'hardhat';

export async function deployComplianceFixture() {
  const [deployer, anotherWallet] = await ethers.getSigners();

  const compliance = await ethers.deployContract('ModularCompliance');
  await compliance.init();

  return {
    accounts: {
      deployer,
      anotherWallet,
    },
    suite: {
      compliance,
    },
  };
}
