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
          agentManager.connect(aliceWallet).callForcedTransfer(aliceWallet.address, bobWallet.address, 200, aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Transfer Manager');
      });
    });

    describe('when specified identity has the TransferManager role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, aliceWallet, bobWallet, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addTransferManager(aliceIdentity.address);

        await expect(
          agentManager.connect(anotherWallet).callForcedTransfer(aliceWallet.address, bobWallet.address, 200, aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Transfer Manager');
      });
    });

    describe('when identity has the TransferManager role and the sender is authorized for it', () => {
      it('Should perform the transfer', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addTransferManager(aliceIdentity.address);

        const transferTx = await agentManager
          .connect(aliceWallet)
          .callForcedTransfer(aliceWallet.address, bobWallet.address, 200, aliceIdentity.address);

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
              aliceIdentity.address,
            ),
        ).to.be.revertedWith('Role: Sender is NOT Transfer Manager');
      });
    });

    describe('when specified identity has the TransferManager role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, aliceWallet, bobWallet, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addTransferManager(aliceIdentity.address);

        await expect(
          agentManager
            .connect(anotherWallet)
            .callBatchForcedTransfer(
              [aliceWallet.address, bobWallet.address],
              [bobWallet.address, aliceWallet.address],
              [200, 200],
              aliceIdentity.address,
            ),
        ).to.be.revertedWith('Role: Sender is NOT Transfer Manager');
      });
    });

    describe('when identity has the TransferManager role and the sender is authorized for it', () => {
      it('Should perform the transfer', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addTransferManager(aliceIdentity.address);

        const transferTx = await agentManager
          .connect(aliceWallet)
          .callBatchForcedTransfer(
            [aliceWallet.address, bobWallet.address],
            [bobWallet.address, aliceWallet.address],
            [200, 200],
            aliceIdentity.address,
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

        await expect(agentManager.connect(aliceWallet).callPause(aliceIdentity.address)).to.be.revertedWith('Role: Sender is NOT Freezer');
      });
    });

    describe('when specified identity has the Freezer role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.address);

        await expect(agentManager.connect(anotherWallet).callPause(aliceIdentity.address)).to.be.revertedWith('Role: Sender is NOT Freezer');
      });
    });

    describe('when identity has the Freezer role and the sender is authorized for it', () => {
      it('Should perform the pause', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.address);

        const pauseTx = await agentManager.connect(aliceWallet).callPause(aliceIdentity.address);

        await expect(pauseTx).to.emit(token, 'Paused').withArgs(agentManager.address);
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

        await expect(agentManager.connect(aliceWallet).callUnpause(aliceIdentity.address)).to.be.revertedWith('Role: Sender is NOT Freezer');
      });
    });

    describe('when specified identity has the Freezer role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.address);

        await expect(agentManager.connect(anotherWallet).callUnpause(aliceIdentity.address)).to.be.revertedWith('Role: Sender is NOT Freezer');
      });
    });

    describe('when identity has the Freezer role and the sender is authorized for it', () => {
      it('Should perform the pause', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.address);

        await agentManager.connect(aliceWallet).callPause(aliceIdentity.address);

        const pauseTx = await agentManager.connect(aliceWallet).callUnpause(aliceIdentity.address);

        await expect(pauseTx).to.emit(token, 'Unpaused').withArgs(agentManager.address);
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

        await expect(agentManager.connect(aliceWallet).callMint(bobWallet.address, 1000, aliceIdentity.address)).to.be.revertedWith(
          'Role: Sender is NOT Supply Modifier',
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

        await agentManager.connect(tokenAdmin).addSupplyModifier(aliceIdentity.address);

        await expect(agentManager.connect(anotherWallet).callMint(bobWallet.address, 1000, aliceIdentity.address)).to.be.revertedWith(
          'Role: Sender is NOT Supply Modifier',
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

        await agentManager.connect(tokenAdmin).addSupplyModifier(aliceIdentity.address);

        const mintTx = await agentManager.connect(aliceWallet).callMint(bobWallet.address, 1000, aliceIdentity.address);

        await expect(mintTx).to.emit(token, 'Transfer').withArgs(ethers.constants.AddressZero, bobWallet.address, 1000);
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
          agentManager.connect(aliceWallet).callBatchMint([bobWallet.address, aliceWallet.address], [1000, 500], aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Supply Modifier');
      });
    });

    describe('when specified identity has the SupplyModifier role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, aliceWallet, bobWallet, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addSupplyModifier(aliceIdentity.address);

        await expect(
          agentManager.connect(anotherWallet).callBatchMint([bobWallet.address, aliceWallet.address], [1000, 500], aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Supply Modifier');
      });
    });

    describe('when identity has the SupplyModifier role and the sender is authorized for it', () => {
      it('Should perform the batch mint', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addSupplyModifier(aliceIdentity.address);

        const mintTx = await agentManager
          .connect(aliceWallet)
          .callBatchMint([bobWallet.address, aliceWallet.address], [1000, 500], aliceIdentity.address);

        await expect(mintTx).to.emit(token, 'Transfer').withArgs(ethers.constants.AddressZero, bobWallet.address, 1000);
        await expect(mintTx).to.emit(token, 'Transfer').withArgs(ethers.constants.AddressZero, aliceWallet.address, 500);
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

        await expect(agentManager.connect(aliceWallet).callBurn(bobWallet.address, 1000, aliceIdentity.address)).to.be.revertedWith(
          'Role: Sender is NOT Supply Modifier',
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

        await agentManager.connect(tokenAdmin).addSupplyModifier(bobIdentity.address);

        await expect(agentManager.connect(anotherWallet).callBurn(bobWallet.address, 200, bobIdentity.address)).to.be.revertedWith(
          'Role: Sender is NOT Supply Modifier',
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

        await agentManager.connect(tokenAdmin).addSupplyModifier(bobIdentity.address);

        const burnTx = await agentManager.connect(bobWallet).callBurn(bobWallet.address, 200, bobIdentity.address);

        await expect(burnTx).to.emit(token, 'Transfer').withArgs(bobWallet.address, ethers.constants.AddressZero, 200);
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
          agentManager.connect(aliceWallet).callBatchBurn([bobWallet.address, aliceWallet.address], [500, 1000], aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Supply Modifier');
      });
    });

    describe('when specified identity has the SupplyModifier role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, aliceWallet, bobWallet, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addSupplyModifier(aliceIdentity.address);

        await expect(
          agentManager.connect(anotherWallet).callBatchBurn([bobWallet.address, aliceWallet.address], [500, 100], aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Supply Modifier');
      });
    });

    describe('when identity has the SupplyModifier role and the sender is authorized for it', () => {
      it('Should perform the batch burn', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addSupplyModifier(aliceIdentity.address);

        const burnTx = await agentManager
          .connect(aliceWallet)
          .callBatchBurn([bobWallet.address, aliceWallet.address], [500, 100], aliceIdentity.address);

        await expect(burnTx).to.emit(token, 'Transfer').withArgs(bobWallet.address, ethers.constants.AddressZero, 500);
        await expect(burnTx).to.emit(token, 'Transfer').withArgs(aliceWallet.address, ethers.constants.AddressZero, 100);
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

        await expect(agentManager.connect(aliceWallet).callSetAddressFrozen(aliceIdentity.address, true, aliceIdentity.address)).to.be.revertedWith(
          'Role: Sender is NOT Freezer',
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

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.address);

        await expect(agentManager.connect(anotherWallet).callSetAddressFrozen(aliceIdentity.address, true, aliceIdentity.address)).to.be.revertedWith(
          'Role: Sender is NOT Freezer',
        );
      });
    });

    describe('when identity has the Freezer role and the sender is authorized for it', () => {
      it('Should perform the freeze', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.address);

        const tx = await agentManager.connect(aliceWallet).callSetAddressFrozen(aliceWallet.address, true, aliceIdentity.address);

        await expect(tx).to.emit(token, 'AddressFrozen').withArgs(aliceWallet.address, true, agentManager.address);
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
          agentManager
            .connect(aliceWallet)
            .callBatchSetAddressFrozen([aliceIdentity.address, bobWallet.address], [true, false], aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Freezer');
      });
    });

    describe('when specified identity has the Freezer role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, bobWallet, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.address);

        await expect(
          agentManager
            .connect(anotherWallet)
            .callBatchSetAddressFrozen([aliceIdentity.address, bobWallet.address], [true, false], aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Freezer');
      });
    });

    describe('when identity has the Freezer role and the sender is authorized for it', () => {
      it('Should perform the batch pause', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.address);

        const pauseTx = await agentManager
          .connect(aliceWallet)
          .callBatchSetAddressFrozen([aliceWallet.address, bobWallet.address], [true, false], aliceIdentity.address);

        await expect(pauseTx).to.emit(token, 'AddressFrozen').withArgs(aliceWallet.address, true, agentManager.address);
        await expect(pauseTx).to.emit(token, 'AddressFrozen').withArgs(bobWallet.address, false, agentManager.address);
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

        await expect(agentManager.connect(aliceWallet).callFreezePartialTokens(aliceIdentity.address, 100, aliceIdentity.address)).to.be.revertedWith(
          'Role: Sender is NOT Freezer',
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

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.address);

        await expect(
          agentManager.connect(anotherWallet).callFreezePartialTokens(aliceIdentity.address, 100, aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Freezer');
      });
    });

    describe('when identity has the Freezer role and the sender is authorized for it', () => {
      it('Should perform the freeze of partial tokens', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.address);

        const freezeTx = await agentManager.connect(aliceWallet).callFreezePartialTokens(aliceWallet.address, 100, aliceIdentity.address);

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
          agentManager.connect(aliceWallet).callBatchFreezePartialTokens([aliceWallet.address, bobWallet.address], [100, 200], aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Freezer');
      });
    });

    describe('when specified identity has the Freezer role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, aliceWallet, bobWallet, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.address);

        await expect(
          agentManager
            .connect(anotherWallet)
            .callBatchFreezePartialTokens([aliceWallet.address, bobWallet.address], [100, 200], aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Freezer');
      });
    });

    describe('when identity has the Freezer role and the sender is authorized for it', () => {
      it('Should perform the batch freeze of partial tokens', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.address);

        const freezeTx = await agentManager
          .connect(aliceWallet)
          .callBatchFreezePartialTokens([aliceWallet.address, bobWallet.address], [100, 200], aliceIdentity.address);

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
          agentManager.connect(aliceWallet).callUnfreezePartialTokens(aliceIdentity.address, 100, aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Freezer');
      });
    });

    describe('when specified identity has the Freezer role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.address);

        await expect(
          agentManager.connect(anotherWallet).callUnfreezePartialTokens(aliceIdentity.address, 100, aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Freezer');
      });
    });

    describe('when identity has the Freezer role and the sender is authorized for it', () => {
      it('Should perform the unfreeze of partial tokens', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.address);

        await agentManager.connect(aliceWallet).callFreezePartialTokens(aliceWallet.address, 100, aliceIdentity.address);

        const freezeTx = await agentManager.connect(aliceWallet).callUnfreezePartialTokens(aliceWallet.address, 100, aliceIdentity.address);

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
            .callBatchUnfreezePartialTokens([aliceWallet.address, bobWallet.address], [100, 200], aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Freezer');
      });
    });

    describe('when specified identity has the Freezer role but the sender is not authorized for it', () => {
      it('should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, aliceWallet, bobWallet, anotherWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.address);

        await expect(
          agentManager
            .connect(anotherWallet)
            .callBatchUnfreezePartialTokens([aliceWallet.address, bobWallet.address], [100, 200], aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Freezer');
      });
    });

    describe('when identity has the Freezer role and the sender is authorized for it', () => {
      it('Should perform the batch unfreeze of partial tokens', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addFreezer(aliceIdentity.address);

        await agentManager.connect(aliceWallet).callFreezePartialTokens(aliceWallet.address, 100, aliceIdentity.address);
        await agentManager.connect(aliceWallet).callFreezePartialTokens(bobWallet.address, 200, aliceIdentity.address);

        const freezeTx = await agentManager
          .connect(aliceWallet)
          .callBatchUnfreezePartialTokens([aliceWallet.address, bobWallet.address], [100, 200], aliceIdentity.address);

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
          agentManager.connect(aliceWallet).callRecoveryAddress(bobWallet.address, anotherWallet.address, bobIdentity.address, aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Recovery Agent');
      });
    });

    describe('when specified identity has the RecoveryAgent role but sender is not authorized for it', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, bobWallet, anotherWallet },
          identities: { aliceIdentity, bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addRecoveryAgent(aliceIdentity.address);

        await expect(
          agentManager
            .connect(anotherWallet)
            .callRecoveryAddress(bobWallet.address, anotherWallet.address, bobIdentity.address, aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT Recovery Agent');
      });
    });

    describe('when identity has the RecoveryAgent role and the sender is authorized for it', () => {
      it('Should perform the recovery of the address', async () => {
        const {
          suite: { agentManager, token },
          accounts: { tokenAdmin, aliceWallet, bobWallet, anotherWallet },
          identities: { aliceIdentity, bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addRecoveryAgent(aliceIdentity.address);

        await bobIdentity
          .connect(bobWallet)
          .addKey(ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [anotherWallet.address])), 1, 1);

        const recoveryTx = await agentManager
          .connect(aliceWallet)
          .callRecoveryAddress(bobWallet.address, anotherWallet.address, bobIdentity.address, aliceIdentity.address);

        await expect(recoveryTx).to.emit(token, 'RecoverySuccess').withArgs(bobWallet.address, anotherWallet.address, bobIdentity.address);
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
          agentManager.connect(aliceWallet).callRegisterIdentity(bobWallet.address, bobIdentity.address, 42, aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT WhiteList Manager');
      });
    });

    describe('when specified identity has the WhiteListManager role but sender is not authorized for it', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, bobWallet },
          identities: { aliceIdentity, bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addWhiteListManager(aliceIdentity.address);

        await expect(
          agentManager.connect(bobWallet).callRegisterIdentity(bobWallet.address, bobIdentity.address, 42, aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT WhiteList Manager');
      });
    });

    describe('when identity has the WhitelistManager role and the sender is authorized for it', () => {
      it('Should perform the registration of the identity', async () => {
        const {
          suite: { agentManager, identityRegistry },
          accounts: { tokenAdmin, aliceWallet, charlieWallet },
          identities: { aliceIdentity, charlieIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addWhiteListManager(aliceIdentity.address);

        const registerTx = await agentManager
          .connect(aliceWallet)
          .callRegisterIdentity(charlieWallet.address, charlieIdentity.address, 42, aliceIdentity.address);

        await expect(registerTx).to.emit(identityRegistry, 'IdentityRegistered').withArgs(charlieWallet.address, charlieIdentity.address);

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
          agentManager.connect(aliceWallet).callUpdateIdentity(bobWallet.address, bobIdentity.address, aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT WhiteList Manager');
      });
    });

    describe('when specified identity has the WhiteListManager role but sender is not authorized for it', () => {
      it('Should revert', async () => {
        const {
          suite: { agentManager },
          accounts: { tokenAdmin, bobWallet },
          identities: { aliceIdentity, bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addWhiteListManager(aliceIdentity.address);

        await expect(
          agentManager.connect(bobWallet).callUpdateIdentity(bobWallet.address, bobIdentity.address, aliceIdentity.address),
        ).to.be.revertedWith('Role: Sender is NOT WhiteList Manager');
      });
    });

    describe('when identity has the WhitelistManager role and the sender is authorized for it', () => {
      it('Should perform the update of the identity', async () => {
        const {
          suite: { agentManager, identityRegistry },
          accounts: { tokenAdmin, aliceWallet, bobWallet },
          identities: { aliceIdentity, bobIdentity, charlieIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await agentManager.connect(tokenAdmin).addWhiteListManager(aliceIdentity.address);

        const updateTx = await agentManager
          .connect(aliceWallet)
          .callUpdateIdentity(bobWallet.address, charlieIdentity.address, aliceIdentity.address);

        await expect(updateTx).to.emit(identityRegistry, 'IdentityUpdated').withArgs(bobIdentity.address, charlieIdentity.address);
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

        await expect(agentManager.connect(aliceWallet).callUpdateCountry(bobWallet.address, 100, aliceIdentity.address)).to.be.revertedWith(
          'Role: Sender is NOT WhiteList Manager',
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

        await agentManager.connect(tokenAdmin).addWhiteListManager(aliceIdentity.address);

        await expect(agentManager.connect(bobWallet).callUpdateCountry(bobWallet.address, 100, aliceIdentity.address)).to.be.revertedWith(
          'Role: Sender is NOT WhiteList Manager',
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

        await agentManager.connect(tokenAdmin).addWhiteListManager(aliceIdentity.address);

        const updateTx = await agentManager.connect(aliceWallet).callUpdateCountry(bobWallet.address, 100, aliceIdentity.address);

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

        await expect(agentManager.connect(aliceWallet).callDeleteIdentity(bobWallet.address, aliceIdentity.address)).to.be.revertedWith(
          'Role: Sender is NOT WhiteList Manager',
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

        await agentManager.connect(tokenAdmin).addWhiteListManager(aliceIdentity.address);

        await expect(agentManager.connect(bobWallet).callDeleteIdentity(bobWallet.address, aliceIdentity.address)).to.be.revertedWith(
          'Role: Sender is NOT WhiteList Manager',
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

        await agentManager.connect(tokenAdmin).addWhiteListManager(aliceIdentity.address);

        const deleteTx = await agentManager.connect(aliceWallet).callDeleteIdentity(bobWallet.address, aliceIdentity.address);

        await expect(deleteTx).to.emit(identityRegistry, 'IdentityRemoved').withArgs(bobWallet.address, bobIdentity.address);

        await expect(identityRegistry.contains(bobWallet.address)).to.eventually.be.false;
      });
    });
  });
});
