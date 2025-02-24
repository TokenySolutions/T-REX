import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers, upgrades } from 'hardhat';
import { expect } from 'chai';
import { deploySuiteWithModularCompliancesFixture } from '../fixtures/deploy-full-suite.fixture';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';

async function deployTransferRestrictFullSuite() {
  const context = await loadFixture(deploySuiteWithModularCompliancesFixture);
  const module = await ethers.deployContract('TransferRestrictModule');
  const proxy = await ethers.deployContract('ModuleProxy', [module.target, module.interface.encodeFunctionData('initialize')]);
  const complianceModule = await ethers.getContractAt('TransferRestrictModule', proxy.target);

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

describe('Compliance Module: TransferRestrict', () => {
  it('should deploy the TransferRestrict contract and bind it to the compliance', async () => {
    const context = await loadFixture(deployTransferRestrictFullSuite);

    expect(context.suite.complianceModule.target).not.to.be.undefined;
    expect(await context.suite.compliance.isModuleBound(context.suite.complianceModule.target)).to.be.true;
  });

  describe('.name', () => {
    it('should return the name of the module', async () => {
      const context = await loadFixture(deployTransferRestrictFullSuite);

      expect(await context.suite.complianceModule.name()).to.be.equal('TransferRestrictModule');
    });
  });

  describe('.isPlugAndPlay', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployTransferRestrictFullSuite);
      expect(await context.suite.complianceModule.isPlugAndPlay()).to.be.true;
    });
  });

  describe('.canComplianceBind', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployTransferRestrictFullSuite);
      const complianceModule = await ethers.deployContract('TransferRestrictModule');
      expect(await complianceModule.canComplianceBind(context.suite.compliance.target)).to.be.true;
    });
  });

  describe('.owner', () => {
    it('should return owner', async () => {
      const context = await loadFixture(deployTransferRestrictFullSuite);
      await expect(context.suite.complianceModule.owner()).to.eventually.be.eq(context.accounts.deployer.address);
    });
  });

  describe('.initialize', () => {
    it('should be called only once', async () => {
      // given
      const {
        accounts: { deployer },
      } = await loadFixture(deployComplianceFixture);
      const module = (await ethers.deployContract('TransferRestrictModule')).connect(deployer);
      await module.initialize();

      // when & then
      await expect(module.initialize()).to.be.revertedWith('Initializable: contract is already initialized');
      expect(await module.owner()).to.be.eq(deployer.address);
    });
  });

  describe('.transferOwnership', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        await expect(
          context.suite.complianceModule.connect(context.accounts.aliceWallet).transferOwnership(context.accounts.bobWallet.address),
        ).to.revertedWithCustomError(context.suite.complianceModule, 'OwnableUnauthorizedAccount');
      });
    });

    describe('when calling with owner account', () => {
      it('should transfer ownership', async () => {
        // given
        const context = await loadFixture(deployTransferRestrictFullSuite);

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
        const context = await loadFixture(deployTransferRestrictFullSuite);
        await expect(context.suite.complianceModule.connect(context.accounts.aliceWallet).upgradeTo(ethers.ZeroAddress)).to.revertedWithCustomError(
          context.suite.complianceModule,
          'OwnableUnauthorizedAccount',
        );
      });
    });

    describe('when calling with owner account', () => {
      it('should upgrade proxy', async () => {
        // given
        const context = await loadFixture(deployTransferRestrictFullSuite);
        const newImplementation = await ethers.deployContract('TransferRestrictModule');

        // when
        await context.suite.complianceModule.connect(context.accounts.deployer).upgradeTo(newImplementation.target);

        // then
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(context.suite.complianceModule.target);
        expect(implementationAddress).to.eq(newImplementation.target);
      });
    });
  });

  describe('.allowUser', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.allowUser(context.accounts.aliceWallet.address)).to.revertedWithCustomError(
          context.suite.complianceModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when calling via compliance', () => {
      it('should allow user', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        const tx = await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function allowUser(address _userAddress)']).encodeFunctionData('allowUser', [context.accounts.aliceWallet.address]),
          context.suite.complianceModule.target,
        );

        await expect(tx)
          .to.emit(context.suite.complianceModule, 'UserAllowed')
          .withArgs(context.suite.compliance.target, context.accounts.aliceWallet.address);
      });
    });
  });

  describe('.batchAllowUsers', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.batchAllowUsers([context.accounts.aliceWallet.address])).to.revertedWithCustomError(
          context.suite.complianceModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when calling via compliance', () => {
      it('should allow identities', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        const tx = await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function batchAllowUsers(address[] _identities)']).encodeFunctionData('batchAllowUsers', [
            [context.accounts.aliceWallet.address, context.accounts.bobWallet.address],
          ]),
          context.suite.complianceModule.target,
        );

        await expect(tx)
          .to.emit(context.suite.complianceModule, 'UserAllowed')
          .withArgs(context.suite.compliance.target, context.accounts.aliceWallet.address)
          .to.emit(context.suite.complianceModule, 'UserAllowed')
          .withArgs(context.suite.compliance.target, context.accounts.bobWallet.address);
      });
    });
  });

  describe('.disallowUser', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.disallowUser(context.accounts.aliceWallet.address)).to.revertedWithCustomError(
          context.suite.complianceModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when calling via compliance', () => {
      it('should disallow user', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function allowUser(address _userAddress)']).encodeFunctionData('allowUser', [context.accounts.aliceWallet.address]),
          context.suite.complianceModule.target,
        );

        const tx = await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function disallowUser(address _userAddress)']).encodeFunctionData('disallowUser', [
            context.accounts.aliceWallet.address,
          ]),
          context.suite.complianceModule.target,
        );

        await expect(tx)
          .to.emit(context.suite.complianceModule, 'UserDisallowed')
          .withArgs(context.suite.compliance.target, context.accounts.aliceWallet.address);
      });
    });
  });

  describe('.batchDisallowUsers', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.batchDisallowUsers([context.accounts.aliceWallet.address])).to.revertedWithCustomError(
          context.suite.complianceModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when calling via compliance', () => {
      it('should disallow user', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function batchAllowUsers(address[] _identities)']).encodeFunctionData('batchAllowUsers', [
            [context.accounts.aliceWallet.address, context.accounts.bobWallet.address],
          ]),
          context.suite.complianceModule.target,
        );

        const tx = await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function batchDisallowUsers(address[] _identities)']).encodeFunctionData('batchDisallowUsers', [
            [context.accounts.aliceWallet.address, context.accounts.bobWallet.address],
          ]),
          context.suite.complianceModule.target,
        );

        await expect(tx)
          .to.emit(context.suite.complianceModule, 'UserDisallowed')
          .withArgs(context.suite.compliance.target, context.accounts.aliceWallet.address)
          .to.emit(context.suite.complianceModule, 'UserDisallowed')
          .withArgs(context.suite.compliance.target, context.accounts.bobWallet.address);
      });
    });
  });

  describe('.isUserAllowed', () => {
    describe('when user is allowed', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function allowUser(address _userAddress)']).encodeFunctionData('allowUser', [context.accounts.aliceWallet.address]),
          context.suite.complianceModule.target,
        );

        const result = await context.suite.complianceModule.isUserAllowed(context.suite.compliance.target, context.accounts.aliceWallet.address);
        expect(result).to.be.true;
      });
    });

    describe('when user is not allowed', () => {
      it('should return false', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        const result = await context.suite.complianceModule.isUserAllowed(context.suite.compliance.target, context.accounts.aliceWallet.address);
        expect(result).to.be.false;
      });
    });
  });

  describe('.moduleCheck', () => {
    describe('when sender and receiver are not allowed', () => {
      it('should return false', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        const to = context.accounts.anotherWallet.address;
        const from = context.accounts.aliceWallet.address;
        const result = await context.suite.complianceModule.moduleCheck(from, to, 10, context.suite.compliance.target);
        expect(result).to.be.false;
      });
    });

    describe('when sender is the null address', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        const to = context.accounts.anotherWallet.address;
        const from = ethers.ZeroAddress;
        const result = await context.suite.complianceModule.moduleCheck(from, to, 10, context.suite.compliance.target);
        expect(result).to.be.true;
      });
    });

    describe('when recipient is the null address', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        const to = ethers.ZeroAddress;
        const from = context.accounts.aliceWallet.address;
        const result = await context.suite.complianceModule.moduleCheck(from, to, 10, context.suite.compliance.target);
        expect(result).to.be.true;
      });
    });

    describe('when sender is allowed', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        const to = context.accounts.aliceWallet.address;
        const from = context.accounts.bobWallet.address;

        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function allowUser(address _userAddress)']).encodeFunctionData('allowUser', [from]),
          context.suite.complianceModule.target,
        );

        const result = await context.suite.complianceModule.moduleCheck(from, to, 10, context.suite.compliance.target);
        expect(result).to.be.true;
      });
    });

    describe('when receiver is allowed', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        const to = context.accounts.aliceWallet.address;
        const from = context.accounts.bobWallet.address;

        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function allowUser(address _userAddress)']).encodeFunctionData('allowUser', [to]),
          context.suite.complianceModule.target,
        );

        const result = await context.suite.complianceModule.moduleCheck(from, to, 10, context.suite.compliance.target);
        expect(result).to.be.true;
      });
    });
  });

  describe('.moduleMintAction', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.moduleMintAction(context.accounts.anotherWallet.address, 10)).to.be.revertedWithCustomError(
          context.suite.complianceModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(
          context.suite.compliance.callModuleFunction(
            new ethers.Interface(['function moduleMintAction(address, uint256)']).encodeFunctionData('moduleMintAction', [
              context.accounts.anotherWallet.address,
              10,
            ]),
            context.suite.complianceModule.target,
          ),
        ).to.eventually.be.fulfilled;
      });
    });
  });

  describe('.moduleBurnAction', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.moduleBurnAction(context.accounts.anotherWallet.address, 10)).to.be.revertedWithCustomError(
          context.suite.complianceModule,
          'OnlyBoundComplianceCanCall',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(
          context.suite.compliance.callModuleFunction(
            new ethers.Interface(['function moduleBurnAction(address, uint256)']).encodeFunctionData('moduleBurnAction', [
              context.accounts.anotherWallet.address,
              10,
            ]),
            context.suite.complianceModule.target,
          ),
        ).to.eventually.be.fulfilled;
      });
    });
  });

  describe('.moduleTransfer', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(
          context.suite.complianceModule.moduleTransferAction(context.accounts.aliceWallet.address, context.accounts.anotherWallet.address, 10),
        ).to.be.revertedWithCustomError(context.suite.complianceModule, 'OnlyBoundComplianceCanCall');
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(
          context.suite.compliance.callModuleFunction(
            new ethers.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [context.accounts.aliceWallet.address, context.accounts.anotherWallet.address, 80],
            ),
            context.suite.complianceModule.target,
          ),
        ).to.eventually.be.fulfilled;
      });
    });
  });
  describe('.supportsInterface()', () => {
    it('should return false for unsupported interfaces', async () => {
      const context = await loadFixture(deployTransferRestrictFullSuite);

      const unsupportedInterfaceId = '0x12345678';
      expect(await context.suite.complianceModule.supportsInterface(unsupportedInterfaceId)).to.equal(false);
    });

    it('should correctly identify the IModule interface ID', async () => {
      const context = await loadFixture(deployTransferRestrictFullSuite);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const iModuleInterfaceId = await interfaceIdCalculator.getIModuleInterfaceId();
      expect(await context.suite.complianceModule.supportsInterface(iModuleInterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC173 interface ID', async () => {
      const context = await loadFixture(deployTransferRestrictFullSuite);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc173InterfaceId = await interfaceIdCalculator.getIERC173InterfaceId();
      expect(await context.suite.complianceModule.supportsInterface(ierc173InterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC165 interface ID', async () => {
      const context = await loadFixture(deployTransferRestrictFullSuite);
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
        accounts: { deployer, aliceWallet, bobWallet },
      } = await loadFixture(deployTransferRestrictFullSuite);

      // Allow users
      await compliance
        .connect(deployer)
        .callModuleFunction(
          new ethers.Interface(['function batchAllowUsers(address[] _identities)']).encodeFunctionData('batchAllowUsers', [
            [aliceWallet.address, bobWallet.address],
          ]),
          module.target,
        );

      // Unbind the compliance
      await compliance
        .connect(deployer)
        .callModuleFunction(
          new ethers.Interface(['function unbindCompliance(address)']).encodeFunctionData('unbindCompliance', [compliance.target]),
          module.target,
        );

      expect(await module.isComplianceBound(compliance.target)).to.be.equal(false);
      expect(await module.getNonce(compliance.target)).to.be.equal(1);

      // Check that the users are not allowed
      expect(await module.isUserAllowed(compliance.target, aliceWallet.address)).to.be.equal(false);
      expect(await module.isUserAllowed(compliance.target, bobWallet.address)).to.be.equal(false);
    });
  });
});
