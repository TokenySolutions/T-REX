import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';

async function deployTimeTransferLimitsFixture() {
  const [deployer, owner] = await ethers.getSigners();

  const complianceModule = await ethers.deployContract('TimeTransfersLimitsModule');

  return {
    accounts: {
      deployer,
      owner,
    },
    contracts: {
      complianceModule,
    },
  };
}

describe.only('Compliance Module: TimeTransferLimits', () => {
  it('should deploy the TimeTransferLimits contract', async () => {
    const context = await loadFixture(deployTimeTransferLimitsFixture);

    await expect(context.contracts.complianceModule.address).not.to.be.undefined;
  });
});
