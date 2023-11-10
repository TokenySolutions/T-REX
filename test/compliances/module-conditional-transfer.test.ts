import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';

describe('ConditionalTransferModule', () => {
  async function deployComplianceWithConditionalTransferModule() {
    const context = await loadFixture(deployComplianceFixture);
    const { compliance } = context.suite;

    const conditionalTransferModule = await ethers.deployContract('ConditionalTransferModule');
    await compliance.addModule(conditionalTransferModule.address);

    const mockContract = await ethers.deployContract('MockContract');

    await compliance.bindToken(mockContract.address);

    return { ...context, suite: { ...context.suite, conditionalTransferModule, mockContract } };
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
    describe('when the sender is not the compliance', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule.connect(anotherWallet).batchApproveTransfers([anotherWallet.address], [anotherWallet.address], [10]),
        ).to.be.revertedWith('only bound compliance can call');
      });
    });

    describe('when the sender is the compliance', () => {
      it('should approve the transfers', async () => {
        const {
          suite: { compliance, conditionalTransferModule, mockContract },
          accounts: { deployer, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        const tx = await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.utils.Interface(['function batchApproveTransfers(address[], address[], uint256[])']).encodeFunctionData(
              'batchApproveTransfers',
              [[aliceWallet.address], [bobWallet.address], [10]],
            ),
            conditionalTransferModule.address,
          );

        await expect(tx)
          .to.emit(conditionalTransferModule, 'TransferApproved')
          .withArgs(aliceWallet.address, bobWallet.address, 10, mockContract.address);

        expect(
          await conditionalTransferModule.isTransferApproved(
            compliance.address,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, mockContract.address),
          ),
        ).to.be.true;

        await expect(
          conditionalTransferModule.getTransferApprovals(
            compliance.address,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, mockContract.address),
          ),
        ).to.eventually.be.equal(1);
      });
    });
  });

  describe('.batchUnApproveTransfers()', () => {
    describe('when the sender is not the compliance', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule.connect(anotherWallet).batchUnApproveTransfers([anotherWallet.address], [anotherWallet.address], [10]),
        ).to.be.revertedWith('only bound compliance can call');
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
                new ethers.utils.Interface(['function batchUnApproveTransfers(address[], address[], uint256[])']).encodeFunctionData(
                  'batchUnApproveTransfers',
                  [[aliceWallet.address], [bobWallet.address], [10]],
                ),
                conditionalTransferModule.address,
              ),
          ).to.be.revertedWith('not approved');
        });
      });

      it('should unapprove the transfers', async () => {
        const {
          suite: { compliance, conditionalTransferModule, mockContract },
          accounts: { deployer, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.utils.Interface(['function batchApproveTransfers(address[], address[], uint256[])']).encodeFunctionData(
              'batchApproveTransfers',
              [[aliceWallet.address], [bobWallet.address], [10]],
            ),
            conditionalTransferModule.address,
          );

        const tx = await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.utils.Interface(['function batchUnApproveTransfers(address[], address[], uint256[])']).encodeFunctionData(
              'batchUnApproveTransfers',
              [[aliceWallet.address], [bobWallet.address], [10]],
            ),
            conditionalTransferModule.address,
          );

        await expect(tx)
          .to.emit(conditionalTransferModule, 'ApprovalRemoved')
          .withArgs(aliceWallet.address, bobWallet.address, 10, mockContract.address);

        expect(
          await conditionalTransferModule.isTransferApproved(
            compliance.address,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, mockContract.address),
          ),
        ).to.be.false;
      });
    });
  });

  describe('.approveTransfer()', () => {
    describe('when the sender is not the compliance', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule.connect(anotherWallet).approveTransfer(anotherWallet.address, anotherWallet.address, 10),
        ).to.be.revertedWith('only bound compliance can call');
      });
    });
  });

  describe('.unApproveTransfer()', () => {
    describe('when the sender is not the compliance', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule.connect(anotherWallet).unApproveTransfer(anotherWallet.address, anotherWallet.address, 10),
        ).to.be.revertedWith('only bound compliance can call');
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
            new ethers.utils.Interface(['function batchApproveTransfers(address[], address[], uint256[])']).encodeFunctionData(
              'batchApproveTransfers',
              [[aliceWallet.address], [bobWallet.address], [10]],
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
            suite: { compliance, conditionalTransferModule, mockContract },
            accounts: { deployer, aliceWallet, bobWallet },
          } = await loadFixture(deployComplianceWithConditionalTransferModule);

          await compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.utils.Interface(['function batchApproveTransfers(address[], address[], uint256[])']).encodeFunctionData(
                'batchApproveTransfers',
                [[aliceWallet.address], [bobWallet.address], [10]],
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

          await expect(tx)
            .to.emit(conditionalTransferModule, 'ApprovalRemoved')
            .withArgs(aliceWallet.address, bobWallet.address, 10, mockContract.address);

          expect(
            await conditionalTransferModule.isTransferApproved(
              compliance.address,
              await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, mockContract.address),
            ),
          ).to.be.false;
        });
      });
    });
  });
});
