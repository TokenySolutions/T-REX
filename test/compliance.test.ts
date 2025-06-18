import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
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

      await expect(compliance.init()).to.be.revertedWithCustomError(compliance, 'InvalidInitialization');
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
          await newCompliance.isTokenBound(token.target).then(bound => expect(bound).to.be.false);
          const tx = await token.setCompliance(newCompliance.target);
          await expect(tx).to.emit(token, 'ComplianceAdded').withArgs(newCompliance.target);
          await expect(tx).to.emit(newCompliance, 'TokenBound').withArgs(token.target);
          await newCompliance.isTokenBound(token.target).then(bound => expect(bound).to.be.true);
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
            authorities: { trexImplementationAuthority },
          } = await loadFixture(deployFullSuiteFixture);

          const complianceProxy = await ethers.deployContract('ModularComplianceProxy', [trexImplementationAuthority.target]);
          const compliance = await ethers.getContractAt('ModularCompliance', complianceProxy.target);

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

        await expect(compliance.connect(anotherWallet).addModule(ethers.ZeroAddress)).to.be.revertedWithCustomError(
          compliance,
          'OwnableUnauthorizedAccount',
        );
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

          const module = await ethers.deployContract('TestModule');
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

            const module = await ethers.deployContract('ModuleNotPnP');
            await expect(compliance.addModule(module.target)).to.be.revertedWithCustomError(compliance, 'ComplianceNotSuitableForBindingToModule');
          });
        });

        describe('when compliance is suitable for binding to the module', () => {
          it('should bind', async () => {
            const {
              accounts,
              suite: { compliance, token },
            } = await loadFixture(deploySuiteWithModularCompliancesFixture);

            await compliance.connect(accounts.deployer).bindToken(token.target);
            await token.connect(accounts.tokenAgent).burn(accounts.aliceWallet.address, 1000);
            await token.connect(accounts.tokenAgent).burn(accounts.bobWallet.address, 500);

            const module = await ethers.deployContract('ModuleNotPnP');
            await module.setModuleReady(compliance.target, true);
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

          const module = await ethers.deployContract('TestModule');
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

          const modules = await Promise.all(Array.from({ length: 25 }, () => ethers.deployContract('TestModule')));

          await Promise.all(modules.map(module => compliance.addModule(module.target)));

          const module = await ethers.deployContract('TestModule');

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

        await expect(compliance.connect(anotherWallet).removeModule(ethers.ZeroAddress)).to.be.revertedWithCustomError(
          compliance,
          'OwnableUnauthorizedAccount',
        );
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

          const module = await ethers.deployContract('TestModule');

          await expect(compliance.removeModule(module.target)).to.be.revertedWithCustomError(compliance, 'ModuleNotBound');
        });
      });

      describe('when module is bound', () => {
        it('should remove the module', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const module = await ethers.deployContract('TestModule');
          await compliance.addModule(module.target);

          const moduleB = await ethers.deployContract('TestModule');
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
    describe('when not calling as a bound token', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          suite: { compliance },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        await expect(compliance.connect(anotherWallet).created(anotherWallet.address, 100)).to.be.revertedWithCustomError(
          compliance,
          'AddressNotATokenBoundToComplianceContract',
        );
      });
    });

    describe('when calling as a bound token', () => {
      describe('when to address is zero', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
            accounts: { charlieWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).created(ethers.ZeroAddress, 100)).to.be.revertedWithCustomError(compliance, 'ZeroAddress');
        });
      });

      describe('when value is zero', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
            accounts: { charlieWallet, bobWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).created(bobWallet.address, 0)).to.be.revertedWithCustomError(compliance, 'ZeroValue');
        });
      });

      describe('when parameters are valid', () => {
        it('should call moduleMintAction on all bound modules', async () => {
          const {
            suite: { compliance },
            accounts: { charlieWallet, bobWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          const module = await ethers.deployContract('TestModule');
          await compliance.addModule(module.target);

          await expect(compliance.connect(charlieWallet).created(bobWallet.address, 100)).to.not.be.reverted;
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
    describe('when not calling as a bound token', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          suite: { compliance },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        await expect(compliance.connect(anotherWallet).destroyed(anotherWallet.address, 100)).to.be.revertedWithCustomError(
          compliance,
          'AddressNotATokenBoundToComplianceContract',
        );
      });
    });

    describe('when calling as a bound token', () => {
      describe('when from address is zero', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
            accounts: { charlieWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).destroyed(ethers.ZeroAddress, 100)).to.be.revertedWithCustomError(compliance, 'ZeroAddress');
        });
      });

      describe('when value is zero', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
            accounts: { charlieWallet, aliceWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).destroyed(aliceWallet.address, 0)).to.be.revertedWithCustomError(compliance, 'ZeroValue');
        });
      });

      describe('when parameters are valid', () => {
        it('should call moduleBurnAction on all bound modules', async () => {
          const {
            suite: { compliance },
            accounts: { charlieWallet, aliceWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          const module = await ethers.deployContract('TestModule');
          await compliance.addModule(module.target);

          await expect(compliance.connect(charlieWallet).destroyed(aliceWallet.address, 100)).to.not.be.reverted;
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

        await expect(compliance.connect(anotherWallet).callModuleFunction(ethers.randomBytes(32), ethers.ZeroAddress)).to.be.revertedWithCustomError(
          compliance,
          'OwnableUnauthorizedAccount',
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
    describe('when not calling as the owner', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          suite: { compliance },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        const module = await ethers.deployContract('TestModule');
        await compliance.addModule(module.target);

        const callData = new ethers.Interface(['function someFunction()']).encodeFunctionData('someFunction');

        await expect(compliance.connect(anotherWallet).callModuleFunction(callData, module.target)).to.be.revertedWithCustomError(
          compliance,
          'OwnableUnauthorizedAccount',
        );
      });
    });

    describe('when calling as the owner', () => {
      describe('when module is not bound', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const module = await ethers.deployContract('TestModule');
          const callData = new ethers.Interface(['function someFunction()']).encodeFunctionData('someFunction');

          await expect(compliance.callModuleFunction(callData, module.target)).to.be.revertedWithCustomError(compliance, 'ModuleNotBound');
        });
      });

      describe('when module is bound', () => {
        it('should call module function and emit ModuleInteraction event', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const module = await ethers.deployContract('TestModule');
          await compliance.addModule(module.target);

          const callData = new ethers.Interface(['function blockModule(bool _blocked)']).encodeFunctionData('blockModule', [true]);
          const expectedSelector = callData.slice(0, 10); // First 4 bytes + 0x prefix

          const tx = await compliance.callModuleFunction(callData, module.target);

          await expect(tx).to.emit(compliance, 'ModuleInteraction').withArgs(module.target, expectedSelector);
        });

        it('should call module function and emit ModuleInteraction event', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const module = await ethers.deployContract('TestModule');
          await compliance.addModule(module.target);

          // Use the actual blockModule function from TestModule
          const callData = new ethers.Interface(['function blockModule(bool _blocked)']).encodeFunctionData('blockModule', [true]);
          const expectedSelector = callData.slice(0, 10); // First 4 bytes + 0x prefix

          const tx = await compliance.callModuleFunction(callData, module.target);

          await expect(tx).to.emit(compliance, 'ModuleInteraction').withArgs(module.target, expectedSelector);
        });
      });
    });
  });

  describe('.addAndSetModule', () => {
    describe('when not calling as the owner', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          suite: { compliance },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        const module = await ethers.deployContract('TestModule');
        const interactions: string[] = [];

        await expect(compliance.connect(anotherWallet).addAndSetModule(module.target, interactions)).to.be.revertedWithCustomError(
          compliance,
          'OwnableUnauthorizedAccount',
        );
      });
    });

    describe('when calling as the owner', () => {
      describe('when interactions array exceeds 5 elements', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const module = await ethers.deployContract('TestModule');
          const interactions = Array(6)
            .fill('0x')
            .map(() => new ethers.Interface(['function someFunction()']).encodeFunctionData('someFunction'));

          await expect(compliance.addAndSetModule(module.target, interactions)).to.be.revertedWithCustomError(compliance, 'ArraySizeLimited');
        });
      });

      describe('when interactions array is valid', () => {
        it('should add module and perform interactions', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const module = await ethers.deployContract('TestModule');
          const interactions = [
            new ethers.Interface(['function blockModule(bool _blocked)']).encodeFunctionData('blockModule', [true]),
            new ethers.Interface(['function blockModule(bool _blocked)']).encodeFunctionData('blockModule', [false]),
          ];

          const tx = await compliance.addAndSetModule(module.target, interactions);

          await expect(tx).to.emit(compliance, 'ModuleAdded').withArgs(module.target);
          await expect(tx).to.emit(compliance, 'ModuleInteraction');
          await expect(compliance.isModuleBound(module.target)).to.be.eventually.true;
        });

        it('should work with empty interactions array', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const module = await ethers.deployContract('TestModule');
          const interactions: string[] = [];

          const tx = await compliance.addAndSetModule(module.target, interactions);

          await expect(tx).to.emit(compliance, 'ModuleAdded').withArgs(module.target);
          await expect(compliance.isModuleBound(module.target)).to.be.eventually.true;
        });
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
    it('should return true for IERC165 interface', async () => {
      const {
        suite: { compliance },
      } = await loadFixture(deploySuiteWithModularCompliancesFixture);

      // IERC165 interface ID: 0x01ffc9a7
      expect(await compliance.supportsInterface('0x01ffc9a7')).to.be.true;
    });

    it('should return true for IERC3643Compliance interface', async () => {
      const {
        suite: { compliance },
      } = await loadFixture(deploySuiteWithModularCompliancesFixture);

      // Deploy the InterfaceIdCalculator to get the correct interface ID
      const calculator = await ethers.deployContract('InterfaceIdCalculator');
      const interfaceId = await calculator.getIERC3643ComplianceInterfaceId();

      expect(await compliance.supportsInterface(interfaceId)).to.be.true;
    });

    it('should return false for unsupported interfaces', async () => {
      const {
        suite: { compliance },
      } = await loadFixture(deploySuiteWithModularCompliancesFixture);

      expect(await compliance.supportsInterface('0xffffffff')).to.be.false;
      expect(await compliance.supportsInterface('0x12345678')).to.be.false;
    });
  });
  describe('edge cases for complete coverage', () => {
    describe('when calling canTransfer with blocked module', () => {
      it('should return false if any module check fails', async () => {
        const {
          suite: { compliance },
          accounts: { aliceWallet, bobWallet },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        const module = await ethers.deployContract('TestModule');
        await compliance.addModule(module.target);

        // Block the module to make moduleCheck return false
        await compliance.callModuleFunction(
          new ethers.Interface(['function blockModule(bool _blocked)']).encodeFunctionData('blockModule', [true]),
          module.target,
        );

        const result = await compliance.canTransfer(aliceWallet.address, bobWallet.address, 100);
        expect(result).to.be.false;
      });
    });

    describe('when removing module that unbinding fails', () => {
      it('should still remove the module from array', async () => {
        const {
          suite: { compliance },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        // Add multiple modules to test array manipulation
        const moduleA = await ethers.deployContract('TestModule');
        const moduleB = await ethers.deployContract('TestModule');
        const moduleC = await ethers.deployContract('TestModule');

        await compliance.addModule(moduleA.target);
        await compliance.addModule(moduleB.target);
        await compliance.addModule(moduleC.target);

        // Remove middle module to test array reordering
        const tx = await compliance.removeModule(moduleB.target);

        await expect(tx).to.emit(compliance, 'ModuleRemoved').withArgs(moduleB.target);

        const modules = await compliance.getModules();
        expect(modules.length).to.equal(2);
        expect(modules).to.include(moduleA.target);
        expect(modules).to.include(moduleC.target);
        expect(modules).to.not.include(moduleB.target);
      });
    });
  });
});
