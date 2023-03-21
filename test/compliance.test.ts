import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { deployFullSuiteFixture } from './fixtures/deploy-full-suite.fixture';

describe('ModularCompliance', () => {
  describe('.init', () => {
    it('should prevent calling init twice', async () => {
      await loadFixture(deployFullSuiteFixture);

      const compliance = await ethers.deployContract('ModularCompliance');
      await compliance.init();

      await expect(compliance.init()).to.be.revertedWith('Initializable: contract is already initialized');
    });
  });

  describe('.bindToken', () => {
    describe('when calling as another account that the owner', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          suite: { token },
        } = await loadFixture(deployFullSuiteFixture);

        const compliance = await ethers.deployContract('ModularCompliance');
        await compliance.init();

        await expect(compliance.connect(anotherWallet).bindToken(token.address)).to.be.revertedWith('only owner or token can call');
      });
    });

    describe('when the compliance is already bound to a token', () => {
      describe('when not calling as the token', () => {
        it('should revert', async () => {
          const {
            accounts: { deployer, anotherWallet },
            suite: { token },
          } = await loadFixture(deployFullSuiteFixture);

          const compliance = await ethers.deployContract('ModularCompliance', deployer);
          await compliance.init();

          await compliance.bindToken(token.address);

          await expect(compliance.connect(anotherWallet).bindToken(token.address)).to.be.revertedWith('only owner or token can call');
        });
      });

      describe('when calling as the token', () => {
        it('should set the new compliance', async () => {
          const {
            suite: { token },
          } = await loadFixture(deployFullSuiteFixture);

          const compliance = await ethers.deployContract('ModularCompliance');
          await compliance.init();
          await compliance.bindToken(token.address);

          const newCompliance = await ethers.deployContract('ModularCompliance');

          const tx = await token.setCompliance(newCompliance.address);
          await expect(tx).to.emit(token, 'ComplianceAdded').withArgs(newCompliance.address);
          await expect(tx).to.emit(newCompliance, 'TokenBound').withArgs(token.address);
        });
      });
    });

    describe('when calling as the owner', () => {
      describe('when token address is zero', () => {
        it('should revert', async () => {
          const {
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          const compliance = await ethers.deployContract('ModularCompliance', deployer);
          await compliance.init();

          await expect(compliance.bindToken(ethers.constants.AddressZero)).to.be.revertedWith('invalid argument - zero address');
        });
      });
    });
  });
});
