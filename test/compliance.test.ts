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

  describe('.unbindToken', () => {
    describe('when calling as another account', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          suite: { token, compliance },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        await expect(compliance.connect(anotherWallet).unbindToken(token.address)).to.be.revertedWith('only owner or token can call');
      });
    });

    describe('when calling as the owner', () => {
      describe('when token is a zero address', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          await expect(compliance.unbindToken(ethers.constants.AddressZero)).to.be.revertedWith('invalid argument - zero address');
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

          await expect(compliance.unbindToken(token.address)).to.be.revertedWith('This token is not bound');
        });
      });
    });

    describe('when calling as the token given in parameters', () => {
      it('should bind the new compliance to the token', async () => {
        const {
          suite: { compliance, complianceBeta, token },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        await token.setCompliance(compliance.address);

        const tx = await token.setCompliance(complianceBeta.address);
        await expect(tx).to.emit(token, 'ComplianceAdded').withArgs(complianceBeta.address);
        await expect(tx).to.emit(complianceBeta, 'TokenBound').withArgs(token.address);
        await expect(tx).to.emit(compliance, 'TokenUnbound').withArgs(token.address);

        await expect(complianceBeta.getTokenBound()).to.eventually.eq(token.address);
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

        await expect(compliance.connect(anotherWallet).addModule(ethers.constants.AddressZero)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when calling as the owner', () => {
      describe('when module address is zero', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          await expect(compliance.addModule(ethers.constants.AddressZero)).to.be.revertedWith('invalid argument - zero address');
        });
      });

      describe('when module address is already bound', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const module = await ethers.deployContract('CountryAllowModule');
          await compliance.addModule(module.address);

          await expect(compliance.addModule(module.address)).to.be.revertedWith('module already bound');
        });
      });

      describe('when module is not plug & play', () => {
        describe('when compliance is not suitable for binding to the module', () => {
          it('should revert', async () => {
            const {
              accounts,
              suite: { compliance, token },
            } = await loadFixture(deploySuiteWithModularCompliancesFixture);
            await compliance.connect(accounts.deployer).bindToken(token.address);

            const module = await ethers.deployContract('MaxBalanceModule');
            await expect(compliance.addModule(module.address)).to.be.revertedWith('compliance is not suitable for binding to the module');
          });
        });

        describe('when compliance is suitable for binding to the module', () => {
          it('should revert', async () => {
            const {
              accounts,
              suite: { compliance, token },
            } = await loadFixture(deploySuiteWithModularCompliancesFixture);

            await compliance.connect(accounts.deployer).bindToken(token.address);
            await token.connect(accounts.tokenAgent).burn(accounts.aliceWallet.address, 1000);
            await token.connect(accounts.tokenAgent).burn(accounts.bobWallet.address, 500);

            const module = await ethers.deployContract('MaxBalanceModule');
            const tx = await compliance.addModule(module.address);

            await expect(tx).to.emit(compliance, 'ModuleAdded').withArgs(module.address);
            await expect(compliance.getModules()).to.eventually.deep.eq([module.address]);
          });
        });
      });

      describe('when module is plug & play', () => {
        it('should add the module', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const module = await ethers.deployContract('CountryAllowModule');
          const tx = await compliance.addModule(module.address);

          await expect(tx).to.emit(compliance, 'ModuleAdded').withArgs(module.address);
          await expect(compliance.getModules()).to.eventually.deep.eq([module.address]);
        });
      });

      describe('when attempting to bind a 25th module', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const modules = await Promise.all(Array.from({ length: 25 }, () => ethers.deployContract('CountryAllowModule')));

          await Promise.all(modules.map((module) => compliance.addModule(module.address)));

          const module = await ethers.deployContract('CountryAllowModule');

          await expect(compliance.addModule(module.address)).to.be.revertedWith('cannot add more than 25 modules');
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

        await expect(compliance.connect(anotherWallet).removeModule(ethers.constants.AddressZero)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when calling as the owner', () => {
      describe('when module address is zero', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          await expect(compliance.removeModule(ethers.constants.AddressZero)).to.be.revertedWith('invalid argument - zero address');
        });
      });

      describe('when module address is not bound', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const module = await ethers.deployContract('CountryAllowModule');

          await expect(compliance.removeModule(module.address)).to.be.revertedWith('module not bound');
        });
      });

      describe('when module is bound', () => {
        it('should remove the module', async () => {
          const {
            suite: { compliance },
          } = await loadFixture(deploySuiteWithModularCompliancesFixture);

          const module = await ethers.deployContract('CountryAllowModule');
          await compliance.addModule(module.address);

          const moduleB = await ethers.deployContract('CountryAllowModule');
          await compliance.addModule(moduleB.address);

          const tx = await compliance.removeModule(moduleB.address);

          await expect(tx).to.emit(compliance, 'ModuleRemoved').withArgs(moduleB.address);

          await expect(compliance.isModuleBound(moduleB.address)).to.be.eventually.false;
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

        await expect(compliance.connect(anotherWallet).transferred(ethers.constants.AddressZero, ethers.constants.AddressZero, 0)).to.be.revertedWith(
          'error : this address is not a token bound to the compliance contract',
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

          await expect(compliance.connect(charlieWallet).transferred(ethers.constants.AddressZero, bobWallet.address, 10)).to.be.revertedWith(
            'invalid argument - zero address',
          );
        });
      });

      describe('when to address is null', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
            accounts: { charlieWallet, aliceWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).transferred(aliceWallet.address, ethers.constants.AddressZero, 10)).to.be.revertedWith(
            'invalid argument - zero address',
          );
        });
      });

      describe('when amount is zero', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
            accounts: { aliceWallet, bobWallet, charlieWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).transferred(aliceWallet.address, bobWallet.address, 0)).to.be.revertedWith(
            'invalid argument - no value transfer',
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

        await expect(compliance.connect(anotherWallet).created(ethers.constants.AddressZero, 0)).to.be.revertedWith(
          'error : this address is not a token bound to the compliance contract',
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

          await expect(compliance.connect(charlieWallet).created(ethers.constants.AddressZero, 10)).to.be.revertedWith(
            'invalid argument - zero address',
          );
        });
      });

      describe('when amount is zero', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
            accounts: { bobWallet, charlieWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).created(bobWallet.address, 0)).to.be.revertedWith('invalid argument - no value mint');
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

        await expect(compliance.connect(anotherWallet).destroyed(ethers.constants.AddressZero, 0)).to.be.revertedWith(
          'error : this address is not a token bound to the compliance contract',
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

          await expect(compliance.connect(charlieWallet).destroyed(ethers.constants.AddressZero, 10)).to.be.revertedWith(
            'invalid argument - zero address',
          );
        });
      });

      describe('when amount is zero', () => {
        it('should revert', async () => {
          const {
            suite: { compliance },
            accounts: { aliceWallet, charlieWallet },
          } = await loadFixture(deploySuiteWithModuleComplianceBoundToWallet);

          await expect(compliance.connect(charlieWallet).destroyed(aliceWallet.address, 0)).to.be.revertedWith('invalid argument - no value burn');
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

        await expect(
          compliance.connect(anotherWallet).callModuleFunction(ethers.utils.randomBytes(32), ethers.constants.AddressZero),
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });

    describe('when module is not bound', () => {
      it('should revert', async () => {
        const {
          accounts: { deployer },
          suite: { compliance },
        } = await loadFixture(deploySuiteWithModularCompliancesFixture);

        await expect(compliance.connect(deployer).callModuleFunction(ethers.utils.randomBytes(32), ethers.constants.AddressZero)).to.be.revertedWith(
          'call only on bound module',
        );
      });
    });
  });
});
