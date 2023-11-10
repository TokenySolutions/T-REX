import { ethers } from 'hardhat';

// eslint-disable-next-line import/prefer-default-export
export async function deployComplianceFixture() {
  const [deployer, aliceWallet, bobWallet, anotherWallet] = await ethers.getSigners();

  const compliance = await ethers.deployContract('ModularCompliance');
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
