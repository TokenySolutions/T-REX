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

        await expect(token.connect(aliceWallet).transfer(bobWallet.address, 100)).to.be.revertedWith('Pausable: paused');
      });
    });

    describe('when the recipient balance is frozen', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { tokenAgent, aliceWallet, bobWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await token.connect(tokenAgent).setAddressFrozen(bobWallet.address, true);

        await expect(token.connect(aliceWallet).transfer(bobWallet.address, 100)).to.be.revertedWith('wallet is frozen');
      });
    });

    describe('when the sender balance is frozen', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { tokenAgent, aliceWallet, bobWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await token.connect(tokenAgent).setAddressFrozen(aliceWallet.address, true);

        await expect(token.connect(aliceWallet).transfer(bobWallet.address, 100)).to.be.revertedWith('wallet is frozen');
      });
    });

    describe('when the sender has not enough balance', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet },
        } = await loadFixture(deployFullSuiteFixture);

        const balance = await token.balanceOf(aliceWallet.address);

        await expect(token.connect(aliceWallet).transfer(bobWallet.address, balance.add(1000))).to.be.revertedWith('Insufficient Balance');
      });
    });

    describe('when the sender has not enough balance unfrozen', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        const balance = await token.balanceOf(aliceWallet.address);
        await token.connect(tokenAgent).freezePartialTokens(aliceWallet.address, balance.sub(100));

        await expect(token.connect(aliceWallet).transfer(bobWallet.address, balance)).to.be.revertedWith('Insufficient Balance');
      });
    });

    describe('when the recipient identity is not verified', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(aliceWallet).transfer(anotherWallet.address, 100)).to.be.revertedWith('Transfer not possible');
      });
    });

    describe('when the transfer breaks compliance rules', () => {
      it('should revert', async () => {
        const {
          suite: { token, compliance },
          accounts: { aliceWallet, bobWallet },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        const complianceModuleA = await ethers.deployContract('CountryAllowModule');
        await compliance.addModule(complianceModuleA.address);
        await token.setCompliance(compliance.address);

        await expect(token.connect(aliceWallet).transfer(bobWallet.address, 100)).to.be.revertedWith('Transfer not possible');
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

        await expect(token.connect(aliceWallet).transferFrom(aliceWallet.address, bobWallet.address, 100)).to.be.revertedWith('Pausable: paused');
      });
    });

    describe('when sender address is frozen', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await token.connect(tokenAgent).setAddressFrozen(aliceWallet.address, true);

        await expect(token.connect(aliceWallet).transferFrom(aliceWallet.address, bobWallet.address, 100)).to.be.revertedWith('wallet is frozen');
      });
    });

    describe('when recipient address is frozen', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await token.connect(tokenAgent).setAddressFrozen(bobWallet.address, true);

        await expect(token.connect(aliceWallet).transferFrom(aliceWallet.address, bobWallet.address, 100)).to.be.revertedWith('wallet is frozen');
      });
    });

    describe('when sender has not enough balance', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, bobWallet },
        } = await loadFixture(deployFullSuiteFixture);

        const balance = await token.balanceOf(aliceWallet.address);

        await expect(token.connect(aliceWallet).transferFrom(aliceWallet.address, bobWallet.address, balance.add(1000))).to.be.revertedWith(
          'Insufficient Balance',
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
        await token.connect(tokenAgent).freezePartialTokens(aliceWallet.address, balance.sub(100));

        await expect(token.connect(aliceWallet).transferFrom(aliceWallet.address, bobWallet.address, balance)).to.be.revertedWith(
          'Insufficient Balance',
        );
      });
    });

    describe('when the recipient identity is not verified', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(aliceWallet).transferFrom(aliceWallet.address, anotherWallet.address, 100)).to.be.revertedWith(
          'Transfer not possible',
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
        await compliance.addModule(complianceModuleA.address);
        await token.setCompliance(compliance.address);

        await expect(token.connect(aliceWallet).transferFrom(aliceWallet.address, bobWallet.address, 100)).to.be.revertedWith(
          'Transfer not possible',
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

        await expect(token.connect(aliceWallet).forcedTransfer(aliceWallet.address, bobWallet.address, 100)).to.be.revertedWith(
          'AgentRole: caller does not have the Agent role',
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

        await expect(token.connect(tokenAgent).forcedTransfer(aliceWallet.address, bobWallet.address, balance.add(1000))).to.be.revertedWith(
          'sender balance too low',
        );
      });
    });

    describe('when recipient identity is not verified', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, anotherWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(tokenAgent).forcedTransfer(aliceWallet.address, anotherWallet.address, 100)).to.be.revertedWith(
          'Transfer not possible',
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
        await compliance.addModule(complianceModuleA.address);
        await token.setCompliance(compliance.address);

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
        await token.connect(tokenAgent).freezePartialTokens(aliceWallet.address, balance.sub(100));

        const tx = await token.connect(tokenAgent).forcedTransfer(aliceWallet.address, bobWallet.address, balance.sub(50));
        await expect(tx).to.emit(token, 'Transfer').withArgs(aliceWallet.address, bobWallet.address, balance.sub(50));
        await expect(tx).to.emit(token, 'TokensUnfrozen').withArgs(aliceWallet.address, balance.sub(150));
        await expect(token.getFrozenTokens(aliceWallet.address)).to.be.eventually.equal(50);
      });
    });
  });

  describe('.mint', () => {
    describe('when sender is not an agent', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(aliceWallet).mint(aliceWallet.address, 100)).to.be.revertedWith('AgentRole: caller does not have the Agent role');
      });
    });

    describe('when recipient identity is not verified', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { anotherWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(token.connect(tokenAgent).mint(anotherWallet.address, 100)).to.be.revertedWith('Identity is not verified.');
      });
    });

    describe('when the mint breaks compliance rules', () => {
      it('should revert', async () => {
        const {
          suite: { token, compliance },
          accounts: { aliceWallet, tokenAgent },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        const complianceModuleA = await ethers.deployContract('CountryAllowModule');
        await compliance.addModule(complianceModuleA.address);
        await token.setCompliance(compliance.address);

        await expect(token.connect(tokenAgent).mint(aliceWallet.address, 100)).to.be.revertedWith('Compliance not followed');
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

        await expect(token.connect(aliceWallet).burn(aliceWallet.address, 100)).to.be.revertedWith('AgentRole: caller does not have the Agent role');
      });
    });

    describe('when source wallet has not enough balance', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        const balance = await token.balanceOf(aliceWallet.address);

        await expect(token.connect(tokenAgent).burn(aliceWallet.address, balance.add(1000))).to.be.revertedWith('cannot burn more than balance');
      });
    });

    describe('when amount to burn is greater that unfrozen balance', () => {
      it('should burn and decrease frozen balance', async () => {
        const {
          suite: { token },
          accounts: { aliceWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        const balance = await token.balanceOf(aliceWallet.address);
        await token.connect(tokenAgent).freezePartialTokens(aliceWallet.address, balance.sub(100));

        const tx = await token.connect(tokenAgent).burn(aliceWallet.address, balance.sub(50));
        await expect(tx).to.emit(token, 'Transfer').withArgs(aliceWallet.address, ethers.constants.AddressZero, balance.sub(50));
        await expect(tx).to.emit(token, 'TokensUnfrozen').withArgs(aliceWallet.address, balance.sub(150));
        await expect(token.getFrozenTokens(aliceWallet.address)).to.be.eventually.equal(50);
      });
    });
  });
});
