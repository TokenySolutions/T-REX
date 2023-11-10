import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';
import { deploySuiteWithModularCompliancesFixture } from '../fixtures/deploy-full-suite.fixture';

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

async function deployTimeTransferLimitsFullSuite() {
  const context = await loadFixture(deploySuiteWithModularCompliancesFixture);
  const complianceModule = await ethers.deployContract('TimeTransfersLimitsModule');
  await context.suite.compliance.bindToken(context.suite.token.address);
  await context.suite.compliance.addModule(complianceModule.address);

  return {
    ...context,
    suite: {
      ...context.suite,
      complianceModule,
    },
  };
}

describe('Compliance Module: TimeTransferLimits', () => {
  it('should deploy the TimeTransferLimits contract and bind it to the compliance', async () => {
    const context = await loadFixture(deployTimeTransferLimitsFixture);

    expect(context.contracts.complianceModule.address).not.to.be.undefined;
    expect(await context.contracts.compliance.isModuleBound(context.contracts.complianceModule.address)).to.be.true;
  });

  describe('.name()', () => {
    it('should return the name of the module', async () => {
      const context = await loadFixture(deployTimeTransferLimitsFixture);

      expect(await context.contracts.complianceModule.name()).to.be.equal('TimeTransfersLimitsModule');
    });
  });

  describe('.setTimeTransferLimit', () => {
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
            new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
              'setTimeTransferLimit',
              [{ limitTime: 1, limitValue: 100 }],
            ),
            context.contracts.complianceModule.address,
          );
          const tx = await context.contracts.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
              'setTimeTransferLimit',
              [{ limitTime: 1, limitValue: 50 }],
            ),
            context.contracts.complianceModule.address,
          );

          await expect(tx)
            .to.emit(context.contracts.complianceModule, 'TimeTransferLimitUpdated')
            .withArgs(context.contracts.compliance.address, 1, 50);
        });
      });

      describe('when there are no limits for this time', () => {
        describe('when there are already 4 limits', () => {
          it('should revert', async () => {
            const context = await loadFixture(deployTimeTransferLimitsFixture);

            await context.contracts.compliance.callModuleFunction(
              new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
                'setTimeTransferLimit',
                [{ limitTime: 1, limitValue: 100 }],
              ),
              context.contracts.complianceModule.address,
            );
            await context.contracts.compliance.callModuleFunction(
              new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
                'setTimeTransferLimit',
                [{ limitTime: 7, limitValue: 1000 }],
              ),
              context.contracts.complianceModule.address,
            );
            await context.contracts.compliance.callModuleFunction(
              new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
                'setTimeTransferLimit',
                [{ limitTime: 30, limitValue: 10000 }],
              ),
              context.contracts.complianceModule.address,
            );
            await context.contracts.compliance.callModuleFunction(
              new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
                'setTimeTransferLimit',
                [{ limitTime: 365, limitValue: 100000 }],
              ),
              context.contracts.complianceModule.address,
            );
            await expect(
              context.contracts.compliance.callModuleFunction(
                new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
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
              new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
                'setTimeTransferLimit',
                [{ limitTime: 1, limitValue: 100 }],
              ),
              context.contracts.complianceModule.address,
            );

            await expect(tx)
              .to.emit(context.contracts.complianceModule, 'TimeTransferLimitUpdated')
              .withArgs(context.contracts.compliance.address, 1, 100);
          });
        });
      });
    });
  });

  describe('.getTimeTransferLimits', () => {
    describe('when there is no time transfer limit', () => {
      it('should return empty array', async () => {
        const context = await loadFixture(deployTimeTransferLimitsFixture);

        const limits = await context.contracts.complianceModule.getTimeTransferLimits(context.suite.compliance.address);
        expect(limits.length).to.be.eq(0);
      });
    });

    describe('when there are time transfer limit', () => {
      it('should return transfer limits', async () => {
        const context = await loadFixture(deployTimeTransferLimitsFixture);

        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
            'setTimeTransferLimit',
            [{ limitTime: 10, limitValue: 120 }],
          ),
          context.contracts.complianceModule.address,
        );

        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
            'setTimeTransferLimit',
            [{ limitTime: 15, limitValue: 100 }],
          ),
          context.contracts.complianceModule.address,
        );

        const limits = await context.contracts.complianceModule.getTimeTransferLimits(context.suite.compliance.address);
        expect(limits.length).to.be.eq(2);
        expect(limits[0].limitTime).to.be.eq(10);
        expect(limits[0].limitValue).to.be.eq(120);
        expect(limits[1].limitTime).to.be.eq(15);
        expect(limits[1].limitValue).to.be.eq(100);
      });
    });
  });

  describe('.moduleTransferAction', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTimeTransferLimitsFixture);
        const from = context.accounts.aliceWallet.address;
        const to = context.accounts.bobWallet.address;

        await expect(context.contracts.complianceModule.moduleTransferAction(from, to, 10)).to.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling via compliance', () => {
      describe('when counters are not initialized yet', () => {
        it('should create and increase the counters', async () => {
          const context = await loadFixture(deployTimeTransferLimitsFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;
          const senderIdentity = await context.suite.identityRegistry.identity(from);
          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
              'setTimeTransferLimit',
              [{ limitTime: 10, limitValue: 120 }],
            ),
            context.suite.complianceModule.address,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
              'setTimeTransferLimit',
              [{ limitTime: 15, limitValue: 100 }],
            ),
            context.suite.complianceModule.address,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 80],
            ),
            context.suite.complianceModule.address,
          );

          const blockTimestamp = await time.latest();
          const counter1 = await context.suite.complianceModule.usersCounters(context.suite.compliance.address, senderIdentity, 10);
          expect(counter1.value).to.be.eq(80);
          expect(counter1.timer).to.be.eq(blockTimestamp + 10);

          const counter2 = await context.suite.complianceModule.usersCounters(context.suite.compliance.address, senderIdentity, 15);
          expect(counter2.value).to.be.eq(80);
          expect(counter2.timer).to.be.eq(blockTimestamp + 15);
        });
      });

      describe('when counters are already initialized', () => {
        it('should increase the counters', async () => {
          const context = await loadFixture(deployTimeTransferLimitsFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;
          const senderIdentity = await context.suite.identityRegistry.identity(from);
          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
              'setTimeTransferLimit',
              [{ limitTime: 100, limitValue: 120 }],
            ),
            context.suite.complianceModule.address,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
              'setTimeTransferLimit',
              [{ limitTime: 150, limitValue: 100 }],
            ),
            context.suite.complianceModule.address,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 20],
            ),
            context.suite.complianceModule.address,
          );

          const blockTimestamp = await time.latest();
          await time.increase(10);

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 30],
            ),
            context.suite.complianceModule.address,
          );

          const counter1 = await context.suite.complianceModule.usersCounters(context.suite.compliance.address, senderIdentity, 100);
          expect(counter1.value).to.be.eq(50);
          expect(counter1.timer).to.be.eq(blockTimestamp + 100);

          const counter2 = await context.suite.complianceModule.usersCounters(context.suite.compliance.address, senderIdentity, 150);
          expect(counter2.value).to.be.eq(50);
          expect(counter2.timer).to.be.eq(blockTimestamp + 150);
        });
      });

      describe('when counter is finished', () => {
        it('should reset the finished counter and increase the counters', async () => {
          const context = await loadFixture(deployTimeTransferLimitsFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;
          const senderIdentity = await context.suite.identityRegistry.identity(from);
          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
              'setTimeTransferLimit',
              [{ limitTime: 10, limitValue: 120 }],
            ),
            context.suite.complianceModule.address,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
              'setTimeTransferLimit',
              [{ limitTime: 150, limitValue: 100 }],
            ),
            context.suite.complianceModule.address,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 20],
            ),
            context.suite.complianceModule.address,
          );

          const blockTimestamp = await time.latest();
          await time.increase(30);

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 30],
            ),
            context.suite.complianceModule.address,
          );

          const resetTimestamp = await time.latest();

          const counter1 = await context.suite.complianceModule.usersCounters(context.suite.compliance.address, senderIdentity, 10);
          expect(counter1.value).to.be.eq(30);
          expect(counter1.timer).to.be.eq(resetTimestamp + 10);

          const counter2 = await context.suite.complianceModule.usersCounters(context.suite.compliance.address, senderIdentity, 150);
          expect(counter2.value).to.be.eq(50);
          expect(counter2.timer).to.be.eq(blockTimestamp + 150);
        });
      });
    });
  });

  describe('.isPlugAndPlay', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployTimeTransferLimitsFullSuite);
      expect(await context.suite.complianceModule.isPlugAndPlay()).to.be.true;
    });
  });

  describe('.canComplianceBind', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployTimeTransferLimitsFullSuite);
      expect(await context.suite.complianceModule.canComplianceBind(context.suite.compliance.address)).to.be.true;
    });
  });

  describe('.moduleCheck', () => {
    describe('when from is null address', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTimeTransferLimitsFullSuite);
        expect(
          await context.suite.complianceModule.moduleCheck(
            '0x0000000000000000000000000000000000000000',
            context.accounts.bobWallet.address,
            100,
            context.suite.compliance.address,
          ),
        ).to.be.true;
      });
    });

    describe('when from is token agent', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTimeTransferLimitsFullSuite);
        expect(
          await context.suite.complianceModule.moduleCheck(
            context.accounts.tokenAgent.address,
            context.accounts.bobWallet.address,
            100,
            context.suite.compliance.address,
          ),
        ).to.be.true;
      });
    });

    describe('when value exceeds the time limit', () => {
      it('should return false', async () => {
        const context = await loadFixture(deployTimeTransferLimitsFullSuite);

        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
            'setTimeTransferLimit',
            [{ limitTime: 10, limitValue: 50 }],
          ),
          context.suite.complianceModule.address,
        );

        expect(
          await context.suite.complianceModule.moduleCheck(
            context.accounts.aliceWallet.address,
            context.accounts.bobWallet.address,
            100,
            context.suite.compliance.address,
          ),
        ).to.be.false;
      });
    });

    describe('when value does not exceed the time limit', () => {
      describe('when value exceeds the counter limit', () => {
        it('should return false', async () => {
          const context = await loadFixture(deployTimeTransferLimitsFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
              'setTimeTransferLimit',
              [{ limitTime: 10, limitValue: 120 }],
            ),
            context.suite.complianceModule.address,
          );
          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 100],
            ),
            context.suite.complianceModule.address,
          );

          expect(await context.suite.complianceModule.moduleCheck(from, to, 100, context.suite.compliance.address)).to.be.false;
        });
      });

      describe('when value does not exceed the counter limit', () => {
        it('should return false', async () => {
          const context = await loadFixture(deployTimeTransferLimitsFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
              'setTimeTransferLimit',
              [{ limitTime: 10, limitValue: 120 }],
            ),
            context.suite.complianceModule.address,
          );

          expect(await context.suite.complianceModule.moduleCheck(from, to, 100, context.suite.compliance.address)).to.be.true;
        });
      });

      describe('when value exceeds the counter limit but counter is finished', () => {
        it('should return true', async () => {
          const context = await loadFixture(deployTimeTransferLimitsFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setTimeTransferLimit(tuple(uint32 limitTime, uint256 limitValue) _limit)']).encodeFunctionData(
              'setTimeTransferLimit',
              [{ limitTime: 10, limitValue: 120 }],
            ),
            context.suite.complianceModule.address,
          );
          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 100],
            ),
            context.suite.complianceModule.address,
          );

          await time.increase(30);

          expect(await context.suite.complianceModule.moduleCheck(from, to, 100, context.suite.compliance.address)).to.be.true;
        });
      });
    });
  });

  describe('.moduleMintAction', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTimeTransferLimitsFixture);

        await expect(context.contracts.complianceModule.moduleMintAction(context.accounts.anotherWallet.address, 10)).to.be.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTimeTransferLimitsFixture);

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
        const context = await loadFixture(deployTimeTransferLimitsFixture);

        await expect(context.contracts.complianceModule.moduleBurnAction(context.accounts.anotherWallet.address, 10)).to.be.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTimeTransferLimitsFixture);

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
});
