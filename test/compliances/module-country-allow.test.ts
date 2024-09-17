import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers, upgrades } from 'hardhat';
import { expect } from 'chai';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';

describe('CountryAllowModule', () => {
  async function deployComplianceWithCountryAllowModule() {
    const context = await loadFixture(deployComplianceFixture);
    const { compliance } = context.suite;

    const module = await ethers.deployContract('CountryAllowModule');
    const proxy = await ethers.deployContract('ModuleProxy', [module.target, module.interface.encodeFunctionData('initialize')]);
    const countryAllowModule = await ethers.getContractAt('CountryAllowModule', proxy.target);
    await compliance.addModule(countryAllowModule.target);

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
      expect(await context.suite.countryAllowModule.canComplianceBind(context.suite.compliance.target)).to.be.true;
    });
  });

  describe('.owner', () => {
    it('should return owner', async () => {
      const context = await loadFixture(deployComplianceWithCountryAllowModule);
      await expect(context.suite.countryAllowModule.owner()).to.eventually.be.eq(context.accounts.deployer.address);
    });
  });

  describe('.initialize', () => {
    it('should be called only once', async () => {
      // given
      const {
        accounts: { deployer },
      } = await loadFixture(deployComplianceFixture);
      const module = (await ethers.deployContract('CountryAllowModule')).connect(deployer);
      await module.initialize();

      // when & then
      await expect(module.initialize()).to.be.revertedWith('Initializable: contract is already initialized');
      expect(await module.owner()).to.be.eq(deployer.address);
    });
  });

  describe('.transferOwnership', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployComplianceWithCountryAllowModule);
        await expect(
          context.suite.countryAllowModule.connect(context.accounts.aliceWallet).transferOwnership(context.accounts.bobWallet.address),
        ).to.revertedWith('Ownable: caller is not the owner');
      });
    });

    describe('when calling with owner account', () => {
      it('should transfer ownership', async () => {
        // given
        const context = await loadFixture(deployComplianceWithCountryAllowModule);

        // when
        await context.suite.countryAllowModule.connect(context.accounts.deployer).transferOwnership(context.accounts.bobWallet.address);
        await context.suite.countryAllowModule.connect(context.accounts.bobWallet).acceptOwnership();

        // then
        const owner = await context.suite.countryAllowModule.owner();
        expect(owner).to.eq(context.accounts.bobWallet.address);
      });
    });
  });

  describe('.upgradeTo', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployComplianceWithCountryAllowModule);
        await expect(context.suite.countryAllowModule.connect(context.accounts.aliceWallet).upgradeTo(ethers.ZeroAddress)).to.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when calling with owner account', () => {
      it('should upgrade proxy', async () => {
        // given
        const {
          suite: { countryAllowModule, compliance },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.Interface(['function addAllowedCountry(uint16 country)']).encodeFunctionData('addAllowedCountry', [42]),
            countryAllowModule.target,
          );

        const newImplementation = await ethers.deployContract('TestUpgradedCountryAllowModule');

        // when
        await countryAllowModule.connect(deployer).upgradeTo(newImplementation.target);

        // then
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(countryAllowModule.target);
        expect(implementationAddress).to.eq(newImplementation.target);

        const upgradedContract = await ethers.getContractAt('TestUpgradedCountryAllowModule', countryAllowModule.target);
        expect(await upgradedContract.getNewField()).to.be.eq(0);

        await upgradedContract.connect(deployer).setNewField(222);
        expect(await upgradedContract.getNewField()).to.be.eq(222);
        expect(await upgradedContract.isCountryAllowed(compliance.target, 42)).to.be.true;
      });
    });
  });

  describe('.batchAllowCountries()', () => {
    describe('when calling not via the Compliance contract', () => {
      it('should revert', async () => {
        const {
          suite: { countryAllowModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.connect(anotherWallet).batchAllowCountries([42, 66])).to.be.revertedWithCustomError(
          countryAllowModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when calling as the owner', () => {
      it('should revert', async () => {
        const {
          suite: { countryAllowModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.connect(deployer).batchAllowCountries([42, 66])).to.be.revertedWithCustomError(
          countryAllowModule,
          'OnlyBoundComplianceCanCall',
        );
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
            new ethers.Interface(['function batchAllowCountries(uint16[] calldata countries)']).encodeFunctionData('batchAllowCountries', [[42, 66]]),
            countryAllowModule.target,
          );

        await expect(tx).to.emit(countryAllowModule, 'CountryAllowed').withArgs(compliance.target, 42);
        await expect(tx).to.emit(countryAllowModule, 'CountryAllowed').withArgs(compliance.target, 66);

        expect(await countryAllowModule.isCountryAllowed(compliance.target, 42)).to.be.true;
        expect(await countryAllowModule.isCountryAllowed(compliance.target, 66)).to.be.true;
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

        await expect(countryAllowModule.connect(anotherWallet).batchDisallowCountries([42, 66])).to.be.revertedWithCustomError(
          countryAllowModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when calling as the owner', () => {
      it('should revert', async () => {
        const {
          suite: { countryAllowModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.connect(deployer).batchDisallowCountries([42, 66])).to.be.revertedWithCustomError(
          countryAllowModule,
          'OnlyBoundComplianceCanCall',
        );
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
            new ethers.Interface(['function batchDisallowCountries(uint16[] calldata countries)']).encodeFunctionData('batchDisallowCountries', [
              [42, 66],
            ]),
            countryAllowModule.target,
          );

        await expect(tx).to.emit(countryAllowModule, 'CountryUnallowed').withArgs(compliance.target, 42);
        await expect(tx).to.emit(countryAllowModule, 'CountryUnallowed').withArgs(compliance.target, 66);

        expect(await countryAllowModule.isCountryAllowed(compliance.target, 42)).to.be.false;
        expect(await countryAllowModule.isCountryAllowed(compliance.target, 66)).to.be.false;
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

        await expect(countryAllowModule.connect(anotherWallet).addAllowedCountry(42)).to.be.revertedWithCustomError(
          countryAllowModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when calling as the owner', () => {
      it('should revert', async () => {
        const {
          suite: { countryAllowModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.connect(deployer).addAllowedCountry(42)).to.be.revertedWithCustomError(
          countryAllowModule,
          'OnlyBoundComplianceCanCall',
        );
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
              new ethers.Interface(['function addAllowedCountry(uint16 country)']).encodeFunctionData('addAllowedCountry', [42]),
              countryAllowModule.target,
            );

          await expect(
            compliance
              .connect(deployer)
              .callModuleFunction(
                new ethers.Interface(['function addAllowedCountry(uint16 country)']).encodeFunctionData('addAllowedCountry', [42]),
                countryAllowModule.target,
              ),
          )
            .to.be.revertedWithCustomError(countryAllowModule, 'CountryAlreadyAllowed')
            .withArgs(compliance.target, 42);
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
              new ethers.Interface(['function addAllowedCountry(uint16 country)']).encodeFunctionData('addAllowedCountry', [42]),
              countryAllowModule.target,
            );

          await expect(tx).to.emit(countryAllowModule, 'CountryAllowed').withArgs(compliance.target, 42);

          expect(await countryAllowModule.isCountryAllowed(compliance.target, 42)).to.be.true;
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

        await expect(countryAllowModule.connect(anotherWallet).removeAllowedCountry(42)).to.be.revertedWithCustomError(
          countryAllowModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when calling as the owner', () => {
      it('should revert', async () => {
        const {
          suite: { countryAllowModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.connect(deployer).removeAllowedCountry(42)).to.be.revertedWithCustomError(
          countryAllowModule,
          'OnlyBoundComplianceCanCall',
        );
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
                new ethers.Interface(['function removeAllowedCountry(uint16 country)']).encodeFunctionData('removeAllowedCountry', [42]),
                countryAllowModule.target,
              ),
          )
            .to.be.revertedWithCustomError(countryAllowModule, 'CountryNotAllowed')
            .withArgs(compliance.target, 42);
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
              new ethers.Interface(['function addAllowedCountry(uint16 country)']).encodeFunctionData('addAllowedCountry', [42]),
              countryAllowModule.target,
            );

          const tx = await compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.Interface(['function removeAllowedCountry(uint16 country)']).encodeFunctionData('removeAllowedCountry', [42]),
              countryAllowModule.target,
            );

          await expect(tx).to.emit(countryAllowModule, 'CountryUnallowed').withArgs(compliance.target, 42);

          expect(await countryAllowModule.isCountryAllowed(compliance.target, 42)).to.be.false;
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
        await compliance.bindToken(contract.target);

        await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.Interface(['function batchAllowCountries(uint16[] calldata countries)']).encodeFunctionData('batchAllowCountries', [[42, 66]]),
            countryAllowModule.target,
          );

        await contract.setInvestorCountry(42);

        await expect(countryAllowModule.moduleCheck(aliceWallet.address, bobWallet.address, 10, compliance.target)).to.be.eventually.true;
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
        await compliance.bindToken(contract.target);

        await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.Interface(['function batchAllowCountries(uint16[] calldata countries)']).encodeFunctionData('batchAllowCountries', [[42, 66]]),
            countryAllowModule.target,
          );

        await contract.setInvestorCountry(10);

        await expect(countryAllowModule.moduleCheck(aliceWallet.address, bobWallet.address, 16, compliance.target)).to.be.eventually.false;
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

        await expect(countryAllowModule.isComplianceBound(compliance.target)).to.be.eventually.true;
      });
    });

    describe('when the address is not a bound compliance', () => {
      it('should return false', async () => {
        const {
          suite: { countryAllowModule },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(countryAllowModule.isComplianceBound(countryAllowModule.target)).to.be.eventually.false;
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

        await expect(countryAllowModule.connect(anotherWallet).unbindCompliance(compliance.target)).to.be.revertedWithCustomError(
          countryAllowModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });
  });
  describe('.supportsInterface()', () => {
    it('should return false for unsupported interfaces', async () => {
      const {
        suite: { countryAllowModule },
      } = await loadFixture(deployComplianceWithCountryAllowModule);

      const unsupportedInterfaceId = '0x12345678';
      expect(await countryAllowModule.supportsInterface(unsupportedInterfaceId)).to.equal(false);
    });

    it('should correctly identify the IModule interface ID', async () => {
      const {
        suite: { countryAllowModule },
      } = await loadFixture(deployComplianceWithCountryAllowModule);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const iModuleInterfaceId = await interfaceIdCalculator.getIModuleInterfaceId();
      expect(await countryAllowModule.supportsInterface(iModuleInterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC173 interface ID', async () => {
      const {
        suite: { countryAllowModule },
      } = await loadFixture(deployComplianceWithCountryAllowModule);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc173InterfaceId = await interfaceIdCalculator.getIERC173InterfaceId();
      expect(await countryAllowModule.supportsInterface(ierc173InterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC165 interface ID', async () => {
      const {
        suite: { countryAllowModule },
      } = await loadFixture(deployComplianceWithCountryAllowModule);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc165InterfaceId = await interfaceIdCalculator.getIERC165InterfaceId();
      expect(await countryAllowModule.supportsInterface(ierc165InterfaceId)).to.equal(true);
    });
  });
  describe('.addAndSetModule()', () => {
    describe('when module is already bound', () => {
      it('should revert', async () => {
        const {
          suite: { compliance, countryAllowModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        await expect(compliance.connect(deployer).addAndSetModule(countryAllowModule.target, [])).to.be.revertedWithCustomError(
          compliance,
          'ModuleAlreadyBound',
        );
      });
    });
    describe('when calling batchAllowCountries not as owner', () => {
      it('should revert', async () => {
        const {
          suite: { compliance, countryAllowModule },
          accounts: { deployer, anotherWallet },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        // Remove the module first
        await compliance.connect(deployer).removeModule(countryAllowModule.target);

        await expect(
          compliance
            .connect(anotherWallet)
            .addAndSetModule(countryAllowModule.target, [
              new ethers.Interface(['function batchAllowCountries(uint16[] calldata countries)']).encodeFunctionData('batchAllowCountries', [[42]]),
            ]),
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });
    describe('when providing more than 5 interactions', () => {
      it('should revert', async () => {
        const {
          suite: { compliance, countryAllowModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        // Remove the module first
        await compliance.connect(deployer).removeModule(countryAllowModule.target);

        const interactions = Array.from({ length: 6 }, () =>
          new ethers.Interface(['function batchAllowCountries(uint16[] calldata countries)']).encodeFunctionData('batchAllowCountries', [[42]]),
        );

        await expect(compliance.connect(deployer).addAndSetModule(countryAllowModule.target, interactions)).to.be.revertedWithCustomError(
          compliance,
          'ArraySizeLimited',
        );
      });
    });
    describe('when calling addAllowedCountry twice with the same country code', () => {
      it('should revert with CountryAlreadyAllowed', async () => {
        const {
          suite: { compliance, countryAllowModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        // Remove the module first to simulate a fresh start
        await compliance.connect(deployer).removeModule(countryAllowModule.target);

        await expect(
          compliance
            .connect(deployer)
            .addAndSetModule(countryAllowModule.target, [
              new ethers.Interface(['function addAllowedCountry(uint16 country)']).encodeFunctionData('addAllowedCountry', [42]),
              new ethers.Interface(['function addAllowedCountry(uint16 country)']).encodeFunctionData('addAllowedCountry', [42]),
            ]),
        ).to.be.revertedWithCustomError(countryAllowModule, 'CountryAlreadyAllowed');
      });
    });
    describe('when calling batchAllowCountries twice successfully', () => {
      it('should add the module and interact with it', async () => {
        const {
          suite: { compliance, countryAllowModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryAllowModule);

        // Remove the module first
        await compliance.connect(deployer).removeModule(countryAllowModule.target);

        const tx = await compliance
          .connect(deployer)
          .addAndSetModule(countryAllowModule.target, [
            new ethers.Interface(['function batchAllowCountries(uint16[] calldata countries)']).encodeFunctionData('batchAllowCountries', [[42]]),
            new ethers.Interface(['function batchAllowCountries(uint16[] calldata countries)']).encodeFunctionData('batchAllowCountries', [[66]]),
          ]);

        await expect(tx).to.emit(compliance, 'ModuleAdded').withArgs(countryAllowModule.target);
        await expect(tx).to.emit(countryAllowModule, 'CountryAllowed').withArgs(compliance.target, 42);
        await expect(tx).to.emit(countryAllowModule, 'CountryAllowed').withArgs(compliance.target, 66);

        expect(await countryAllowModule.isCountryAllowed(compliance.target, 42)).to.be.true;
        expect(await countryAllowModule.isCountryAllowed(compliance.target, 66)).to.be.true;
      });
    });
  });
});
