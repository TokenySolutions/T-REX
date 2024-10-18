import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';

describe('UtilityChecker.upgrateTo', () => {
  describe('when calling directly', () => {
    it('should revert', async () => {
      const [, , , , , aliceWallet] = await ethers.getSigners();

      const implementation = await ethers.deployContract('UtilityChecker');
      const proxy = await ethers.deployContract('UtilityCheckerProxy', [implementation.target, '0x8129fc1c']);
      const utilityChecker = await ethers.getContractAt('UtilityChecker', proxy.target);

      const newImplementation = await ethers.deployContract('UtilityChecker');

      await expect(utilityChecker.connect(aliceWallet).upgradeTo(newImplementation.target)).to.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('when calling with owner account', () => {
    it('should upgrade proxy', async () => {
      const [deployer] = await ethers.getSigners();

      const implementation = await ethers.deployContract('UtilityChecker');
      const proxy = await ethers.deployContract('UtilityCheckerProxy', [implementation.target, '0x8129fc1c']);
      const utilityChecker = await ethers.getContractAt('UtilityChecker', proxy.target);

      const newImplementation = await ethers.deployContract('UtilityChecker');

      await utilityChecker.connect(deployer).upgradeTo(newImplementation.target);

      const implementationAddress = await upgrades.erc1967.getImplementationAddress(utilityChecker.target as string);
      expect(implementationAddress).to.eq(newImplementation.target);
    });
  });
});
