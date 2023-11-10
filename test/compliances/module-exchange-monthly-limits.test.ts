import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';
import { deploySuiteWithModularCompliancesFixture } from '../fixtures/deploy-full-suite.fixture';

async function deployExchangeMonthlyLimitsFixture() {
  const context = await loadFixture(deployComplianceFixture);

  const complianceModule = await ethers.deployContract('ExchangeMonthlyLimitsModule');
  await context.suite.compliance.addModule(complianceModule.address);

  return {
    ...context,
    contracts: {
      ...context.suite,
      complianceModule,
    },
  };
}

async function deployExchangeMonthlyLimitsFullSuite() {
  const context = await loadFixture(deploySuiteWithModularCompliancesFixture);
  const complianceModule = await ethers.deployContract('ExchangeMonthlyLimitsModule');
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

describe('Compliance Module: ExchangeMonthlyLimits', () => {
  it('should deploy the ExchangeMonthlyLimits contract and bind it to the compliance', async () => {
    const context = await loadFixture(deployExchangeMonthlyLimitsFixture);

    expect(context.contracts.complianceModule.address).not.to.be.undefined;
    expect(await context.contracts.compliance.isModuleBound(context.contracts.complianceModule.address)).to.be.true;
  });

  describe('.name()', () => {
    it('should return the name of the module', async () => {
      const context = await loadFixture(deployExchangeMonthlyLimitsFixture);

      expect(await context.contracts.complianceModule.name()).to.be.eq('ExchangeMonthlyLimitsModule');
    });
  });

  describe('.isPlugAndPlay', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployExchangeMonthlyLimitsFullSuite);
      expect(await context.suite.complianceModule.isPlugAndPlay()).to.be.true;
    });
  });

  describe('.canComplianceBind', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployExchangeMonthlyLimitsFullSuite);
      expect(await context.suite.complianceModule.canComplianceBind(context.suite.compliance.address)).to.be.true;
    });
  });

  describe('.setExchangeMonthlyLimit', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployExchangeMonthlyLimitsFixture);
        const exchangeID = context.accounts.anotherWallet.address;

        await expect(context.contracts.complianceModule.setExchangeMonthlyLimit(exchangeID, 1)).to.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling via compliance', () => {
      it('should update the limit', async () => {
        const context = await loadFixture(deployExchangeMonthlyLimitsFixture);
        const exchangeID = context.accounts.anotherWallet.address;

        const tx = await context.contracts.compliance.callModuleFunction(
          new ethers.utils.Interface(['function setExchangeMonthlyLimit(address _exchangeID, uint256 _newExchangeMonthlyLimit)']).encodeFunctionData(
            'setExchangeMonthlyLimit',
            [exchangeID, 100],
          ),
          context.contracts.complianceModule.address,
        );

        await expect(tx)
          .to.emit(context.contracts.complianceModule, 'ExchangeMonthlyLimitUpdated')
          .withArgs(context.contracts.compliance.address, exchangeID, 100);
      });
    });
  });

  describe('.getExchangeMonthlyLimit', () => {
    it('should return monthly limit', async () => {
      const context = await loadFixture(deployExchangeMonthlyLimitsFixture);
      const exchangeID = context.accounts.anotherWallet.address;

      await context.contracts.compliance.callModuleFunction(
        new ethers.utils.Interface(['function setExchangeMonthlyLimit(address _exchangeID, uint256 _newExchangeMonthlyLimit)']).encodeFunctionData(
          'setExchangeMonthlyLimit',
          [exchangeID, 100],
        ),
        context.contracts.complianceModule.address,
      );

      expect(await context.contracts.complianceModule.getExchangeMonthlyLimit(context.suite.compliance.address, exchangeID)).to.be.eq(100);
    });
  });

  describe('.addExchangeID', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployExchangeMonthlyLimitsFixture);
        const exchangeID = context.accounts.anotherWallet.address;

        await expect(context.contracts.complianceModule.connect(context.accounts.aliceWallet).addExchangeID(exchangeID)).to.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when calling via compliance', () => {
      describe('when exchangeID is not tagged', () => {
        it('should tag ONCHAINID as exchange', async () => {
          const context = await loadFixture(deployExchangeMonthlyLimitsFixture);
          const exchangeID = context.accounts.anotherWallet.address;

          const tx = await context.contracts.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

          await expect(tx).to.emit(context.contracts.complianceModule, 'ExchangeIDAdded').withArgs(exchangeID);
          expect(await context.contracts.complianceModule.isExchangeID(exchangeID)).to.be.true;
        });
      });

      describe('when exchangeID is already tagged', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployExchangeMonthlyLimitsFixture);
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
        const context = await loadFixture(deployExchangeMonthlyLimitsFixture);
        const exchangeID = context.accounts.anotherWallet.address;

        await expect(context.contracts.complianceModule.connect(context.accounts.aliceWallet).removeExchangeID(exchangeID)).to.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when calling via compliance', () => {
      describe('when exchangeID is tagged', () => {
        it('should untag the exchangeID', async () => {
          const context = await loadFixture(deployExchangeMonthlyLimitsFixture);
          const exchangeID = context.accounts.anotherWallet.address;

          await context.contracts.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

          const tx = context.contracts.complianceModule.connect(context.accounts.deployer).removeExchangeID(exchangeID);

          await expect(tx).to.emit(context.contracts.complianceModule, 'ExchangeIDRemoved').withArgs(exchangeID);
          expect(await context.contracts.complianceModule.isExchangeID(exchangeID)).to.be.false;
        });
      });

      describe('when exchangeID is not being tagged', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployExchangeMonthlyLimitsFixture);
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
        const context = await loadFixture(deployExchangeMonthlyLimitsFixture);
        const exchangeID = context.accounts.anotherWallet.address;
        expect(await context.contracts.complianceModule.isExchangeID(exchangeID)).to.be.false;
      });
    });

    describe('when exchangeID is tagged', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployExchangeMonthlyLimitsFixture);
        const exchangeID = context.accounts.anotherWallet.address;

        await context.contracts.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

        expect(await context.contracts.complianceModule.isExchangeID(exchangeID)).to.be.true;
      });
    });
  });

  describe('.moduleTransferAction', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployExchangeMonthlyLimitsFixture);
        const from = context.accounts.aliceWallet.address;
        const to = context.accounts.bobWallet.address;

        await expect(context.contracts.complianceModule.moduleTransferAction(from, to, 10)).to.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling via compliance', () => {
      describe('when receiver is an exchange', () => {
        describe('when sender is not a token agent', () => {
          describe('when the exchange monthly limit is not exceeded', () => {
            it('should increase exchange counter', async () => {
              const context = await loadFixture(deployExchangeMonthlyLimitsFullSuite);
              const from = context.accounts.aliceWallet.address;
              const to = context.accounts.bobWallet.address;
              const exchangeID = await context.suite.identityRegistry.identity(to);
              const investorID = await context.suite.identityRegistry.identity(from);

              await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

              await context.suite.compliance.callModuleFunction(
                new ethers.utils.Interface([
                  'function setExchangeMonthlyLimit(address _exchangeID, uint256 _newExchangeMonthlyLimit)',
                ]).encodeFunctionData('setExchangeMonthlyLimit', [exchangeID, 100]),
                context.suite.complianceModule.address,
              );

              await context.suite.compliance.callModuleFunction(
                new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                  'moduleTransferAction',
                  [from, to, 10],
                ),
                context.suite.complianceModule.address,
              );

              const counter = await context.suite.complianceModule.getMonthlyCounter(context.suite.compliance.address, exchangeID, investorID);
              expect(counter).to.be.eq(10);
            });
          });

          describe('when the exchange month is finished', () => {
            it('should set monthly timer', async () => {
              const context = await loadFixture(deployExchangeMonthlyLimitsFullSuite);
              const from = context.accounts.aliceWallet.address;
              const to = context.accounts.bobWallet.address;
              const exchangeID = await context.suite.identityRegistry.identity(to);
              const investorID = await context.suite.identityRegistry.identity(from);

              await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

              await context.suite.compliance.callModuleFunction(
                new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                  'moduleTransferAction',
                  [from, to, 10],
                ),
                context.suite.complianceModule.address,
              );

              const timer = await context.suite.complianceModule.getMonthlyTimer(context.suite.compliance.address, exchangeID, investorID);
              expect(timer).to.be.gt(0);
            });
          });
          describe('when the exchange month is not finished', () => {
            it('should not update monthly timer', async () => {
              const context = await loadFixture(deployExchangeMonthlyLimitsFullSuite);
              const from = context.accounts.aliceWallet.address;
              const to = context.accounts.bobWallet.address;
              const exchangeID = await context.suite.identityRegistry.identity(to);
              const investorID = await context.suite.identityRegistry.identity(from);

              await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

              await context.suite.compliance.callModuleFunction(
                new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                  'moduleTransferAction',
                  [from, to, 10],
                ),
                context.suite.complianceModule.address,
              );

              const previousTimer = await context.suite.complianceModule.getMonthlyTimer(context.suite.compliance.address, exchangeID, investorID);
              await context.suite.compliance.callModuleFunction(
                new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                  'moduleTransferAction',
                  [from, to, 11],
                ),
                context.suite.complianceModule.address,
              );

              const timer = await context.suite.complianceModule.getMonthlyTimer(context.suite.compliance.address, exchangeID, investorID);
              expect(timer).to.be.eq(previousTimer);
            });
          });
        });

        describe('when sender is a token agent', () => {
          it('should not set limits', async () => {
            const context = await loadFixture(deployExchangeMonthlyLimitsFullSuite);
            const from = context.accounts.tokenAgent.address;
            const to = context.accounts.bobWallet.address;
            const exchangeID = await context.suite.identityRegistry.identity(to);
            const investorID = await context.suite.identityRegistry.identity(from);

            await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

            await context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface([
                'function setExchangeMonthlyLimit(address _exchangeID, uint256 _newExchangeMonthlyLimit)',
              ]).encodeFunctionData('setExchangeMonthlyLimit', [exchangeID, 100]),
              context.suite.complianceModule.address,
            );

            await context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                'moduleTransferAction',
                [from, to, 10],
              ),
              context.suite.complianceModule.address,
            );

            const counter = await context.suite.complianceModule.getMonthlyCounter(context.suite.compliance.address, exchangeID, investorID);
            expect(counter).to.be.eq(0);

            const timer = await context.suite.complianceModule.getMonthlyTimer(context.suite.compliance.address, exchangeID, investorID);
            expect(timer).to.be.eq(0);
          });
        });
      });

      describe('when receiver is not an exchange', () => {
        describe('when sender is not a token agent', () => {
          it('should not set limits', async () => {
            const context = await loadFixture(deployExchangeMonthlyLimitsFullSuite);
            const from = context.accounts.aliceWallet.address;
            const to = context.accounts.bobWallet.address;
            const receiverID = await context.suite.identityRegistry.identity(to);
            const investorID = await context.suite.identityRegistry.identity(from);

            await context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                'moduleTransferAction',
                [from, to, 10],
              ),
              context.suite.complianceModule.address,
            );

            const counter = await context.suite.complianceModule.getMonthlyCounter(context.suite.compliance.address, receiverID, investorID);
            expect(counter).to.be.eq(0);

            const timer = await context.suite.complianceModule.getMonthlyTimer(context.suite.compliance.address, receiverID, investorID);
            expect(timer).to.be.eq(0);
          });
        });

        describe('when sender is a token agent', () => {
          it('should not set limits', async () => {
            const context = await loadFixture(deployExchangeMonthlyLimitsFullSuite);
            const from = context.accounts.tokenAgent.address;
            const to = context.accounts.bobWallet.address;
            const receiverID = await context.suite.identityRegistry.identity(to);
            const investorID = await context.suite.identityRegistry.identity(from);

            await context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                'moduleTransferAction',
                [from, to, 10],
              ),
              context.suite.complianceModule.address,
            );

            const counter = await context.suite.complianceModule.getMonthlyCounter(context.suite.compliance.address, receiverID, investorID);
            expect(counter).to.be.eq(0);

            const timer = await context.suite.complianceModule.getMonthlyTimer(context.suite.compliance.address, receiverID, investorID);
            expect(timer).to.be.eq(0);
          });
        });
      });
    });
  });

  describe('.moduleCheck', () => {
    describe('when from is null address', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployExchangeMonthlyLimitsFullSuite);
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
        const context = await loadFixture(deployExchangeMonthlyLimitsFullSuite);
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
        const context = await loadFixture(deployExchangeMonthlyLimitsFullSuite);
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
          const context = await loadFixture(deployExchangeMonthlyLimitsFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;
          const senderExchangeID = await context.suite.identityRegistry.identity(from);
          const receiverExchangeID = await context.suite.identityRegistry.identity(to);

          await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(senderExchangeID);

          await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(receiverExchangeID);

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface([
              'function setExchangeMonthlyLimit(address _exchangeID, uint256 _newExchangeMonthlyLimit)',
            ]).encodeFunctionData('setExchangeMonthlyLimit', [receiverExchangeID, 90]),
            context.suite.complianceModule.address,
          );

          expect(await context.suite.complianceModule.moduleCheck(from, to, 100, context.suite.compliance.address)).to.be.true;
        });
      });

      describe('when value exceeds the monthly limit', () => {
        it('should return false', async () => {
          const context = await loadFixture(deployExchangeMonthlyLimitsFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;
          const exchangeID = await context.suite.identityRegistry.identity(to);

          await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface([
              'function setExchangeMonthlyLimit(address _exchangeID, uint256 _newExchangeMonthlyLimit)',
            ]).encodeFunctionData('setExchangeMonthlyLimit', [exchangeID, 90]),
            context.suite.complianceModule.address,
          );

          expect(await context.suite.complianceModule.moduleCheck(from, to, 100, context.suite.compliance.address)).to.be.false;
        });
      });

      describe('when exchange month is finished', () => {
        it('should return true', async () => {
          const context = await loadFixture(deployExchangeMonthlyLimitsFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;
          const exchangeID = await context.suite.identityRegistry.identity(to);

          await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface([
              'function setExchangeMonthlyLimit(address _exchangeID, uint256 _newExchangeMonthlyLimit)',
            ]).encodeFunctionData('setExchangeMonthlyLimit', [exchangeID, 150]),
            context.suite.complianceModule.address,
          );

          expect(await context.suite.complianceModule.moduleCheck(from, to, 100, context.suite.compliance.address)).to.be.true;
        });
      });

      describe('when monthly counter exceeds the monthly limit', () => {
        it('should return false', async () => {
          const context = await loadFixture(deployExchangeMonthlyLimitsFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;
          const exchangeID = await context.suite.identityRegistry.identity(to);

          await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface([
              'function setExchangeMonthlyLimit(address _exchangeID, uint256 _newExchangeMonthlyLimit)',
            ]).encodeFunctionData('setExchangeMonthlyLimit', [exchangeID, 150]),
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

      describe('when monthly counter does not exceed the monthly limit', () => {
        it('should return true', async () => {
          const context = await loadFixture(deployExchangeMonthlyLimitsFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;
          const exchangeID = await context.suite.identityRegistry.identity(to);

          await context.suite.complianceModule.connect(context.accounts.deployer).addExchangeID(exchangeID);

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface([
              'function setExchangeMonthlyLimit(address _exchangeID, uint256 _newExchangeMonthlyLimit)',
            ]).encodeFunctionData('setExchangeMonthlyLimit', [exchangeID, 150]),
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
        const context = await loadFixture(deployExchangeMonthlyLimitsFixture);

        await expect(context.contracts.complianceModule.moduleMintAction(context.accounts.anotherWallet.address, 10)).to.be.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployExchangeMonthlyLimitsFixture);

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
        const context = await loadFixture(deployExchangeMonthlyLimitsFixture);

        await expect(context.contracts.complianceModule.moduleBurnAction(context.accounts.anotherWallet.address, 10)).to.be.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployExchangeMonthlyLimitsFixture);

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
