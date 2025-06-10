import { expect } from 'chai';
import { ethers } from 'hardhat';

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

      // Read the implementation address from the EIP-1967 implementation slot
      const implementationSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
      const implementationAddress = await ethers.provider.getStorage(proxy.target as string, implementationSlot);

      // Convert the storage value to an address
      const actualImplementation = ethers.getAddress(`0x${implementationAddress.slice(-40)}`);

      expect(actualImplementation).to.eq(newImplementation.target);
    });
  });
});
