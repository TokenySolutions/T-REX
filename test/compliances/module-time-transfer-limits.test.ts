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

        await expect(context.contracts.complianceModule.setTimeTransferLimit({ limitTime: 1, limitValue: 100 })).to.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling via compliance', () => {
      describe('when there is already a limit for a given time', () => {
        it('should update the limit', async () => {
          const context = await loadFixture(deployTimeTransferLimitsFixture);

          await context.contracts.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint16 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
              'setTimeTransferLimit',
              [{ limitTime: 1, limitValue: 100 }],
            ),
            context.contracts.complianceModule.address,
          );
          const tx = await context.contracts.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint16 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
              'setTimeTransferLimit',
              [{ limitTime: 1, limitValue: 50 }],
            ),
            context.contracts.complianceModule.address,
          );

          await expect(tx)
            .to.emit(context.contracts.complianceModule, 'TimeTransferLimitAdded')
            .withArgs(context.contracts.compliance.address, 1, 50);
        });
      });

      describe('When there are no limits for this time', () => {
        describe('when there are already 4 limits', () => {
          it('should revert', async () => {
            const context = await loadFixture(deployTimeTransferLimitsFixture);

            await context.contracts.compliance.callModuleFunction(
              new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint16 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
                'setTimeTransferLimit',
                [{ limitTime: 1, limitValue: 100 }],
              ),
              context.contracts.complianceModule.address,
            );
            await context.contracts.compliance.callModuleFunction(
              new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint16 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
                'setTimeTransferLimit',
                [{ limitTime: 7, limitValue: 1000 }],
              ),
              context.contracts.complianceModule.address,
            );
            await context.contracts.compliance.callModuleFunction(
              new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint16 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
                'setTimeTransferLimit',
                [{ limitTime: 30, limitValue: 10000 }],
              ),
              context.contracts.complianceModule.address,
            );
            await context.contracts.compliance.callModuleFunction(
              new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint16 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
                'setTimeTransferLimit',
                [{ limitTime: 365, limitValue: 100000 }],
              ),
              context.contracts.complianceModule.address,
            );
            await expect(
              context.contracts.compliance.callModuleFunction(
                new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint16 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
                  'setTimeTransferLimit',
                  [{ limitTime: 3650, limitValue: 1000000 }],
                ),
                context.contracts.complianceModule.address,
              ),
            ).to.be.revertedWithCustomError(context.contracts.complianceModule, `LimitsArraySizeExceeded`);
          });
        });

        describe('when there is not already a limit for the given time', () => {
          it('should add a new limit', async () => {
            const context = await loadFixture(deployTimeTransferLimitsFixture);

            const tx = await context.contracts.compliance.callModuleFunction(
              new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint16 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
                'setTimeTransferLimit',
                [{ limitTime: 1, limitValue: 100 }],
              ),
              context.contracts.complianceModule.address,
            );

            await expect(tx)
              .to.emit(context.contracts.complianceModule, 'TimeTransferLimitAdded')
              .withArgs(context.contracts.compliance.address, 1, 100);
          });
        });
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
