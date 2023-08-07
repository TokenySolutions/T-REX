import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';

async function deployTimeTransferLimitsFixture() {
  const context = await loadFixture(deployComplianceFixture);

  const complianceModule = await ethers.deployContract('TimeTransfersLimitsModule');
  await context.suite.compliance.addModule(complianceModule.address);

  return {
    ...context,
    contracts: {
      ...context.suite,
      complianceModule,
    },
  };
}

describe.only('Compliance Module: TimeTransferLimits', () => {
  it('should deploy the TimeTransferLimits contract and bind it to the compliance', async () => {
    const context = await loadFixture(deployTimeTransferLimitsFixture);

    expect(context.contracts.complianceModule.address).not.to.be.undefined;
    expect(await context.contracts.compliance.isModuleBound(context.contracts.complianceModule.address)).to.be.true;
  });

  describe('.addDailyLimit', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTimeTransferLimitsFixture);

        await expect(context.contracts.complianceModule.addDailyLimit(1000)).to.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling via compliance', () => {
      it('should add a new limit', async () => {
        const context = await loadFixture(deployTimeTransferLimitsFixture);

        const tx = await context.contracts.compliance.callModuleFunction(
          new ethers.utils.Interface(['function addTimeTransferLimit(uint256 dailyLimit)']).encodeFunctionData('addTimeTransferLimit', [1000]),
          context.contracts.complianceModule.address,
        );

        await expect(tx).to.emit(context.contracts.complianceModule, 'DailyLimitAdded').withArgs(1000);
      });
    });
  });

  describe('.moduleCheck', () => {
    describe('when transfer is breaking daily limits', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTimeTransferLimitsFixture);

        expect(
          await context.contracts.complianceModule.moduleCheck(
            context.accounts.aliceWallet.address,
            context.accounts.bobWallet.address,
            100,
            context.contracts.compliance.address,
          ),
        ).to.be.false;
      });
    });
  });
});
