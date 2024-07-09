import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { deployFullSuiteFixture, deploySuiteWithModularCompliancesFixture } from '../fixtures/deploy-full-suite.fixture';

describe('Token - Transfers', () => {
  describe('.approve()', () => {
    it('should approve a contract to spend a certain amount of tokens', async () => {
      const {
        suite: { token },
        accounts: { aliceWallet, anotherWallet },
      } = await loadFixture(deployFullSuiteFixture);

      const tx = await token.connect(aliceWallet).approve(anotherWallet.address, 100);
      await expect(tx).to.emit(token, 'Approval').withArgs(aliceWallet.address, anotherWallet.address, 100);

      await expect(token.allowance(aliceWallet.address, anotherWallet.address)).to.eventually.equal(100);
    });
  });

  describe('.increaseAllowance()', () => {
    it('should increase the allowance of a contract to spend a certain amount of tokens', async () => {
      const {
        suite: { token },
        accounts: { aliceWallet, anotherWallet },
      } = await loadFixture(deployFullSuiteFixture);

      await token.connect(aliceWallet).approve(anotherWallet.address, 100);

      const tx = await token.connect(aliceWallet).increaseAllowance(anotherWallet.address, 100);
      await expect(tx).to.emit(token, 'Approval').withArgs(aliceWallet.address, anotherWallet.address, 200);

      await expect(token.allowance(aliceWallet.address, anotherWallet.address)).to.eventually.equal(200);
    });
  });

  describe('.decreaseAllowance()', () => {
    it('should decrease the allowance of a contract to spend a certain amount of tokens', async () => {
      const {
        suite: { token },
        accounts: { aliceWallet, anotherWallet },
      } = await loadFixture(deployFullSuiteFixture);

      await token.connect(aliceWallet).approve(anotherWallet.address, 150);

      const tx = await token.connect(aliceWallet).decreaseAllowance(anotherWallet.address, 100);
      await expect(tx).to.emit(token, 'Approval').withArgs(aliceWallet.address, anotherWallet.address, 50);

      await expect(token.allowance(aliceWallet.address, anotherWallet.address)).to.eventually.equal(50);
    });
  });

  describe('.transfer()', () => {
    describe('when the token is paused', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await token.connect(tokenAgent).pause();

        await expect(token.connect(aliceWallet).transfer(bobWallet.address, 100)).to.be.revertedWithCustomError(token, 'EnforcedPause');
      });
    });

    describe('when the recipient balance is frozen', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { tokenAgent, aliceWallet, bobWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await token.connect(tokenAgent).setAddressFrozen(bobWallet.address, true);

        await expect(token.connect(aliceWallet).transfer(bobWallet.address, 100)).to.be.revertedWithCustomError(token, 'FrozenWallet');
      });
    });

    describe('when the sender balance is frozen', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { tokenAgent, aliceWallet, bobWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await token.connect(tokenAgent).setAddressFrozen(aliceWallet.address, true);

        await expect(token.connect(aliceWallet).transfer(bobWallet.address, 100)).to.be.revertedWithCustomError(token, 'FrozenWallet');
      });
    });

    describe('when the sender has not enough balance', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet },
        } = await loadFixture(deployFullSuiteFixture);

        const balance = await token.balanceOf(aliceWallet.address);

        await expect(token.connect(aliceWallet).transfer(bobWallet.address, balance + 1000n)).to.be.revertedWithCustomError(
          token,
          'ERC20InsufficientBalance',
        );
      });
    });

    describe('when the sender has not enough balance unfrozen', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        const balance = await token.balanceOf(aliceWallet.address);
        await token.connect(tokenAgent).freezePartialTokens(aliceWallet.address, balance - 100n);

        await expect(token.connect(aliceWallet).transfer(bobWallet.address, balance)).to.be.revertedWithCustomError(
          token,
          'ERC20InsufficientBalance',
        );
      });
    });

    describe('when the recipient identity is not verified', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(aliceWallet).transfer(anotherWallet.address, 100)).to.be.revertedWithCustomError(token, 'TransferNotPossible');
      });
    });

    describe('when the transfer breaks compliance rules', () => {
      it('should revert', async () => {
        const {
          suite: { token, compliance },
          accounts: { aliceWallet, bobWallet },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        const complianceModuleA = await ethers.deployContract('CountryAllowModule');
        await compliance.addModule(complianceModuleA.target);
        await token.setCompliance(compliance.target);

        await expect(token.connect(aliceWallet).transfer(bobWallet.address, 100)).to.be.revertedWithCustomError(token, 'TransferNotPossible');
      });
    });

    describe('when the transfer is compliant', () => {
      it('should transfer tokens', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet },
        } = await loadFixture(deployFullSuiteFixture);

        const tx = await token.connect(aliceWallet).transfer(bobWallet.address, 100);
        await expect(tx).to.emit(token, 'Transfer').withArgs(aliceWallet.address, bobWallet.address, 100);
      });
    });
  });

  describe('.batchTransfer()', () => {
    it('should transfer tokens', async () => {
      const {
        suite: { token },
        accounts: { aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);

      const tx = await token.connect(aliceWallet).batchTransfer([bobWallet.address, bobWallet.address], [100, 200]);
      await expect(tx).to.emit(token, 'Transfer').withArgs(aliceWallet.address, bobWallet.address, 100);
      await expect(tx).to.emit(token, 'Transfer').withArgs(aliceWallet.address, bobWallet.address, 200);
    });
  });

  describe('.transferFrom()', () => {
    describe('when the token is paused', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await token.connect(tokenAgent).pause();

        await expect(token.connect(aliceWallet).transferFrom(aliceWallet.address, bobWallet.address, 100)).to.be.revertedWithCustomError(
          token,
          'EnforcedPause',
        );
      });
    });

    describe('when sender address is frozen', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await token.connect(tokenAgent).setAddressFrozen(aliceWallet.address, true);

        await expect(token.connect(aliceWallet).transferFrom(aliceWallet.address, bobWallet.address, 100)).to.be.revertedWithCustomError(
          token,
          'FrozenWallet',
        );
      });
    });

    describe('when recipient address is frozen', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await token.connect(tokenAgent).setAddressFrozen(bobWallet.address, true);

        await expect(token.connect(aliceWallet).transferFrom(aliceWallet.address, bobWallet.address, 100)).to.be.revertedWithCustomError(
          token,
          'FrozenWallet',
        );
      });
    });

    describe('when sender has not enough balance', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet },
        } = await loadFixture(deployFullSuiteFixture);

        const balance = await token.balanceOf(aliceWallet.address);

        await expect(token.connect(aliceWallet).transferFrom(aliceWallet.address, bobWallet.address, balance + 1000n)).to.be.revertedWithCustomError(
          token,
          'ERC20InsufficientBalance',
        );
      });
    });

    describe('when sender has not enough balance unfrozen', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        const balance = await token.balanceOf(aliceWallet.address);
        await token.connect(tokenAgent).freezePartialTokens(aliceWallet.address, balance - 100n);

        await expect(token.connect(aliceWallet).transferFrom(aliceWallet.address, bobWallet.address, balance)).to.be.revertedWithCustomError(
          token,
          'ERC20InsufficientBalance',
        );
      });
    });

    describe('when the recipient identity is not verified', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(aliceWallet).transferFrom(aliceWallet.address, anotherWallet.address, 100)).to.be.revertedWithCustomError(
          token,
          'TransferNotPossible',
        );
      });
    });

    describe('when the transfer breaks compliance rules', () => {
      it('should revert', async () => {
        const {
          suite: { token, compliance },
          accounts: { aliceWallet, bobWallet },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        const complianceModuleA = await ethers.deployContract('CountryAllowModule');
        await compliance.addModule(complianceModuleA.target);
        await token.setCompliance(compliance.target);

        await expect(token.connect(aliceWallet).transferFrom(aliceWallet.address, bobWallet.address, 100)).to.be.revertedWithCustomError(
          token,
          'TransferNotPossible',
        );
      });
    });

    describe('when the transfer is compliant', () => {
      it('should transfer tokens and reduce allowance of transferred value', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet, anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await token.connect(aliceWallet).approve(anotherWallet.address, 100);

        const tx = await token.connect(anotherWallet).transferFrom(aliceWallet.address, bobWallet.address, 100);
        await expect(tx).to.emit(token, 'Transfer').withArgs(aliceWallet.address, bobWallet.address, 100);

        await expect(token.allowance(aliceWallet.address, anotherWallet.address)).to.be.eventually.equal(0);
      });
    });
  });

  describe('.forcedTransfer()', () => {
    describe('when sender is not an agent', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(aliceWallet).forcedTransfer(aliceWallet.address, bobWallet.address, 100)).to.be.revertedWithCustomError(
          token,
          'CallerDoesNotHaveAgentRole',
        );
      });
    });

    describe('when agent permission is restricted', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await token.setAgentRestrictions(tokenAgent.address, {
          disableAddressFreeze: false,
          disableBurn: false,
          disableForceTransfer: true,
          disableMint: false,
          disablePartialFreeze: false,
          disablePause: false,
          disableRecovery: false,
        });

        await expect(token.connect(tokenAgent).forcedTransfer(aliceWallet.address, bobWallet.address, 100)).to.be.revertedWithCustomError(
          token,
          'AgentNotAuthorized',
        );
      });
    });

    describe('when source wallet has not enough balance', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        const balance = await token.balanceOf(aliceWallet.address);

        await expect(token.connect(tokenAgent).forcedTransfer(aliceWallet.address, bobWallet.address, balance + 1000n)).to.be.revertedWithCustomError(
          token,
          'ERC20InsufficientBalance',
        );
      });
    });

    describe('when recipient identity is not verified', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, anotherWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(tokenAgent).forcedTransfer(aliceWallet.address, anotherWallet.address, 100)).to.be.revertedWithCustomError(
          token,
          'TransferNotPossible',
        );
      });
    });

    describe('when the transfer breaks compliance rules', () => {
      it('should still transfer tokens', async () => {
        const {
          suite: { token, compliance },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        const complianceModuleA = await ethers.deployContract('CountryAllowModule');
        await compliance.addModule(complianceModuleA.target);
        await token.setCompliance(compliance.target);

        const tx = await token.connect(tokenAgent).forcedTransfer(aliceWallet.address, bobWallet.address, 100);
        await expect(tx).to.emit(token, 'Transfer').withArgs(aliceWallet.address, bobWallet.address, 100);
      });
    });

    describe('when amount is greater than unfrozen balance', () => {
      it('should unfroze tokens', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        const balance = await token.balanceOf(aliceWallet.address);
        await token.connect(tokenAgent).freezePartialTokens(aliceWallet.address, balance - 100n);

        const tx = await token.connect(tokenAgent).forcedTransfer(aliceWallet.address, bobWallet.address, balance - 50n);
        await expect(tx)
          .to.emit(token, 'Transfer')
          .withArgs(aliceWallet.address, bobWallet.address, balance - 50n);
        await expect(tx)
          .to.emit(token, 'TokensUnfrozen')
          .withArgs(aliceWallet.address, balance - 150n);
        await expect(token.getFrozenTokens(aliceWallet.address)).to.be.eventually.equal(50);
      });
    });
  });

  describe('.mint()', () => {
    describe('when sender is not an agent', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(aliceWallet).mint(aliceWallet.address, 100)).to.be.revertedWithCustomError(token, 'CallerDoesNotHaveAgentRole');
      });
    });

    describe('when agent permission is restricted', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await token.setAgentRestrictions(tokenAgent.address, {
          disableAddressFreeze: false,
          disableBurn: false,
          disableForceTransfer: false,
          disableMint: true,
          disablePartialFreeze: false,
          disablePause: false,
          disableRecovery: false,
        });

        await expect(token.connect(tokenAgent).mint(aliceWallet.address, 100)).to.be.revertedWithCustomError(token, 'AgentNotAuthorized');
      });
    });

    describe('when recipient identity is not verified', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { anotherWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(tokenAgent).mint(anotherWallet.address, 100)).to.be.revertedWithCustomError(token, 'UnverifiedIdentity');
      });
    });

    describe('when the mint breaks compliance rules', () => {
      it('should revert', async () => {
        const {
          suite: { token, compliance },
          accounts: { aliceWallet, tokenAgent },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        const complianceModuleA = await ethers.deployContract('CountryAllowModule');
        await compliance.addModule(complianceModuleA.target);
        await token.setCompliance(compliance.target);

        await expect(token.connect(tokenAgent).mint(aliceWallet.address, 100)).to.be.revertedWithCustomError(token, 'ComplianceNotFollowed');
      });
    });
  });

  describe('.burn()', () => {
    describe('when sender is not an agent', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(aliceWallet).burn(aliceWallet.address, 100)).to.be.revertedWithCustomError(token, 'CallerDoesNotHaveAgentRole');
      });
    });

    describe('when agent permission is restricted', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await token.setAgentRestrictions(tokenAgent.address, {
          disableAddressFreeze: false,
          disableBurn: true,
          disableForceTransfer: false,
          disableMint: false,
          disablePartialFreeze: false,
          disablePause: false,
          disableRecovery: false,
        });

        await expect(token.connect(tokenAgent).burn(aliceWallet.address, 100)).to.be.revertedWithCustomError(token, 'AgentNotAuthorized');
      });
    });

    describe('when source wallet has not enough balance', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        const balance = await token.balanceOf(aliceWallet.address);

        await expect(token.connect(tokenAgent).burn(aliceWallet.address, balance + 1000n)).to.be.revertedWithCustomError(
          token,
          'ERC20InsufficientBalance',
        );
      });
    });

    describe('when amount to burn is greater that unfrozen balance', () => {
      it('should burn and decrease frozen balance', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        const balance = await token.balanceOf(aliceWallet.address);
        await token.connect(tokenAgent).freezePartialTokens(aliceWallet.address, balance - 100n);

        const tx = await token.connect(tokenAgent).burn(aliceWallet.address, balance - 50n);
        await expect(tx)
          .to.emit(token, 'Transfer')
          .withArgs(aliceWallet.address, ethers.ZeroAddress, balance - 50n);
        await expect(tx)
          .to.emit(token, 'TokensUnfrozen')
          .withArgs(aliceWallet.address, balance - 150n);
        await expect(token.getFrozenTokens(aliceWallet.address)).to.be.eventually.equal(50);
      });
    });
  });

  describe('.freezePartialTokens()', () => {
    describe('when sender is not an agent', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(aliceWallet).freezePartialTokens(aliceWallet.address, 100)).to.be.revertedWithCustomError(
          token,
          'CallerDoesNotHaveAgentRole',
        );
      });
    });

    describe('when agent permission is restricted', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await token.setAgentRestrictions(tokenAgent.address, {
          disableAddressFreeze: false,
          disableBurn: false,
          disableForceTransfer: false,
          disableMint: false,
          disablePartialFreeze: true,
          disablePause: false,
          disableRecovery: false,
        });

        await expect(token.connect(tokenAgent).freezePartialTokens(aliceWallet.address, 100)).to.be.revertedWithCustomError(
          token,
          'AgentNotAuthorized',
        );
      });
    });

    describe('when freeze amount exceeds the balance', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(tokenAgent).freezePartialTokens(aliceWallet.address, 999999999999)).to.be.revertedWithCustomError(
          token,
          'ERC20InsufficientBalance',
        );
      });
    });

    describe('when freeze amount does not exceed the balance', () => {
      it('should freeze', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(tokenAgent).freezePartialTokens(aliceWallet.address, 100))
          .to.emit(token, 'TokensFrozen')
          .withArgs(aliceWallet.address, 100);
      });
    });
  });

  describe('.unfreezePartialTokens()', () => {
    describe('when sender is not an agent', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(aliceWallet).unfreezePartialTokens(aliceWallet.address, 100)).to.be.revertedWithCustomError(
          token,
          'CallerDoesNotHaveAgentRole',
        );
      });
    });

    describe('when agent permission is restricted', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await token.setAgentRestrictions(tokenAgent.address, {
          disableAddressFreeze: false,
          disableBurn: false,
          disableForceTransfer: false,
          disableMint: false,
          disablePartialFreeze: true,
          disablePause: false,
          disableRecovery: false,
        });

        await expect(token.connect(tokenAgent).unfreezePartialTokens(aliceWallet.address, 100)).to.be.revertedWithCustomError(
          token,
          'AgentNotAuthorized',
        );
      });
    });

    describe('when unfreeze amount exceeds the frozen amount', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(tokenAgent).unfreezePartialTokens(aliceWallet.address, 5000)).to.be.revertedWithCustomError(
          token,
          'AmountAboveFrozenTokens',
        );
      });
    });

    describe('when freeze amount does not exceed the balance', () => {
      it('should freeze', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await token.connect(tokenAgent).freezePartialTokens(aliceWallet.address, 200);
        await expect(token.connect(tokenAgent).unfreezePartialTokens(aliceWallet.address, 100))
          .to.emit(token, 'TokensUnfrozen')
          .withArgs(aliceWallet.address, 100);
      });
    });
  });
});
