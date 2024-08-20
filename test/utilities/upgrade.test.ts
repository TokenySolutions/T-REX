import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { deployFullSuiteFixture } from '../fixtures/deploy-full-suite.fixture';

describe('UtilityChecker.upgrateTo', () => {
  describe('when calling directly', () => {
    it('should revert', async () => {
      const context = await loadFixture(deployFullSuiteFixture);

      const implementation = await ethers.deployContract('UtilityChecker');
      const proxy = await ethers.deployContract('UtilityCheckerProxy', [implementation.target, '0x8129fc1c']);
      const utilityChecker = await ethers.getContractAt('UtilityChecker', proxy.target);

      const newImplementation = await ethers.deployContract('UtilityChecker');

      await expect(utilityChecker.connect(context.accounts.aliceWallet).upgradeTo(newImplementation.target)).to.revertedWith(
        'Ownable: caller is not the owner',
      );
    });
  });

  describe('when calling with owner account', () => {
    it('should upgrade proxy', async () => {
      const context = await loadFixture(deployFullSuiteFixture);

      const implementation = await ethers.deployContract('UtilityChecker');
      const proxy = await ethers.deployContract('UtilityCheckerProxy', [implementation.target, '0x8129fc1c']);
      const utilityChecker = await ethers.getContractAt('UtilityChecker', proxy.target);

      const newImplementation = await ethers.deployContract('UtilityChecker');

      await utilityChecker.connect(context.accounts.deployer).upgradeTo(newImplementation.target);

      const implementationAddress = await upgrades.erc1967.getImplementationAddress(utilityChecker.target as string);
      expect(implementationAddress).to.eq(newImplementation.target);
    });
  });
});
