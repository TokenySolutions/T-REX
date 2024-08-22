import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  deployFullSuiteFixture,
  deploySuiteWithModularCompliancesFixture,
  deploySuiteWithModuleComplianceBoundToWallet,
} from './fixtures/deploy-full-suite.fixture';

describe('ModularCompliance', () => {
  describe('.init', () => {
    it('should prevent calling init twice', async () => {
      const {
        suite: { compliance },
      } = await loadFixture(deploySuiteWithModularCompliancesFixture);

      await expect(compliance.init()).to.be.revertedWith('Initializable: contract is already initialized');
    });
  });

  describe('.bindToken', () => {
    describe('when calling as another account that the owner', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          suite: { token, compliance },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        await expect(compliance.connect(anotherWallet).bindToken(token.target)).to.be.revertedWithCustomError(compliance, 'OnlyOwnerOrTokenCanCall');
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

          await compliance.bindToken(token.target);

          await expect(compliance.connect(anotherWallet).bindToken(token.target)).to.be.revertedWithCustomError(
            compliance,
            'OnlyOwnerOrTokenCanCall',
          );
        });
      });

      describe('when calling as the token', () => {
        it('should set the new compliance', async () => {
          const {
            suite: { token },
          } = await loadFixture(deployFullSuiteFixture);

          const compliance = await ethers.deployContract('ModularCompliance');
          await compliance.init();
          await compliance.bindToken(token.target);

          const newCompliance = await ethers.deployContract('ModularCompliance');

          const tx = await token.setCompliance(newCompliance.target);
          await expect(tx).to.emit(token, 'ComplianceAdded').withArgs(newCompliance.target);
          await expect(tx).to.emit(newCompliance, 'TokenBound').withArgs(token.target);
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

          await expect(compliance.bindToken(ethers.ZeroAddress)).to.be.revertedWithCustomError(compliance, 'ZeroAddress');
        });
      });
    });
  });

  describe('.unbindToken', () => {
    describe('when calling as another account', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          suite: { token, compliance },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        await expect(compliance.connect(anotherWallet).unbindToken(token.target)).to.be.revertedWithCustomError(
          compliance,
          'OnlyOwnerOrTokenCanCall',
        );
      });
    });

    describe('when calling as the owner', () => {
      describe('when token is a zero address', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          await expect(compliance.unbindToken(ethers.ZeroAddress)).to.be.revertedWithCustomError(compliance, 'ZeroAddress');
        });
      });

      describe('when token is not bound', () => {
        it('should revert', async () => {
          const {
            accounts: { deployer },
            suite: { token },
          } = await loadFixture(deployFullSuiteFixture);

          const compliance = await ethers.deployContract('ModularCompliance', deployer);
          await compliance.init();

          await expect(compliance.unbindToken(token.target)).to.be.revertedWithCustomError(compliance, 'TokenNotBound');
        });
      });
    });

    describe('when calling as the token given in parameters', () => {
      it('should bind the new compliance to the token', async () => {
        const {
          suite: { compliance, complianceBeta, token },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        await token.setCompliance(compliance.target);

        const tx = await token.setCompliance(complianceBeta.target);
        await expect(tx).to.emit(token, 'ComplianceAdded').withArgs(complianceBeta.target);
        await expect(tx).to.emit(complianceBeta, 'TokenBound').withArgs(token.target);
        await expect(tx).to.emit(compliance, 'TokenUnbound').withArgs(token.target);

        await expect(complianceBeta.getTokenBound()).to.eventually.eq(token.target);
      });
    });
  });

  describe('.addModule', () => {
    describe('when not calling as the owner', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          suite: { compliance },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        await expect(compliance.connect(anotherWallet).addModule(ethers.ZeroAddress)).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });

    describe('when calling as the owner', () => {
      describe('when module address is zero', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          await expect(compliance.addModule(ethers.ZeroAddress)).to.be.revertedWithCustomError(compliance, 'ZeroAddress');
        });
      });

      describe('when module address is already bound', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const module = await ethers.deployContract('CountryAllowModule');
          await compliance.addModule(module.target);

          await expect(compliance.addModule(module.target)).to.be.revertedWithCustomError(compliance, 'ModuleAlreadyBound');
        });
      });

      describe('when module is not plug & play', () => {
        describe('when compliance is not suitable for binding to the module', () => {
          it('should revert', async () => {
            const {
              accounts,
              suite: { compliance, token },
            } = await loadFixture(deploySuiteWithModularCompliancesFixture);
            await compliance.connect(accounts.deployer).bindToken(token.target);

            const module = await ethers.deployContract('MaxBalanceModule');
            await expect(compliance.addModule(module.target)).to.be.revertedWithCustomError(compliance, 'ComplianceNotSuitableForBindingToModule');
          });
        });

        describe('when compliance is suitable for binding to the module', () => {
          it('should revert', async () => {
            const {
              accounts,
              suite: { compliance, token },
            } = await loadFixture(deploySuiteWithModularCompliancesFixture);

            await compliance.connect(accounts.deployer).bindToken(token.target);
            await token.connect(accounts.tokenAgent).burn(accounts.aliceWallet.address, 1000);
            await token.connect(accounts.tokenAgent).burn(accounts.bobWallet.address, 500);

            const module = await ethers.deployContract('MaxBalanceModule');
            const tx = await compliance.addModule(module.target);

            await expect(tx).to.emit(compliance, 'ModuleAdded').withArgs(module.target);
            await expect(compliance.getModules()).to.eventually.deep.eq([module.target]);
          });
        });
      });

      describe('when module is plug & play', () => {
        it('should add the module', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const module = await ethers.deployContract('CountryAllowModule');
          const tx = await compliance.addModule(module.target);

          await expect(tx).to.emit(compliance, 'ModuleAdded').withArgs(module.target);
          await expect(compliance.getModules()).to.eventually.deep.eq([module.target]);
        });
      });

      describe('when attempting to bind a 25th module', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const modules = await Promise.all(Array.from({ length: 25 }, () => ethers.deployContract('CountryAllowModule')));

          await Promise.all(modules.map((module) => compliance.addModule(module.target)));

          const module = await ethers.deployContract('CountryAllowModule');

          await expect(compliance.addModule(module.target)).to.be.revertedWithCustomError(compliance, 'MaxModulesReached');
        });
      });
    });
  });

  describe('.removeModule', () => {
    describe('when not calling as owner', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          suite: { compliance },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        await expect(compliance.connect(anotherWallet).removeModule(ethers.ZeroAddress)).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });

    describe('when calling as the owner', () => {
      describe('when module address is zero', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          await expect(compliance.removeModule(ethers.ZeroAddress)).to.be.revertedWithCustomError(compliance, 'ZeroAddress');
        });
      });

      describe('when module address is not bound', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const module = await ethers.deployContract('CountryAllowModule');

          await expect(compliance.removeModule(module.target)).to.be.revertedWithCustomError(compliance, 'ModuleNotBound');
        });
      });

      describe('when module is bound', () => {
        it('should remove the module', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const module = await ethers.deployContract('CountryAllowModule');
          await compliance.addModule(module.target);

          const moduleB = await ethers.deployContract('CountryAllowModule');
          await compliance.addModule(moduleB.target);

          const tx = await compliance.removeModule(moduleB.target);

          await expect(tx).to.emit(compliance, 'ModuleRemoved').withArgs(moduleB.target);

          await expect(compliance.isModuleBound(moduleB.target)).to.be.eventually.false;
        });
      });
    });
  });

  describe('.transferred', () => {
    describe('when not calling as a bound token', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          suite: { compliance },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        await expect(compliance.connect(anotherWallet).transferred(ethers.ZeroAddress, ethers.ZeroAddress, 0)).to.be.revertedWithCustomError(
          compliance,
          'AddressNotATokenBoundToComplianceContract',
        );
      });
    });

    describe('when calling as a bound token', () => {
      describe('when from address is null', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
            accounts: { bobWallet, charlieWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).transferred(ethers.ZeroAddress, bobWallet.address, 10)).to.be.revertedWithCustomError(
            compliance,
            'ZeroAddress',
          );
        });
      });

      describe('when to address is null', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
            accounts: { charlieWallet, aliceWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).transferred(aliceWallet.address, ethers.ZeroAddress, 10)).to.be.revertedWithCustomError(
            compliance,
            'ZeroAddress',
          );
        });
      });

      describe('when amount is zero', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
            accounts: { aliceWallet, bobWallet, charlieWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).transferred(aliceWallet.address, bobWallet.address, 0)).to.be.revertedWithCustomError(
            compliance,
            'ZeroValue',
          );
        });
      });

      describe('when amount is greater than zero', () => {
        it('Should update the modules', async () => {
          const {
            suite: { compliance },
            accounts: { aliceWallet, bobWallet, charlieWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).transferred(aliceWallet.address, bobWallet.address, 10)).to.be.fulfilled;
        });
      });
    });
  });

  describe('.created', () => {
    describe('when not calling as a bound token', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          suite: { compliance },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        await expect(compliance.connect(anotherWallet).created(ethers.ZeroAddress, 0)).to.be.revertedWithCustomError(
          compliance,
          'AddressNotATokenBoundToComplianceContract',
        );
      });
    });

    describe('when calling as a bound token', () => {
      describe('when to address is null', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
            accounts: { charlieWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).created(ethers.ZeroAddress, 10)).to.be.revertedWithCustomError(compliance, 'ZeroAddress');
        });
      });

      describe('when amount is zero', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
            accounts: { bobWallet, charlieWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).created(bobWallet.address, 0)).to.be.revertedWithCustomError(compliance, 'ZeroValue');
        });
      });

      describe('when amount is greater than zero', () => {
        it('Should update the modules', async () => {
          const {
            suite: { compliance },
            accounts: { bobWallet, charlieWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).created(bobWallet.address, 10)).to.be.fulfilled;
        });
      });
    });
  });

  describe('.destroyed', () => {
    describe('when not calling as a bound token', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          suite: { compliance },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        await expect(compliance.connect(anotherWallet).destroyed(ethers.ZeroAddress, 0)).to.be.revertedWithCustomError(
          compliance,
          'AddressNotATokenBoundToComplianceContract',
        );
      });
    });

    describe('when calling as a bound token', () => {
      describe('when from address is null', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
            accounts: { charlieWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).destroyed(ethers.ZeroAddress, 10)).to.be.revertedWithCustomError(compliance, 'ZeroAddress');
        });
      });

      describe('when amount is zero', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
            accounts: { aliceWallet, charlieWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).destroyed(aliceWallet.address, 0)).to.be.revertedWithCustomError(compliance, 'ZeroValue');
        });
      });

      describe('when amount is greater than zero', () => {
        it('Should update the modules', async () => {
          const {
            suite: { compliance },
            accounts: { aliceWallet, charlieWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).destroyed(aliceWallet.address, 10)).to.be.fulfilled;
        });
      });
    });
  });

  describe('.callModuleFunction()', () => {
    describe('when sender is not the owner', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          suite: { compliance },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        await expect(compliance.connect(anotherWallet).callModuleFunction(ethers.randomBytes(32), ethers.ZeroAddress)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when module is not bound', () => {
      it('should revert', async () => {
        const {
          accounts: { deployer },
          suite: { compliance },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        await expect(compliance.connect(deployer).callModuleFunction(ethers.randomBytes(32), ethers.ZeroAddress)).to.be.revertedWithCustomError(
          compliance,
          'ModuleNotBound',
        );
      });
    });
  });
  describe('.supportsInterface()', () => {
    it('should return false for unsupported interfaces', async () => {
      const {
        suite: { compliance },
      } = await loadFixture(deploySuiteWithModularCompliancesFixture);

      const unsupportedInterfaceId = '0x12345678';
      expect(await compliance.supportsInterface(unsupportedInterfaceId)).to.equal(false);
    });

    it('should correctly identify the IModularCompliance interface ID', async () => {
      const {
        suite: { compliance },
      } = await loadFixture(deploySuiteWithModularCompliancesFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const iModularComplianceInterfaceId = await interfaceIdCalculator.getIModularComplianceInterfaceId();
      expect(await compliance.supportsInterface(iModularComplianceInterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC3643Compliance interface ID', async () => {
      const {
        suite: { compliance },
      } = await loadFixture(deploySuiteWithModularCompliancesFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const iComplianceInterfaceId = await interfaceIdCalculator.getIERC3643ComplianceInterfaceId();
      expect(await compliance.supportsInterface(iComplianceInterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC173 interface ID', async () => {
      const {
        suite: { compliance },
      } = await loadFixture(deploySuiteWithModularCompliancesFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc173InterfaceId = await interfaceIdCalculator.getIERC173InterfaceId();
      expect(await compliance.supportsInterface(ierc173InterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC165 interface ID', async () => {
      const {
        suite: { compliance },
      } = await loadFixture(deploySuiteWithModularCompliancesFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc165InterfaceId = await interfaceIdCalculator.getIERC165InterfaceId();
      expect(await compliance.supportsInterface(ierc165InterfaceId)).to.equal(true);
    });
  });
});
