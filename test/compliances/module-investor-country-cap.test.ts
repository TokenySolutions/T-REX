import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { deploySuiteWithModularCompliancesFixture } from '../fixtures/deploy-full-suite.fixture';

describe('InvestorCountryCapModule', () => {
  // Test fixture
  async function deployIvestorCountryCapModuleFullSuite() {
    const context = await loadFixture(deploySuiteWithModularCompliancesFixture);

    const module = await ethers.deployContract('InvestorCountryCapModule');
    const proxy = await ethers.deployContract('ModuleProxy', [module.target, module.interface.encodeFunctionData('initialize')]);
    const complianceModule = await ethers.getContractAt('InvestorCountryCapModule', proxy.target);

    await context.suite.compliance.bindToken(context.suite.token.target);

    await context.suite.token.connect(context.accounts.tokenAgent).pause();
    await complianceModule.batchInitialize(context.suite.compliance.target, [
      context.accounts.aliceWallet.address,
      context.accounts.bobWallet.address,
    ]);
    await context.suite.compliance.addModule(complianceModule.target);
    await context.suite.token.connect(context.accounts.tokenAgent).unpause();

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
      } = await loadFixture(deployIvestorCountryCapModuleFullSuite);

      expect(await complianceModule.name()).to.equal('InvestorCountryCapModule');
      expect(await complianceModule.isPlugAndPlay()).to.be.false;
    });
  });

  describe('Country Cap Management', () => {
    it('should revert when calling directly', async () => {
      const {
        suite: { complianceModule },
      } = await loadFixture(deployIvestorCountryCapModuleFullSuite);

      await expect(complianceModule.setCountryCap(840, 100)).to.be.revertedWithCustomError(complianceModule, 'OnlyBoundComplianceCanCall');
    });

    it('should set country cap correctly', async () => {
      const {
        suite: { compliance, complianceModule },
      } = await loadFixture(deployIvestorCountryCapModuleFullSuite);

      const countryCode = 840; // USA
      const cap = 100;

      const tx = await compliance.callModuleFunction(
        new ethers.Interface(['function setCountryCap(uint16 _country, uint256 _cap)']).encodeFunctionData('setCountryCap', [countryCode, cap]),
        complianceModule.target,
      );

      await expect(tx).to.emit(complianceModule, 'CountryCapSet').withArgs(countryCode, cap);
    });

    it('should revert when setting cap lower than current count', async () => {
      const {
        suite: { compliance, complianceModule },
      } = await loadFixture(deployIvestorCountryCapModuleFullSuite);

      const countryCode = 840; // USA
      const cap = 100;

      await compliance.callModuleFunction(
        new ethers.Interface(['function setCountryCap(uint16 _country, uint256 _cap)']).encodeFunctionData('setCountryCap', [countryCode, cap]),
        complianceModule.target,
      );

      // Try to set cap lower than current count
      await expect(
        compliance.callModuleFunction(
          new ethers.Interface(['function setCountryCap(uint16 _country, uint256 _cap)']).encodeFunctionData('setCountryCap', [countryCode, cap - 1]),
          complianceModule.target,
        ),
      ).to.be.revertedWithCustomError(complianceModule, 'CapLowerThanCurrent');
    });
  });

  describe('Bypassed Identity Management', () => {
    it('should add bypassed identity correctly', async () => {
      const {
        suite: { compliance, complianceModule },
        accounts: { aliceWallet },
      } = await loadFixture(deployIvestorCountryCapModuleFullSuite);

      const tx = await compliance.callModuleFunction(
        new ethers.Interface(['function addBypassedIdentity(address _identity)']).encodeFunctionData('addBypassedIdentity', [aliceWallet.address]),
        complianceModule.target,
      );
      await expect(tx).to.emit(complianceModule, 'BypassedIdentityAdded').withArgs(aliceWallet.address);
    });

    it('should revert if trying to remove bypassed identity that is not bypassed', async () => {
      const {
        suite: { compliance, complianceModule },
        accounts: { aliceWallet },
      } = await loadFixture(deployIvestorCountryCapModuleFullSuite);

      await expect(
        compliance.callModuleFunction(
          new ethers.Interface(['function removeBypassedIdentity(address _identity)']).encodeFunctionData('removeBypassedIdentity', [
            aliceWallet.address,
          ]),
          complianceModule.target,
        ),
      ).to.be.revertedWithCustomError(complianceModule, 'IdentityNotBypassed');
    });

    it('should remove bypassed identity correctly', async () => {
      const {
        suite: { compliance, complianceModule },
        accounts: { aliceWallet },
      } = await loadFixture(deployIvestorCountryCapModuleFullSuite);

      await compliance.callModuleFunction(
        new ethers.Interface(['function addBypassedIdentity(address _identity)']).encodeFunctionData('addBypassedIdentity', [aliceWallet.address]),
        complianceModule.target,
      );

      const tx = await compliance.callModuleFunction(
        new ethers.Interface(['function removeBypassedIdentity(address _identity)']).encodeFunctionData('removeBypassedIdentity', [
          aliceWallet.address,
        ]),
        complianceModule.target,
      );
      await expect(tx).to.emit(complianceModule, 'BypassedIdentityRemoved').withArgs(aliceWallet.address);
    });
  });

  describe('Transfer Checks', () => {
    it('should allow transfer for bypassed identity', async () => {
      const {
        suite: { compliance, complianceModule },
        accounts: { aliceWallet },
      } = await loadFixture(deployIvestorCountryCapModuleFullSuite);

      await compliance.callModuleFunction(
        new ethers.Interface(['function addBypassedIdentity(address _identity)']).encodeFunctionData('addBypassedIdentity', [aliceWallet.address]),
        complianceModule.target,
      );

      expect(await complianceModule.moduleCheck(aliceWallet.address, aliceWallet.address, 100, compliance.target)).to.be.true;
    });

    it('should allow transfer when country is not capped', async () => {
      const {
        suite: { compliance, complianceModule },
        accounts: { aliceWallet },
      } = await loadFixture(deployIvestorCountryCapModuleFullSuite);

      expect(await complianceModule.moduleCheck(aliceWallet.address, aliceWallet.address, 100, compliance.target)).to.be.true;
    });

    it('should enforce country cap', async () => {
      const {
        suite: { compliance, complianceModule, identityRegistry },
        accounts: { aliceWallet, charlieWallet, tokenAgent },
        identities: { charlieIdentity },
      } = await loadFixture(deployIvestorCountryCapModuleFullSuite);

      const aliceCountry = await identityRegistry.investorCountry(aliceWallet.address);
      await compliance.callModuleFunction(
        new ethers.Interface(['function setCountryCap(uint16 _country, uint256 _cap)']).encodeFunctionData('setCountryCap', [aliceCountry, 1]),
        complianceModule.target,
      );

      await identityRegistry.connect(tokenAgent).registerIdentity(charlieWallet.address, charlieIdentity, aliceCountry);

      expect(await complianceModule.moduleCheck(aliceWallet.address, charlieWallet.address, 100, compliance.target)).to.be.false;
    });
  });

  describe('Wallet Management', () => {
    it('should enforce wallet per identity limit', async () => {
      const {
        suite: { compliance, complianceModule, identityRegistry },
        accounts: { tokenAgent, aliceWallet },
        identities: { aliceIdentity },
      } = await loadFixture(deployIvestorCountryCapModuleFullSuite);

      const aliceCountry = await identityRegistry.investorCountry(aliceWallet.address);
      await compliance.callModuleFunction(
        new ethers.Interface(['function setCountryCap(uint16 _country, uint256 _cap)']).encodeFunctionData('setCountryCap', [aliceCountry, 100]),
        complianceModule.target,
      );

      await Promise.all(
        Array(21)
          .fill(0)
          .map(async () => {
            const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
            await identityRegistry.connect(tokenAgent).registerIdentity(wallet.address, aliceIdentity, aliceCountry);

            expect(await complianceModule.moduleCheck(aliceWallet.address, wallet.address, 10, compliance.target)).to.be.true;
            await compliance.callModuleFunction(
              new ethers.Interface(['function moduleMintAction(address, uint256)']).encodeFunctionData('moduleMintAction', [wallet.address, 10]),
              complianceModule.target,
            );
            return wallet;
          }),
      );

      const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
      await identityRegistry.connect(tokenAgent).registerIdentity(wallet.address, aliceIdentity, aliceCountry);

      // This should fail
      expect(await complianceModule.moduleCheck(aliceWallet.address, wallet.address, 100, compliance.target)).to.be.false;
    });
  });

  describe('Country Change Handling', () => {
    it('should handle country change correctly', async () => {
      const {
        suite: { compliance, complianceModule, identityRegistry },
        accounts: { aliceWallet, tokenAgent },
      } = await loadFixture(deployIvestorCountryCapModuleFullSuite);

      const newCountry = 250; // France

      await compliance.callModuleFunction(
        new ethers.Interface(['function setCountryCap(uint16 _country, uint256 _cap)']).encodeFunctionData('setCountryCap', [newCountry, 10]),
        complianceModule.target,
      );

      // Setup initial state
      expect(await complianceModule.moduleCheck(aliceWallet.address, aliceWallet.address, 100, compliance.target)).to.be.true;

      // Change country
      await identityRegistry.connect(tokenAgent).updateCountry(aliceWallet.address, newCountry);

      // Should still be able to transfer after country change
      expect(await complianceModule.moduleCheck(aliceWallet.address, aliceWallet.address, 100, compliance.target)).to.be.true;
    });
  });

  describe('Batch Initialize (For gas cost)', () => {
    it('should initialize correctly', async () => {
      const context = await loadFixture(deploySuiteWithModularCompliancesFixture);

      const module = await ethers.deployContract('InvestorCountryCapModule');
      const proxy = await ethers.deployContract('ModuleProxy', [module.target, module.interface.encodeFunctionData('initialize')]);
      const complianceModule = await ethers.getContractAt('InvestorCountryCapModule', proxy.target);

      await context.suite.compliance.bindToken(context.suite.token.target);

      await context.suite.token.connect(context.accounts.tokenAgent).pause();
      await complianceModule.batchInitialize(context.suite.compliance.target, [
        context.accounts.aliceWallet.address,
        context.accounts.bobWallet.address,
        // context.accounts.charlieWallet.address,
        // context.accounts.anotherWallet.address,
      ]);
      await context.suite.compliance.addModule(complianceModule.target);
      await context.suite.token.connect(context.accounts.tokenAgent).unpause();
    });
  });
});
