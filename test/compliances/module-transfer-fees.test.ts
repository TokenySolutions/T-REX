import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';
import { deploySuiteWithModularCompliancesFixture } from '../fixtures/deploy-full-suite.fixture';

async function deployTransferFeesFixture() {
  const context = await loadFixture(deployComplianceFixture);

  const complianceModule = await ethers.deployContract('TransferFeesModule');
  await context.suite.compliance.addModule(complianceModule.address);

  return {
    ...context,
    contracts: {
      ...context.suite,
      complianceModule,
    },
  };
}

async function deployTransferFeesFullSuite() {
  const context = await loadFixture(deploySuiteWithModularCompliancesFixture);
  const complianceModule = await ethers.deployContract('TransferFeesModule');
  await context.suite.compliance.bindToken(context.suite.token.address);
  await context.suite.compliance.addModule(complianceModule.address);

  const identity = await context.suite.identityRegistry.identity(context.accounts.aliceWallet.address);
  await context.suite.identityRegistry.connect(context.accounts.tokenAgent).registerIdentity(context.accounts.charlieWallet.address, identity, 0);

  return {
    ...context,
    suite: {
      ...context.suite,
      complianceModule,
    },
  };
}

describe.only('Compliance Module: TransferFees', () => {
  it('should deploy the TransferFees contract and bind it to the compliance', async () => {
    const context = await loadFixture(deployTransferFeesFixture);

    expect(context.contracts.complianceModule.address).not.to.be.undefined;
    expect(await context.contracts.compliance.isModuleBound(context.contracts.complianceModule.address)).to.be.true;
  });

  describe('.setFee', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferFeesFullSuite);
        const collector = context.accounts.anotherWallet.address;

        await expect(
          context.suite.complianceModule.connect(context.accounts.anotherWallet).setFee(context.suite.compliance.address, 1, collector),
        ).to.revertedWith('only token owner can call');
      });
    });

    describe('when calling as token owner', () => {
      describe('when rate is greater than the max', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployTransferFeesFullSuite);
          const collector = context.accounts.anotherWallet.address;

          await expect(context.suite.complianceModule.setFee(context.suite.compliance.address, 10001, collector)).to.be.revertedWithCustomError(
            context.suite.complianceModule,
            `FeeRateIsOutOfRange`,
          );
        });
      });

      describe('when collector address is null', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployTransferFeesFullSuite);
          const collector = '0x0000000000000000000000000000000000000000';

          await expect(context.suite.complianceModule.setFee(context.suite.compliance.address, 1, collector)).to.be.revertedWithCustomError(
            context.suite.complianceModule,
            `InvalidFeeCollectorAddress`,
          );
        });
      });

      describe('when collector address is not verified', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployTransferFeesFullSuite);
          const collector = context.accounts.anotherWallet.address;

          await expect(context.suite.complianceModule.setFee(context.suite.compliance.address, 1, collector)).to.be.revertedWithCustomError(
            context.suite.complianceModule,
            `CollectorAddressIsNotVerified`,
          );
        });
      });

      describe('when collector address is verified', () => {
        it('should set the fee', async () => {
          const context = await loadFixture(deployTransferFeesFullSuite);
          const collector = context.accounts.aliceWallet.address;

          const tx = await context.suite.complianceModule.setFee(context.suite.compliance.address, 1, collector);

          await expect(tx).to.emit(context.suite.complianceModule, 'FeeUpdated').withArgs(context.suite.compliance.address, 1, collector);

          const fee = await context.suite.complianceModule.getFee(context.suite.compliance.address);
          expect(fee.rate).to.be.eq(1);
          expect(fee.collector).to.be.eq(collector);
        });
      });
    });
  });

  describe('.getFee', () => {
    it('should return the fee', async () => {
      const context = await loadFixture(deployTransferFeesFullSuite);
      const collector = context.accounts.aliceWallet.address;
      await context.suite.complianceModule.setFee(context.suite.compliance.address, 1, collector);

      const fee = await context.suite.complianceModule.getFee(context.suite.compliance.address);
      expect(fee.rate).to.be.eq(1);
      expect(fee.collector).to.be.eq(collector);
    });
  });

  describe('.canComplianceBind', () => {
    describe('when the module is not registered as a token agent', () => {
      it('should return false', async () => {
        const context = await loadFixture(deployTransferFeesFullSuite);
        const result = await context.suite.complianceModule.canComplianceBind(context.suite.compliance.address);
        expect(result).to.be.false;
      });
    });

    describe('when the module is registered as a token agent', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTransferFeesFullSuite);
        await context.suite.token.addAgent(context.suite.complianceModule.address);
        const result = await context.suite.complianceModule.canComplianceBind(context.suite.compliance.address);
        expect(result).to.be.true;
      });
    });
  });

  describe('.moduleTransferAction', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferFeesFullSuite);
        const from = context.accounts.aliceWallet.address;
        const to = context.accounts.bobWallet.address;

        await expect(context.suite.complianceModule.moduleTransferAction(from, to, 10)).to.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling via compliance', () => {
      describe('when from is null address', () => {
        it('should do nothing', async () => {
          const context = await loadFixture(deployTransferFeesFullSuite);
          await context.suite.token.addAgent(context.suite.complianceModule.address);
          const collector = context.accounts.charlieWallet.address;
          await context.suite.complianceModule.setFee(context.suite.compliance.address, 1000, collector);

          const from = '0x0000000000000000000000000000000000000000';
          const to = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 80],
            ),
            context.suite.complianceModule.address,
          );

          const collectedAmount = await context.suite.token.balanceOf(collector);
          expect(collectedAmount).to.be.eq(0);
        });
      });

      describe('when to is null address', () => {
        it('should do nothing', async () => {
          const context = await loadFixture(deployTransferFeesFullSuite);
          await context.suite.token.addAgent(context.suite.complianceModule.address);
          const collector = context.accounts.charlieWallet.address;
          await context.suite.complianceModule.setFee(context.suite.compliance.address, 1000, collector);

          const from = context.accounts.bobWallet.address;
          const to = '0x0000000000000000000000000000000000000000';

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 80],
            ),
            context.suite.complianceModule.address,
          );

          const collectedAmount = await context.suite.token.balanceOf(collector);
          expect(collectedAmount).to.be.eq(0);
        });
      });

      describe('when from and to belong to the same identity', () => {
        it('should do nothing', async () => {
          const context = await loadFixture(deployTransferFeesFullSuite);
          await context.suite.token.addAgent(context.suite.complianceModule.address);
          const collector = context.accounts.charlieWallet.address;
          await context.suite.complianceModule.setFee(context.suite.compliance.address, 1000, collector);

          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.anotherWallet.address;
          const identity = await context.suite.identityRegistry.identity(from);
          await context.suite.identityRegistry.connect(context.accounts.tokenAgent).registerIdentity(to, identity, 0);

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 80],
            ),
            context.suite.complianceModule.address,
          );

          const collectedAmount = await context.suite.token.balanceOf(collector);
          expect(collectedAmount).to.be.eq(0);
        });
      });

      describe('when fee is zero', () => {
        it('should do nothing', async () => {
          const context = await loadFixture(deployTransferFeesFullSuite);
          await context.suite.token.addAgent(context.suite.complianceModule.address);
          const collector = context.accounts.charlieWallet.address;
          await context.suite.complianceModule.setFee(context.suite.compliance.address, 0, collector);

          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 80],
            ),
            context.suite.complianceModule.address,
          );

          const collectedAmount = await context.suite.token.balanceOf(collector);
          expect(collectedAmount).to.be.eq(0);
        });
      });

      describe('when sender is the collector', () => {
        it('should do nothing', async () => {
          const context = await loadFixture(deployTransferFeesFullSuite);
          await context.suite.token.addAgent(context.suite.complianceModule.address);
          const collector = context.accounts.charlieWallet.address;
          await context.suite.complianceModule.setFee(context.suite.compliance.address, 1000, collector);

          const to = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [collector, to, 80],
            ),
            context.suite.complianceModule.address,
          );

          const collectedAmount = await context.suite.token.balanceOf(collector);
          expect(collectedAmount).to.be.eq(0);
        });
      });

      describe('when receiver is the collector', () => {
        it('should do nothing', async () => {
          const context = await loadFixture(deployTransferFeesFullSuite);
          await context.suite.token.addAgent(context.suite.complianceModule.address);
          const collector = context.accounts.charlieWallet.address;
          await context.suite.complianceModule.setFee(context.suite.compliance.address, 1000, collector);

          const from = context.accounts.bobWallet.address;
          await context.suite.token.connect(context.accounts.tokenAgent).mint(collector, 5000);

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, collector, 80],
            ),
            context.suite.complianceModule.address,
          );

          const collectedAmount = await context.suite.token.balanceOf(collector);
          expect(collectedAmount).to.be.eq(5000);
        });
      });

      describe('when calculated fee amount is zero', () => {
        it('should do nothing', async () => {
          const context = await loadFixture(deployTransferFeesFullSuite);
          await context.suite.token.addAgent(context.suite.complianceModule.address);
          const collector = context.accounts.charlieWallet.address;
          await context.suite.complianceModule.setFee(context.suite.compliance.address, 1, collector);

          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 80],
            ),
            context.suite.complianceModule.address,
          );

          const collectedAmount = await context.suite.token.balanceOf(collector);
          expect(collectedAmount).to.be.eq(0);
        });
      });

      describe('when calculated fee amount is higher than zero', () => {
        it('should transfer the fee amount', async () => {
          const context = await loadFixture(deployTransferFeesFullSuite);
          await context.suite.token.addAgent(context.suite.complianceModule.address);
          const collector = context.accounts.charlieWallet.address;
          await context.suite.complianceModule.setFee(context.suite.compliance.address, 1000, collector);

          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 80],
            ),
            context.suite.complianceModule.address,
          );

          const collectedAmount = await context.suite.token.balanceOf(collector);
          expect(collectedAmount).to.be.eq(8); // 10% of 80

          const toBalance = await context.suite.token.balanceOf(to);
          expect(toBalance).to.be.eq(492); // it had 500 tokens before
        });
      });
    });
  });

  describe('.moduleMintAction', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferFeesFixture);

        await expect(context.contracts.complianceModule.moduleMintAction(context.accounts.anotherWallet.address, 10)).to.be.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTransferFeesFixture);

        await expect(
          context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleMintAction(address, uint256)']).encodeFunctionData('moduleMintAction', [
              context.accounts.anotherWallet.address,
              10,
            ]),
            context.contracts.complianceModule.address,
          ),
        ).to.eventually.be.fulfilled;
      });
    });
  });

  describe('.moduleBurnAction', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferFeesFixture);

        await expect(context.contracts.complianceModule.moduleBurnAction(context.accounts.anotherWallet.address, 10)).to.be.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTransferFeesFixture);

        await expect(
          context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleBurnAction(address, uint256)']).encodeFunctionData('moduleBurnAction', [
              context.accounts.anotherWallet.address,
              10,
            ]),
            context.contracts.complianceModule.address,
          ),
        ).to.eventually.be.fulfilled;
      });
    });
  });

  describe('.moduleCheck', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployTransferFeesFullSuite);
      const from = context.accounts.aliceWallet.address;
      const to = context.accounts.bobWallet.address;
      expect(await context.suite.complianceModule.moduleCheck(from, to, 100, context.suite.compliance.address)).to.be.true;
    });
  });

  describe('.name', () => {
    it('should return the name of the module', async () => {
      const context = await loadFixture(deployTransferFeesFullSuite);
      expect(await context.suite.complianceModule.name()).to.be.equal('TransferFeesModule');
    });
  });
});
