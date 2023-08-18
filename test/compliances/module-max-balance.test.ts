import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';
import { deploySuiteWithModularCompliancesFixture } from '../fixtures/deploy-full-suite.fixture';

async function deployMaxBalanceFixture() {
  const context = await loadFixture(deployComplianceFixture);

  const complianceModule = await ethers.deployContract('MaxBalanceModule');
  await context.suite.compliance.addModule(complianceModule.address);

  return {
    ...context,
    suite: {
      ...context.suite,
      complianceModule,
    },
  };
}

async function deployMaxBalanceFullSuite() {
  const context = await loadFixture(deploySuiteWithModularCompliancesFixture);
  const complianceModule = await ethers.deployContract('MaxBalanceModule');
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

describe('Compliance Module: MaxBalance', () => {
  it('should deploy the MaxBalance contract and bind it to the compliance', async () => {
    const context = await loadFixture(deployMaxBalanceFixture);

    expect(context.suite.complianceModule.address).not.to.be.undefined;
    expect(await context.suite.compliance.isModuleBound(context.suite.complianceModule.address)).to.be.true;
  });

  describe('.setMaxBalance', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployMaxBalanceFixture);

        await expect(context.suite.complianceModule.setMaxBalance(100)).to.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling via compliance', () => {
      it('should set max balance', async () => {
        const context = await loadFixture(deployMaxBalanceFixture);

        const tx = await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [100]),
          context.suite.complianceModule.address,
        );

        await expect(tx).to.emit(context.suite.complianceModule, 'MaxBalanceSet').withArgs(context.suite.compliance.address, 100);
      });
    });
  });

  describe('.preSetModuleState', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployMaxBalanceFixture);
        await expect(
          context.suite.complianceModule
            .connect(context.accounts.aliceWallet)
            .preSetModuleState(context.suite.compliance.address, context.accounts.aliceWallet.address, 100),
        ).to.revertedWith('only compliance owner call');
      });
    });

    describe('when calling via deployer', () => {
      describe('when compliance already bound', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployMaxBalanceFixture);
          await expect(
            context.suite.complianceModule
              .connect(context.accounts.deployer)
              .preSetModuleState(context.suite.compliance.address, context.accounts.aliceWallet.address, 100),
          ).to.revertedWith('cannot do on bound compliance');
        });
      });

      describe('when compliance is not yet bound', () => {
        it('should preset', async () => {
          const context = await loadFixture(deployComplianceFixture);
          const complianceModule = await ethers.deployContract('MaxBalanceModule');

          const tx = await complianceModule
            .connect(context.accounts.deployer)
            .preSetModuleState(context.suite.compliance.address, context.accounts.aliceWallet.address, 100);

          await expect(tx)
            .to.emit(complianceModule, 'IDBalancePreSet')
            .withArgs(context.suite.compliance.address, context.accounts.aliceWallet.address, 100);
        });
      });
    });
  });

  describe('.batchPreSetModuleState', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployMaxBalanceFixture);
        await expect(
          context.suite.complianceModule
            .connect(context.accounts.aliceWallet)
            .batchPreSetModuleState(context.suite.compliance.address, [context.accounts.aliceWallet.address], [100]),
        ).to.revertedWith('only compliance owner call');
      });
    });

    describe('when calling via deployer', () => {
      describe('when compliance already bound', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployMaxBalanceFixture);
          await expect(
            context.suite.complianceModule
              .connect(context.accounts.deployer)
              .batchPreSetModuleState(context.suite.compliance.address, [context.accounts.aliceWallet.address], [100]),
          ).to.revertedWith('cannot do on bound compliance');
        });
      });

      describe('when compliance is not yet bound', () => {
        it('should preset', async () => {
          const context = await loadFixture(deployComplianceFixture);
          const complianceModule = await ethers.deployContract('MaxBalanceModule');

          const tx = await complianceModule
            .connect(context.accounts.deployer)
            .batchPreSetModuleState(
              context.suite.compliance.address,
              [context.accounts.aliceWallet.address, context.accounts.bobWallet.address],
              [100, 200],
            );

          await expect(tx)
            .to.emit(complianceModule, 'IDBalancePreSet')
            .withArgs(context.suite.compliance.address, context.accounts.aliceWallet.address, 100)
            .to.emit(complianceModule, 'IDBalancePreSet')
            .withArgs(context.suite.compliance.address, context.accounts.bobWallet.address, 200);
        });
      });
    });
  });

  describe('.moduleTransferAction', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployMaxBalanceFixture);
        const from = context.accounts.aliceWallet.address;
        const to = context.accounts.bobWallet.address;

        await expect(context.suite.complianceModule.moduleTransferAction(from, to, 10)).to.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling via compliance', () => {
      describe('when value exceeds the max balance', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployMaxBalanceFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
            context.suite.complianceModule.address,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleMintAction(address _to, uint256 _value)']).encodeFunctionData('moduleMintAction', [
              from,
              150,
            ]),
            context.suite.complianceModule.address,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [100]),
            context.suite.complianceModule.address,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [from, to, 40],
            ),
            context.suite.complianceModule.address,
          );

          await expect(
            context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                'moduleTransferAction',
                [from, to, 80],
              ),
              context.suite.complianceModule.address,
            ),
          ).to.be.revertedWithCustomError(context.suite.complianceModule, `MaxBalanceExceeded`);
        });
      });

      describe('when value does not exceed the max balance', () => {
        it('should allow the transfer', async () => {
          const context = await loadFixture(deployMaxBalanceFullSuite);
          const from = context.accounts.aliceWallet.address;
          const to = context.accounts.bobWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
            context.suite.complianceModule.address,
          );

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleMintAction(address _to, uint256 _value)']).encodeFunctionData('moduleMintAction', [
              from,
              150,
            ]),
            context.suite.complianceModule.address,
          );

          await expect(
            context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
                'moduleTransferAction',
                [from, to, 120],
              ),
              context.suite.complianceModule.address,
            ),
          ).to.be.eventually.fulfilled;
        });
      });
    });
  });

  describe('.moduleMintAction', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployMaxBalanceFixture);
        const to = context.accounts.bobWallet.address;

        await expect(context.suite.complianceModule.moduleMintAction(to, 10)).to.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling via compliance', () => {
      describe('when value exceeds the max balance', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployMaxBalanceFullSuite);
          const to = context.accounts.aliceWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
            context.suite.complianceModule.address,
          );

          await expect(
            context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface(['function moduleMintAction(address _to, uint256 _value)']).encodeFunctionData('moduleMintAction', [
                to,
                160,
              ]),
              context.suite.complianceModule.address,
            ),
          ).to.be.revertedWithCustomError(context.suite.complianceModule, `MaxBalanceExceeded`);
        });
      });

      describe('when value does not exceed the max balance', () => {
        it('should allow the mint', async () => {
          const context = await loadFixture(deployMaxBalanceFullSuite);
          const to = context.accounts.aliceWallet.address;

          await context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
            context.suite.complianceModule.address,
          );

          await expect(
            context.suite.compliance.callModuleFunction(
              new ethers.utils.Interface(['function moduleMintAction(address _to, uint256 _value)']).encodeFunctionData('moduleMintAction', [
                to,
                150,
              ]),
              context.suite.complianceModule.address,
            ),
          ).to.be.eventually.fulfilled;
        });
      });
    });
  });

  describe('.moduleBurnAction', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployMaxBalanceFixture);
        const from = context.accounts.bobWallet.address;

        await expect(context.suite.complianceModule.moduleBurnAction(from, 10)).to.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling via compliance', () => {
      it('should allow the burn', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        const from = context.accounts.aliceWallet.address;

        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
          context.suite.complianceModule.address,
        );

        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function moduleMintAction(address _to, uint256 _value)']).encodeFunctionData('moduleMintAction', [from, 100]),
          context.suite.complianceModule.address,
        );

        await expect(
          context.suite.compliance.callModuleFunction(
            new ethers.utils.Interface(['function moduleBurnAction(address _from, uint256 _value)']).encodeFunctionData('moduleBurnAction', [
              from,
              90,
            ]),
            context.suite.complianceModule.address,
          ),
        ).to.be.eventually.fulfilled;
      });
    });
  });

  describe('.moduleCheck', () => {
    describe('when value exceeds compliance max balance', () => {
      it('should return false', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        const to = context.accounts.aliceWallet.address;
        const from = context.accounts.bobWallet.address;

        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
          context.suite.complianceModule.address,
        );

        const result = await context.suite.complianceModule.moduleCheck(from, to, 170, context.suite.compliance.address);
        expect(result).to.be.false;
      });
    });

    describe('when user balance exceeds compliance max balance', () => {
      it('should return false', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        const to = context.accounts.aliceWallet.address;
        const from = context.accounts.bobWallet.address;

        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
          context.suite.complianceModule.address,
        );

        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function moduleMintAction(address _to, uint256 _value)']).encodeFunctionData('moduleMintAction', [to, 100]),
          context.suite.complianceModule.address,
        );

        const result = await context.suite.complianceModule.moduleCheck(from, to, 70, context.suite.compliance.address);
        expect(result).to.be.false;
      });
    });

    describe('when user balance does not exceed compliance max balance', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployMaxBalanceFullSuite);
        const to = context.accounts.aliceWallet.address;
        const from = context.accounts.bobWallet.address;

        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function setMaxBalance(uint256 _max)']).encodeFunctionData('setMaxBalance', [150]),
          context.suite.complianceModule.address,
        );

        const result = await context.suite.complianceModule.moduleCheck(from, to, 70, context.suite.compliance.address);
        expect(result).to.be.true;
      });
    });
  });
});
