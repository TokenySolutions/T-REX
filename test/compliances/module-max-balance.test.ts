import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers, upgrades } from 'hardhat';
import { expect } from 'chai';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';
import { deploySuiteWithModularCompliancesFixture } from '../fixtures/deploy-full-suite.fixture';

async function deployMaxBalanceFullSuite() {
  const context = await loadFixture(deploySuiteWithModularCompliancesFixture);

  const module = await ethers.deployContract('MaxBalanceModule');
  const proxy = await ethers.deployContract('ModuleProxy', [module.target, module.interface.encodeFunctionData('initialize')]);
  const complianceModule = await ethers.getContractAt('MaxBalanceModule', proxy.target);

  await context.suite.token.connect(context.accounts.tokenAgent).burn(context.accounts.aliceWallet.address, 1000);
  await context.suite.token.connect(context.accounts.tokenAgent).burn(context.accounts.bobWallet.address, 500);
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

describe('Compliance Module: MaxBalance', () => {
  it('should deploy the MaxBalance contract and bind it to the compliance', async () => {
    const context = await loadFixture(deployMaxBalanceFullSuite);

    expect(context.suite.complianceModule.target).not.to.be.undefined;
    expect(await context.suite.compliance.isModuleBound(context.suite.complianceModule.target)).to.be.true;
  });

  describe('.name', () => {
    it('should return the name of the module', async () => {
      const context = await loadFixture(deployMaxBalanceFullSuite);

      expect(await context.suite.complianceModule.name()).to.be.equal('MaxBalanceModule');
    });
  });

  describe('.isPlugAndPlay', () => {
    it('should return false', async () => {
      const context = await loadFixture(deployMaxBalanceFullSuite);
      expect(await context.suite.complianceModule.isPlugAndPlay()).to.be.false;
    });
  });

  describe('.canComplianceBind', () => {
    describe('when token totalSupply is greater than zero', () => {
      describe('when compliance preset status is false', () => {
        it('should return false', async () => {
          const context = await loadFixture(deployMaxBalanceFullSuite);
          await context.suite.token.connect(context.accounts.tokenAgent).mint(context.accounts.aliceWallet.address, 1000);
          expect(await context.suite.complianceModule.canComplianceBind(context.suite.compliance.target)).to.be.false;
        });
      });

      describe('when compliance preset status is true', () => {
        it('should return true', async () => {
          const context = await loadFixture(deployMaxBalanceFullSuite);
          const complianceModule = await ethers.deployContract('MaxBalanceModule');

          await complianceModule
            .connect(context.accounts.deployer)
            .preSetModuleState(context.suite.compliance.target, context.accounts.aliceWallet.address, 100);

          expect(await complianceModule.canComplianceBind(context.suite.compliance.target)).to.be.true;
        });
      });
    });

    describe('when token totalSupply is zero', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        const complianceModule = await ethers.deployContract('MaxBalanceModule');

        expect(await complianceModule.canComplianceBind(context.suite.compliance.target)).to.be.true;
      });
    });
  });

  describe('.setMaxBalance', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);

        await expect(context.suite.complianceModule.setMaxBalance(100)).to.revertedWithCustomError(
          context.suite.complianceModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when calling via compliance', () => {
      it('should set max balance', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);

        const tx = await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [100]),
          context.suite.complianceModule.target,
        );

        await expect(tx).to.emit(context.suite.complianceModule, 'MaxBalanceSet').withArgs(context.suite.compliance.target, 100);
      });
    });
  });

  describe('.owner', () => {
    it('should return owner', async () => {
      const context = await loadFixture(deployMaxBalanceFullSuite);
      await expect(context.suite.complianceModule.owner()).to.eventually.be.eq(context.accounts.deployer.address);
    });
  });

  describe('.initialize', () => {
    it('should be called only once', async () => {
      // given
      const {
        accounts: { deployer },
      } = await loadFixture(deployComplianceFixture);
      const module = (await ethers.deployContract('MaxBalanceModule')).connect(deployer);
      await module.initialize();

      // when & then
      await expect(module.initialize()).to.be.revertedWith('Initializable: contract is already initialized');
      expect(await module.owner()).to.be.eq(deployer.address);
    });
  });

  describe('.transferOwnership', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        await expect(
          context.suite.complianceModule.connect(context.accounts.aliceWallet).transferOwnership(context.accounts.bobWallet.address),
        ).to.revertedWith('Ownable: caller is not the owner');
      });
    });

    describe('when calling with owner account', () => {
      it('should transfer ownership', async () => {
        // given
        const context = await loadFixture(deployMaxBalanceFullSuite);

        // when
        const tx1 = await context.suite.complianceModule.connect(context.accounts.deployer).transferOwnership(context.accounts.bobWallet.address);
        expect(tx1)
          .to.emit(context.suite.complianceModule, 'OwnershipTransferStarted')
          .withArgs(context.accounts.deployer.address, context.accounts.bobWallet.address);
        const tx2 = await context.suite.complianceModule.connect(context.accounts.bobWallet).acceptOwnership();
        expect(tx2)
          .to.emit(context.suite.complianceModule, 'OwnershipTransferred')
          .withArgs(context.accounts.deployer.address, context.accounts.bobWallet.address);
        // then
        const owner = await context.suite.complianceModule.owner();
        expect(owner).to.eq(context.accounts.bobWallet.address);
      });
    });
  });

  describe('.upgradeTo', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        await expect(context.suite.complianceModule.connect(context.accounts.aliceWallet).upgradeTo(ethers.ZeroAddress)).to.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when calling with owner account', () => {
      it('should upgrade proxy', async () => {
        // given
        const context = await loadFixture(deployMaxBalanceFullSuite);
        const newImplementation = await ethers.deployContract('MaxBalanceModule');

        // when
        await context.suite.complianceModule.connect(context.accounts.deployer).upgradeTo(newImplementation.target);

        // then
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(context.suite.complianceModule.target);
        expect(implementationAddress).to.eq(newImplementation.target);
      });
    });
  });

  describe('.preSetModuleState', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        await expect(
          context.suite.complianceModule
            .connect(context.accounts.aliceWallet)
            .preSetModuleState(context.suite.compliance.target, context.accounts.aliceWallet.address, 100),
        ).to.be.revertedWithCustomError(context.suite.complianceModule, `OnlyComplianceOwnerCanCall`);
      });
    });

    describe('when calling via deployer', () => {
      describe('when compliance already bound', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployMaxBalanceFullSuite);
          await expect(
            context.suite.complianceModule
              .connect(context.accounts.deployer)
              .preSetModuleState(context.suite.compliance.target, context.accounts.aliceWallet.address, 100),
          ).to.be.revertedWithCustomError(context.suite.complianceModule, `TokenAlreadyBound`);
        });
      });

      describe('when compliance is not yet bound', () => {
        it('should preset', async () => {
          const context = await loadFixture(deployComplianceFixture);
          const complianceModule = await ethers.deployContract('MaxBalanceModule');

          const tx = await complianceModule
            .connect(context.accounts.deployer)
            .preSetModuleState(context.suite.compliance.target, context.accounts.aliceWallet.address, 100);

          await expect(tx)
            .to.emit(complianceModule, 'IDBalancePreSet')
            .withArgs(context.suite.compliance.target, context.accounts.aliceWallet.address, 100);
        });
      });
    });
  });

  describe('.presetCompleted', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        await expect(
          context.suite.complianceModule.connect(context.accounts.aliceWallet).presetCompleted(context.suite.compliance.target),
        ).to.be.revertedWithCustomError(context.suite.complianceModule, `OnlyComplianceOwnerCanCall`);
      });
    });

    describe('when calling via deployer', () => {
      it('should update preset status as true', async () => {
        const context = await loadFixture(deployComplianceFixture);
        const complianceModule = await ethers.deployContract('MaxBalanceModule');

        await complianceModule.connect(context.accounts.deployer).presetCompleted(context.suite.compliance.target);

        expect(await complianceModule.canComplianceBind(context.suite.compliance.target)).to.be.true;
      });
    });
  });

  describe('.batchPreSetModuleState', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        await expect(
          context.suite.complianceModule
            .connect(context.accounts.aliceWallet)
            .batchPreSetModuleState(context.suite.compliance.target, [context.accounts.aliceWallet.address], [100]),
        ).to.be.revertedWithCustomError(context.suite.complianceModule, `OnlyComplianceOwnerCanCall`);
      });
    });

    describe('when calling via deployer', () => {
      describe('when _id array is empty', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployMaxBalanceFullSuite);
          await expect(
            context.suite.complianceModule.connect(context.accounts.deployer).batchPreSetModuleState(context.suite.compliance.target, [], []),
          ).to.be.revertedWithCustomError(context.suite.complianceModule, `InvalidPresetValues`);
        });
      });

      describe('when the lengths of the _id and _balance arrays are not equal', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployMaxBalanceFullSuite);
          await expect(
            context.suite.complianceModule
              .connect(context.accounts.deployer)
              .batchPreSetModuleState(
                context.suite.compliance.target,
                [context.accounts.aliceWallet.address, context.accounts.bobWallet.address],
                [100],
              ),
          ).to.be.revertedWithCustomError(context.suite.complianceModule, `InvalidPresetValues`);
        });
      });

      describe('when compliance already bound', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployMaxBalanceFullSuite);
          await expect(
            context.suite.complianceModule
              .connect(context.accounts.deployer)
              .batchPreSetModuleState(context.suite.compliance.target, [context.accounts.aliceWallet.address], [100]),
          ).to.be.revertedWithCustomError(context.suite.complianceModule, `TokenAlreadyBound`);
        });
      });

      describe('when compliance is not yet bound', () => {
        it('should preset', async () => {
          const context = await loadFixture(deployComplianceFixture);
          const complianceModule = await ethers.deployContract('MaxBalanceModule');

          const tx = await complianceModule
            .connect(context.accounts.deployer)
            .batchPreSetModuleState(
              context.suite.compliance.target,
              [context.accounts.aliceWallet.address, context.accounts.bobWallet.address],
              [100, 200],
            );

          await expect(tx)
            .to.emit(complianceModule, 'IDBalancePreSet')
            .withArgs(context.suite.compliance.target, context.accounts.aliceWallet.address, 100)
            .to.emit(complianceModule, 'IDBalancePreSet')
            .withArgs(context.suite.compliance.target, context.accounts.bobWallet.address, 200);
        });
      });
    });
  });

  describe('.moduleTransferAction', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        const from = context.accounts.aliceWallet.address;
        const to = context.accounts.bobWallet.address;

        await expect(context.suite.complianceModule.moduleTransferAction(from, to, 10)).to.revertedWithCustomError(
          context.suite.complianceModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when calling via compliance', () => {
      describe('when value exceeds the max balance', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployMaxBalanceFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
            context.suite.complianceModule.target,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.Interface(['function moduleMintAction(address _to, uint256 _value)']).encodeFunctionData('moduleMintAction', [from, 150]),
            context.suite.complianceModule.target,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [100]),
            context.suite.complianceModule.target,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 40],
            ),
            context.suite.complianceModule.target,
          );

          await expect(
            context.suite.compliance.callModuleFunction(
              new ethers.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                'moduleTransferAction',
                [from, to, 80],
              ),
              context.suite.complianceModule.target,
            ),
          ).to.be.revertedWithCustomError(context.suite.complianceModule, `MaxBalanceExceeded`);
        });
      });

      describe('when value does not exceed the max balance', () => {
        it('should update receiver and sender balances', async () => {
          const context = await loadFixture(deployMaxBalanceFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;
          const senderIdentity = await context.suite.identityRegistry.identity(context.accounts.aliceWallet.address);
          const receiverIdentity = await context.suite.identityRegistry.identity(context.accounts.bobWallet.address);

          await context.suite.compliance.callModuleFunction(
            new ethers.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
            context.suite.complianceModule.target,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.Interface(['function moduleMintAction(address _to, uint256 _value)']).encodeFunctionData('moduleMintAction', [from, 150]),
            context.suite.complianceModule.target,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 120],
            ),
            context.suite.complianceModule.target,
          );

          const senderBalance = await context.suite.complianceModule.getIDBalance(context.suite.compliance.target, senderIdentity);
          expect(senderBalance).to.be.eq(30);

          const receiverBalance = await context.suite.complianceModule.getIDBalance(context.suite.compliance.target, receiverIdentity);
          expect(receiverBalance).to.be.eq(120);
        });
      });
    });
  });

  describe('.moduleMintAction', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        const to = context.accounts.bobWallet.address;

        await expect(context.suite.complianceModule.moduleMintAction(to, 10)).to.revertedWithCustomError(
          context.suite.complianceModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when calling via compliance', () => {
      describe('when value exceeds the max balance', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployMaxBalanceFullSuite);
          const to = context.accounts.aliceWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
            context.suite.complianceModule.target,
          );

          await expect(
            context.suite.compliance.callModuleFunction(
              new ethers.Interface(['function moduleMintAction(address _to, uint256 _value)']).encodeFunctionData('moduleMintAction', [to, 160]),
              context.suite.complianceModule.target,
            ),
          ).to.be.revertedWithCustomError(context.suite.complianceModule, `MaxBalanceExceeded`);
        });
      });

      describe('when value does not exceed the max balance', () => {
        it('should update minter balance', async () => {
          const context = await loadFixture(deployMaxBalanceFullSuite);
          const to = context.accounts.aliceWallet.address;
          const receiverIdentity = await context.suite.identityRegistry.identity(context.accounts.aliceWallet.address);

          await context.suite.compliance.callModuleFunction(
            new ethers.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
            context.suite.complianceModule.target,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.Interface(['function moduleMintAction(address _to, uint256 _value)']).encodeFunctionData('moduleMintAction', [to, 150]),
            context.suite.complianceModule.target,
          );

          const receiverBalance = await context.suite.complianceModule.getIDBalance(context.suite.compliance.target, receiverIdentity);
          expect(receiverBalance).to.be.eq(150);
        });
      });
    });
  });

  describe('.moduleBurnAction', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        const from = context.accounts.bobWallet.address;

        await expect(context.suite.complianceModule.moduleBurnAction(from, 10)).to.revertedWithCustomError(
          context.suite.complianceModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when calling via compliance', () => {
      it('should update sender balance', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        const from = context.accounts.aliceWallet.address;
        const senderIdentity = await context.suite.identityRegistry.identity(context.accounts.aliceWallet.address);

        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
          context.suite.complianceModule.target,
        );

        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function moduleMintAction(address _to, uint256 _value)']).encodeFunctionData('moduleMintAction', [from, 100]),
          context.suite.complianceModule.target,
        );

        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function moduleBurnAction(address _from, uint256 _value)']).encodeFunctionData('moduleBurnAction', [from, 90]),
          context.suite.complianceModule.target,
        );

        const senderBalance = await context.suite.complianceModule.getIDBalance(context.suite.compliance.target, senderIdentity);
        expect(senderBalance).to.be.eq(10);
      });
    });
  });

  describe('.moduleCheck', () => {
    describe('when identity not found', () => {
      it('should return false', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        const to = context.accounts.anotherWallet.address;
        const from = context.accounts.aliceWallet.address;

        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
          context.suite.complianceModule.target,
        );

        await expect(context.suite.complianceModule.moduleCheck(from, to, 10, context.suite.compliance.target)).to.revertedWithCustomError(
          context.suite.complianceModule,
          'IdentityNotFound',
        );
      });
    });

    describe('when value exceeds compliance max balance', () => {
      it('should return false', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        const to = context.accounts.aliceWallet.address;
        const from = context.accounts.bobWallet.address;

        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
          context.suite.complianceModule.target,
        );

        const result = await context.suite.complianceModule.moduleCheck(from, to, 170, context.suite.compliance.target);
        expect(result).to.be.false;
      });
    });

    describe('when user balance exceeds compliance max balance', () => {
      it('should return false', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        const to = context.accounts.aliceWallet.address;
        const from = context.accounts.bobWallet.address;

        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
          context.suite.complianceModule.target,
        );

        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function moduleMintAction(address _to, uint256 _value)']).encodeFunctionData('moduleMintAction', [to, 100]),
          context.suite.complianceModule.target,
        );

        const result = await context.suite.complianceModule.moduleCheck(from, to, 70, context.suite.compliance.target);
        expect(result).to.be.false;
      });
    });

    describe('when user balance does not exceed compliance max balance', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        const to = context.accounts.aliceWallet.address;
        const from = context.accounts.bobWallet.address;

        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
          context.suite.complianceModule.target,
        );

        const result = await context.suite.complianceModule.moduleCheck(from, to, 70, context.suite.compliance.target);
        expect(result).to.be.true;
      });
    });
  });
  describe('.supportsInterface()', () => {
    it('should return false for unsupported interfaces', async () => {
      const context = await loadFixture(deployMaxBalanceFullSuite);

      const unsupportedInterfaceId = '0x12345678';
      expect(await context.suite.complianceModule.supportsInterface(unsupportedInterfaceId)).to.equal(false);
    });

    it('should correctly identify the IModule interface ID', async () => {
      const context = await loadFixture(deployMaxBalanceFullSuite);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const iModuleInterfaceId = await interfaceIdCalculator.getIModuleInterfaceId();
      expect(await context.suite.complianceModule.supportsInterface(iModuleInterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC173 interface ID', async () => {
      const context = await loadFixture(deployMaxBalanceFullSuite);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc173InterfaceId = await interfaceIdCalculator.getIERC173InterfaceId();
      expect(await context.suite.complianceModule.supportsInterface(ierc173InterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC165 interface ID', async () => {
      const context = await loadFixture(deployMaxBalanceFullSuite);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc165InterfaceId = await interfaceIdCalculator.getIERC165InterfaceId();
      expect(await context.suite.complianceModule.supportsInterface(ierc165InterfaceId)).to.equal(true);
    });
  });

  describe('.unbindCompliance()', () => {
    it('should unbind the compliance', async () => {
      const {
        suite: { complianceModule: module, compliance },
        accounts: { deployer },
      } = await loadFixture(deployMaxBalanceFullSuite);

      // Set max balance
      await compliance
        .connect(deployer)
        .callModuleFunction(new ethers.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]), module.target);

      // Unbind the compliance
      await compliance
        .connect(deployer)
        .callModuleFunction(
          new ethers.Interface(['function unbindCompliance(address)']).encodeFunctionData('unbindCompliance', [compliance.target]),
          module.target,
        );

      expect(await module.isComplianceBound(compliance.target)).to.be.equal(false);
      expect(await module.getNonce(compliance.target)).to.be.equal(1);

      // Check that the max balance is removed
      expect(await module.getMaxBalance(compliance.target)).to.be.equal(0);
    });
  });
});
