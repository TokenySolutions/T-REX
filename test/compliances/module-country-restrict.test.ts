import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers, upgrades } from 'hardhat';
import { expect } from 'chai';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';

describe('CountryRestrictModule', () => {
  async function deployComplianceWithCountryRestrictModule() {
    const context = await loadFixture(deployComplianceFixture);
    const { compliance } = context.suite;

    const module = await ethers.deployContract('CountryRestrictModule');
    const proxy = await ethers.deployContract('ModuleProxy', [module.target, module.interface.encodeFunctionData('initialize')]);
    const countryRestrictModule = await ethers.getContractAt('CountryRestrictModule', proxy.target);
    await compliance.addModule(countryRestrictModule.target);
    return { ...context, suite: { ...context.suite, countryRestrictModule } };
  }

  describe('.name()', () => {
    it('should return the name of the module', async () => {
      const {
        suite: { countryRestrictModule },
      } = await loadFixture(deployComplianceWithCountryRestrictModule);

      expect(await countryRestrictModule.name()).to.equal('CountryRestrictModule');
    });
  });

  describe('.isPlugAndPlay()', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployComplianceWithCountryRestrictModule);
      expect(await context.suite.countryRestrictModule.isPlugAndPlay()).to.be.true;
    });
  });

  describe('.canComplianceBind()', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployComplianceWithCountryRestrictModule);
      expect(await context.suite.countryRestrictModule.canComplianceBind(context.suite.compliance.target)).to.be.true;
    });
  });

  describe('.owner', () => {
    it('should return owner', async () => {
      const context = await loadFixture(deployComplianceWithCountryRestrictModule);
      await expect(context.suite.countryRestrictModule.owner()).to.eventually.be.eq(context.accounts.deployer.address);
    });
  });

  describe('.initialize', () => {
    it('should be called only once', async () => {
      // given
      const {
        accounts: { deployer },
      } = await loadFixture(deployComplianceFixture);
      const module = (await ethers.deployContract('CountryRestrictModule')).connect(deployer);
      await module.initialize();

      // when & then
      await expect(module.initialize()).to.be.revertedWith('Initializable: contract is already initialized');
      expect(await module.owner()).to.be.eq(deployer.address);
    });
  });

  describe('.transferOwnership', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployComplianceWithCountryRestrictModule);
        await expect(
          context.suite.countryRestrictModule.connect(context.accounts.aliceWallet).transferOwnership(context.accounts.bobWallet.address),
        ).to.revertedWith('Ownable: caller is not the owner');
      });
    });

    describe('when calling with owner account', () => {
      it('should transfer ownership', async () => {
        // given
        const context = await loadFixture(deployComplianceWithCountryRestrictModule);

        // when
        const tx1 = await context.suite.countryRestrictModule
          .connect(context.accounts.deployer)
          .transferOwnership(context.accounts.bobWallet.address);
        expect(tx1)
          .to.emit(context.suite.countryRestrictModule, 'OwnershipTransferStarted')
          .withArgs(context.accounts.deployer.address, context.accounts.bobWallet.address);
        const tx2 = await context.suite.countryRestrictModule.connect(context.accounts.bobWallet).acceptOwnership();
        expect(tx2)
          .to.emit(context.suite.countryRestrictModule, 'OwnershipTransferred')
          .withArgs(context.accounts.deployer.address, context.accounts.bobWallet.address);
        // then
        const owner = await context.suite.countryRestrictModule.owner();
        expect(owner).to.eq(context.accounts.bobWallet.address);
      });
    });
  });

  describe('.upgradeTo', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployComplianceWithCountryRestrictModule);
        await expect(context.suite.countryRestrictModule.connect(context.accounts.aliceWallet).upgradeTo(ethers.ZeroAddress)).to.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when calling with owner account', () => {
      it('should upgrade proxy', async () => {
        // given
        const context = await loadFixture(deployComplianceWithCountryRestrictModule);
        const newImplementation = await ethers.deployContract('CountryRestrictModule');

        // when
        await context.suite.countryRestrictModule.connect(context.accounts.deployer).upgradeTo(newImplementation.target);

        // then
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(context.suite.countryRestrictModule.target);
        expect(implementationAddress).to.eq(newImplementation.target);
      });
    });
  });

  describe('.addCountryRestriction()', () => {
    describe('when the sender is a random wallet', () => {
      it('should reverts', async () => {
        const {
          suite: { countryRestrictModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);

        await expect(countryRestrictModule.connect(anotherWallet).addCountryRestriction(42)).to.be.revertedWithCustomError(
          countryRestrictModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when the sender is the deployer', () => {
      it('should revert', async () => {
        const {
          suite: { countryRestrictModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);

        await expect(countryRestrictModule.connect(deployer).addCountryRestriction(42)).to.be.revertedWithCustomError(
          countryRestrictModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when called via the compliance', () => {
      describe('when country is already restricted', () => {
        it('should revert', async () => {
          const {
            suite: { compliance, countryRestrictModule },
            accounts: { deployer },
          } = await loadFixture(deployComplianceWithCountryRestrictModule);

          await compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.Interface(['function addCountryRestriction(uint16 country)']).encodeFunctionData('addCountryRestriction', [42]),
              countryRestrictModule.target,
            );

          await expect(
            compliance
              .connect(deployer)
              .callModuleFunction(
                new ethers.Interface(['function addCountryRestriction(uint16 country)']).encodeFunctionData('addCountryRestriction', [42]),
                countryRestrictModule.target,
              ),
          ).to.be.revertedWithCustomError(countryRestrictModule, 'CountryAlreadyRestricted');
        });
      });

      describe('when country is not restricted', () => {
        it('should add the country restriction', async () => {
          const {
            suite: { compliance, countryRestrictModule },
            accounts: { deployer },
          } = await loadFixture(deployComplianceWithCountryRestrictModule);

          const tx = await compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.Interface(['function addCountryRestriction(uint16 country)']).encodeFunctionData('addCountryRestriction', [42]),
              countryRestrictModule.target,
            );

          await expect(tx).to.emit(countryRestrictModule, 'AddedRestrictedCountry').withArgs(compliance.target, 42);

          expect(await countryRestrictModule.isCountryRestricted(compliance.target, 42)).to.be.true;
        });
      });
    });
  });

  describe('.removeCountryRestriction()', () => {
    describe('when the sender is a random wallet', () => {
      it('should reverts', async () => {
        const {
          suite: { countryRestrictModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);

        await expect(countryRestrictModule.connect(anotherWallet).removeCountryRestriction(42)).to.be.revertedWithCustomError(
          countryRestrictModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when the sender is the deployer', () => {
      it('should revert', async () => {
        const {
          suite: { countryRestrictModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);

        await expect(countryRestrictModule.connect(deployer).removeCountryRestriction(42)).to.be.revertedWithCustomError(
          countryRestrictModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when called via the compliance', () => {
      describe('when country is not restricted', () => {
        it('should revert', async () => {
          const {
            suite: { compliance, countryRestrictModule },
            accounts: { deployer },
          } = await loadFixture(deployComplianceWithCountryRestrictModule);

          await expect(
            compliance
              .connect(deployer)
              .callModuleFunction(
                new ethers.Interface(['function removeCountryRestriction(uint16 country)']).encodeFunctionData('removeCountryRestriction', [42]),
                countryRestrictModule.target,
              ),
          ).to.be.revertedWithCustomError(countryRestrictModule, 'CountryNotRestricted');
        });
      });

      describe('when country is restricted', () => {
        it('should remove the country restriction', async () => {
          const {
            suite: { compliance, countryRestrictModule },
            accounts: { deployer },
          } = await loadFixture(deployComplianceWithCountryRestrictModule);

          await compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.Interface(['function addCountryRestriction(uint16 country)']).encodeFunctionData('addCountryRestriction', [42]),
              countryRestrictModule.target,
            );

          const tx = await compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.Interface(['function removeCountryRestriction(uint16 country)']).encodeFunctionData('removeCountryRestriction', [42]),
              countryRestrictModule.target,
            );

          await expect(tx).to.emit(countryRestrictModule, 'RemovedRestrictedCountry').withArgs(compliance.target, 42);

          expect(await countryRestrictModule.isCountryRestricted(compliance.target, 42)).to.be.false;
        });
      });
    });
  });

  describe('.batchRestrictCountries()', () => {
    describe('when the sender is a random wallet', () => {
      it('should reverts', async () => {
        const {
          suite: { countryRestrictModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);

        await expect(countryRestrictModule.connect(anotherWallet).batchRestrictCountries([42])).to.be.revertedWithCustomError(
          countryRestrictModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when the sender is the deployer', () => {
      it('should revert', async () => {
        const {
          suite: { countryRestrictModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);

        await expect(countryRestrictModule.connect(deployer).batchRestrictCountries([42])).to.be.revertedWithCustomError(
          countryRestrictModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when called via the compliance', () => {
      describe('when attempting to restrict more than 195 countries at once', () => {
        it('should revert', async () => {
          const {
            suite: { compliance, countryRestrictModule },
            accounts: { deployer },
          } = await loadFixture(deployComplianceWithCountryRestrictModule);

          await expect(
            compliance
              .connect(deployer)
              .callModuleFunction(
                new ethers.Interface(['function batchRestrictCountries(uint16[] memory countries)']).encodeFunctionData('batchRestrictCountries', [
                  Array.from({ length: 195 }, (_, i) => i),
                ]),
                countryRestrictModule.target,
              ),
          ).to.be.revertedWithCustomError(countryRestrictModule, 'MaxCountriesInBatchReached');
        });
      });

      describe('when a country is already restricted', () => {
        it('should revert', async () => {
          const {
            suite: { compliance, countryRestrictModule },
            accounts: { deployer },
          } = await loadFixture(deployComplianceWithCountryRestrictModule);

          await compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.Interface(['function addCountryRestriction(uint16 country)']).encodeFunctionData('addCountryRestriction', [42]),
              countryRestrictModule.target,
            );

          await expect(
            compliance
              .connect(deployer)
              .callModuleFunction(
                new ethers.Interface(['function batchRestrictCountries(uint16[] memory countries)']).encodeFunctionData('batchRestrictCountries', [
                  [12, 42, 67],
                ]),
                countryRestrictModule.target,
              ),
          ).to.be.revertedWithCustomError(countryRestrictModule, 'CountryAlreadyRestricted');
        });
      });

      it('should add the country restriction', async () => {
        const {
          suite: { compliance, countryRestrictModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);

        const tx = await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.Interface(['function batchRestrictCountries(uint16[] memory countries)']).encodeFunctionData('batchRestrictCountries', [
              [42, 66],
            ]),
            countryRestrictModule.target,
          );

        await expect(tx).to.emit(countryRestrictModule, 'AddedRestrictedCountry').withArgs(compliance.target, 42);
        await expect(tx).to.emit(countryRestrictModule, 'AddedRestrictedCountry').withArgs(compliance.target, 66);

        expect(await countryRestrictModule.isCountryRestricted(compliance.target, 42)).to.be.true;
        expect(await countryRestrictModule.isCountryRestricted(compliance.target, 66)).to.be.true;
      });
    });
  });

  describe('.batchUnrestrictCountries()', () => {
    describe('when the sender is a random wallet', () => {
      it('should reverts', async () => {
        const {
          suite: { countryRestrictModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);

        await expect(countryRestrictModule.connect(anotherWallet).batchUnrestrictCountries([42])).to.be.revertedWithCustomError(
          countryRestrictModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when the sender is the deployer', () => {
      it('should revert', async () => {
        const {
          suite: { countryRestrictModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);

        await expect(countryRestrictModule.connect(deployer).batchUnrestrictCountries([42])).to.be.revertedWithCustomError(
          countryRestrictModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when called via the compliance', () => {
      describe('when attempting to unrestrict more than 195 countries at once', () => {
        it('should revert', async () => {
          const {
            suite: { compliance, countryRestrictModule },
            accounts: { deployer },
          } = await loadFixture(deployComplianceWithCountryRestrictModule);

          await expect(
            compliance
              .connect(deployer)
              .callModuleFunction(
                new ethers.Interface(['function batchUnrestrictCountries(uint16[] memory countries)']).encodeFunctionData(
                  'batchUnrestrictCountries',
                  [Array.from({ length: 195 }, (_, i) => i)],
                ),
                countryRestrictModule.target,
              ),
          ).to.be.revertedWithCustomError(countryRestrictModule, 'MaxCountriesInBatchReached');
        });
      });

      describe('when a country is not restricted', () => {
        it('should revert', async () => {
          const {
            suite: { compliance, countryRestrictModule },
            accounts: { deployer },
          } = await loadFixture(deployComplianceWithCountryRestrictModule);

          await expect(
            compliance
              .connect(deployer)
              .callModuleFunction(
                new ethers.Interface(['function batchUnrestrictCountries(uint16[] memory countries)']).encodeFunctionData(
                  'batchUnrestrictCountries',
                  [[12, 42, 67]],
                ),
                countryRestrictModule.target,
              ),
          ).to.be.revertedWithCustomError(countryRestrictModule, 'CountryNotRestricted');
        });
      });

      it('should remove the country restriction', async () => {
        const {
          suite: { compliance, countryRestrictModule },
          accounts: { deployer },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);

        await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.Interface(['function batchRestrictCountries(uint16[] memory countries)']).encodeFunctionData('batchRestrictCountries', [
              [42, 66],
            ]),
            countryRestrictModule.target,
          );

        const tx = await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.Interface(['function batchUnrestrictCountries(uint16[] memory countries)']).encodeFunctionData('batchUnrestrictCountries', [
              [42, 66],
            ]),
            countryRestrictModule.target,
          );

        await expect(tx).to.emit(countryRestrictModule, 'RemovedRestrictedCountry').withArgs(compliance.target, 42);
        await expect(tx).to.emit(countryRestrictModule, 'RemovedRestrictedCountry').withArgs(compliance.target, 66);

        expect(await countryRestrictModule.isCountryRestricted(compliance.target, 42)).to.be.false;
        expect(await countryRestrictModule.isCountryRestricted(compliance.target, 66)).to.be.false;
      });
    });
  });

  describe('.moduleTransferAction()', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const {
          suite: { countryRestrictModule },
          accounts: { anotherWallet, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);

        await expect(
          countryRestrictModule.connect(anotherWallet).moduleTransferAction(aliceWallet.address, bobWallet.address, 10),
        ).to.be.revertedWithCustomError(countryRestrictModule, 'OnlyBoundComplianceCanCall');
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const {
          suite: { compliance, countryRestrictModule },
          accounts: { deployer, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);

        await expect(
          compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.Interface(['function moduleTransferAction(address, address, uint256)']).encodeFunctionData('moduleTransferAction', [
                aliceWallet.address,
                bobWallet.address,
                10,
              ]),
              countryRestrictModule.target,
            ),
        ).to.eventually.be.fulfilled;
      });
    });
  });

  describe('.moduleMintAction()', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const {
          suite: { countryRestrictModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);

        await expect(countryRestrictModule.connect(anotherWallet).moduleMintAction(anotherWallet.address, 10)).to.be.revertedWithCustomError(
          countryRestrictModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const {
          suite: { compliance, countryRestrictModule },
          accounts: { deployer, anotherWallet },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);

        await expect(
          compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.Interface(['function moduleMintAction(address, uint256)']).encodeFunctionData('moduleMintAction', [
                anotherWallet.address,
                10,
              ]),
              countryRestrictModule.target,
            ),
        ).to.eventually.be.fulfilled;
      });
    });
  });

  describe('.moduleBurnAction()', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const {
          suite: { countryRestrictModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);

        await expect(countryRestrictModule.connect(anotherWallet).moduleBurnAction(anotherWallet.address, 10)).to.be.revertedWithCustomError(
          countryRestrictModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const {
          suite: { compliance, countryRestrictModule },
          accounts: { deployer, anotherWallet },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);

        await expect(
          compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.Interface(['function moduleBurnAction(address, uint256)']).encodeFunctionData('moduleBurnAction', [
                anotherWallet.address,
                10,
              ]),
              countryRestrictModule.target,
            ),
        ).to.eventually.be.fulfilled;
      });
    });
  });

  describe('.moduleCheck', () => {
    describe('when identity country is restricted', () => {
      it('should return false', async () => {
        const {
          suite: { compliance, countryRestrictModule },
          accounts: { deployer, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);
        const contract = await ethers.deployContract('MockContract');
        await compliance.bindToken(contract.target);

        await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.Interface(['function batchRestrictCountries(uint16[] calldata countries)']).encodeFunctionData('batchRestrictCountries', [
              [42, 66],
            ]),
            countryRestrictModule.target,
          );

        await contract.setInvestorCountry(42);

        await expect(countryRestrictModule.moduleCheck(aliceWallet.address, bobWallet.address, 16, compliance.target)).to.be.eventually.false;
      });
    });

    describe('when identity country is not restricted', () => {
      it('should return true', async () => {
        const {
          suite: { compliance, countryRestrictModule },
          accounts: { deployer, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithCountryRestrictModule);
        const contract = await ethers.deployContract('MockContract');
        await compliance.bindToken(contract.target);

        await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.Interface(['function batchRestrictCountries(uint16[] calldata countries)']).encodeFunctionData('batchRestrictCountries', [
              [42, 66],
            ]),
            countryRestrictModule.target,
          );

        await contract.setInvestorCountry(10);

        await expect(countryRestrictModule.moduleCheck(aliceWallet.address, bobWallet.address, 16, compliance.target)).to.be.eventually.true;
      });
    });
  });
  describe('.supportsInterface()', () => {
    it('should return false for unsupported interfaces', async () => {
      const {
        suite: { countryRestrictModule },
      } = await loadFixture(deployComplianceWithCountryRestrictModule);

      const unsupportedInterfaceId = '0x12345678';
      expect(await countryRestrictModule.supportsInterface(unsupportedInterfaceId)).to.equal(false);
    });

    it('should correctly identify the IModule interface ID', async () => {
      const {
        suite: { countryRestrictModule },
      } = await loadFixture(deployComplianceWithCountryRestrictModule);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const iModuleInterfaceId = await interfaceIdCalculator.getIModuleInterfaceId();
      expect(await countryRestrictModule.supportsInterface(iModuleInterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC173 interface ID', async () => {
      const {
        suite: { countryRestrictModule },
      } = await loadFixture(deployComplianceWithCountryRestrictModule);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc173InterfaceId = await interfaceIdCalculator.getIERC173InterfaceId();
      expect(await countryRestrictModule.supportsInterface(ierc173InterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC165 interface ID', async () => {
      const {
        suite: { countryRestrictModule },
      } = await loadFixture(deployComplianceWithCountryRestrictModule);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc165InterfaceId = await interfaceIdCalculator.getIERC165InterfaceId();
      expect(await countryRestrictModule.supportsInterface(ierc165InterfaceId)).to.equal(true);
    });
  });
});
