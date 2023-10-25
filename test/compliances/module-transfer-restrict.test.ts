import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';
import { deploySuiteWithModularCompliancesFixture } from '../fixtures/deploy-full-suite.fixture';

async function deployTransferRestrictFullSuite() {
  const context = await loadFixture(deploySuiteWithModularCompliancesFixture);
  const complianceModule = await ethers.deployContract('TransferRestrictModule');
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

describe('Compliance Module: TransferRestrict', () => {
  it('should deploy the TransferRestrict contract and bind it to the compliance', async () => {
    const context = await loadFixture(deployTransferRestrictFullSuite);

    expect(context.suite.complianceModule.address).not.to.be.undefined;
    expect(await context.suite.compliance.isModuleBound(context.suite.complianceModule.address)).to.be.true;
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
      expect(await complianceModule.canComplianceBind(context.suite.compliance.address)).to.be.true;
    });
  });

  describe('.allowIdentity', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.allowIdentity(context.accounts.aliceWallet.address)).to.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling via compliance', () => {
      it('should allow identity', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        const tx = await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function allowIdentity(address _identity)']).encodeFunctionData('allowIdentity', [
            context.accounts.aliceWallet.address,
          ]),
          context.suite.complianceModule.address,
        );

        await expect(tx)
          .to.emit(context.suite.complianceModule, 'IdentityAllowed')
          .withArgs(context.suite.compliance.address, context.accounts.aliceWallet.address);
      });
    });
  });

  describe('.batchAllowIdentities', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.batchAllowIdentities([context.accounts.aliceWallet.address])).to.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling via compliance', () => {
      it('should allow identities', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        const tx = await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function batchAllowIdentities(address[] _identities)']).encodeFunctionData('batchAllowIdentities', [
            [context.accounts.aliceWallet.address, context.accounts.bobWallet.address],
          ]),
          context.suite.complianceModule.address,
        );

        await expect(tx)
          .to.emit(context.suite.complianceModule, 'IdentityAllowed')
          .withArgs(context.suite.compliance.address, context.accounts.aliceWallet.address)
          .to.emit(context.suite.complianceModule, 'IdentityAllowed')
          .withArgs(context.suite.compliance.address, context.accounts.bobWallet.address);
      });
    });
  });

  describe('.disallowIdentity', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.disallowIdentity(context.accounts.aliceWallet.address)).to.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling via compliance', () => {
      it('should disallow identity', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function allowIdentity(address _identity)']).encodeFunctionData('allowIdentity', [
            context.accounts.aliceWallet.address,
          ]),
          context.suite.complianceModule.address,
        );

        const tx = await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function disallowIdentity(address _identity)']).encodeFunctionData('disallowIdentity', [
            context.accounts.aliceWallet.address,
          ]),
          context.suite.complianceModule.address,
        );

        await expect(tx)
          .to.emit(context.suite.complianceModule, 'IdentityDisallowed')
          .withArgs(context.suite.compliance.address, context.accounts.aliceWallet.address);
      });
    });
  });

  describe('.batchDisallowIdentities', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.batchDisallowIdentities([context.accounts.aliceWallet.address])).to.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling via compliance', () => {
      it('should disallow identity', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function batchAllowIdentities(address[] _identities)']).encodeFunctionData('batchAllowIdentities', [
            [context.accounts.aliceWallet.address, context.accounts.bobWallet.address],
          ]),
          context.suite.complianceModule.address,
        );

        const tx = await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function batchDisallowIdentities(address[] _identities)']).encodeFunctionData('batchDisallowIdentities', [
            [context.accounts.aliceWallet.address, context.accounts.bobWallet.address],
          ]),
          context.suite.complianceModule.address,
        );

        await expect(tx)
          .to.emit(context.suite.complianceModule, 'IdentityDisallowed')
          .withArgs(context.suite.compliance.address, context.accounts.aliceWallet.address)
          .to.emit(context.suite.complianceModule, 'IdentityDisallowed')
          .withArgs(context.suite.compliance.address, context.accounts.bobWallet.address);
      });
    });
  });

  describe('.isIdentityAllowed', () => {
    describe('when identity is allowed', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        const identity = await context.suite.identityRegistry.identity(context.accounts.aliceWallet.address);
        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function allowIdentity(address _identity)']).encodeFunctionData('allowIdentity', [identity]),
          context.suite.complianceModule.address,
        );

        const result = await context.suite.complianceModule.isIdentityAllowed(context.suite.compliance.address, identity);
        expect(result).to.be.true;
      });
    });

    describe('when identity is not allowed', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        const identity = await context.suite.identityRegistry.identity(context.accounts.aliceWallet.address);
        const result = await context.suite.complianceModule.isIdentityAllowed(context.suite.compliance.address, identity);
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
        const result = await context.suite.complianceModule.moduleCheck(from, to, 10, context.suite.compliance.address);
        expect(result).to.be.false;
      });
    });

    describe('when sender is allowed', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        const to = context.accounts.aliceWallet.address;
        const from = context.accounts.bobWallet.address;

        const identity = await context.suite.identityRegistry.identity(from);
        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function allowIdentity(address _identity)']).encodeFunctionData('allowIdentity', [identity]),
          context.suite.complianceModule.address,
        );

        const result = await context.suite.complianceModule.moduleCheck(from, to, 10, context.suite.compliance.address);
        expect(result).to.be.true;
      });
    });

    describe('when receiver is allowed', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        const to = context.accounts.aliceWallet.address;
        const from = context.accounts.bobWallet.address;

        const identity = await context.suite.identityRegistry.identity(to);
        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function allowIdentity(address _identity)']).encodeFunctionData('allowIdentity', [identity]),
          context.suite.complianceModule.address,
        );

        const result = await context.suite.complianceModule.moduleCheck(from, to, 10, context.suite.compliance.address);
        expect(result).to.be.true;
      });
    });
  });

  describe('.moduleMintAction', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.moduleMintAction(context.accounts.anotherWallet.address, 10)).to.be.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

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
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.moduleBurnAction(context.accounts.anotherWallet.address, 10)).to.be.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

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
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(
          context.suite.complianceModule.moduleTransferAction(context.accounts.aliceWallet.address, context.accounts.anotherWallet.address, 10),
        ).to.be.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

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
