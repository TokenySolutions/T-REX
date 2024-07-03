import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers, upgrades } from 'hardhat';

import { deployFullSuiteFixture } from './fixtures/deploy-full-suite.fixture';

describe('DVATransferManager', () => {
  async function deployFullSuiteWithTransferManager() {
    const context = await loadFixture(deployFullSuiteFixture);

    const implementation = await ethers.deployContract('DVATransferManager');
    const transferManagerProxy = await ethers.deployContract('DVATransferManagerProxy', [implementation.target, '0x']);
    const transferManager = await ethers.getContractAt('DVATransferManager', transferManagerProxy.target);
    await transferManager.initialize();
    return {
      ...context,
      suite: {
        ...context.suite,
        transferManager,
      },
    };
  }

  async function deployFullSuiteWithVerifiedTransferManager() {
    const context = await loadFixture(deployFullSuiteWithTransferManager);
    await context.suite.token.connect(context.accounts.deployer).addAgent(context.suite.transferManager.target);
    return context;
  }

  async function signTransfer(
    transferID: string,
    signer: Signer,
  ): Promise<{
    v: number;
    r: string;
    s: string;
  }> {
    const rawSignature = await signer.signMessage(ethers.getBytes(transferID));
    const { v, r, s } = ethers.Signature.from(rawSignature);
    return { v, r, s };
  }

  async function deployFullSuiteWithNonSequentialTransfer() {
    const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
    await context.suite.transferManager
      .connect(context.accounts.deployer)
      .setApprovalCriteria(context.suite.token.target, true, true, false, [context.accounts.charlieWallet.address]);

    await context.suite.token.connect(context.accounts.aliceWallet).approve(context.suite.transferManager.target, 100000);
    const transferID = await context.suite.transferManager.calculateTransferID(
      0,
      context.accounts.aliceWallet.address,
      context.accounts.bobWallet.address,
      100,
    );

    await context.suite.transferManager
      .connect(context.accounts.aliceWallet)
      .initiateTransfer(context.suite.token.target, context.accounts.bobWallet.address, 100);

    return {
      ...context,
      transferID,
    };
  }

  async function deployFullSuiteWithSequentialTransfer() {
    const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
    await context.suite.transferManager
      .connect(context.accounts.deployer)
      .setApprovalCriteria(context.suite.token.target, true, true, true, [context.accounts.charlieWallet.address]);

    await context.suite.token.connect(context.accounts.aliceWallet).approve(context.suite.transferManager.target, 100000);
    const transferID = await context.suite.transferManager.calculateTransferID(
      0,
      context.accounts.aliceWallet.address,
      context.accounts.bobWallet.address,
      100,
    );

    await context.suite.transferManager
      .connect(context.accounts.aliceWallet)
      .initiateTransfer(context.suite.token.target, context.accounts.bobWallet.address, 100);

    return {
      ...context,
      transferID,
    };
  }

  describe('.initialize', () => {
    describe('when the contract is not initialized before', () => {
      it('should initialize', async () => {
        const context = await loadFixture(deployFullSuiteWithTransferManager);

        const implementation = await ethers.deployContract('DVATransferManager');
        const transferManagerProxy = await ethers.deployContract('DVATransferManagerProxy', [implementation.target, '0x']);
        const transferManager = await ethers.getContractAt('DVATransferManager', transferManagerProxy.target);
        await expect(transferManager.connect(context.accounts.deployer).initialize()).to.eventually.be.fulfilled;
        await expect(transferManager.owner()).to.eventually.be.eq(context.accounts.deployer.address);
      });
    });

    describe('when the contract is already initialized', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithTransferManager);
        // @dev Line below is commented due to Hardhat incompatibility with viaIR, should be tested with newer Hardhat version.
        // await expect(context.suite.transferManager.initialize()).to.eventually.be.rejectedWith('Initializable: contract is already initialized');
        await expect(context.suite.transferManager.initialize()).to.be.reverted;
      });
    });
  });

  describe('.setApprovalCriteria', () => {
    describe('when sender is not a token agent', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithTransferManager);

        await expect(
          context.suite.transferManager
            .connect(context.accounts.anotherWallet)
            .setApprovalCriteria(context.suite.token.target, false, true, true, []),
        ).to.be.revertedWithCustomError(context.suite.transferManager, `OnlyTokenOwnerCanCall`);
      });
    });

    describe('when sender is a token agent', () => {
      describe('when DVA Manager is not an agent of the token', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteWithTransferManager);

          await expect(
            context.suite.transferManager.connect(context.accounts.deployer).setApprovalCriteria(context.suite.token.target, false, true, true, []),
          ).to.be.revertedWithCustomError(context.suite.transferManager, `DVAManagerIsNotAnAgentOfTheToken`);
        });
      });

      describe('when DVA Manager is an agent of the token', () => {
        describe('when token is not already registered', () => {
          it('should modify approval criteria', async () => {
            const context = await loadFixture(deployFullSuiteWithTransferManager);
            await context.suite.token.connect(context.accounts.deployer).addAgent(context.suite.transferManager.target);

            const tx = context.suite.transferManager
              .connect(context.accounts.deployer)
              .setApprovalCriteria(context.suite.token.target, true, true, true, [
                context.accounts.anotherWallet.address,
                context.accounts.bobWallet.address,
              ]);
            await tx;

            const approvalCriteria = await context.suite.transferManager.getApprovalCriteria(context.suite.token.target);
            await expect(tx)
              .to.emit(context.suite.transferManager, 'ApprovalCriteriaSet')
              .withArgs(
                context.suite.token.target,
                true,
                true,
                true,
                [context.accounts.anotherWallet.address, context.accounts.bobWallet.address],
                approvalCriteria.hash,
              );
            expect(approvalCriteria.includeRecipientApprover).to.be.true;
            expect(approvalCriteria.includeAgentApprover).to.be.true;
            expect(approvalCriteria.sequentialApproval).to.be.true;
            expect(approvalCriteria.additionalApprovers).to.be.eql([context.accounts.anotherWallet.address, context.accounts.bobWallet.address]);
          });
        });

        describe('when token is already registered', () => {
          it('should modify approval criteria', async () => {
            const context = await loadFixture(deployFullSuiteWithTransferManager);
            await context.suite.token.connect(context.accounts.deployer).addAgent(context.suite.transferManager.target);

            await context.suite.transferManager
              .connect(context.accounts.deployer)
              .setApprovalCriteria(context.suite.token.target, true, true, true, [
                context.accounts.anotherWallet.address,
                context.accounts.bobWallet.address,
              ]);

            const previousApprovalCriteria = await context.suite.transferManager.getApprovalCriteria(context.suite.token.target);

            const tx = await context.suite.transferManager
              .connect(context.accounts.deployer)
              .setApprovalCriteria(context.suite.token.target, false, false, false, [context.accounts.davidWallet.address]);

            await tx.wait();
            const approvalCriteria = await context.suite.transferManager.getApprovalCriteria(context.suite.token.target);
            expect(approvalCriteria.includeRecipientApprover).to.be.false;
            expect(approvalCriteria.includeAgentApprover).to.be.false;
            expect(approvalCriteria.sequentialApproval).to.be.false;
            expect(approvalCriteria.additionalApprovers).to.be.eql([context.accounts.davidWallet.address]);
            expect(approvalCriteria.hash.toString()).not.to.be.eq(previousApprovalCriteria.hash.toString());

            await expect(tx)
              .to.emit(context.suite.transferManager, 'ApprovalCriteriaSet')
              .withArgs(context.suite.token.target, false, false, false, [context.accounts.davidWallet.address], approvalCriteria.hash);
          });
        });
      });
    });
  });

  describe('.initiateTransfer', () => {
    describe('when token is not registered to the DVA manager', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithTransferManager);

        await expect(
          context.suite.transferManager
            .connect(context.accounts.aliceWallet)
            .initiateTransfer(context.suite.token.target, context.accounts.bobWallet.address, 10),
        ).to.be.revertedWithCustomError(context.suite.transferManager, `TokenIsNotRegistered`);
      });
    });

    describe('when token is registered to the DVA manager', () => {
      describe('when recipient is not verified for the token', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
          await context.suite.transferManager
            .connect(context.accounts.deployer)
            .setApprovalCriteria(context.suite.token.target, true, true, true, [
              context.accounts.charlieWallet.address,
              context.accounts.anotherWallet.address,
            ]);

          await expect(
            context.suite.transferManager
              .connect(context.accounts.aliceWallet)
              .initiateTransfer(context.suite.token.target, context.accounts.anotherWallet.address, 10),
          ).to.be.revertedWithCustomError(context.suite.transferManager, `RecipientIsNotVerified`);
        });
      });

      describe('when amount is higher than sender balance', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
          await context.suite.transferManager
            .connect(context.accounts.deployer)
            .setApprovalCriteria(context.suite.token.target, true, true, true, [
              context.accounts.charlieWallet.address,
              context.accounts.anotherWallet.address,
            ]);

          await context.suite.token.connect(context.accounts.aliceWallet).approve(context.suite.transferManager.target, 100000);

          await expect(
            context.suite.transferManager
              .connect(context.accounts.aliceWallet)
              .initiateTransfer(context.suite.token.target, context.accounts.bobWallet.address, 100000),
          ).to.be.revertedWithCustomError(context.suite.token, 'ERC20InsufficientBalance');
        });
      });

      describe('when sender has enough balance', () => {
        describe('when includeRecipientApprover is true', () => {
          it('should initiate the transfer with recipient approver', async () => {
            const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
            await context.suite.transferManager
              .connect(context.accounts.deployer)
              .setApprovalCriteria(context.suite.token.target, true, false, true, []);

            await context.suite.token.connect(context.accounts.aliceWallet).approve(context.suite.transferManager.target, 100000);
            const transferID = await context.suite.transferManager.calculateTransferID(
              0,
              context.accounts.aliceWallet.address,
              context.accounts.bobWallet.address,
              100,
            );

            const tx = context.suite.transferManager
              .connect(context.accounts.aliceWallet)
              .initiateTransfer(context.suite.token.target, context.accounts.bobWallet.address, 100);

            await expect(tx)
              .to.emit(context.suite.transferManager, 'TransferInitiated')
              .withArgs(
                transferID,
                context.suite.token.target,
                context.accounts.aliceWallet.address,
                context.accounts.bobWallet.address,
                100,
                (await context.suite.transferManager.getApprovalCriteria(context.suite.token.target)).hash,
              );

            await (await tx).wait();
            const transfer = await context.suite.transferManager.getTransfer(transferID);
            expect(transfer.approvers.length).to.be.eq(1);
            expect(transfer.approvers[0]['wallet']).to.be.eq(context.accounts.bobWallet.address);
            expect(transfer.approvers[0]['approved']).to.be.false;
          });
        });

        describe('when includeAgentApprover is true', () => {
          it('should initiate the transfer with token agent approver', async () => {
            const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
            await context.suite.transferManager
              .connect(context.accounts.deployer)
              .setApprovalCriteria(context.suite.token.target, false, true, true, []);

            await context.suite.token.connect(context.accounts.aliceWallet).approve(context.suite.transferManager.target, 100000);
            const transferID = await context.suite.transferManager.calculateTransferID(
              0,
              context.accounts.aliceWallet.address,
              context.accounts.bobWallet.address,
              100,
            );

            const tx = context.suite.transferManager
              .connect(context.accounts.aliceWallet)
              .initiateTransfer(context.suite.token.target, context.accounts.bobWallet.address, 100);

            await expect(tx)
              .to.emit(context.suite.transferManager, 'TransferInitiated')
              .withArgs(
                transferID,
                context.suite.token.target,
                context.accounts.aliceWallet.address,
                context.accounts.bobWallet.address,
                100,
                (await context.suite.transferManager.getApprovalCriteria(context.suite.token.target)).hash,
              );

            await (await tx).wait();
            const transfer = await context.suite.transferManager.getTransfer(transferID);
            expect(transfer.approvers.length).to.be.eq(1);
            expect(transfer.approvers[0]['wallet']).to.be.eq('0x0000000000000000000000000000000000000000');
            expect(transfer.approvers[0]['approved']).to.be.false;
          });
        });

        describe('when additional approvers exist', () => {
          it('should initiate the transfer with token agent approver', async () => {
            const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
            await context.suite.transferManager
              .connect(context.accounts.deployer)
              .setApprovalCriteria(context.suite.token.target, false, false, true, [
                context.accounts.charlieWallet.address,
                context.accounts.anotherWallet.address,
              ]);

            await context.suite.token.connect(context.accounts.aliceWallet).approve(context.suite.transferManager.target, 100000);
            const transferID = await context.suite.transferManager.calculateTransferID(
              0,
              context.accounts.aliceWallet.address,
              context.accounts.bobWallet.address,
              100,
            );

            const tx = context.suite.transferManager
              .connect(context.accounts.aliceWallet)
              .initiateTransfer(context.suite.token.target, context.accounts.bobWallet.address, 100);

            await expect(tx)
              .to.emit(context.suite.transferManager, 'TransferInitiated')
              .withArgs(
                transferID,
                context.suite.token.target,
                context.accounts.aliceWallet.address,
                context.accounts.bobWallet.address,
                100,
                (await context.suite.transferManager.getApprovalCriteria(context.suite.token.target)).hash,
              );

            const transfer = await context.suite.transferManager.getTransfer(transferID);
            expect(transfer.approvers.length).to.be.eq(2);
            expect(transfer.approvers[0]['wallet']).to.be.eq(context.accounts.charlieWallet.address);
            expect(transfer.approvers[0]['approved']).to.be.false;
            expect(transfer.approvers[1]['wallet']).to.be.eq(context.accounts.anotherWallet.address);
            expect(transfer.approvers[1]['approved']).to.be.false;
          });
        });

        describe('when all criteria are enabled', () => {
          it('should initiate the transfer with all approvers', async () => {
            const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
            await context.suite.transferManager
              .connect(context.accounts.deployer)
              .setApprovalCriteria(context.suite.token.target, true, true, true, [
                context.accounts.charlieWallet.address,
                context.accounts.anotherWallet.address,
              ]);

            await context.suite.token.connect(context.accounts.aliceWallet).approve(context.suite.transferManager.target, 100000);
            const transferID = await context.suite.transferManager.calculateTransferID(
              0,
              context.accounts.aliceWallet.address,
              context.accounts.bobWallet.address,
              100,
            );

            const tx = context.suite.transferManager
              .connect(context.accounts.aliceWallet)
              .initiateTransfer(context.suite.token.target, context.accounts.bobWallet.address, 100);

            await expect(tx)
              .to.emit(context.suite.transferManager, 'TransferInitiated')
              .withArgs(
                transferID,
                context.suite.token.target,
                context.accounts.aliceWallet.address,
                context.accounts.bobWallet.address,
                100,
                (await context.suite.transferManager.getApprovalCriteria(context.suite.token.target)).hash,
              );

            await (await tx).wait();
            const transfer = await context.suite.transferManager.getTransfer(transferID);
            expect(transfer.approvers.length).to.be.eq(4);
            expect(transfer.approvers[0]['wallet']).to.be.eq(context.accounts.bobWallet.address);
            expect(transfer.approvers[0]['approved']).to.be.false;
            expect(transfer.approvers[1]['wallet']).to.be.eq('0x0000000000000000000000000000000000000000');
            expect(transfer.approvers[1]['approved']).to.be.false;
            expect(transfer.approvers[2]['wallet']).to.be.eq(context.accounts.charlieWallet.address);
            expect(transfer.approvers[2]['approved']).to.be.false;
            expect(transfer.approvers[3]['wallet']).to.be.eq(context.accounts.anotherWallet.address);
            expect(transfer.approvers[3]['approved']).to.be.false;

            const senderBalance = await context.suite.token.balanceOf(context.accounts.aliceWallet.address);
            expect(senderBalance).to.be.eq(1000);

            const frozenBalance = await context.suite.token.getFrozenTokens(context.accounts.aliceWallet.address);
            expect(frozenBalance).to.be.eq(100);
          });
        });
      });
    });
  });

  describe('.approveTransfer', () => {
    describe('when transfer does not exist', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
        const transferID = await context.suite.transferManager.calculateTransferID(
          0,
          context.accounts.aliceWallet.address,
          context.accounts.bobWallet.address,
          100,
        );

        await expect(context.suite.transferManager.approveTransfer(transferID)).to.be.revertedWithCustomError(
          context.suite.transferManager,
          `InvalidTransferID`,
        );
      });
    });

    describe('when transfer status is not pending', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
        await context.suite.transferManager.connect(context.accounts.aliceWallet).cancelTransfer(context.transferID);

        await expect(context.suite.transferManager.approveTransfer(context.transferID)).to.be.revertedWithCustomError(
          context.suite.transferManager,
          `TransferIsNotInPendingStatus`,
        );
      });
    });

    describe('when approval criteria are changed after the transfer has been initiated', () => {
      describe('when trying to approve before approval state reset', () => {
        it('should reset approvers', async () => {
          const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
          const modifyTx = await context.suite.transferManager
            .connect(context.accounts.deployer)
            .setApprovalCriteria(context.suite.token.target, false, false, false, [context.accounts.davidWallet.address]);

          await modifyTx.wait();
          const tx = context.suite.transferManager.connect(context.accounts.charlieWallet).approveTransfer(context.transferID);
          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferApprovalStateReset')
            .withArgs(context.transferID, (await context.suite.transferManager.getApprovalCriteria(context.suite.token.target)).hash);

          await (await tx).wait();
          const transfer = await context.suite.transferManager.getTransfer(context.transferID);
          expect(transfer.approvers.length).to.be.eq(1);
          expect(transfer.approvers[0]['wallet']).to.be.eq(context.accounts.davidWallet.address);
          expect(transfer.approvers[0]['approved']).to.be.false;
        });
      });

      describe('when trying to approve after approval state reset', () => {
        it('should approve', async () => {
          const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
          const modifyTx = await context.suite.transferManager
            .connect(context.accounts.deployer)
            .setApprovalCriteria(context.suite.token.target, false, false, false, [context.accounts.davidWallet.address]);

          await modifyTx.wait();
          const resetTx = await context.suite.transferManager.connect(context.accounts.charlieWallet).approveTransfer(context.transferID);
          await resetTx.wait();

          const tx = context.suite.transferManager.connect(context.accounts.davidWallet).approveTransfer(context.transferID);
          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferApproved')
            .withArgs(context.transferID, context.accounts.davidWallet.address);
        });
      });
    });

    describe('when sequential approval is disabled', () => {
      describe('when caller is not an approver', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
          await expect(context.suite.transferManager.approveTransfer(context.transferID)).to.be.revertedWithCustomError(
            context.suite.transferManager,
            `ApproverNotFound`,
          );
        });
      });

      describe('when caller is the last approver', () => {
        it('should approve', async () => {
          const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
          const tx = context.suite.transferManager.connect(context.accounts.charlieWallet).approveTransfer(context.transferID);
          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferApproved')
            .withArgs(context.transferID, context.accounts.charlieWallet.address);
        });
      });

      describe('when all parties approve the transfer', () => {
        it('should complete', async () => {
          const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);

          await context.suite.transferManager.connect(context.accounts.tokenAgent).approveTransfer(context.transferID);
          await context.suite.transferManager.connect(context.accounts.bobWallet).approveTransfer(context.transferID);
          const tx = context.suite.transferManager.connect(context.accounts.charlieWallet).approveTransfer(context.transferID);

          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferApproved')
            .withArgs(context.transferID, context.accounts.charlieWallet.address);

          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferCompleted')
            .withArgs(context.transferID, context.suite.token.target, context.accounts.aliceWallet.address, context.accounts.bobWallet.address, 100);

          const transfer = await context.suite.transferManager.getTransfer(context.transferID);
          expect(transfer.status).to.be.eq(1);

          const senderBalance = await context.suite.token.balanceOf(context.accounts.aliceWallet.address);
          expect(senderBalance).to.be.eq(900);

          const receiverBalance = await context.suite.token.balanceOf(context.accounts.bobWallet.address);
          expect(receiverBalance).to.be.eq(600);

          const dvaBalance = await context.suite.token.balanceOf(context.suite.transferManager.target);
          expect(dvaBalance).to.be.eq(0);
        });
      });
    });

    describe('when sequential approval is enabled', () => {
      describe('when caller is not the next approver', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteWithSequentialTransfer);
          await expect(
            context.suite.transferManager.connect(context.accounts.charlieWallet).approveTransfer(context.transferID),
          ).to.be.revertedWithCustomError(context.suite.transferManager, `ApprovalsMustBeSequential`);
        });
      });

      describe('when caller is the next approver and it is a token agent', () => {
        it('should approve', async () => {
          const context = await loadFixture(deployFullSuiteWithSequentialTransfer);
          await context.suite.transferManager.connect(context.accounts.bobWallet).approveTransfer(context.transferID);
          const tx = context.suite.transferManager.connect(context.accounts.tokenAgent).approveTransfer(context.transferID);

          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferApproved')
            .withArgs(context.transferID, context.accounts.tokenAgent.address);
        });
      });

      describe('when all parties approve the transfer', () => {
        it('should complete', async () => {
          const context = await loadFixture(deployFullSuiteWithSequentialTransfer);

          await context.suite.transferManager.connect(context.accounts.bobWallet).approveTransfer(context.transferID);
          await context.suite.transferManager.connect(context.accounts.tokenAgent).approveTransfer(context.transferID);
          const tx = context.suite.transferManager.connect(context.accounts.charlieWallet).approveTransfer(context.transferID);

          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferApproved')
            .withArgs(context.transferID, context.accounts.charlieWallet.address);

          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferCompleted')
            .withArgs(context.transferID, context.suite.token.target, context.accounts.aliceWallet.address, context.accounts.bobWallet.address, 100);

          const transfer = await context.suite.transferManager.getTransfer(context.transferID);
          expect(transfer.status).to.be.eq(1);

          const senderBalance = await context.suite.token.balanceOf(context.accounts.aliceWallet.address);
          expect(senderBalance).to.be.eq(900);

          const receiverBalance = await context.suite.token.balanceOf(context.accounts.bobWallet.address);
          expect(receiverBalance).to.be.eq(600);

          const dvaBalance = await context.suite.token.balanceOf(context.suite.transferManager.target);
          expect(dvaBalance).to.be.eq(0);
        });
      });
    });
  });

  describe('.delegateApproveTransfer', () => {
    describe('when signatures array is empty', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
        const transferID = await context.suite.transferManager.calculateTransferID(
          0,
          context.accounts.aliceWallet.address,
          context.accounts.bobWallet.address,
          100,
        );

        await expect(context.suite.transferManager.delegateApproveTransfer(transferID, [])).to.be.revertedWithCustomError(
          context.suite.transferManager,
          `SignaturesCanNotBeEmpty`,
        );
      });
    });

    describe('when transfer does not exist', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
        const transferID = await context.suite.transferManager.calculateTransferID(
          0,
          context.accounts.aliceWallet.address,
          context.accounts.bobWallet.address,
          100,
        );

        await expect(
          context.suite.transferManager.delegateApproveTransfer(transferID, [await signTransfer(transferID, context.accounts.charlieWallet)]),
        ).to.be.revertedWithCustomError(context.suite.transferManager, `InvalidTransferID`);
      });
    });

    describe('when transfer status is not pending', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
        await context.suite.transferManager.connect(context.accounts.aliceWallet).cancelTransfer(context.transferID);

        await expect(
          context.suite.transferManager.delegateApproveTransfer(context.transferID, [
            await signTransfer(context.transferID, context.accounts.charlieWallet),
          ]),
        ).to.be.revertedWithCustomError(context.suite.transferManager, `TransferIsNotInPendingStatus`);
      });
    });

    describe('when approval criteria are changed after the transfer has been initiated', () => {
      describe('when trying to approve before approval state reset', () => {
        it('should reset approvers', async () => {
          const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
          const modifyTx = await context.suite.transferManager
            .connect(context.accounts.deployer)
            .setApprovalCriteria(context.suite.token.target, false, false, false, [context.accounts.davidWallet.address]);

          await modifyTx.wait();
          const tx = context.suite.transferManager
            .connect(context.accounts.anotherWallet)
            .delegateApproveTransfer(context.transferID, [await signTransfer(context.transferID, context.accounts.charlieWallet)]);

          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferApprovalStateReset')
            .withArgs(context.transferID, (await context.suite.transferManager.getApprovalCriteria(context.suite.token.target)).hash);

          await (await tx).wait();
          const transfer = await context.suite.transferManager.getTransfer(context.transferID);
          expect(transfer.approvers.length).to.be.eq(1);
          expect(transfer.approvers[0]['wallet']).to.be.eq(context.accounts.davidWallet.address);
          expect(transfer.approvers[0]['approved']).to.be.false;
        });
      });

      describe('when trying to approve after approval state reset', () => {
        it('should approve', async () => {
          const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
          const modifyTx = await context.suite.transferManager
            .connect(context.accounts.deployer)
            .setApprovalCriteria(context.suite.token.target, false, false, false, [context.accounts.davidWallet.address]);

          await modifyTx.wait();
          const resetTx = await context.suite.transferManager.connect(context.accounts.charlieWallet).approveTransfer(context.transferID);
          await resetTx.wait();

          const tx = context.suite.transferManager
            .connect(context.accounts.anotherWallet)
            .delegateApproveTransfer(context.transferID, [await signTransfer(context.transferID, context.accounts.davidWallet)]);
          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferApproved')
            .withArgs(context.transferID, context.accounts.davidWallet.address);
        });
      });
    });

    describe('when sequential approval is disabled', () => {
      describe('when caller is not an approver', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
          await expect(
            context.suite.transferManager.delegateApproveTransfer(context.transferID, [
              await signTransfer(context.transferID, context.accounts.anotherWallet),
            ]),
          ).to.be.revertedWithCustomError(context.suite.transferManager, `ApproverNotFound`);
        });
      });

      describe('when signer is an approver', () => {
        it('should approve', async () => {
          const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
          const tx = context.suite.transferManager
            .connect(context.accounts.anotherWallet)
            .delegateApproveTransfer(context.transferID, [await signTransfer(context.transferID, context.accounts.charlieWallet)]);

          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferApproved')
            .withArgs(context.transferID, context.accounts.charlieWallet.address);
        });
      });

      describe('when all parties approve the transfer', () => {
        it('should complete', async () => {
          const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);

          const tx = await context.suite.transferManager
            .connect(context.accounts.tokenAgent)
            .delegateApproveTransfer(context.transferID, [
              await signTransfer(context.transferID, context.accounts.tokenAgent),
              await signTransfer(context.transferID, context.accounts.bobWallet),
              await signTransfer(context.transferID, context.accounts.charlieWallet),
            ]);

          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferApproved')
            .withArgs(context.transferID, context.accounts.tokenAgent.address)
            .to.emit(context.suite.transferManager, 'TransferApproved')
            .withArgs(context.transferID, context.accounts.bobWallet.address)
            .to.emit(context.suite.transferManager, 'TransferApproved')
            .withArgs(context.transferID, context.accounts.charlieWallet.address);

          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferCompleted')
            .withArgs(context.transferID, context.suite.token.target, context.accounts.aliceWallet.address, context.accounts.bobWallet.address, 100);

          const transfer = await context.suite.transferManager.getTransfer(context.transferID);
          expect(transfer.status).to.be.eq(1);

          const senderBalance = await context.suite.token.balanceOf(context.accounts.aliceWallet.address);
          expect(senderBalance).to.be.eq(900);

          const receiverBalance = await context.suite.token.balanceOf(context.accounts.bobWallet.address);
          expect(receiverBalance).to.be.eq(600);

          const dvaBalance = await context.suite.token.balanceOf(context.suite.transferManager.target);
          expect(dvaBalance).to.be.eq(0);
        });
      });
    });
  });

  describe('.cancelTransfer', () => {
    describe('when transfer does not exist', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
        const transferID = await context.suite.transferManager.calculateTransferID(
          0,
          context.accounts.aliceWallet.address,
          context.accounts.bobWallet.address,
          100,
        );

        await expect(context.suite.transferManager.cancelTransfer(transferID)).to.be.revertedWithCustomError(
          context.suite.transferManager,
          `InvalidTransferID`,
        );
      });
    });

    describe('when caller is not sender', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
        await expect(
          context.suite.transferManager.connect(context.accounts.bobWallet).cancelTransfer(context.transferID),
        ).to.be.revertedWithCustomError(context.suite.transferManager, `OnlyTransferSenderCanCall`);
      });
    });

    describe('when transfer status is not pending', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
        await context.suite.transferManager.connect(context.accounts.aliceWallet).cancelTransfer(context.transferID);

        await expect(
          context.suite.transferManager.connect(context.accounts.aliceWallet).cancelTransfer(context.transferID),
        ).to.be.revertedWithCustomError(context.suite.transferManager, `TransferIsNotInPendingStatus`);
      });
    });

    describe('when transfer status is pending', () => {
      it('should cancel', async () => {
        const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);

        const tx = await context.suite.transferManager.connect(context.accounts.aliceWallet).cancelTransfer(context.transferID);
        await expect(tx).to.emit(context.suite.transferManager, 'TransferCancelled').withArgs(context.transferID);

        const transfer = await context.suite.transferManager.getTransfer(context.transferID);
        expect(transfer.status).to.be.eq(2);

        const senderBalance = await context.suite.token.balanceOf(context.accounts.aliceWallet.address);
        expect(senderBalance).to.be.eq(1000);
      });
    });
  });

  describe('.rejectTransfer', () => {
    describe('when transfer does not exist', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
        const transferID = await context.suite.transferManager.calculateTransferID(
          0,
          context.accounts.aliceWallet.address,
          context.accounts.bobWallet.address,
          100,
        );

        await expect(context.suite.transferManager.rejectTransfer(transferID)).to.be.revertedWithCustomError(
          context.suite.transferManager,
          `InvalidTransferID`,
        );
      });
    });

    describe('when transfer status is not pending', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
        await context.suite.transferManager.connect(context.accounts.aliceWallet).cancelTransfer(context.transferID);

        await expect(context.suite.transferManager.rejectTransfer(context.transferID)).to.be.revertedWithCustomError(
          context.suite.transferManager,
          `TransferIsNotInPendingStatus`,
        );
      });
    });

    describe('when sequential approval is disabled', () => {
      describe('when caller is not an approver', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
          await expect(context.suite.transferManager.rejectTransfer(context.transferID)).to.be.revertedWithCustomError(
            context.suite.transferManager,
            `ApproverNotFound`,
          );
        });
      });

      describe('when caller is the last approver', () => {
        it('should reject', async () => {
          const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
          const tx = context.suite.transferManager.connect(context.accounts.charlieWallet).rejectTransfer(context.transferID);
          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferRejected')
            .withArgs(context.transferID, context.accounts.charlieWallet.address);

          const transfer = await context.suite.transferManager.getTransfer(context.transferID);
          expect(transfer.status).to.be.eq(3);

          const senderBalance = await context.suite.token.balanceOf(context.accounts.aliceWallet.address);
          expect(senderBalance).to.be.eq(1000);
        });
      });
    });

    describe('when sequential approval is enabled', () => {
      describe('when caller is not the next approver', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteWithSequentialTransfer);
          await expect(
            context.suite.transferManager.connect(context.accounts.charlieWallet).rejectTransfer(context.transferID),
          ).to.be.revertedWithCustomError(context.suite.transferManager, `ApprovalsMustBeSequential`);
        });
      });

      describe('when caller is the next approver and it is a token agent', () => {
        it('should reject', async () => {
          const context = await loadFixture(deployFullSuiteWithSequentialTransfer);
          await context.suite.transferManager.connect(context.accounts.bobWallet).approveTransfer(context.transferID);
          const tx = context.suite.transferManager.connect(context.accounts.tokenAgent).rejectTransfer(context.transferID);

          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferRejected')
            .withArgs(context.transferID, context.accounts.tokenAgent.address);

          const transfer = await context.suite.transferManager.getTransfer(context.transferID);
          expect(transfer.status).to.be.eq(3);

          const senderBalance = await context.suite.token.balanceOf(context.accounts.aliceWallet.address);
          expect(senderBalance).to.be.eq(1000);
        });
      });
    });

    describe('when approval criteria are changed after the transfer has been initiated', () => {
      describe('when trying to reject before approval state reset', () => {
        it('should reset approvers', async () => {
          const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
          const modifyTx = await context.suite.transferManager
            .connect(context.accounts.deployer)
            .setApprovalCriteria(context.suite.token.target, false, false, false, [context.accounts.davidWallet.address]);

          await modifyTx.wait();
          const tx = context.suite.transferManager.connect(context.accounts.charlieWallet).rejectTransfer(context.transferID);
          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferApprovalStateReset')
            .withArgs(context.transferID, (await context.suite.transferManager.getApprovalCriteria(context.suite.token.target)).hash);

          await (await tx).wait();
          const transfer = await context.suite.transferManager.getTransfer(context.transferID);
          expect(transfer.approvers.length).to.be.eq(1);
          expect(transfer.approvers[0]['wallet']).to.be.eq(context.accounts.davidWallet.address);
          expect(transfer.approvers[0]['approved']).to.be.false;
        });
      });

      describe('when trying to reject after approval state reset', () => {
        it('should reject', async () => {
          const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
          const modifyTx = await context.suite.transferManager
            .connect(context.accounts.deployer)
            .setApprovalCriteria(context.suite.token.target, false, false, false, [context.accounts.davidWallet.address]);

          await modifyTx.wait();
          const resetTx = await context.suite.transferManager.connect(context.accounts.charlieWallet).rejectTransfer(context.transferID);
          await resetTx.wait();

          const tx = context.suite.transferManager.connect(context.accounts.davidWallet).rejectTransfer(context.transferID);

          await expect(tx)
            .to.emit(context.suite.transferManager, 'TransferRejected')
            .withArgs(context.transferID, context.accounts.davidWallet.address);

          const transfer = await context.suite.transferManager.getTransfer(context.transferID);
          expect(transfer.status).to.be.eq(3);

          const senderBalance = await context.suite.token.balanceOf(context.accounts.aliceWallet.address);
          expect(senderBalance).to.be.eq(1000);
        });
      });
    });
  });

  describe('.upgradeTo', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithTransferManager);
        await expect(context.suite.transferManager.connect(context.accounts.aliceWallet).upgradeTo(ethers.ZeroAddress)).to.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when calling with owner account', () => {
      it('should upgrade proxy', async () => {
        // given
        const context = await loadFixture(deployFullSuiteWithTransferManager);
        const newImplementation = await ethers.deployContract('DVATransferManager');

        // when
        await context.suite.transferManager.connect(context.accounts.deployer).upgradeTo(newImplementation.target);

        // then
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(context.suite.transferManager.target);
        expect(implementationAddress).to.eq(newImplementation.target);
      });
    });
  });

  describe('.getTransfer', () => {
    describe('when transfer does not exist', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
        const transferID = await context.suite.transferManager.calculateTransferID(
          0,
          context.accounts.aliceWallet.address,
          context.accounts.bobWallet.address,
          100,
        );

        await expect(context.suite.transferManager.getTransfer(transferID)).to.be.revertedWithCustomError(
          context.suite.transferManager,
          `InvalidTransferID`,
        );
      });
    });

    describe('when transfer exists', () => {
      it('should return transfer', async () => {
        const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);

        const transfer = await context.suite.transferManager.getTransfer(context.transferID);
        expect(transfer.tokenAddress).to.be.eq(context.suite.token.target);
        expect(transfer.sender).to.be.eq(context.accounts.aliceWallet.address);
        expect(transfer.recipient).to.be.eq(context.accounts.bobWallet.address);
        expect(transfer.amount).to.be.eq(100);
        expect(transfer.status).to.be.eq(0);
        expect(transfer.approvers.length).to.be.eq(3);
        expect(transfer.approvers[0].wallet).to.be.eq(context.accounts.bobWallet.address);
        expect(transfer.approvers[0].approved).to.be.false;
        expect(transfer.approvers[1].wallet).to.be.eq('0x0000000000000000000000000000000000000000');
        expect(transfer.approvers[1].approved).to.be.false;
        expect(transfer.approvers[2].wallet).to.be.eq(context.accounts.charlieWallet.address);
        expect(transfer.approvers[2].approved).to.be.false;
      });
    });
  });

  describe('.getNextTxNonce', () => {
    describe('when there is no transfer', () => {
      it('should return zero', async () => {
        const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
        const nonce = await context.suite.transferManager.getNextTxNonce();
        expect(nonce).to.be.eq(0);
      });
    });

    describe('when one transfer exists', () => {
      it('should return one', async () => {
        const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
        const nonce = await context.suite.transferManager.getNextTxNonce();
        expect(nonce).to.be.eq(1);
      });
    });
  });

  describe('.getNextApprover', () => {
    describe('when transfer does not exist', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
        const transferID = await context.suite.transferManager.calculateTransferID(
          0,
          context.accounts.aliceWallet.address,
          context.accounts.bobWallet.address,
          100,
        );

        await expect(context.suite.transferManager.getNextApprover(transferID)).to.be.revertedWithCustomError(
          context.suite.transferManager,
          `InvalidTransferID`,
        );
      });
    });

    describe('when transfer status is not pending', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithNonSequentialTransfer);
        await context.suite.transferManager.connect(context.accounts.aliceWallet).cancelTransfer(context.transferID);

        await expect(
          context.suite.transferManager.connect(context.accounts.aliceWallet).getNextApprover(context.transferID),
        ).to.be.revertedWithCustomError(context.suite.transferManager, `TransferIsNotInPendingStatus`);
      });
    });

    describe('when no one approved the transfer', () => {
      it('should return first approver', async () => {
        const context = await loadFixture(deployFullSuiteWithSequentialTransfer);
        const { nextApprover, anyTokenAgent } = await context.suite.transferManager.getNextApprover(context.transferID);
        expect(nextApprover).to.be.eq(context.accounts.bobWallet.address);
        expect(anyTokenAgent).to.be.false;
      });
    });

    describe('when one approver approved the transfer', () => {
      it('should return second approver (token agent)', async () => {
        const context = await loadFixture(deployFullSuiteWithSequentialTransfer);
        await context.suite.transferManager.connect(context.accounts.bobWallet).approveTransfer(context.transferID);
        const { nextApprover, anyTokenAgent } = await context.suite.transferManager.getNextApprover(context.transferID);
        expect(nextApprover).to.be.eq('0x0000000000000000000000000000000000000000');
        expect(anyTokenAgent).to.be.true;
      });
    });
  });

  describe('.getApprovalCriteria', () => {
    describe('when token is not registered', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);
        await expect(context.suite.transferManager.getApprovalCriteria(context.suite.token.target)).to.be.revertedWithCustomError(
          context.suite.transferManager,
          `TokenIsNotRegistered`,
        );
      });
    });

    describe('when token is registered', () => {
      it('should return criteria', async () => {
        const context = await loadFixture(deployFullSuiteWithSequentialTransfer);
        const approvalCriteria = await context.suite.transferManager.getApprovalCriteria(context.suite.token.target);
        expect(approvalCriteria.includeRecipientApprover).to.be.true;
        expect(approvalCriteria.includeAgentApprover).to.be.true;
        expect(approvalCriteria.sequentialApproval).to.be.true;
        expect(approvalCriteria.additionalApprovers).to.be.eql([context.accounts.charlieWallet.address]);
      });
    });
  });

  describe('.name', () => {
    it('should return the name of the module', async () => {
      const context = await loadFixture(deployFullSuiteWithVerifiedTransferManager);

      expect(await context.suite.transferManager.name()).to.be.equal('DVATransferManager');
    });
  });
});
