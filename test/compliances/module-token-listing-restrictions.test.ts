import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers, upgrades } from 'hardhat';
import { expect } from 'chai';
import { deploySuiteWithModularCompliancesFixture } from '../fixtures/deploy-full-suite.fixture';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';

async function deployTokenListingRestrictionsFullSuite() {
  const context = await loadFixture(deploySuiteWithModularCompliancesFixture);
  const module = await ethers.deployContract('TokenListingRestrictionsModule');
  const proxy = await ethers.deployContract('ModuleProxy', [module.address, module.interface.encodeFunctionData('initialize')]);
  const complianceModule = await ethers.getContractAt('TokenListingRestrictionsModule', proxy.address);

  await context.suite.compliance.bindToken(context.suite.token.address);
  await context.suite.compliance.addModule(complianceModule.address);

  return {
    ...context,
    suite: {
      ...context.suite,
      complianceModule,
    },
  };
}

describe('Compliance Module: TokenListingRestrictions', () => {
  it('should deploy the TokenListingRestrictions contract and bind it to the compliance', async () => {
    const context = await loadFixture(deployTokenListingRestrictionsFullSuite);

    expect(context.suite.complianceModule.address).not.to.be.undefined;
    expect(await context.suite.compliance.isModuleBound(context.suite.complianceModule.address)).to.be.true;
  });

  describe('.name', () => {
    it('should return the name of the module', async () => {
      const context = await loadFixture(deployTokenListingRestrictionsFullSuite);

      expect(await context.suite.complianceModule.name()).to.be.equal('TokenListingRestrictionsModule');
    });
  });

  describe('.isPlugAndPlay', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
      expect(await context.suite.complianceModule.isPlugAndPlay()).to.be.true;
    });
  });

  describe('.canComplianceBind', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
      const complianceModule = await ethers.deployContract('TokenListingRestrictionsModule');
      expect(await complianceModule.canComplianceBind(context.suite.compliance.address)).to.be.true;
    });
  });

  describe('.owner', () => {
    it('should return owner', async () => {
      const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
      await expect(context.suite.complianceModule.owner()).to.eventually.be.eq(context.accounts.deployer.address);
    });
  });

  describe('.initialize', () => {
    it('should be called only once', async () => {
      // given
      const {
        accounts: { deployer },
      } = await loadFixture(deployComplianceFixture);
      const module = (await ethers.deployContract('TokenListingRestrictionsModule')).connect(deployer);
      await module.initialize();

      // when & then
      await expect(module.initialize()).to.be.revertedWith('Initializable: contract is already initialized');
      expect(await module.owner()).to.be.eq(deployer.address);
    });
  });

  describe('.transferOwnership', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
        await expect(
          context.suite.complianceModule.connect(context.accounts.aliceWallet).transferOwnership(context.accounts.bobWallet.address),
        ).to.revertedWith('Ownable: caller is not the owner');
      });
    });

    describe('when calling with owner account', () => {
      it('should transfer ownership', async () => {
        // given
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);

        // when
        const tx = await context.suite.complianceModule.connect(context.accounts.deployer).transferOwnership(context.accounts.bobWallet.address);

        // then
        await expect(tx)
          .to.emit(context.suite.complianceModule, 'OwnershipTransferred')
          .withArgs(context.accounts.deployer.address, context.accounts.bobWallet.address);

        const owner = await context.suite.complianceModule.owner();
        expect(owner).to.eq(context.accounts.bobWallet.address);
      });
    });
  });

  describe('.upgradeTo', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
        await expect(context.suite.complianceModule.connect(context.accounts.aliceWallet).upgradeTo(ethers.constants.AddressZero)).to.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when calling with owner account', () => {
      it('should upgrade proxy', async () => {
        // given
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
        const newImplementation = await ethers.deployContract('TokenListingRestrictionsModule');

        // when
        await context.suite.complianceModule.connect(context.accounts.deployer).upgradeTo(newImplementation.address);

        // then
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(context.suite.complianceModule.address);
        expect(implementationAddress).to.eq(newImplementation.address);
      });
    });
  });

  describe('.configureToken', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
        await expect(context.suite.complianceModule.configureToken(1)).to.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling via compliance', () => {
      describe('when given listing type is zero (NOT_CONFIGURED)', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
          await expect(
            context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [0]),
              context.suite.complianceModule.address,
            ),
          ).to.be.revertedWithCustomError(context.suite.complianceModule, `InvalidListingTypeForConfiguration`);
        });
      });

      describe('when token is already configured', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
            context.suite.complianceModule.address,
          );

          await expect(
            context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [2]),
              context.suite.complianceModule.address,
            ),
          ).to.be.revertedWithCustomError(context.suite.complianceModule, `TokenAlreadyConfigured`);
        });
      });

      describe('when token is not configured before', () => {
        it('should configure the token', async () => {
          const context = await loadFixture(deployTokenListingRestrictionsFullSuite);

          const tx = await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
            context.suite.complianceModule.address,
          );

          await expect(tx).to.emit(context.suite.complianceModule, 'TokenListingConfigured').withArgs(context.suite.token.address, 1);
        });
      });
    });
  });

  describe('.listToken', () => {
    describe('when token is not configured', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
        await expect(
          context.suite.complianceModule.connect(context.accounts.aliceWallet).listToken(context.suite.token.address, 1),
        ).to.be.revertedWithCustomError(context.suite.complianceModule, `TokenIsNotConfigured`);
      });
    });

    describe('when token is configured', () => {
      describe('when token is listed before', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
            context.suite.complianceModule.address,
          );

          await context.suite.complianceModule.connect(context.accounts.aliceWallet).listToken(context.suite.token.address, 1);

          await expect(
            context.suite.complianceModule.connect(context.accounts.aliceWallet).listToken(context.suite.token.address, 1),
          ).to.be.revertedWithCustomError(context.suite.complianceModule, `TokenAlreadyListed`);
        });
      });

      describe('when token is not already listed', () => {
        describe('when the investor address type is WALLET', () => {
          it('should list the token', async () => {
            const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
            await context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
              context.suite.complianceModule.address,
            );

            const tx = await context.suite.complianceModule.connect(context.accounts.aliceWallet).listToken(context.suite.token.address, 0);

            await expect(tx)
              .to.emit(context.suite.complianceModule, 'TokenListed')
              .withArgs(context.suite.token.address, context.accounts.aliceWallet.address);
          });
        });

        describe('when the investor address type is ONCHAINID', () => {
          describe('when identity does not exist', () => {
            it('should revert', async () => {
              const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
              await context.suite.compliance.callModuleFunction(
                new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
                context.suite.complianceModule.address,
              );

              await expect(
                context.suite.complianceModule.connect(context.accounts.anotherWallet).listToken(context.suite.token.address, 1),
              ).to.be.revertedWithCustomError(context.suite.complianceModule, `IdentityNotFound`);
            });
          });

          describe('when identity exists', () => {
            it('should list the token', async () => {
              const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
              await context.suite.compliance.callModuleFunction(
                new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
                context.suite.complianceModule.address,
              );

              const tx = await context.suite.complianceModule.connect(context.accounts.aliceWallet).listToken(context.suite.token.address, 1);

              await expect(tx)
                .to.emit(context.suite.complianceModule, 'TokenListed')
                .withArgs(context.suite.token.address, context.identities.aliceIdentity.address);
            });
          });
        });
      });
    });
  });

  describe('.batchListTokens', () => {
    describe('when token is not configured', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
        await expect(
          context.suite.complianceModule.connect(context.accounts.aliceWallet).batchListTokens([context.suite.token.address], 1),
        ).to.be.revertedWithCustomError(context.suite.complianceModule, `TokenIsNotConfigured`);
      });
    });

    describe('when token is configured', () => {
      describe('when token is listed before', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
            context.suite.complianceModule.address,
          );

          await context.suite.complianceModule.connect(context.accounts.aliceWallet).listToken(context.suite.token.address, 1);

          await expect(
            context.suite.complianceModule.connect(context.accounts.aliceWallet).batchListTokens([context.suite.token.address], 1),
          ).to.be.revertedWithCustomError(context.suite.complianceModule, `TokenAlreadyListed`);
        });
      });

      describe('when token is not already listed', () => {
        describe('when the investor address type is WALLET', () => {
          it('should list tokens', async () => {
            const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
            await context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
              context.suite.complianceModule.address,
            );

            const tx = await context.suite.complianceModule.connect(context.accounts.aliceWallet).batchListTokens([context.suite.token.address], 0);

            await expect(tx)
              .to.emit(context.suite.complianceModule, 'TokenListed')
              .withArgs(context.suite.token.address, context.accounts.aliceWallet.address);
          });
        });

        describe('when the investor address type is ONCHAINID', () => {
          it('should list tokens', async () => {
            const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
            await context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
              context.suite.complianceModule.address,
            );

            const tx = await context.suite.complianceModule.connect(context.accounts.aliceWallet).batchListTokens([context.suite.token.address], 1);

            await expect(tx)
              .to.emit(context.suite.complianceModule, 'TokenListed')
              .withArgs(context.suite.token.address, context.identities.aliceIdentity.address);
          });
        });
      });
    });
  });

  describe('.unlistToken', () => {
    describe('when token is not listed', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
          context.suite.complianceModule.address,
        );

        await expect(
          context.suite.complianceModule.connect(context.accounts.aliceWallet).unlistToken(context.suite.token.address, 1),
        ).to.be.revertedWithCustomError(context.suite.complianceModule, `TokenIsNotListed`);
      });
    });

    describe('when token is listed', () => {
      describe('when the investor address type is WALLET', () => {
        it('should unlist the token', async () => {
          const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
            context.suite.complianceModule.address,
          );

          await context.suite.complianceModule.connect(context.accounts.aliceWallet).listToken(context.suite.token.address, 0);

          const tx = await context.suite.complianceModule.connect(context.accounts.aliceWallet).unlistToken(context.suite.token.address, 0);

          await expect(tx)
            .to.emit(context.suite.complianceModule, 'TokenUnlisted')
            .withArgs(context.suite.token.address, context.accounts.aliceWallet.address);
        });
      });

      describe('when the investor address type is ONCHAINID', () => {
        it('should unlist the token', async () => {
          const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
            context.suite.complianceModule.address,
          );

          await context.suite.complianceModule.connect(context.accounts.aliceWallet).listToken(context.suite.token.address, 1);

          const tx = await context.suite.complianceModule.connect(context.accounts.aliceWallet).unlistToken(context.suite.token.address, 1);

          await expect(tx)
            .to.emit(context.suite.complianceModule, 'TokenUnlisted')
            .withArgs(context.suite.token.address, context.identities.aliceIdentity.address);
        });
      });
    });
  });

  describe('.batchUnlistTokens', () => {
    describe('when token is not listed', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
          context.suite.complianceModule.address,
        );

        await expect(
          context.suite.complianceModule.connect(context.accounts.aliceWallet).batchUnlistTokens([context.suite.token.address], 1),
        ).to.be.revertedWithCustomError(context.suite.complianceModule, `TokenIsNotListed`);
      });
    });

    describe('when token is not listed', () => {
      describe('when the investor address type is WALLET', () => {
        it('should unlist tokens', async () => {
          const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
            context.suite.complianceModule.address,
          );

          await context.suite.complianceModule.connect(context.accounts.aliceWallet).listToken(context.suite.token.address, 0);

          const tx = await context.suite.complianceModule.connect(context.accounts.aliceWallet).batchUnlistTokens([context.suite.token.address], 0);

          await expect(tx)
            .to.emit(context.suite.complianceModule, 'TokenUnlisted')
            .withArgs(context.suite.token.address, context.accounts.aliceWallet.address);
        });
      });

      describe('when the investor address type is ONCHAINID', () => {
        it('should unlist tokens', async () => {
          const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
            context.suite.complianceModule.address,
          );

          await context.suite.complianceModule.connect(context.accounts.aliceWallet).listToken(context.suite.token.address, 1);

          const tx = await context.suite.complianceModule.connect(context.accounts.aliceWallet).batchUnlistTokens([context.suite.token.address], 1);

          await expect(tx)
            .to.emit(context.suite.complianceModule, 'TokenUnlisted')
            .withArgs(context.suite.token.address, context.identities.aliceIdentity.address);
        });
      });
    });
  });

  describe('.getTokenListingType', () => {
    describe('when token is not configured', () => {
      it('should return NOT_CONFIGURED(0)', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
        const result = await context.suite.complianceModule.getTokenListingType(context.suite.token.address);
        expect(result).to.be.eq(0);
      });
    });

    describe('when token is configured', () => {
      it('should return token listing type', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);

        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
          context.suite.complianceModule.address,
        );

        const result = await context.suite.complianceModule.getTokenListingType(context.suite.token.address);
        expect(result).to.be.eq(1);
      });
    });
  });

  describe('.getInvestorListingStatus', () => {
    describe('when token is not listed', () => {
      it('should return false', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
        const result = await context.suite.complianceModule.getInvestorListingStatus(
          context.suite.token.address,
          context.accounts.aliceWallet.address,
        );
        expect(result).to.be.false;
      });
    });

    describe('when token is listed', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);

        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
          context.suite.complianceModule.address,
        );

        await context.suite.complianceModule.connect(context.accounts.aliceWallet).listToken(context.suite.token.address, 0);

        const result = await context.suite.complianceModule.getInvestorListingStatus(
          context.suite.token.address,
          context.accounts.aliceWallet.address,
        );
        expect(result).to.be.true;
      });
    });
  });

  describe('.moduleCheck', () => {
    describe('when receiver is the null address', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
        const from = context.accounts.aliceWallet.address;

        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
          context.suite.complianceModule.address,
        );

        const result = await context.suite.complianceModule.moduleCheck(from, ethers.constants.AddressZero, 10, context.suite.compliance.address);
        expect(result).to.be.true;
      });
    });

    describe('when token is not configured', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
        const from = context.accounts.aliceWallet.address;
        const to = context.accounts.bobWallet.address;
        const result = await context.suite.complianceModule.moduleCheck(from, to, 10, context.suite.compliance.address);
        expect(result).to.be.true;
      });
    });

    describe('when the listing type is WHITELISTING', () => {
      describe('when token is not listed', () => {
        it('should return false', async () => {
          const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
          const to = context.accounts.aliceWallet.address;
          const from = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
            context.suite.complianceModule.address,
          );

          const result = await context.suite.complianceModule.moduleCheck(from, to, 10, context.suite.compliance.address);
          expect(result).to.be.false;
        });
      });

      describe('when token is listed for the wallet', () => {
        it('should return true', async () => {
          const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
          const to = context.accounts.aliceWallet.address;
          const from = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
            context.suite.complianceModule.address,
          );

          await context.suite.complianceModule.connect(context.accounts.aliceWallet).listToken(context.suite.token.address, 0);

          const result = await context.suite.complianceModule.moduleCheck(from, to, 10, context.suite.compliance.address);
          expect(result).to.be.true;
        });
      });

      describe('when token is listed for the OID', () => {
        it('should return true', async () => {
          const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
          const to = context.accounts.aliceWallet.address;
          const from = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [1]),
            context.suite.complianceModule.address,
          );

          await context.suite.complianceModule.connect(context.accounts.aliceWallet).listToken(context.suite.token.address, 1);

          const result = await context.suite.complianceModule.moduleCheck(from, to, 10, context.suite.compliance.address);
          expect(result).to.be.true;
        });
      });
    });

    describe('when the listing type is BLACKLISTING', () => {
      describe('when token is not listed', () => {
        it('should return true', async () => {
          const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
          const to = context.accounts.aliceWallet.address;
          const from = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [2]),
            context.suite.complianceModule.address,
          );

          const result = await context.suite.complianceModule.moduleCheck(from, to, 10, context.suite.compliance.address);
          expect(result).to.be.true;
        });
      });

      describe('when token is listed for the wallet', () => {
        it('should return false', async () => {
          const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
          const to = context.accounts.aliceWallet.address;
          const from = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [2]),
            context.suite.complianceModule.address,
          );

          await context.suite.complianceModule.connect(context.accounts.aliceWallet).listToken(context.suite.token.address, 0);

          const result = await context.suite.complianceModule.moduleCheck(from, to, 10, context.suite.compliance.address);
          expect(result).to.be.false;
        });
      });

      describe('when token is listed for the OID', () => {
        it('should return false', async () => {
          const context = await loadFixture(deployTokenListingRestrictionsFullSuite);
          const to = context.accounts.aliceWallet.address;
          const from = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function configureToken(uint8 _listingType)']).encodeFunctionData('configureToken', [2]),
            context.suite.complianceModule.address,
          );

          await context.suite.complianceModule.connect(context.accounts.aliceWallet).listToken(context.suite.token.address, 1);

          const result = await context.suite.complianceModule.moduleCheck(from, to, 10, context.suite.compliance.address);
          expect(result).to.be.false;
        });
      });
    });
  });

  describe('.moduleMintAction', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);

        await expect(context.suite.complianceModule.moduleMintAction(context.accounts.anotherWallet.address, 10)).to.be.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);

        await expect(
          context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleMintAction(address, uint256)']).encodeFunctionData('moduleMintAction', [
              context.accounts.anotherWallet.address,
              10,
            ]),
            context.suite.complianceModule.address,
          ),
        ).to.eventually.be.fulfilled;
      });
    });
  });

  describe('.moduleBurnAction', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);

        await expect(context.suite.complianceModule.moduleBurnAction(context.accounts.anotherWallet.address, 10)).to.be.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);

        await expect(
          context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleBurnAction(address, uint256)']).encodeFunctionData('moduleBurnAction', [
              context.accounts.anotherWallet.address,
              10,
            ]),
            context.suite.complianceModule.address,
          ),
        ).to.eventually.be.fulfilled;
      });
    });
  });

  describe('.moduleTransfer', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);

        await expect(
          context.suite.complianceModule.moduleTransferAction(context.accounts.aliceWallet.address, context.accounts.anotherWallet.address, 10),
        ).to.be.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTokenListingRestrictionsFullSuite);

        await expect(
          context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [context.accounts.aliceWallet.address, context.accounts.anotherWallet.address, 80],
            ),
            context.suite.complianceModule.address,
          ),
        ).to.eventually.be.fulfilled;
      });
    });
  });
});
