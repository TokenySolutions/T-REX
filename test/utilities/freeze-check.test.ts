import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { deployFullSuiteFixture } from '../fixtures/deploy-full-suite.fixture';

describe('UtilityChecker.testFreeze', () => {
  describe('When sender is frozen', () => {
    it('should return true', async () => {
      const {
        suite: { token },
        accounts: { tokenAgent, aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);

      await token.connect(tokenAgent).setAddressFrozen(aliceWallet.address, true);

      const utilityChecker = await ethers.deployContract('UtilityChecker');
      const [success, balance] = await utilityChecker.testFreeze(token.target, aliceWallet.address, bobWallet.address, 100);
      expect(success).to.be.equal(true);
      expect(balance).to.be.equal(0);
    });
  });

  describe('When recipient is frozen', () => {
    it('should return true', async () => {
      const {
        suite: { token },
        accounts: { tokenAgent, aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);

      await token.connect(tokenAgent).setAddressFrozen(bobWallet.address, true);

      const utilityChecker = await ethers.deployContract('UtilityChecker');
      const [success, balance] = await utilityChecker.testFreeze(token.target, aliceWallet.address, bobWallet.address, 100);
      expect(success).to.be.equal(true);
      expect(balance).to.be.equal(0);
    });
  });

  describe('When unfrozen balance is unsufficient', () => {
    it('should return true', async () => {
      const {
        suite: { token },
        accounts: { tokenAgent, aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);

      const initialBalance = await token.balanceOf(aliceWallet.address);
      await token.connect(tokenAgent).freezePartialTokens(aliceWallet.address, initialBalance - 10n);

      const utilityChecker = await ethers.deployContract('UtilityChecker');
      const [success, balance] = await utilityChecker.testFreeze(token.target, aliceWallet.address, bobWallet.address, 100);
      expect(success).to.be.equal(true);
      expect(balance).to.be.equal(10);
    });
  });

  describe('When nominal case', () => {
    it('should return false', async () => {
      const {
        suite: { token },
        accounts: { aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);

      const initialBalance = await token.balanceOf(aliceWallet.address);

      const utilityChecker = await ethers.deployContract('UtilityChecker');
      const [success, balance] = await utilityChecker.testFreeze(token.target, aliceWallet.address, bobWallet.address, 100);
      expect(success).to.be.equal(false);
      expect(balance).to.be.equal(initialBalance);
    });
  });
});
