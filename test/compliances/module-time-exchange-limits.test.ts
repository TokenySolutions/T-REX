import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';
import { deploySuiteWithModularCompliancesFixture } from '../fixtures/deploy-full-suite.fixture';

async function deployTimeExchangeLimitsFixture() {
  const context = await loadFixture(deployComplianceFixture);

  const complianceModule = await ethers.deployContract('TimeExchangeLimitsModule');
  await context.suite.compliance.addModule(complianceModule.address);

  return {
    ...context,
    contracts: {
      ...context.suite,
      complianceModule,
    },
  };
}

async function deployTimeExchangeLimitsFullSuite() {
  const context = await loadFixture(deploySuiteWithModularCompliancesFixture);
  const complianceModule = await ethers.deployContract('TimeExchangeLimitsModule');
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

describe('Compliance Module: TimeExchangeLimits', () => {
  it('should deploy the TimeExchangeLimits contract and bind it to the compliance', async () => {
    const context = await loadFixture(deployTimeExchangeLimitsFixture);

    expect(context.contracts.complianceModule.address).not.to.be.undefined;
    expect(await context.contracts.compliance.isModuleBound(context.contracts.complianceModule.address)).to.be.true;
  });

  describe('.name()', () => {
    it('should return the name of the module', async () => {
      const context = await loadFixture(deployTimeExchangeLimitsFixture);

      expect(await context.contracts.complianceModule.name()).to.be.equal('TimeExchangeLimitsModule');
    });
  });

  describe('.setExchangeLimit', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTimeExchangeLimitsFixture);
        const exchangeID = context.accounts.anotherWallet.address;

        await expect(context.contracts.complianceModule.setExchangeLimit(exchangeID, { limitTime: 1, limitValue: 100 })).to.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling via compliance', () => {
      describe('when limit time does not exist', () => {
        describe('when limit array size not exceeded', () => {
          it('should add new limit', async () => {
            const context = await loadFixture(deployTimeExchangeLimitsFixture);
            const exchangeID = context.accounts.anotherWallet.address;

            const tx = await context.contracts.compliance.callModuleFunction(
              new ethers.utils.Interface([
                'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
              ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 1, limitValue: 100 }]),
              context.contracts.complianceModule.address,
            );

            await expect(tx)
              .to.emit(context.contracts.complianceModule, 'ExchangeLimitUpdated')
              .withArgs(context.contracts.compliance.address, exchangeID, 100, 1);

            const limits = await context.contracts.complianceModule.getExchangeLimits(context.suite.compliance.address, exchangeID);
            expect(limits.length).to.be.eq(1);
          });
        });
        describe('when there are already 4 limits', () => {
          it('should revert', async () => {
            const context = await loadFixture(deployTimeExchangeLimitsFixture);
            const exchangeID = context.accounts.anotherWallet.address;

            await context.contracts.compliance.callModuleFunction(
              new ethers.utils.Interface([
                'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
              ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 1, limitValue: 100 }]),
              context.contracts.complianceModule.address,
            );

            await context.contracts.compliance.callModuleFunction(
              new ethers.utils.Interface([
                'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
              ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 2, limitValue: 100 }]),
              context.contracts.complianceModule.address,
            );

            await context.contracts.compliance.callModuleFunction(
              new ethers.utils.Interface([
                'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
              ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 3, limitValue: 100 }]),
              context.contracts.complianceModule.address,
            );

            await context.contracts.compliance.callModuleFunction(
              new ethers.utils.Interface([
                'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
              ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 4, limitValue: 100 }]),
              context.contracts.complianceModule.address,
            );
            await expect(
              context.contracts.compliance.callModuleFunction(
                new ethers.utils.Interface([
                  'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
                ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 5, limitValue: 100 }]),
                context.contracts.complianceModule.address,
              ),
            ).to.be.revertedWithCustomError(context.contracts.complianceModule, `LimitsArraySizeExceeded`);
          });
        });
      });

      describe('when limit time already exists', () => {
        it('should update the limit', async () => {
          const context = await loadFixture(deployTimeExchangeLimitsFixture);
          const exchangeID = context.accounts.anotherWallet.address;

          await context.contracts.compliance.callModuleFunction(
            new ethers.utils.Interface([
              'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
            ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 1, limitValue: 90 }]),
            context.contracts.complianceModule.address,
          );

          const tx = await context.contracts.compliance.callModuleFunction(
            new ethers.utils.Interface([
              'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
            ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 1, limitValue: 100 }]),
            context.contracts.complianceModule.address,
          );

          await expect(tx)
            .to.emit(context.contracts.complianceModule, 'ExchangeLimitUpdated')
            .withArgs(context.contracts.compliance.address, exchangeID, 100, 1);

          const limits = await context.contracts.complianceModule.getExchangeLimits(context.suite.compliance.address, exchangeID);
          expect(limits.length).to.be.eq(1);
          expect(limits[0][0]).to.be.eq(1);
          expect(limits[0][1].toString()).to.be.eq('100');
        });
      });
    });
  });

  describe('.getExchangeLimits', () => {
    it('should return limits', async () => {
      const context = await loadFixture(deployTimeExchangeLimitsFixture);
      const exchangeID = context.accounts.anotherWallet.address;

      await context.contracts.compliance.callModuleFunction(
        new ethers.utils.Interface([
          'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
        ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 1, limitValue: 100 }]),
        context.contracts.complianceModule.address,
      );

      const limits = await context.contracts.complianceModule.getExchangeLimits(context.suite.compliance.address, exchangeID);
      expect(limits.length).to.be.eq(1);
      expect(limits[0][0]).to.be.eq(1);
      expect(limits[0][1].toString()).to.be.eq('100');
    });
  });

  describe('.getExchangeCounter', () => {
    it('should return counter', async () => {
      const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
      const from = context.accounts.aliceWallet.address;
      const to = context.accounts.bobWallet.address;
      const exchangeID = await context.suite.identityRegistry.identity(to);
      const investorID = await context.suite.identityRegistry.identity(from);

      await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

      await context.suite.compliance.callModuleFunction(
        new ethers.utils.Interface([
          'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
        ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 10000, limitValue: 100 }]),
        context.suite.complianceModule.address,
      );

      await context.suite.compliance.callModuleFunction(
        new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
          'moduleTransferAction',
          [from, to, 10],
        ),
        context.suite.complianceModule.address,
      );

      const counter = await context.suite.complianceModule.getExchangeCounter(context.suite.compliance.address, exchangeID, investorID, 10000);
      expect(counter.value).to.be.eq(10);
    });
  });

  describe('.addExchangeID', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTimeExchangeLimitsFixture);
        const exchangeID = context.accounts.anotherWallet.address;

        await expect(context.contracts.complianceModule.connect(context.accounts.aliceWallet).addExchangeID(exchangeID)).to.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when calling with owner', () => {
      describe('when exchangeID is not tagged', () => {
        it('should tag ONCHAINID as exchange', async () => {
          const context = await loadFixture(deployTimeExchangeLimitsFixture);
          const exchangeID = context.accounts.anotherWallet.address;

          const tx = await context.contracts.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

          await expect(tx).to.emit(context.contracts.complianceModule, 'ExchangeIDAdded').withArgs(exchangeID);
          expect(await context.contracts.complianceModule.isExchangeID(exchangeID)).to.be.true;
        });
      });

      describe('when exchangeID is already tagged', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployTimeExchangeLimitsFixture);
          const exchangeID = context.accounts.anotherWallet.address;

          await context.contracts.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

          await expect(context.contracts.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID)).to.be.revertedWithCustomError(
            context.contracts.complianceModule,
            `ONCHAINIDAlreadyTaggedAsExchange`,
          );
        });
      });
    });
  });

  describe('.removeExchangeID', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTimeExchangeLimitsFixture);
        const exchangeID = context.accounts.anotherWallet.address;

        await expect(context.contracts.complianceModule.connect(context.accounts.bobWallet).removeExchangeID(exchangeID)).to.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when calling via compliance', () => {
      describe('when exchangeID is tagged', () => {
        it('should untag the exchangeID', async () => {
          const context = await loadFixture(deployTimeExchangeLimitsFixture);
          const exchangeID = context.accounts.anotherWallet.address;

          await context.contracts.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

          const tx = await context.contracts.complianceModule.connect(context.accounts.deployer).removeExchangeID(exchangeID);

          await expect(tx).to.emit(context.contracts.complianceModule, 'ExchangeIDRemoved').withArgs(exchangeID);
          expect(await context.contracts.complianceModule.isExchangeID(exchangeID)).to.be.false;
        });
      });

      describe('when exchangeID is not being tagged', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployTimeExchangeLimitsFixture);
          const exchangeID = context.accounts.anotherWallet.address;

          await expect(
            context.contracts.complianceModule.connect(context.accounts.deployer).removeExchangeID(exchangeID),
          ).to.be.revertedWithCustomError(context.contracts.complianceModule, `ONCHAINIDNotTaggedAsExchange`);
        });
      });
    });
  });

  describe('.isExchangeID', () => {
    describe('when exchangeID is not tagged', () => {
      it('should return false', async () => {
        const context = await loadFixture(deployTimeExchangeLimitsFixture);
        const exchangeID = context.accounts.anotherWallet.address;
        expect(await context.contracts.complianceModule.isExchangeID(exchangeID)).to.be.false;
      });
    });

    describe('when exchangeID is tagged', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTimeExchangeLimitsFixture);
        const exchangeID = context.accounts.anotherWallet.address;

        await context.contracts.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

        expect(await context.contracts.complianceModule.isExchangeID(exchangeID)).to.be.true;
      });
    });
  });

  describe('.moduleTransferAction', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTimeExchangeLimitsFixture);
        const from = context.accounts.aliceWallet.address;
        const to = context.accounts.bobWallet.address;

        await expect(context.contracts.complianceModule.moduleTransferAction(from, to, 10)).to.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling via compliance', () => {
      describe('when receiver is an exchange', () => {
        describe('when sender is not a token agent', () => {
          describe('when the exchange limit is not exceeded', () => {
            it('should increase exchange counter', async () => {
              const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
              const from = context.accounts.aliceWallet.address;
              const to = context.accounts.bobWallet.address;
              const exchangeID = await context.suite.identityRegistry.identity(to);
              const investorID = await context.suite.identityRegistry.identity(from);

              await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

              await context.suite.compliance.callModuleFunction(
                new ethers.utils.Interface([
                  'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
                ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 10000, limitValue: 100 }]),
                context.suite.complianceModule.address,
              );

              await context.suite.compliance.callModuleFunction(
                new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                  'moduleTransferAction',
                  [from, to, 10],
                ),
                context.suite.complianceModule.address,
              );

              const counter = await context.suite.complianceModule.getExchangeCounter(
                context.suite.compliance.address,
                exchangeID,
                investorID,
                10000,
              );
              expect(counter.value).to.be.eq(10);
            });
          });

          describe('when the exchange timer is finished', () => {
            it('should set timer', async () => {
              const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
              const from = context.accounts.aliceWallet.address;
              const to = context.accounts.bobWallet.address;
              const exchangeID = await context.suite.identityRegistry.identity(to);
              const investorID = await context.suite.identityRegistry.identity(from);

              await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

              await context.suite.compliance.callModuleFunction(
                new ethers.utils.Interface([
                  'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
                ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 10000, limitValue: 100 }]),
                context.suite.complianceModule.address,
              );

              await context.suite.compliance.callModuleFunction(
                new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                  'moduleTransferAction',
                  [from, to, 10],
                ),
                context.suite.complianceModule.address,
              );

              const counter = await context.suite.complianceModule.getExchangeCounter(
                context.suite.compliance.address,
                exchangeID,
                investorID,
                10000,
              );
              expect(counter.timer).to.be.gt(0);
            });
          });
          describe('when the exchange month is not finished', () => {
            it('should not update timer', async () => {
              const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
              const from = context.accounts.aliceWallet.address;
              const to = context.accounts.bobWallet.address;
              const exchangeID = await context.suite.identityRegistry.identity(to);
              const investorID = await context.suite.identityRegistry.identity(from);

              await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

              await context.suite.compliance.callModuleFunction(
                new ethers.utils.Interface([
                  'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
                ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 10000, limitValue: 100 }]),
                context.suite.complianceModule.address,
              );

              await context.suite.compliance.callModuleFunction(
                new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                  'moduleTransferAction',
                  [from, to, 10],
                ),
                context.suite.complianceModule.address,
              );

              const previousCounter = await context.suite.complianceModule.getExchangeCounter(
                context.suite.compliance.address,
                exchangeID,
                investorID,
                10000,
              );

              await context.suite.compliance.callModuleFunction(
                new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                  'moduleTransferAction',
                  [from, to, 11],
                ),
                context.suite.complianceModule.address,
              );

              const counter = await context.suite.complianceModule.getExchangeCounter(
                context.suite.compliance.address,
                exchangeID,
                investorID,
                10000,
              );
              expect(counter.timer).to.be.eq(previousCounter.timer);
            });
          });
        });

        describe('when sender is a token agent', () => {
          it('should not set limits', async () => {
            const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
            const from = context.accounts.tokenAgent.address;
            const to = context.accounts.bobWallet.address;
            const exchangeID = await context.suite.identityRegistry.identity(to);
            const investorID = await context.suite.identityRegistry.identity(from);

            await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

            await context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface([
                'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
              ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 10000, limitValue: 100 }]),
              context.suite.complianceModule.address,
            );

            await context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                'moduleTransferAction',
                [from, to, 10],
              ),
              context.suite.complianceModule.address,
            );

            const counter = await context.suite.complianceModule.getExchangeCounter(context.suite.compliance.address, exchangeID, investorID, 10000);
            expect(counter.timer).to.be.eq(0);
            expect(counter.value).to.be.eq(0);
          });
        });
      });

      describe('when receiver is not an exchange', () => {
        describe('when sender is not a token agent', () => {
          it('should not set limits', async () => {
            const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
            const from = context.accounts.aliceWallet.address;
            const to = context.accounts.bobWallet.address;
            const receiverID = await context.suite.identityRegistry.identity(to);
            const investorID = await context.suite.identityRegistry.identity(from);

            await context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface([
                'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
              ]).encodeFunctionData('setExchangeLimit', [receiverID, { limitTime: 10000, limitValue: 100 }]),
              context.suite.complianceModule.address,
            );

            await context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                'moduleTransferAction',
                [from, to, 10],
              ),
              context.suite.complianceModule.address,
            );

            const counter = await context.suite.complianceModule.getExchangeCounter(context.suite.compliance.address, receiverID, investorID, 10000);
            expect(counter.timer).to.be.eq(0);
            expect(counter.value).to.be.eq(0);
          });
        });

        describe('when sender is a token agent', () => {
          it('should not set limits', async () => {
            const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
            const from = context.accounts.tokenAgent.address;
            const to = context.accounts.bobWallet.address;
            const receiverID = await context.suite.identityRegistry.identity(to);
            const investorID = await context.suite.identityRegistry.identity(from);

            await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(receiverID);

            await context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface([
                'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
              ]).encodeFunctionData('setExchangeLimit', [receiverID, { limitTime: 10000, limitValue: 100 }]),
              context.suite.complianceModule.address,
            );

            await context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                'moduleTransferAction',
                [from, to, 10],
              ),
              context.suite.complianceModule.address,
            );

            const counter = await context.suite.complianceModule.getExchangeCounter(context.suite.compliance.address, receiverID, investorID, 10000);
            expect(counter.timer).to.be.eq(0);
            expect(counter.value).to.be.eq(0);
          });
        });
      });
    });
  });

  describe('.isPlugAndPlay', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
      expect(await context.suite.complianceModule.isPlugAndPlay()).to.be.true;
    });
  });

  describe('.canComplianceBind', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
      expect(await context.suite.complianceModule.canComplianceBind(context.suite.compliance.address)).to.be.true;
    });
  });

  describe('.moduleCheck', () => {
    describe('when from is null address', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
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
        const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
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

    describe('when receiver is not exchange', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
        expect(
          await context.suite.complianceModule.moduleCheck(
            context.accounts.aliceWallet.address,
            context.accounts.bobWallet.address,
            100,
            context.suite.compliance.address,
          ),
        ).to.be.true;
      });
    });

    describe('when receiver is exchange', () => {
      describe('when sender is exchange', () => {
        it('should return true', async () => {
          const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;
          const senderExchangeID = await context.suite.identityRegistry.identity(from);
          const receiverExchangeID = await context.suite.identityRegistry.identity(to);

          await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(receiverExchangeID);

          await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(senderExchangeID);

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface([
              'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
            ]).encodeFunctionData('setExchangeLimit', [receiverExchangeID, { limitTime: 10000, limitValue: 90 }]),
            context.suite.complianceModule.address,
          );

          expect(await context.suite.complianceModule.moduleCheck(from, to, 100, context.suite.compliance.address)).to.be.true;
        });
      });

      describe('when value exceeds the limit', () => {
        it('should return false', async () => {
          const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;
          const exchangeID = await context.suite.identityRegistry.identity(to);

          await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface([
              'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
            ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 10000, limitValue: 90 }]),
            context.suite.complianceModule.address,
          );

          expect(await context.suite.complianceModule.moduleCheck(from, to, 100, context.suite.compliance.address)).to.be.false;
        });
      });

      describe('when exchange month is finished', () => {
        it('should return true', async () => {
          const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;
          const exchangeID = await context.suite.identityRegistry.identity(to);

          await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface([
              'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
            ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 10000, limitValue: 150 }]),
            context.suite.complianceModule.address,
          );

          expect(await context.suite.complianceModule.moduleCheck(from, to, 100, context.suite.compliance.address)).to.be.true;
        });
      });

      describe('when counter exceeds the limit', () => {
        it('should return false', async () => {
          const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;
          const exchangeID = await context.suite.identityRegistry.identity(to);

          await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface([
              'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
            ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 10000, limitValue: 150 }]),
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

      describe('when counter does not exceed the limit', () => {
        it('should return true', async () => {
          const context = await loadFixture(deployTimeExchangeLimitsFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;
          const exchangeID = await context.suite.identityRegistry.identity(to);

          await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface([
              'function setExchangeLimit(address _exchangeID, tuple(uint32 limitTime, uint256 limitValue))',
            ]).encodeFunctionData('setExchangeLimit', [exchangeID, { limitTime: 10000, limitValue: 150 }]),
            context.suite.complianceModule.address,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 100],
            ),
            context.suite.complianceModule.address,
          );

          expect(await context.suite.complianceModule.moduleCheck(from, to, 40, context.suite.compliance.address)).to.be.true;
        });
      });
    });
  });

  describe('.moduleMintAction', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTimeExchangeLimitsFixture);

        await expect(context.contracts.complianceModule.moduleMintAction(context.accounts.anotherWallet.address, 10)).to.be.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTimeExchangeLimitsFixture);

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
        const context = await loadFixture(deployTimeExchangeLimitsFixture);

        await expect(context.contracts.complianceModule.moduleBurnAction(context.accounts.anotherWallet.address, 10)).to.be.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTimeExchangeLimitsFixture);

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
