import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';

describe('CountryAllowModule', () => {
  async function deployComplianceWithCountryAllowModule() {
    const context = await loadFixture(deployComplianceFixture);
    const { compliance } = context.suite;

    const countryAllowModule = await ethers.deployContract('CountryAllowModule');
    await compliance.addModule(countryAllowModule.address);

    return { ...context, suite: { ...context.suite, countryAllowModule } };
  }

  describe('.name()', () => {
    it('should return the name of the module', async () => {
      const {
        suite: { countryAllowModule },
      } = await loadFixture(deployComplianceWithCountryAllowModule);

      expect(await countryAllowModule.name()).to.be.equal('CountryAllowModule');
    });
  });

  describe('.isPlugAndPlay()', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployComplianceWithCountryAllowModule);
      expect(await context.suite.countryAllowModule.isPlugAndPlay()).to.be.true;
    });
  });

  describe('.canComplianceBind()', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployComplianceWithCountryAllowModule);
      expect(await context.suite.countryAllowModule.canComplianceBind(context.suite.compliance.address)).to.be.true;
    });
  });

  describe('.batchAllowCountries()', () => {
    describe('when calling not via the Compliance contract', () => {
      it('should revert', async () => {
        const {
          suite: { countryAllowModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.connect(anotherWallet).batchAllowCountries([42, 66])).to.be.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling as the owner', () => {
      it('should revert', async () => {
        const {
          suite: { countryAllowModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.connect(deployer).batchAllowCountries([42, 66])).to.be.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling via the compliance contract', () => {
      it('should allow the given countries', async () => {
        const {
          suite: { compliance, countryAllowModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        const tx = await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.utils.Interface(['function batchAllowCountries(uint16[] calldata countries)']).encodeFunctionData('batchAllowCountries', [
              [42, 66],
            ]),
            countryAllowModule.address,
          );

        await expect(tx).to.emit(countryAllowModule, 'CountryAllowed').withArgs(compliance.address, 42);
        await expect(tx).to.emit(countryAllowModule, 'CountryAllowed').withArgs(compliance.address, 66);

        expect(await countryAllowModule.isCountryAllowed(compliance.address, 42)).to.be.true;
        expect(await countryAllowModule.isCountryAllowed(compliance.address, 66)).to.be.true;
      });
    });
  });

  describe('.batchDisallowCountries()', () => {
    describe('when calling not via the Compliance contract', () => {
      it('should revert', async () => {
        const {
          suite: { countryAllowModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.connect(anotherWallet).batchDisallowCountries([42, 66])).to.be.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling as the owner', () => {
      it('should revert', async () => {
        const {
          suite: { countryAllowModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.connect(deployer).batchDisallowCountries([42, 66])).to.be.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling via the compliance contract', () => {
      it('should disallow the given countries', async () => {
        const {
          suite: { compliance, countryAllowModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        const tx = await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.utils.Interface(['function batchDisallowCountries(uint16[] calldata countries)']).encodeFunctionData(
              'batchDisallowCountries',
              [[42, 66]],
            ),
            countryAllowModule.address,
          );

        await expect(tx).to.emit(countryAllowModule, 'CountryUnallowed').withArgs(compliance.address, 42);
        await expect(tx).to.emit(countryAllowModule, 'CountryUnallowed').withArgs(compliance.address, 66);

        expect(await countryAllowModule.isCountryAllowed(compliance.address, 42)).to.be.false;
        expect(await countryAllowModule.isCountryAllowed(compliance.address, 66)).to.be.false;
      });
    });
  });

  describe('.addAllowedCountry()', () => {
    describe('when calling not via the Compliance contract', () => {
      it('should revert', async () => {
        const {
          suite: { countryAllowModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.connect(anotherWallet).addAllowedCountry(42)).to.be.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling as the owner', () => {
      it('should revert', async () => {
        const {
          suite: { countryAllowModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.connect(deployer).addAllowedCountry(42)).to.be.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling via the compliance contract', () => {
      describe('when country is already allowed', () => {
        it('should revert', async () => {
          const {
            suite: { compliance, countryAllowModule },
            accounts: { deployer },
          } = await loadFixture(deployComplianceWithCountryAllowModule);

          await compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.utils.Interface(['function addAllowedCountry(uint16 country)']).encodeFunctionData('addAllowedCountry', [42]),
              countryAllowModule.address,
            );

          await expect(
            compliance
              .connect(deployer)
              .callModuleFunction(
                new ethers.utils.Interface(['function addAllowedCountry(uint16 country)']).encodeFunctionData('addAllowedCountry', [42]),
                countryAllowModule.address,
              ),
          )
            .to.be.revertedWithCustomError(countryAllowModule, 'CountryAlreadyAllowed')
            .withArgs(compliance.address, 42);
        });
      });

      describe('when country is not allowed', () => {
        it('should allow the given country', async () => {
          const {
            suite: { compliance, countryAllowModule },
            accounts: { deployer },
          } = await loadFixture(deployComplianceWithCountryAllowModule);

          const tx = await compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.utils.Interface(['function addAllowedCountry(uint16 country)']).encodeFunctionData('addAllowedCountry', [42]),
              countryAllowModule.address,
            );

          await expect(tx).to.emit(countryAllowModule, 'CountryAllowed').withArgs(compliance.address, 42);

          expect(await countryAllowModule.isCountryAllowed(compliance.address, 42)).to.be.true;
        });
      });
    });
  });

  describe('.removeAllowedCountry()', () => {
    describe('when calling not via the Compliance contract', () => {
      it('should revert', async () => {
        const {
          suite: { countryAllowModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.connect(anotherWallet).removeAllowedCountry(42)).to.be.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling as the owner', () => {
      it('should revert', async () => {
        const {
          suite: { countryAllowModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.connect(deployer).removeAllowedCountry(42)).to.be.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling via the compliance contract', () => {
      describe('when country is not allowed', () => {
        it('should revert', async () => {
          const {
            suite: { compliance, countryAllowModule },
            accounts: { deployer },
          } = await loadFixture(deployComplianceWithCountryAllowModule);

          await expect(
            compliance
              .connect(deployer)
              .callModuleFunction(
                new ethers.utils.Interface(['function removeAllowedCountry(uint16 country)']).encodeFunctionData('removeAllowedCountry', [42]),
                countryAllowModule.address,
              ),
          )
            .to.be.revertedWithCustomError(countryAllowModule, 'CountryNotAllowed')
            .withArgs(compliance.address, 42);
        });
      });

      describe('when country is allowed', () => {
        it('should disallow the given country', async () => {
          const {
            suite: { compliance, countryAllowModule },
            accounts: { deployer },
          } = await loadFixture(deployComplianceWithCountryAllowModule);

          await compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.utils.Interface(['function addAllowedCountry(uint16 country)']).encodeFunctionData('addAllowedCountry', [42]),
              countryAllowModule.address,
            );

          const tx = await compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.utils.Interface(['function removeAllowedCountry(uint16 country)']).encodeFunctionData('removeAllowedCountry', [42]),
              countryAllowModule.address,
            );

          await expect(tx).to.emit(countryAllowModule, 'CountryUnallowed').withArgs(compliance.address, 42);

          expect(await countryAllowModule.isCountryAllowed(compliance.address, 42)).to.be.false;
        });
      });
    });
  });

  describe('.moduleCheck', () => {
    describe('when identity country is allowed', () => {
      it('should return true', async () => {
        const {
          suite: { compliance, countryAllowModule },
          accounts: { deployer, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithCountryAllowModule);
        const contract = await ethers.deployContract('MockContract');
        await compliance.bindToken(contract.address);

        await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.utils.Interface(['function batchAllowCountries(uint16[] calldata countries)']).encodeFunctionData('batchAllowCountries', [
              [42, 66],
            ]),
            countryAllowModule.address,
          );

        await contract.setInvestorCountry(42);

        await expect(countryAllowModule.moduleCheck(aliceWallet.address, bobWallet.address, 10, compliance.address)).to.be.eventually.true;
        await expect(compliance.canTransfer(aliceWallet.address, bobWallet.address, 10)).to.be.eventually.true;
      });
    });

    describe('when identity country is not allowed', () => {
      it('should return false', async () => {
        const {
          suite: { compliance, countryAllowModule },
          accounts: { deployer, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithCountryAllowModule);
        const contract = await ethers.deployContract('MockContract');
        await compliance.bindToken(contract.address);

        await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.utils.Interface(['function batchAllowCountries(uint16[] calldata countries)']).encodeFunctionData('batchAllowCountries', [
              [42, 66],
            ]),
            countryAllowModule.address,
          );

        await contract.setInvestorCountry(10);

        await expect(countryAllowModule.moduleCheck(aliceWallet.address, bobWallet.address, 16, compliance.address)).to.be.eventually.false;
        await expect(compliance.canTransfer(aliceWallet.address, bobWallet.address, 16)).to.be.eventually.false;
      });
    });
  });

  describe('.isComplianceBound()', () => {
    describe('when the address is a bound compliance', () => {
      it('should return true', async () => {
        const {
          suite: { countryAllowModule, compliance },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.isComplianceBound(compliance.address)).to.be.eventually.true;
      });
    });

    describe('when the address is not a bound compliance', () => {
      it('should return false', async () => {
        const {
          suite: { countryAllowModule },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.isComplianceBound(countryAllowModule.address)).to.be.eventually.false;
      });
    });
  });

  describe('.unbindCompliance()', () => {
    describe('when sender is not a bound compliance', () => {
      it('should revert', async () => {
        const {
          suite: { countryAllowModule, compliance },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.connect(anotherWallet).unbindCompliance(compliance.address)).to.be.revertedWith(
          'only bound compliance can call',
        );
      });
    });
  });
});
