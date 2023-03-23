import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { deployFullSuiteFixture } from '../fixtures/deploy-full-suite.fixture';

describe('Token - Recovery', () => {
  describe('.recoveryAddress()', () => {
    describe('when sender is not an agent', () => {
      it('should reverts', async () => {
        const {
          suite: { token },
          accounts: { bobWallet, anotherWallet },
          identities: { bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await bobIdentity
          .connect(bobWallet)
          .addKey(ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [anotherWallet.address])), 1, 1);

        await expect(token.connect(anotherWallet).recoveryAddress(bobWallet.address, anotherWallet.address, bobIdentity.address)).to.be.revertedWith(
          'AgentRole: caller does not have the Agent role',
        );
      });
    });

    describe('when sender is an agent', () => {
      describe('when wallet to recover has no balance', () => {
        it('should revert', async () => {
          const {
            suite: { token },
            accounts: { tokenAgent, aliceWallet, bobWallet, anotherWallet },
            identities: { bobIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await token.connect(bobWallet).transfer(aliceWallet.address, await token.balanceOf(bobWallet.address));

          await expect(token.connect(tokenAgent).recoveryAddress(bobWallet.address, anotherWallet.address, bobIdentity.address)).to.be.revertedWith(
            'no tokens to recover',
          );
        });
      });

      describe('when new wallet is not authorized on the identity', () => {
        it('should revert', async () => {
          const {
            suite: { token },
            accounts: { tokenAgent, bobWallet, anotherWallet },
            identities: { bobIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(token.connect(tokenAgent).recoveryAddress(bobWallet.address, anotherWallet.address, bobIdentity.address)).to.be.revertedWith(
            'Recovery not possible',
          );
        });
      });

      describe('when wallet is frozen', () => {
        it('should recover and freeze the new wallet', async () => {
          const {
            suite: { token },
            accounts: { tokenAgent, bobWallet, anotherWallet },
            identities: { bobIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await bobIdentity
            .connect(bobWallet)
            .addKey(ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [anotherWallet.address])), 1, 1);

          await token.connect(tokenAgent).setAddressFrozen(bobWallet.address, true);

          const tx = await token.connect(tokenAgent).recoveryAddress(bobWallet.address, anotherWallet.address, bobIdentity.address);
          await expect(token.isFrozen(anotherWallet.address)).to.be.eventually.true;
          await expect(tx).to.emit(token, 'RecoverySuccess').withArgs(bobWallet.address, anotherWallet.address, bobIdentity.address);
          await expect(tx).to.emit(token, 'AddressFrozen').withArgs(anotherWallet.address, true, tokenAgent.address);
        });
      });

      describe('when wallet has frozen token', () => {
        it('should recover and freeze tokens on the new wallet', async () => {
          const {
            suite: { token },
            accounts: { tokenAgent, bobWallet, anotherWallet },
            identities: { bobIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await bobIdentity
            .connect(bobWallet)
            .addKey(ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [anotherWallet.address])), 1, 1);

          await token.connect(tokenAgent).freezePartialTokens(bobWallet.address, 50);

          const tx = await token.connect(tokenAgent).recoveryAddress(bobWallet.address, anotherWallet.address, bobIdentity.address);
          await expect(token.getFrozenTokens(anotherWallet.address)).to.be.eventually.eq(50);
          await expect(tx).to.emit(token, 'RecoverySuccess').withArgs(bobWallet.address, anotherWallet.address, bobIdentity.address);
          await expect(tx).to.emit(token, 'TokensFrozen').withArgs(anotherWallet.address, 50);
        });
      });
    });
  });
});
