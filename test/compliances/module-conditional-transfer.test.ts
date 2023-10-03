import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';
import { deploySuiteWithModularCompliancesFixture } from '../fixtures/deploy-full-suite.fixture';

describe('ConditionalTransferModule', () => {
  async function deployComplianceWithConditionalTransferModule() {
    const context = await loadFixture(deploySuiteWithModularCompliancesFixture);
    const { compliance } = context.suite;

    const conditionalTransferModule = await ethers.deployContract('ConditionalTransferModule');
    await compliance.addModule(conditionalTransferModule.address);
    await context.suite.compliance.bindToken(context.suite.token.address);
    return { ...context, suite: { ...context.suite, conditionalTransferModule } };
  }

  describe('.name()', () => {
    it('should return the name of the module', async () => {
      const {
        suite: { conditionalTransferModule },
      } = await loadFixture(deployComplianceWithConditionalTransferModule);

      expect(await conditionalTransferModule.name()).to.be.equal('ConditionalTransferModule');
    });
  });

  describe('.isPlugAndPlay()', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployComplianceWithConditionalTransferModule);
      expect(await context.suite.conditionalTransferModule.isPlugAndPlay()).to.be.true;
    });
  });

  describe('.canComplianceBind', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployComplianceWithConditionalTransferModule);
      expect(await context.suite.conditionalTransferModule.canComplianceBind(context.suite.compliance.address)).to.be.true;
    });
  });

  describe('.batchApproveTransfers', () => {
    describe('when the given compliance address is not bound', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet, charlieWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule
            .connect(anotherWallet)
            .batchApproveTransfers(charlieWallet.address, [anotherWallet.address], [anotherWallet.address], [10]),
        ).to.be.revertedWith('compliance not bound');
      });
    });

    describe('when the sender is not the compliance or a token agent', () => {
      it('should revert', async () => {
        const {
          suite: { compliance, conditionalTransferModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule
            .connect(anotherWallet)
            .batchApproveTransfers(compliance.address, [anotherWallet.address], [anotherWallet.address], [10]),
        ).to.be.revertedWithCustomError(conditionalTransferModule, `OnlyComplianceOwnerOrAgentCanCall`);
      });
    });

    describe('when the sender is the compliance', () => {
      it('should approve the transfers', async () => {
        const {
          suite: { compliance, conditionalTransferModule, token },
          accounts: { deployer, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        const tx = await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.utils.Interface(['function batchApproveTransfers(address, address[], address[], uint256[])']).encodeFunctionData(
              'batchApproveTransfers',
              [compliance.address, [aliceWallet.address], [bobWallet.address], [10]],
            ),
            conditionalTransferModule.address,
          );

        await expect(tx).to.emit(conditionalTransferModule, 'TransferApproved').withArgs(aliceWallet.address, bobWallet.address, 10, token.address);

        expect(
          await conditionalTransferModule.isTransferApproved(
            compliance.address,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, token.address),
          ),
        ).to.be.true;

        await expect(
          conditionalTransferModule.getTransferApprovals(
            compliance.address,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, token.address),
          ),
        ).to.eventually.be.equal(1);
      });
    });

    describe('when the sender is the token agent', () => {
      it('should approve the transfers', async () => {
        const {
          suite: { compliance, conditionalTransferModule, token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        const tx = await conditionalTransferModule
          .connect(tokenAgent)
          .batchApproveTransfers(compliance.address, [aliceWallet.address], [bobWallet.address], [10]);

        await expect(tx).to.emit(conditionalTransferModule, 'TransferApproved').withArgs(aliceWallet.address, bobWallet.address, 10, token.address);

        expect(
          await conditionalTransferModule.isTransferApproved(
            compliance.address,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, token.address),
          ),
        ).to.be.true;

        await expect(
          conditionalTransferModule.getTransferApprovals(
            compliance.address,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, token.address),
          ),
        ).to.eventually.be.equal(1);
      });
    });
  });

  describe('.batchUnApproveTransfers()', () => {
    describe('when the given compliance address is not bound', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet, charlieWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule
            .connect(anotherWallet)
            .batchUnApproveTransfers(charlieWallet.address, [anotherWallet.address], [anotherWallet.address], [10]),
        ).to.be.revertedWith('compliance not bound');
      });
    });

    describe('when the sender is not the compliance or a token agent', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule, compliance },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule
            .connect(anotherWallet)
            .batchUnApproveTransfers(compliance.address, [anotherWallet.address], [anotherWallet.address], [10]),
        ).to.be.revertedWithCustomError(conditionalTransferModule, `OnlyComplianceOwnerOrAgentCanCall`);
      });
    });

    describe('when the sender is the compliance', () => {
      describe('when the transfer is not approved', () => {
        it('should revert', async () => {
          const {
            suite: { compliance, conditionalTransferModule },
            accounts: { deployer, aliceWallet, bobWallet },
          } = await loadFixture(deployComplianceWithConditionalTransferModule);

          await expect(
            compliance
              .connect(deployer)
              .callModuleFunction(
                new ethers.utils.Interface(['function batchUnApproveTransfers(address, address[], address[], uint256[])']).encodeFunctionData(
                  'batchUnApproveTransfers',
                  [compliance.address, [aliceWallet.address], [bobWallet.address], [10]],
                ),
                conditionalTransferModule.address,
              ),
          ).to.be.revertedWith('not approved');
        });
      });

      it('should unapprove the transfers', async () => {
        const {
          suite: { compliance, conditionalTransferModule, token },
          accounts: { deployer, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.utils.Interface(['function batchApproveTransfers(address, address[], address[], uint256[])']).encodeFunctionData(
              'batchApproveTransfers',
              [compliance.address, [aliceWallet.address], [bobWallet.address], [10]],
            ),
            conditionalTransferModule.address,
          );

        const tx = await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.utils.Interface(['function batchUnApproveTransfers(address, address[], address[], uint256[])']).encodeFunctionData(
              'batchUnApproveTransfers',
              [compliance.address, [aliceWallet.address], [bobWallet.address], [10]],
            ),
            conditionalTransferModule.address,
          );

        await expect(tx).to.emit(conditionalTransferModule, 'ApprovalRemoved').withArgs(aliceWallet.address, bobWallet.address, 10, token.address);

        expect(
          await conditionalTransferModule.isTransferApproved(
            compliance.address,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, token.address),
          ),
        ).to.be.false;
      });
    });

    describe('when the sender is the token agent', () => {
      it('should unapprove the transfers', async () => {
        const {
          suite: { compliance, conditionalTransferModule, token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await conditionalTransferModule
          .connect(tokenAgent)
          .batchApproveTransfers(compliance.address, [aliceWallet.address], [bobWallet.address], [10]);

        const tx = await conditionalTransferModule
          .connect(tokenAgent)
          .batchUnApproveTransfers(compliance.address, [aliceWallet.address], [bobWallet.address], [10]);

        await expect(tx).to.emit(conditionalTransferModule, 'ApprovalRemoved').withArgs(aliceWallet.address, bobWallet.address, 10, token.address);

        expect(
          await conditionalTransferModule.isTransferApproved(
            compliance.address,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, token.address),
          ),
        ).to.be.false;
      });
    });
  });

  describe('.approveTransfer()', () => {
    describe('when the given compliance address is not bound', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet, charlieWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule.connect(anotherWallet).approveTransfer(charlieWallet.address, anotherWallet.address, anotherWallet.address, 10),
        ).to.be.revertedWith('compliance not bound');
      });
    });

    describe('when the sender is not the compliance or a token agent', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule, compliance },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule.connect(anotherWallet).approveTransfer(compliance.address, anotherWallet.address, anotherWallet.address, 10),
        ).to.be.revertedWithCustomError(conditionalTransferModule, `OnlyComplianceOwnerOrAgentCanCall`);
      });
    });

    describe('when the sender is the compliance', () => {
      it('should approve the transfer', async () => {
        const {
          suite: { compliance, conditionalTransferModule, token },
          accounts: { deployer, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        const tx = await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.utils.Interface(['function approveTransfer(address, address, address, uint256)']).encodeFunctionData('approveTransfer', [
              compliance.address,
              aliceWallet.address,
              bobWallet.address,
              10,
            ]),
            conditionalTransferModule.address,
          );

        await expect(tx).to.emit(conditionalTransferModule, 'TransferApproved').withArgs(aliceWallet.address, bobWallet.address, 10, token.address);

        expect(
          await conditionalTransferModule.isTransferApproved(
            compliance.address,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, token.address),
          ),
        ).to.be.true;

        await expect(
          conditionalTransferModule.getTransferApprovals(
            compliance.address,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, token.address),
          ),
        ).to.eventually.be.equal(1);
      });
    });

    describe('when the sender is the token agent', () => {
      it('should approve the transfer', async () => {
        const {
          suite: { compliance, conditionalTransferModule, token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        const tx = await conditionalTransferModule
          .connect(tokenAgent)
          .approveTransfer(compliance.address, aliceWallet.address, bobWallet.address, 10);

        await expect(tx).to.emit(conditionalTransferModule, 'TransferApproved').withArgs(aliceWallet.address, bobWallet.address, 10, token.address);

        expect(
          await conditionalTransferModule.isTransferApproved(
            compliance.address,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, token.address),
          ),
        ).to.be.true;

        await expect(
          conditionalTransferModule.getTransferApprovals(
            compliance.address,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, token.address),
          ),
        ).to.eventually.be.equal(1);
      });
    });
  });

  describe('.unApproveTransfer()', () => {
    describe('when the given compliance address is not bound', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet, charlieWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule.connect(anotherWallet).unApproveTransfer(charlieWallet.address, anotherWallet.address, anotherWallet.address, 10),
        ).to.be.revertedWith('compliance not bound');
      });
    });

    describe('when the sender is not the compliance or a token agent', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule, compliance },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule.connect(anotherWallet).unApproveTransfer(compliance.address, anotherWallet.address, anotherWallet.address, 10),
        ).to.be.revertedWithCustomError(conditionalTransferModule, `OnlyComplianceOwnerOrAgentCanCall`);
      });
    });

    describe('when the sender is the compliance', () => {
      describe('when the transfer is not approved', () => {
        it('should revert', async () => {
          const {
            suite: { compliance, conditionalTransferModule },
            accounts: { deployer, aliceWallet, bobWallet },
          } = await loadFixture(deployComplianceWithConditionalTransferModule);

          await expect(
            compliance
              .connect(deployer)
              .callModuleFunction(
                new ethers.utils.Interface(['function unApproveTransfer(address, address, address, uint256)']).encodeFunctionData(
                  'unApproveTransfer',
                  [compliance.address, aliceWallet.address, bobWallet.address, 10],
                ),
                conditionalTransferModule.address,
              ),
          ).to.be.revertedWith('not approved');
        });
      });

      it('should unapprove the transfer', async () => {
        const {
          suite: { compliance, conditionalTransferModule, token },
          accounts: { deployer, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.utils.Interface(['function approveTransfer(address, address, address, uint256)']).encodeFunctionData('approveTransfer', [
              compliance.address,
              aliceWallet.address,
              bobWallet.address,
              10,
            ]),
            conditionalTransferModule.address,
          );

        const tx = await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.utils.Interface(['function unApproveTransfer(address, address, address, uint256)']).encodeFunctionData('unApproveTransfer', [
              compliance.address,
              aliceWallet.address,
              bobWallet.address,
              10,
            ]),
            conditionalTransferModule.address,
          );

        await expect(tx).to.emit(conditionalTransferModule, 'ApprovalRemoved').withArgs(aliceWallet.address, bobWallet.address, 10, token.address);

        expect(
          await conditionalTransferModule.isTransferApproved(
            compliance.address,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, token.address),
          ),
        ).to.be.false;
      });
    });

    describe('when the sender is the token agent', () => {
      it('should unapprove the transfer', async () => {
        const {
          suite: { compliance, conditionalTransferModule, token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await conditionalTransferModule.connect(tokenAgent).approveTransfer(compliance.address, aliceWallet.address, bobWallet.address, 10);

        const tx = await conditionalTransferModule
          .connect(tokenAgent)
          .unApproveTransfer(compliance.address, aliceWallet.address, bobWallet.address, 10);

        await expect(tx).to.emit(conditionalTransferModule, 'ApprovalRemoved').withArgs(aliceWallet.address, bobWallet.address, 10, token.address);

        expect(
          await conditionalTransferModule.isTransferApproved(
            compliance.address,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, token.address),
          ),
        ).to.be.false;
      });
    });
  });

  describe('.moduleCheck()', () => {
    describe('when transfer is not approved', () => {
      it('should return false', async () => {
        const {
          suite: { compliance, conditionalTransferModule },
          accounts: { aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(conditionalTransferModule.moduleCheck(aliceWallet.address, bobWallet.address, 10, compliance.address)).to.eventually.be.false;
      });
    });

    describe('when transfer is approved', () => {
      it('should return true', async () => {
        const {
          suite: { compliance, conditionalTransferModule },
          accounts: { deployer, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.utils.Interface(['function batchApproveTransfers(address, address[], address[], uint256[])']).encodeFunctionData(
              'batchApproveTransfers',
              [compliance.address, [aliceWallet.address], [bobWallet.address], [10]],
            ),
            conditionalTransferModule.address,
          );

        await expect(conditionalTransferModule.moduleCheck(aliceWallet.address, bobWallet.address, 10, compliance.address)).to.eventually.be.true;
      });
    });
  });

  describe('.moduleBurnAction', () => {
    describe('when called by a random wallet', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(conditionalTransferModule.moduleBurnAction(anotherWallet.address, 10)).to.be.revertedWith('only bound compliance can call');
      });
    });

    describe('when called by the compliance', () => {
      it('should do nothing', async () => {
        const {
          suite: { conditionalTransferModule, compliance },
          accounts: { deployer, anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.utils.Interface(['function moduleBurnAction(address, uint256)']).encodeFunctionData('moduleBurnAction', [
                anotherWallet.address,
                10,
              ]),
              conditionalTransferModule.address,
            ),
        ).to.eventually.be.fulfilled;
      });
    });
  });

  describe('.moduleMintAction', () => {
    describe('when called by a random wallet', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(conditionalTransferModule.moduleMintAction(anotherWallet.address, 10)).to.be.revertedWith('only bound compliance can call');
      });
    });

    describe('when called by the compliance', () => {
      it('should do nothing', async () => {
        const {
          suite: { conditionalTransferModule, compliance },
          accounts: { deployer, anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.utils.Interface(['function moduleMintAction(address, uint256)']).encodeFunctionData('moduleMintAction', [
                anotherWallet.address,
                10,
              ]),
              conditionalTransferModule.address,
            ),
        ).to.eventually.be.fulfilled;
      });
    });
  });

  describe('.moduleTransferAction()', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule.connect(anotherWallet).moduleTransferAction(aliceWallet.address, bobWallet.address, 10),
        ).to.be.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling as the compliance', () => {
      describe('when the transfer is not approved', () => {
        it('should do nothing', async () => {
          const {
            suite: { compliance, conditionalTransferModule },
            accounts: { deployer, aliceWallet, bobWallet },
          } = await loadFixture(deployComplianceWithConditionalTransferModule);

          await expect(
            compliance
              .connect(deployer)
              .callModuleFunction(
                new ethers.utils.Interface(['function moduleTransferAction(address, address, uint256)']).encodeFunctionData('moduleTransferAction', [
                  aliceWallet.address,
                  bobWallet.address,
                  10,
                ]),
                conditionalTransferModule.address,
              ),
          ).to.eventually.be.fulfilled;
        });
      });

      describe('when the transfer is approved', () => {
        it('should remove the transfer approval', async () => {
          const {
            suite: { compliance, conditionalTransferModule, token },
            accounts: { deployer, aliceWallet, bobWallet },
          } = await loadFixture(deployComplianceWithConditionalTransferModule);

          await compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.utils.Interface(['function batchApproveTransfers(address, address[], address[], uint256[])']).encodeFunctionData(
                'batchApproveTransfers',
                [compliance.address, [aliceWallet.address], [bobWallet.address], [10]],
              ),
              conditionalTransferModule.address,
            );

          const tx = await expect(
            compliance
              .connect(deployer)
              .callModuleFunction(
                new ethers.utils.Interface(['function moduleTransferAction(address, address, uint256)']).encodeFunctionData('moduleTransferAction', [
                  aliceWallet.address,
                  bobWallet.address,
                  10,
                ]),
                conditionalTransferModule.address,
              ),
          ).to.eventually.be.fulfilled;

          await expect(tx).to.emit(conditionalTransferModule, 'ApprovalRemoved').withArgs(aliceWallet.address, bobWallet.address, 10, token.address);

          expect(
            await conditionalTransferModule.isTransferApproved(
              compliance.address,
              await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, token.address),
            ),
          ).to.be.false;
        });
      });
    });
  });
});
