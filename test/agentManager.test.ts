import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { deployFullSuiteFixture } from './fixtures/deploy-full-suite.fixture';

describe('AgentManager', () => {
  describe('.callForceTransfer', () => {
    describe('when specified identity is missing the TransferManager role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          agentManager.connect(aliceWallet).callForcedTransfer(aliceWallet.address, bobWallet.address, 200, aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotTransferManager');
      });
    });

    describe('when specified identity has the TransferManager role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, aliceWallet, bobWallet, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addTransferManager(aliceIdentity.target);

        await expect(
          agentManager.connect(anotherWallet).callForcedTransfer(aliceWallet.address, bobWallet.address, 200, aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotTransferManager');
      });
    });

    describe('when identity has the TransferManager role and the sender is authorized for it', () => {
      it('Should perform the transfer', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addTransferManager(aliceIdentity.target);

        const transferTx = await agentManager
          .connect(aliceWallet)
          .callForcedTransfer(aliceWallet.address, bobWallet.address, 200, aliceIdentity.target);

        await expect(transferTx).to.emit(token, 'Transfer').withArgs(aliceWallet.address, bobWallet.address, 200);
      });
    });
  });

  describe('.callBatchForceTransfer', () => {
    describe('when specified identity is missing the TransferManager role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          agentManager
            .connect(aliceWallet)
            .callBatchForcedTransfer(
              [aliceWallet.address, bobWallet.address],
              [bobWallet.address, aliceWallet.address],
              [200, 200],
              aliceIdentity.target,
            ),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotTransferManager');
      });
    });

    describe('when specified identity has the TransferManager role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, aliceWallet, bobWallet, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addTransferManager(aliceIdentity.target);

        await expect(
          agentManager
            .connect(anotherWallet)
            .callBatchForcedTransfer(
              [aliceWallet.address, bobWallet.address],
              [bobWallet.address, aliceWallet.address],
              [200, 200],
              aliceIdentity.target,
            ),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotTransferManager');
      });
    });

    describe('when identity has the TransferManager role and the sender is authorized for it', () => {
      it('Should perform the transfer', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addTransferManager(aliceIdentity.target);

        const transferTx = await agentManager
          .connect(aliceWallet)
          .callBatchForcedTransfer(
            [aliceWallet.address, bobWallet.address],
            [bobWallet.address, aliceWallet.address],
            [200, 200],
            aliceIdentity.target,
          );

        await expect(transferTx).to.emit(token, 'Transfer').withArgs(aliceWallet.address, bobWallet.address, 200);
        await expect(transferTx).to.emit(token, 'Transfer').withArgs(bobWallet.address, aliceWallet.address, 200);
      });
    });
  });

  describe('.callPause', () => {
    describe('when specified identity is missing the Freezer role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(agentManager.connect(aliceWallet).callPause(aliceIdentity.target)).to.be.revertedWithCustomError(
          agentManager,
          'SenderIsNotFreezer',
        );
      });
    });

    describe('when specified identity has the Freezer role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.target);

        await expect(agentManager.connect(anotherWallet).callPause(aliceIdentity.target)).to.be.revertedWithCustomError(
          agentManager,
          'SenderIsNotFreezer',
        );
      });
    });

    describe('when identity has the Freezer role and the sender is authorized for it', () => {
      it('Should perform the pause', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.target);

        const pauseTx = await agentManager.connect(aliceWallet).callPause(aliceIdentity.target);

        await expect(pauseTx).to.emit(token, 'Paused').withArgs(agentManager.target);
        await expect(token.paused()).to.be.eventually.true;
      });
    });
  });

  describe('.callUnpause', () => {
    describe('when specified identity is missing the Freezer role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(agentManager.connect(aliceWallet).callUnpause(aliceIdentity.target)).to.be.revertedWithCustomError(
          agentManager,
          'SenderIsNotFreezer',
        );
      });
    });

    describe('when specified identity has the Freezer role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.target);

        await expect(agentManager.connect(anotherWallet).callUnpause(aliceIdentity.target)).to.be.revertedWithCustomError(
          agentManager,
          'SenderIsNotFreezer',
        );
      });
    });

    describe('when identity has the Freezer role and the sender is authorized for it', () => {
      it('Should perform the pause', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.target);

        await agentManager.connect(aliceWallet).callPause(aliceIdentity.target);

        const pauseTx = await agentManager.connect(aliceWallet).callUnpause(aliceIdentity.target);

        await expect(pauseTx).to.emit(token, 'Unpaused').withArgs(agentManager.target);
      });
    });
  });

  describe('.callMint', () => {
    describe('when specified identity is missing the SupplyModifier role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(agentManager.connect(aliceWallet).callMint(bobWallet.address, 1000, aliceIdentity.target)).to.be.revertedWithCustomError(
          agentManager,
          'SenderIsNotSupplyModifier',
        );
      });
    });

    describe('when specified identity has the SupplyModifier role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, bobWallet, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addSupplyModifier(aliceIdentity.target);

        await expect(agentManager.connect(anotherWallet).callMint(bobWallet.address, 1000, aliceIdentity.target)).to.be.revertedWithCustomError(
          agentManager,
          'SenderIsNotSupplyModifier',
        );
      });
    });

    describe('when identity has the SupplyModifier role and the sender is authorized for it', () => {
      it('Should perform the mint', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addSupplyModifier(aliceIdentity.target);

        const mintTx = await agentManager.connect(aliceWallet).callMint(bobWallet.address, 1000, aliceIdentity.target);

        await expect(mintTx).to.emit(token, 'Transfer').withArgs(ethers.ZeroAddress, bobWallet.address, 1000);
      });
    });
  });

  describe('.callBatchMint', () => {
    describe('when specified identity is missing the SupplyModifier role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          agentManager.connect(aliceWallet).callBatchMint([bobWallet.address, aliceWallet.address], [1000, 500], aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotSupplyModifier');
      });
    });

    describe('when specified identity has the SupplyModifier role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, aliceWallet, bobWallet, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addSupplyModifier(aliceIdentity.target);

        await expect(
          agentManager.connect(anotherWallet).callBatchMint([bobWallet.address, aliceWallet.address], [1000, 500], aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotSupplyModifier');
      });
    });

    describe('when identity has the SupplyModifier role and the sender is authorized for it', () => {
      it('Should perform the batch mint', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addSupplyModifier(aliceIdentity.target);

        const mintTx = await agentManager
          .connect(aliceWallet)
          .callBatchMint([bobWallet.address, aliceWallet.address], [1000, 500], aliceIdentity.target);

        await expect(mintTx).to.emit(token, 'Transfer').withArgs(ethers.ZeroAddress, bobWallet.address, 1000);
        await expect(mintTx).to.emit(token, 'Transfer').withArgs(ethers.ZeroAddress, aliceWallet.address, 500);
      });
    });
  });

  describe('.callBurn', () => {
    describe('when specified identity is missing the SupplyModifier role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(agentManager.connect(aliceWallet).callBurn(bobWallet.address, 1000, aliceIdentity.target)).to.be.revertedWithCustomError(
          agentManager,
          'SenderIsNotSupplyModifier',
        );
      });
    });

    describe('when specified identity has the SupplyModifier role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, bobWallet, anotherWallet },
          identities: { bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addSupplyModifier(bobIdentity.target);

        await expect(agentManager.connect(anotherWallet).callBurn(bobWallet.address, 200, bobIdentity.target)).to.be.revertedWithCustomError(
          agentManager,
          'SenderIsNotSupplyModifier',
        );
      });
    });

    describe('when identity has the SupplyModifier role and the sender is authorized for it', () => {
      it('Should perform the burn', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, bobWallet },
          identities: { bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addSupplyModifier(bobIdentity.target);

        const burnTx = await agentManager.connect(bobWallet).callBurn(bobWallet.address, 200, bobIdentity.target);

        await expect(burnTx).to.emit(token, 'Transfer').withArgs(bobWallet.address, ethers.ZeroAddress, 200);
      });
    });
  });

  describe('.callBatchBurn', () => {
    describe('when specified identity is missing the SupplyModifier role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          agentManager.connect(aliceWallet).callBatchBurn([bobWallet.address, aliceWallet.address], [500, 1000], aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotSupplyModifier');
      });
    });

    describe('when specified identity has the SupplyModifier role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, aliceWallet, bobWallet, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addSupplyModifier(aliceIdentity.target);

        await expect(
          agentManager.connect(anotherWallet).callBatchBurn([bobWallet.address, aliceWallet.address], [500, 100], aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotSupplyModifier');
      });
    });

    describe('when identity has the SupplyModifier role and the sender is authorized for it', () => {
      it('Should perform the batch burn', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addSupplyModifier(aliceIdentity.target);

        const burnTx = await agentManager
          .connect(aliceWallet)
          .callBatchBurn([bobWallet.address, aliceWallet.address], [500, 100], aliceIdentity.target);

        await expect(burnTx).to.emit(token, 'Transfer').withArgs(bobWallet.address, ethers.ZeroAddress, 500);
        await expect(burnTx).to.emit(token, 'Transfer').withArgs(aliceWallet.address, ethers.ZeroAddress, 100);
      });
    });
  });

  describe('.callSetAddressFrozen', () => {
    describe('when specified identity is missing the Freezer role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          agentManager.connect(aliceWallet).callSetAddressFrozen(aliceIdentity.target, true, aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotFreezer');
      });
    });

    describe('when specified identity has the Freezer role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.target);

        await expect(
          agentManager.connect(anotherWallet).callSetAddressFrozen(aliceIdentity.target, true, aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotFreezer');
      });
    });

    describe('when identity has the Freezer role and the sender is authorized for it', () => {
      it('Should perform the freeze', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.target);

        const tx = await agentManager.connect(aliceWallet).callSetAddressFrozen(aliceWallet.address, true, aliceIdentity.target);

        await expect(tx).to.emit(token, 'AddressFrozen').withArgs(aliceWallet.address, true, agentManager.target);
        await expect(token.isFrozen(aliceWallet.address)).to.eventually.be.true;
      });
    });
  });

  describe('.callBatchSetAddressFrozen', () => {
    describe('when specified identity is missing the Freezer role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          agentManager.connect(aliceWallet).callBatchSetAddressFrozen([aliceIdentity.target, bobWallet.address], [true, false], aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotFreezer');
      });
    });

    describe('when specified identity has the Freezer role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, bobWallet, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.target);

        await expect(
          agentManager
            .connect(anotherWallet)
            .callBatchSetAddressFrozen([aliceIdentity.target, bobWallet.address], [true, false], aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotFreezer');
      });
    });

    describe('when identity has the Freezer role and the sender is authorized for it', () => {
      it('Should perform the batch pause', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.target);

        const pauseTx = await agentManager
          .connect(aliceWallet)
          .callBatchSetAddressFrozen([aliceWallet.address, bobWallet.address], [true, false], aliceIdentity.target);

        await expect(pauseTx).to.emit(token, 'AddressFrozen').withArgs(aliceWallet.address, true, agentManager.target);
        await expect(pauseTx).to.emit(token, 'AddressFrozen').withArgs(bobWallet.address, false, agentManager.target);
      });
    });
  });

  describe('.callFreezePartialTokens', () => {
    describe('when specified identity is missing the Freezer role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          agentManager.connect(aliceWallet).callFreezePartialTokens(aliceIdentity.target, 100, aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotFreezer');
      });
    });

    describe('when specified identity has the Freezer role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.target);

        await expect(
          agentManager.connect(anotherWallet).callFreezePartialTokens(aliceIdentity.target, 100, aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotFreezer');
      });
    });

    describe('when identity has the Freezer role and the sender is authorized for it', () => {
      it('Should perform the freeze of partial tokens', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.target);

        const freezeTx = await agentManager.connect(aliceWallet).callFreezePartialTokens(aliceWallet.address, 100, aliceIdentity.target);

        await expect(freezeTx).to.emit(token, 'TokensFrozen').withArgs(aliceWallet.address, 100);
      });
    });
  });

  describe('.callBatchFreezePartialTokens', () => {
    describe('when specified identity is missing the Freezer role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          agentManager.connect(aliceWallet).callBatchFreezePartialTokens([aliceWallet.address, bobWallet.address], [100, 200], aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotFreezer');
      });
    });

    describe('when specified identity has the Freezer role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, aliceWallet, bobWallet, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.target);

        await expect(
          agentManager
            .connect(anotherWallet)
            .callBatchFreezePartialTokens([aliceWallet.address, bobWallet.address], [100, 200], aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotFreezer');
      });
    });

    describe('when identity has the Freezer role and the sender is authorized for it', () => {
      it('Should perform the batch freeze of partial tokens', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.target);

        const freezeTx = await agentManager
          .connect(aliceWallet)
          .callBatchFreezePartialTokens([aliceWallet.address, bobWallet.address], [100, 200], aliceIdentity.target);

        await expect(freezeTx).to.emit(token, 'TokensFrozen').withArgs(aliceWallet.address, 100);
        await expect(freezeTx).to.emit(token, 'TokensFrozen').withArgs(bobWallet.address, 200);
      });
    });
  });

  describe('.callUnfreezePartialTokens', () => {
    describe('when specified identity is missing the Freezer role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          agentManager.connect(aliceWallet).callUnfreezePartialTokens(aliceIdentity.target, 100, aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotFreezer');
      });
    });

    describe('when specified identity has the Freezer role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.target);

        await expect(
          agentManager.connect(anotherWallet).callUnfreezePartialTokens(aliceIdentity.target, 100, aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotFreezer');
      });
    });

    describe('when identity has the Freezer role and the sender is authorized for it', () => {
      it('Should perform the unfreeze of partial tokens', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.target);

        await agentManager.connect(aliceWallet).callFreezePartialTokens(aliceWallet.address, 100, aliceIdentity.target);

        const freezeTx = await agentManager.connect(aliceWallet).callUnfreezePartialTokens(aliceWallet.address, 100, aliceIdentity.target);

        await expect(freezeTx).to.emit(token, 'TokensUnfrozen').withArgs(aliceWallet.address, 100);
      });
    });
  });

  describe('.callBatchUnfreezePartialTokens', () => {
    describe('when specified identity is missing the Freezer role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          agentManager
            .connect(aliceWallet)
            .callBatchUnfreezePartialTokens([aliceWallet.address, bobWallet.address], [100, 200], aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotFreezer');
      });
    });

    describe('when specified identity has the Freezer role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, aliceWallet, bobWallet, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.target);

        await expect(
          agentManager
            .connect(anotherWallet)
            .callBatchUnfreezePartialTokens([aliceWallet.address, bobWallet.address], [100, 200], aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotFreezer');
      });
    });

    describe('when identity has the Freezer role and the sender is authorized for it', () => {
      it('Should perform the batch unfreeze of partial tokens', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.target);

        await agentManager.connect(aliceWallet).callFreezePartialTokens(aliceWallet.address, 100, aliceIdentity.target);
        await agentManager.connect(aliceWallet).callFreezePartialTokens(bobWallet.address, 200, aliceIdentity.target);

        const freezeTx = await agentManager
          .connect(aliceWallet)
          .callBatchUnfreezePartialTokens([aliceWallet.address, bobWallet.address], [100, 200], aliceIdentity.target);

        await expect(freezeTx).to.emit(token, 'TokensUnfrozen').withArgs(aliceWallet.address, 100);
      });
    });
  });

  describe('.callRecoveryAddress', () => {
    describe('when specified identity is missing the RecoveryAgent role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet, bobWallet, anotherWallet },
          identities: { aliceIdentity, bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          agentManager.connect(aliceWallet).callRecoveryAddress(bobWallet.address, anotherWallet.address, bobIdentity.target, aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotRecoveryAgent');
      });
    });

    describe('when specified identity has the RecoveryAgent role but sender is not authorized for it', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, bobWallet, anotherWallet },
          identities: { aliceIdentity, bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addRecoveryAgent(aliceIdentity.target);

        await expect(
          agentManager.connect(anotherWallet).callRecoveryAddress(bobWallet.address, anotherWallet.address, bobIdentity.target, aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotRecoveryAgent');
      });
    });

    describe('when identity has the RecoveryAgent role and the sender is authorized for it', () => {
      it('Should perform the recovery of the address', async () => {
        const abiCoder = new ethers.AbiCoder();
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet, anotherWallet },
          identities: { aliceIdentity, bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addRecoveryAgent(aliceIdentity.target);

        await bobIdentity.connect(bobWallet).addKey(ethers.keccak256(abiCoder.encode(['address'], [anotherWallet.address])), 1, 1);

        const recoveryTx = await agentManager
          .connect(aliceWallet)
          .callRecoveryAddress(bobWallet.address, anotherWallet.address, bobIdentity.target, aliceIdentity.target);

        await expect(recoveryTx).to.emit(token, 'RecoverySuccess').withArgs(bobWallet.address, anotherWallet.address, bobIdentity.target);
      });
    });
  });

  describe('.callRegisterIdentity', () => {
    describe('when specified identity is missing the WhiteListManager role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet, bobWallet },
          identities: { aliceIdentity, bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          agentManager.connect(aliceWallet).callRegisterIdentity(bobWallet.address, bobIdentity.target, 42, aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotWhiteListManager');
      });
    });

    describe('when specified identity has the WhiteListManager role but sender is not authorized for it', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, bobWallet },
          identities: { aliceIdentity, bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addWhiteListManager(aliceIdentity.target);

        await expect(
          agentManager.connect(bobWallet).callRegisterIdentity(bobWallet.address, bobIdentity.target, 42, aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotWhiteListManager');
      });
    });

    describe('when identity has the WhitelistManager role and the sender is authorized for it', () => {
      it('Should perform the registration of the identity', async () => {
        const {
          suite: { agentManager, identityRegistry },
          accounts: { tokenAdmin, aliceWallet, charlieWallet },
          identities: { aliceIdentity, charlieIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addWhiteListManager(aliceIdentity.target);

        const registerTx = await agentManager
          .connect(aliceWallet)
          .callRegisterIdentity(charlieWallet.address, charlieIdentity.target, 42, aliceIdentity.target);

        await expect(registerTx).to.emit(identityRegistry, 'IdentityRegistered').withArgs(charlieWallet.address, charlieIdentity.target);

        await expect(identityRegistry.contains(charlieWallet.address)).to.eventually.be.true;
      });
    });
  });

  describe('.callUpdateIdentity', () => {
    describe('when specified identity is missing the WhiteListManager role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet, bobWallet },
          identities: { aliceIdentity, bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          agentManager.connect(aliceWallet).callUpdateIdentity(bobWallet.address, bobIdentity.target, aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotWhiteListManager');
      });
    });

    describe('when specified identity has the WhiteListManager role but sender is not authorized for it', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, bobWallet },
          identities: { aliceIdentity, bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addWhiteListManager(aliceIdentity.target);

        await expect(
          agentManager.connect(bobWallet).callUpdateIdentity(bobWallet.address, bobIdentity.target, aliceIdentity.target),
        ).to.be.revertedWithCustomError(agentManager, 'SenderIsNotWhiteListManager');
      });
    });

    describe('when identity has the WhitelistManager role and the sender is authorized for it', () => {
      it('Should perform the update of the identity', async () => {
        const {
          suite: { agentManager, identityRegistry },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity, bobIdentity, charlieIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addWhiteListManager(aliceIdentity.target);

        const updateTx = await agentManager.connect(aliceWallet).callUpdateIdentity(bobWallet.address, charlieIdentity.target, aliceIdentity.target);

        await expect(updateTx).to.emit(identityRegistry, 'IdentityUpdated').withArgs(bobIdentity.target, charlieIdentity.target);
      });
    });
  });

  describe('.callUpdateCountry', () => {
    describe('when specified identity is missing the WhiteListManager role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(agentManager.connect(aliceWallet).callUpdateCountry(bobWallet.address, 100, aliceIdentity.target)).to.be.revertedWithCustomError(
          agentManager,
          'SenderIsNotWhiteListManager',
        );
      });
    });

    describe('when specified identity has the WhiteListManager role but sender is not authorized for it', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addWhiteListManager(aliceIdentity.target);

        await expect(agentManager.connect(bobWallet).callUpdateCountry(bobWallet.address, 100, aliceIdentity.target)).to.be.revertedWithCustomError(
          agentManager,
          'SenderIsNotWhiteListManager',
        );
      });
    });

    describe('when identity has the WhitelistManager role and the sender is authorized for it', () => {
      it('Should perform the update of the country', async () => {
        const {
          suite: { agentManager, identityRegistry },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addWhiteListManager(aliceIdentity.target);

        const updateTx = await agentManager.connect(aliceWallet).callUpdateCountry(bobWallet.address, 100, aliceIdentity.target);

        await expect(updateTx).to.emit(identityRegistry, 'CountryUpdated').withArgs(bobWallet.address, 100);
      });
    });
  });

  describe('.callDeleteIdentity', () => {
    describe('when specified identity is missing the WhiteListManager role', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(agentManager.connect(aliceWallet).callDeleteIdentity(bobWallet.address, aliceIdentity.target)).to.be.revertedWithCustomError(
          agentManager,
          'SenderIsNotWhiteListManager',
        );
      });
    });

    describe('when specified identity has the WhiteListManager role but sender is not authorized for it', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addWhiteListManager(aliceIdentity.target);

        await expect(agentManager.connect(bobWallet).callDeleteIdentity(bobWallet.address, aliceIdentity.target)).to.be.revertedWithCustomError(
          agentManager,
          'SenderIsNotWhiteListManager',
        );
      });
    });

    describe('when identity has the WhitelistManager role and the sender is authorized for it', () => {
      it('Should perform the deletion of the identity', async () => {
        const {
          suite: { agentManager, identityRegistry },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity, bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addWhiteListManager(aliceIdentity.target);

        const deleteTx = await agentManager.connect(aliceWallet).callDeleteIdentity(bobWallet.address, aliceIdentity.target);

        await expect(deleteTx).to.emit(identityRegistry, 'IdentityRemoved').withArgs(bobWallet.address, bobIdentity.target);

        await expect(identityRegistry.contains(bobWallet.address)).to.eventually.be.false;
      });
    });
  });
});
