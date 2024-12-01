import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { deploySuiteWithModularCompliancesFixture } from '../fixtures/deploy-full-suite.fixture';

describe('MinTransferByCountryModule', () => {
  // Test fixture
  async function deployMinTransferByCountryModuleFullSuite() {
    const context = await loadFixture(deploySuiteWithModularCompliancesFixture);

    const module = await ethers.deployContract('MinTransferByCountryModule');
    const proxy = await ethers.deployContract('ModuleProxy', [module.target, module.interface.encodeFunctionData('initialize')]);
    const complianceModule = await ethers.getContractAt('MinTransferByCountryModule', proxy.target);

    await context.suite.compliance.bindToken(context.suite.token.target);
    await context.suite.compliance.addModule(complianceModule.target);

    return {
      ...context,
      suite: {
        ...context.suite,
        complianceModule,
      },
    };
  }

  describe('Initialization', () => {
    it('should initialize correctly', async () => {
      const {
        suite: { complianceModule },
      } = await loadFixture(deployMinTransferByCountryModuleFullSuite);

      expect(await complianceModule.name()).to.equal('MinTransferByCountryModule');
      expect(await complianceModule.isPlugAndPlay()).to.be.true;
    });
  });

  describe('Country Settings', () => {
    it('should set minimum transfer amount for a country', async () => {
      const {
        suite: { compliance, complianceModule },
        accounts: { deployer },
      } = await loadFixture(deployMinTransferByCountryModuleFullSuite);

      const countryCode = 42;
      const minAmount = ethers.parseEther('100');

      const tx = await compliance
        .connect(deployer)
        .callModuleFunction(
          new ethers.Interface(['function setMinimumTransferAmount(uint16 country, uint256 amount)']).encodeFunctionData('setMinimumTransferAmount', [
            countryCode,
            minAmount,
          ]),
          complianceModule.target,
        );
      await expect(tx).to.emit(complianceModule, 'MinimumTransferAmountSet').withArgs(countryCode, minAmount);
    });

    it('should revert when other than compliance tries to set minimum transfer amount', async () => {
      const {
        suite: { complianceModule },
        accounts: { aliceWallet },
      } = await loadFixture(deployMinTransferByCountryModuleFullSuite);

      const countryCode = 1;
      const minAmount = ethers.parseEther('100');

      await expect(complianceModule.connect(aliceWallet).setMinimumTransferAmount(countryCode, minAmount)).to.be.revertedWithCustomError(
        complianceModule,
        'OnlyBoundComplianceCanCall',
      );
    });
  });

  describe('Transfer Validation', () => {
    it('should allow transfer when amount meets minimum requirement', async () => {
      const {
        suite: { compliance, complianceModule, identityRegistry },
        accounts: { deployer, aliceWallet, bobWallet },
      } = await loadFixture(deployMinTransferByCountryModuleFullSuite);

      const countryCode = await identityRegistry.investorCountry(aliceWallet.address);
      const minAmount = ethers.parseEther('100');

      await compliance
        .connect(deployer)
        .callModuleFunction(
          new ethers.Interface(['function setMinimumTransferAmount(uint16 country, uint256 amount)']).encodeFunctionData('setMinimumTransferAmount', [
            countryCode,
            minAmount,
          ]),
          complianceModule.target,
        );

      const transferAmount = ethers.parseEther('150');
      expect(await complianceModule.moduleCheck(bobWallet.address, aliceWallet.address, transferAmount, compliance.target)).to.be.true;
    });

    it('should prevent transfer when amount is below minimum requirement', async () => {
      const {
        suite: { compliance, complianceModule, identityRegistry },
        accounts: { deployer, charlieWallet, bobWallet },
      } = await loadFixture(deployMinTransferByCountryModuleFullSuite);

      const countryCode = await identityRegistry.investorCountry(charlieWallet.address);
      const minAmount = ethers.parseEther('100');

      await compliance
        .connect(deployer)
        .callModuleFunction(
          new ethers.Interface(['function setMinimumTransferAmount(uint16 country, uint256 amount)']).encodeFunctionData('setMinimumTransferAmount', [
            countryCode,
            minAmount,
          ]),
          complianceModule.target,
        );

      const transferAmount = ethers.parseEther('99');
      expect(await complianceModule.moduleCheck(bobWallet.address, charlieWallet.address, transferAmount, compliance.target)).to.be.false;
    });

    it('should allow transfer when no minimum amount is set for country', async () => {
      const {
        suite: { compliance, complianceModule },
        accounts: { aliceWallet, charlieWallet },
      } = await loadFixture(deployMinTransferByCountryModuleFullSuite);

      expect(await complianceModule.moduleCheck(aliceWallet.address, charlieWallet.address, 1, compliance.target)).to.be.true;
    });

    it('should allow transfer when user as already a balance', async () => {
      const {
        suite: { compliance, complianceModule, identityRegistry },
        accounts: { deployer, aliceWallet, bobWallet },
      } = await loadFixture(deployMinTransferByCountryModuleFullSuite);

      const countryCode = await identityRegistry.investorCountry(bobWallet.address);
      const minAmount = ethers.parseEther('100');

      await compliance
        .connect(deployer)
        .callModuleFunction(
          new ethers.Interface(['function setMinimumTransferAmount(uint16 country, uint256 amount)']).encodeFunctionData('setMinimumTransferAmount', [
            countryCode,
            minAmount,
          ]),
          complianceModule.target,
        );

      expect(await complianceModule.moduleCheck(aliceWallet.address, bobWallet.address, 1, compliance.target)).to.be.true;
    });

    it('should allow transfer when transfer into same identity and same country with amount below the minimum amount set', async () => {
      const {
        suite: { compliance, complianceModule, identityRegistry },
        accounts: { deployer, aliceWallet, anotherWallet, tokenAgent },
        identities: { aliceIdentity },
      } = await loadFixture(deployMinTransferByCountryModuleFullSuite);

      const countryCode = await identityRegistry.investorCountry(aliceWallet.address);

      await identityRegistry.connect(tokenAgent).registerIdentity(anotherWallet.address, aliceIdentity, countryCode);

      const minAmount = ethers.parseEther('100');
      await compliance
        .connect(deployer)
        .callModuleFunction(
          new ethers.Interface(['function setMinimumTransferAmount(uint16 country, uint256 amount)']).encodeFunctionData('setMinimumTransferAmount', [
            countryCode,
            minAmount,
          ]),
          complianceModule.target,
        );

      expect(await complianceModule.moduleCheck(aliceWallet.address, anotherWallet.address, 1, compliance.target)).to.be.true;
    });

    it('should prevent transfer when transfer into same identity and different country with amount below the minimum amount set', async () => {
      const {
        suite: { compliance, complianceModule, identityRegistry },
        accounts: { deployer, aliceWallet, anotherWallet, tokenAgent },
        identities: { aliceIdentity },
      } = await loadFixture(deployMinTransferByCountryModuleFullSuite);

      const countryCode = 1n + (await identityRegistry.investorCountry(aliceWallet.address));

      await identityRegistry.connect(tokenAgent).registerIdentity(anotherWallet.address, aliceIdentity, countryCode);

      const minAmount = ethers.parseEther('100');
      await compliance
        .connect(deployer)
        .callModuleFunction(
          new ethers.Interface(['function setMinimumTransferAmount(uint16 country, uint256 amount)']).encodeFunctionData('setMinimumTransferAmount', [
            countryCode,
            minAmount,
          ]),
          complianceModule.target,
        );

      expect(await complianceModule.moduleCheck(aliceWallet.address, anotherWallet.address, 1, compliance.target)).to.be.false;
    });
  });
});
