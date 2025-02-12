import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers, upgrades } from 'hardhat';
import { expect } from 'chai';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';

describe('ConditionalTransferModule', () => {
  async function deployComplianceWithConditionalTransferModule() {
    const context = await loadFixture(deployComplianceFixture);
    const { compliance } = context.suite;

    const module = await ethers.deployContract('ConditionalTransferModule');
    const proxy = await ethers.deployContract('ModuleProxy', [module.target, module.interface.encodeFunctionData('initialize')]);
    const conditionalTransferModule = await ethers.getContractAt('ConditionalTransferModule', proxy.target);

    await compliance.addModule(conditionalTransferModule.target);

    const mockContract = await ethers.deployContract('MockContract');

    await compliance.bindToken(mockContract.target);

    return { ...context, suite: { ...context.suite, conditionalTransferModule, mockContract } };
  }

  describe('.name()', () => {
    it('should return the name of the module', async () => {
      const {
        suite: { conditionalTransferModule },
      } = await loadFixture(deployComplianceWithConditionalTransferModule);

      expect(await conditionalTransferModule.name()).to.be.equal('ConditionalTransferModule');
    });
  });

  describe('.isPlugAndPlay()', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployComplianceWithConditionalTransferModule);
      expect(await context.suite.conditionalTransferModule.isPlugAndPlay()).to.be.true;
    });
  });

  describe('.canComplianceBind', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployComplianceWithConditionalTransferModule);
      expect(await context.suite.conditionalTransferModule.canComplianceBind(context.suite.compliance.target)).to.be.true;
    });
  });

  describe('.owner', () => {
    it('should return owner', async () => {
      const context = await loadFixture(deployComplianceWithConditionalTransferModule);
      await expect(context.suite.conditionalTransferModule.owner()).to.eventually.be.eq(context.accounts.deployer.address);
    });
  });

  describe('.initialize', () => {
    it('should be called only once', async () => {
      // given
      const {
        accounts: { deployer },
      } = await loadFixture(deployComplianceFixture);
      const module = (await ethers.deployContract('ConditionalTransferModule')).connect(deployer);
      await module.initialize();

      // when & then
      await expect(module.initialize()).to.be.revertedWith('Initializable: contract is already initialized');
      expect(await module.owner()).to.be.eq(deployer.address);
    });
  });

  describe('.transferOwnership', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployComplianceWithConditionalTransferModule);
        await expect(
          context.suite.conditionalTransferModule.connect(context.accounts.aliceWallet).transferOwnership(context.accounts.bobWallet.address),
        ).to.revertedWithCustomError(context.suite.conditionalTransferModule, 'OwnableUnauthorizedAccount');
      });
    });

    describe('when calling with owner account', () => {
      it('should transfer ownership', async () => {
        // given
        const context = await loadFixture(deployComplianceWithConditionalTransferModule);

        // when
        const tx1 = await context.suite.conditionalTransferModule
          .connect(context.accounts.deployer)
          .transferOwnership(context.accounts.bobWallet.address);
        expect(tx1)
          .to.emit(context.suite.conditionalTransferModule, 'OwnershipTransferStarted')
          .withArgs(context.accounts.deployer.address, context.accounts.bobWallet.address);
        const tx2 = await context.suite.conditionalTransferModule.connect(context.accounts.bobWallet).acceptOwnership();
        expect(tx2)
          .to.emit(context.suite.conditionalTransferModule, 'OwnershipTransferred')
          .withArgs(context.accounts.deployer.address, context.accounts.bobWallet.address);
        // then
        const owner = await context.suite.conditionalTransferModule.owner();
        expect(owner).to.eq(context.accounts.bobWallet.address);
      });
    });
  });

  describe('.upgradeTo', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployComplianceWithConditionalTransferModule);
        await expect(
          context.suite.conditionalTransferModule.connect(context.accounts.aliceWallet).upgradeTo(ethers.ZeroAddress),
        ).to.revertedWithCustomError(context.suite.conditionalTransferModule, 'OwnableUnauthorizedAccount');
      });
    });

    describe('when calling with owner account', () => {
      it('should upgrade proxy', async () => {
        // given
        const context = await loadFixture(deployComplianceWithConditionalTransferModule);
        const newImplementation = await ethers.deployContract('ConditionalTransferModule');

        // when
        await context.suite.conditionalTransferModule.connect(context.accounts.deployer).upgradeTo(newImplementation.target);

        // then
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(context.suite.conditionalTransferModule.target);
        expect(implementationAddress).to.eq(newImplementation.target);
      });
    });
  });

  describe('.batchApproveTransfers', () => {
    describe('when the sender is not the compliance', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule.connect(anotherWallet).batchApproveTransfers([anotherWallet.address], [anotherWallet.address], [10]),
        ).to.be.revertedWithCustomError(conditionalTransferModule, 'OnlyBoundComplianceCanCall');
      });
    });

    describe('when the sender is the compliance', () => {
      it('should approve the transfers', async () => {
        const {
          suite: { compliance, conditionalTransferModule, mockContract },
          accounts: { deployer, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        const tx = await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.Interface(['function batchApproveTransfers(address[], address[], uint256[])']).encodeFunctionData('batchApproveTransfers', [
              [aliceWallet.address],
              [bobWallet.address],
              [10],
            ]),
            conditionalTransferModule.target,
          );

        await expect(tx)
          .to.emit(conditionalTransferModule, 'TransferApproved')
          .withArgs(aliceWallet.address, bobWallet.address, 10, mockContract.target);

        expect(
          await conditionalTransferModule.isTransferApproved(
            compliance.target,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, mockContract.target),
          ),
        ).to.be.true;

        await expect(
          conditionalTransferModule.getTransferApprovals(
            compliance.target,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, mockContract.target),
          ),
        ).to.eventually.be.equal(1);
      });
    });
  });

  describe('.batchUnApproveTransfers()', () => {
    describe('when the sender is not the compliance', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule.connect(anotherWallet).batchUnApproveTransfers([anotherWallet.address], [anotherWallet.address], [10]),
        ).to.be.revertedWithCustomError(conditionalTransferModule, 'OnlyBoundComplianceCanCall');
      });
    });

    describe('when the sender is the compliance', () => {
      describe('when the transfer is not approved', () => {
        it('should revert', async () => {
          const {
            suite: { compliance, conditionalTransferModule },
            accounts: { deployer, aliceWallet, bobWallet },
          } = await loadFixture(deployComplianceWithConditionalTransferModule);

          await expect(
            compliance
              .connect(deployer)
              .callModuleFunction(
                new ethers.Interface(['function batchUnApproveTransfers(address[], address[], uint256[])']).encodeFunctionData(
                  'batchUnApproveTransfers',
                  [[aliceWallet.address], [bobWallet.address], [10]],
                ),
                conditionalTransferModule.target,
              ),
          ).to.be.revertedWithCustomError(conditionalTransferModule, 'TransferNotApproved');
        });
      });

      it('should unapprove the transfers', async () => {
        const {
          suite: { compliance, conditionalTransferModule, mockContract },
          accounts: { deployer, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.Interface(['function batchApproveTransfers(address[], address[], uint256[])']).encodeFunctionData('batchApproveTransfers', [
              [aliceWallet.address],
              [bobWallet.address],
              [10],
            ]),
            conditionalTransferModule.target,
          );

        const tx = await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.Interface(['function batchUnApproveTransfers(address[], address[], uint256[])']).encodeFunctionData(
              'batchUnApproveTransfers',
              [[aliceWallet.address], [bobWallet.address], [10]],
            ),
            conditionalTransferModule.target,
          );

        await expect(tx)
          .to.emit(conditionalTransferModule, 'ApprovalRemoved')
          .withArgs(aliceWallet.address, bobWallet.address, 10, mockContract.target);

        expect(
          await conditionalTransferModule.isTransferApproved(
            compliance.target,
            await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, mockContract.target),
          ),
        ).to.be.false;
      });
    });
  });

  describe('.approveTransfer()', () => {
    describe('when the sender is not the compliance', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule.connect(anotherWallet).approveTransfer(anotherWallet.address, anotherWallet.address, 10),
        ).to.be.revertedWithCustomError(conditionalTransferModule, 'OnlyBoundComplianceCanCall');
      });
    });
  });

  describe('.unApproveTransfer()', () => {
    describe('when the sender is not the compliance', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule.connect(anotherWallet).unApproveTransfer(anotherWallet.address, anotherWallet.address, 10),
        ).to.be.revertedWithCustomError(conditionalTransferModule, 'OnlyBoundComplianceCanCall');
      });
    });
  });

  describe('.moduleCheck()', () => {
    describe('when transfer is not approved', () => {
      it('should return false', async () => {
        const {
          suite: { compliance, conditionalTransferModule },
          accounts: { aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(conditionalTransferModule.moduleCheck(aliceWallet.address, bobWallet.address, 10, compliance.target)).to.eventually.be.false;
      });
    });

    describe('when transfer is approved', () => {
      it('should return true', async () => {
        const {
          suite: { compliance, conditionalTransferModule },
          accounts: { deployer, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await compliance
          .connect(deployer)
          .callModuleFunction(
            new ethers.Interface(['function batchApproveTransfers(address[], address[], uint256[])']).encodeFunctionData('batchApproveTransfers', [
              [aliceWallet.address],
              [bobWallet.address],
              [10],
            ]),
            conditionalTransferModule.target,
          );

        await expect(conditionalTransferModule.moduleCheck(aliceWallet.address, bobWallet.address, 10, compliance.target)).to.eventually.be.true;
      });
    });
  });

  describe('.moduleBurnAction', () => {
    describe('when called by a random wallet', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(conditionalTransferModule.moduleBurnAction(anotherWallet.address, 10)).to.be.revertedWithCustomError(
          conditionalTransferModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when called by the compliance', () => {
      it('should do nothing', async () => {
        const {
          suite: { conditionalTransferModule, compliance },
          accounts: { deployer, anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.Interface(['function moduleBurnAction(address, uint256)']).encodeFunctionData('moduleBurnAction', [
                anotherWallet.address,
                10,
              ]),
              conditionalTransferModule.target,
            ),
        ).to.eventually.be.fulfilled;
      });
    });
  });

  describe('.moduleMintAction', () => {
    describe('when called by a random wallet', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(conditionalTransferModule.moduleMintAction(anotherWallet.address, 10)).to.be.revertedWithCustomError(
          conditionalTransferModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when called by the compliance', () => {
      it('should do nothing', async () => {
        const {
          suite: { conditionalTransferModule, compliance },
          accounts: { deployer, anotherWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.Interface(['function moduleMintAction(address, uint256)']).encodeFunctionData('moduleMintAction', [
                anotherWallet.address,
                10,
              ]),
              conditionalTransferModule.target,
            ),
        ).to.eventually.be.fulfilled;
      });
    });
  });

  describe('.moduleTransferAction()', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const {
          suite: { conditionalTransferModule },
          accounts: { anotherWallet, aliceWallet, bobWallet },
        } = await loadFixture(deployComplianceWithConditionalTransferModule);

        await expect(
          conditionalTransferModule.connect(anotherWallet).moduleTransferAction(aliceWallet.address, bobWallet.address, 10),
        ).to.be.revertedWithCustomError(conditionalTransferModule, 'OnlyBoundComplianceCanCall');
      });
    });

    describe('when calling as the compliance', () => {
      describe('when the transfer is not approved', () => {
        it('should do nothing', async () => {
          const {
            suite: { compliance, conditionalTransferModule },
            accounts: { deployer, aliceWallet, bobWallet },
          } = await loadFixture(deployComplianceWithConditionalTransferModule);

          await expect(
            compliance
              .connect(deployer)
              .callModuleFunction(
                new ethers.Interface(['function moduleTransferAction(address, address, uint256)']).encodeFunctionData('moduleTransferAction', [
                  aliceWallet.address,
                  bobWallet.address,
                  10,
                ]),
                conditionalTransferModule.target,
              ),
          ).to.eventually.be.fulfilled;
        });
      });

      describe('when the transfer is approved', () => {
        it('should remove the transfer approval', async () => {
          const {
            suite: { compliance, conditionalTransferModule, mockContract },
            accounts: { deployer, aliceWallet, bobWallet },
          } = await loadFixture(deployComplianceWithConditionalTransferModule);

          await compliance
            .connect(deployer)
            .callModuleFunction(
              new ethers.Interface(['function batchApproveTransfers(address[], address[], uint256[])']).encodeFunctionData('batchApproveTransfers', [
                [aliceWallet.address],
                [bobWallet.address],
                [10],
              ]),
              conditionalTransferModule.target,
            );

          const tx = await expect(
            compliance
              .connect(deployer)
              .callModuleFunction(
                new ethers.Interface(['function moduleTransferAction(address, address, uint256)']).encodeFunctionData('moduleTransferAction', [
                  aliceWallet.address,
                  bobWallet.address,
                  10,
                ]),
                conditionalTransferModule.target,
              ),
          ).to.eventually.be.fulfilled;

          await expect(tx)
            .to.emit(conditionalTransferModule, 'ApprovalRemoved')
            .withArgs(aliceWallet.address, bobWallet.address, 10, mockContract.target);

          expect(
            await conditionalTransferModule.isTransferApproved(
              compliance.target,
              await conditionalTransferModule.calculateTransferHash(aliceWallet.address, bobWallet.address, 10, mockContract.target),
            ),
          ).to.be.false;
        });
      });
    });
  });
  describe('.supportsInterface()', () => {
    it('should return false for unsupported interfaces', async () => {
      const {
        suite: { conditionalTransferModule },
      } = await loadFixture(deployComplianceWithConditionalTransferModule);

      const unsupportedInterfaceId = '0x12345678';
      expect(await conditionalTransferModule.supportsInterface(unsupportedInterfaceId)).to.equal(false);
    });

    it('should correctly identify the IModule interface ID', async () => {
      const {
        suite: { conditionalTransferModule },
      } = await loadFixture(deployComplianceWithConditionalTransferModule);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const iModuleInterfaceId = await interfaceIdCalculator.getIModuleInterfaceId();
      expect(await conditionalTransferModule.supportsInterface(iModuleInterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC173 interface ID', async () => {
      const {
        suite: { conditionalTransferModule },
      } = await loadFixture(deployComplianceWithConditionalTransferModule);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc173InterfaceId = await interfaceIdCalculator.getIERC173InterfaceId();
      expect(await conditionalTransferModule.supportsInterface(ierc173InterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC165 interface ID', async () => {
      const {
        suite: { conditionalTransferModule },
      } = await loadFixture(deployComplianceWithConditionalTransferModule);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc165InterfaceId = await interfaceIdCalculator.getIERC165InterfaceId();
      expect(await conditionalTransferModule.supportsInterface(ierc165InterfaceId)).to.equal(true);
    });
  });
});
