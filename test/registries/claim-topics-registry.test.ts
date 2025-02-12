import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { deployFullSuiteFixture } from '../fixtures/deploy-full-suite.fixture';

describe('ClaimTopicsRegistry', () => {
  describe('.init', () => {
    describe('when contract was already initialized', () => {
      it('should revert', async () => {
        const {
          suite: { claimTopicsRegistry },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(claimTopicsRegistry.init()).to.be.revertedWith('Initializable: contract is already initialized');
      });
    });
  });

  describe('.addClaimTopic', () => {
    describe('when sender is not owner', () => {
      it('should revert', async () => {
        const {
          suite: { claimTopicsRegistry },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(claimTopicsRegistry.connect(anotherWallet).addClaimTopic(1)).to.be.revertedWithCustomError(
          claimTopicsRegistry,
          'OwnableUnauthorizedAccount',
        );
      });
    });

    describe('when sender is owner', () => {
      describe('when topic array contains more than 14 elements', () => {
        it('should revert', async () => {
          const {
            suite: { claimTopicsRegistry },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await Promise.all(Array.from({ length: 14 }, (_, i) => i).map((i) => claimTopicsRegistry.addClaimTopic(i)));

          await expect(claimTopicsRegistry.connect(deployer).addClaimTopic(14)).to.be.revertedWithCustomError(
            claimTopicsRegistry,
            'MaxTopicsReached',
          );
        });
      });

      describe('when adding a topic that is already added', () => {
        it('should revert', async () => {
          const {
            suite: { claimTopicsRegistry },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await claimTopicsRegistry.addClaimTopic(1);

          await expect(claimTopicsRegistry.connect(deployer).addClaimTopic(1)).to.be.revertedWithCustomError(
            claimTopicsRegistry,
            'ClaimTopicAlreadyExists',
          );
        });
      });
    });
  });

  describe('.removeClaimTopic', () => {
    describe('when sender is not owner', () => {
      it('should revert', async () => {
        const {
          suite: { claimTopicsRegistry },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(claimTopicsRegistry.connect(anotherWallet).removeClaimTopic(1)).to.be.revertedWithCustomError(
          claimTopicsRegistry,
          'OwnableUnauthorizedAccount',
        );
      });
    });

    describe('when sender is owner', () => {
      it('should remove claim topic', async () => {
        const {
          suite: { claimTopicsRegistry },
          accounts: { deployer },
        } = await loadFixture(deployFullSuiteFixture);

        await claimTopicsRegistry.addClaimTopic(1);
        await claimTopicsRegistry.addClaimTopic(2);
        await claimTopicsRegistry.addClaimTopic(3);

        const tx = await claimTopicsRegistry.connect(deployer).removeClaimTopic(2);
        await expect(tx).to.emit(claimTopicsRegistry, 'ClaimTopicRemoved').withArgs(2);
      });
    });
  });
  describe('.supportsInterface()', () => {
    it('should return false for unsupported interfaces', async () => {
      const {
        suite: { claimTopicsRegistry },
      } = await loadFixture(deployFullSuiteFixture);

      const unsupportedInterfaceId = '0x12345678';
      expect(await claimTopicsRegistry.supportsInterface(unsupportedInterfaceId)).to.equal(false);
    });

    it('should correctly identify the IERC3643ClaimTopicsRegistry interface ID', async () => {
      const {
        suite: { claimTopicsRegistry },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const iClaimTopicsRegistryInterfaceId = await interfaceIdCalculator.getIERC3643ClaimTopicsRegistryInterfaceId();
      expect(await claimTopicsRegistry.supportsInterface(iClaimTopicsRegistryInterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC173 interface ID', async () => {
      const {
        suite: { claimTopicsRegistry },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc173InterfaceId = await interfaceIdCalculator.getIERC173InterfaceId();
      expect(await claimTopicsRegistry.supportsInterface(ierc173InterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC165 interface ID', async () => {
      const {
        suite: { claimTopicsRegistry },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc165InterfaceId = await interfaceIdCalculator.getIERC165InterfaceId();
      expect(await claimTopicsRegistry.supportsInterface(ierc165InterfaceId)).to.equal(true);
    });
  });
});
