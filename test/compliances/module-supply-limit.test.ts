import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';
import { deploySuiteWithModularCompliancesFixture } from '../fixtures/deploy-full-suite.fixture';

async function deploySupplyLimitFixture() {
  const context = await loadFixture(deployComplianceFixture);

  const complianceModule = await ethers.deployContract('SupplyLimitModule');
  await context.suite.compliance.addModule(complianceModule.address);

  return {
    ...context,
    suite: {
      ...context.suite,
      complianceModule,
    },
  };
}

async function deploySupplyLimitFullSuite() {
  const context = await loadFixture(deploySuiteWithModularCompliancesFixture);
  const complianceModule = await ethers.deployContract('SupplyLimitModule');
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

describe.only('Compliance Module: SupplyLimit', () => {
  it('should deploy the SupplyLimit contract and bind it to the compliance', async () => {
    const context = await loadFixture(deploySupplyLimitFixture);

    expect(context.suite.complianceModule.address).not.to.be.undefined;
    expect(await context.suite.compliance.isModuleBound(context.suite.complianceModule.address)).to.be.true;
  });

  describe('.setSupplyLimit', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deploySupplyLimitFixture);

        await expect(context.suite.complianceModule.setSupplyLimit(context.suite.compliance.address, 100)).to.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling via compliance', () => {
      it('should set supply limit', async () => {
        const context = await loadFixture(deploySupplyLimitFixture);

        const tx = await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function setSupplyLimit(address _compliance, uint256 _limit)']).encodeFunctionData('setSupplyLimit', [
            context.suite.compliance.address,
            100,
          ]),
          context.suite.complianceModule.address,
        );

        await expect(tx).to.emit(context.suite.complianceModule, 'SupplyLimitSet').withArgs(context.suite.compliance.address, 100);
      });
    });
  });

  describe('.moduleCheck', () => {
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    describe('when value exceeds compliance supply limit', () => {
      it('should return false', async () => {
        const context = await loadFixture(deploySupplyLimitFullSuite);
        const to = context.accounts.aliceWallet.address;
        const from = zeroAddress;

        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function setSupplyLimit(address _compliance, uint256 _limit)']).encodeFunctionData('setSupplyLimit', [
            context.suite.compliance.address,
            1600,
          ]),
          context.suite.complianceModule.address,
        );

        const result = await context.suite.complianceModule.moduleCheck(from, to, 101, context.suite.compliance.address);
        expect(result).to.be.false;
      });
    });

    describe('when supply limit does not exceed compliance supply limit', () => {
      it('should return true', async () => {
        const context = await loadFixture(deploySupplyLimitFullSuite);
        const to = context.accounts.aliceWallet.address;
        const from = zeroAddress;

        await context.suite.compliance.callModuleFunction(
          new ethers.utils.Interface(['function setSupplyLimit(address _compliance, uint256 _limit)']).encodeFunctionData('setSupplyLimit', [
            context.suite.compliance.address,
            1600,
          ]),
          context.suite.complianceModule.address,
        );

        const result = await context.suite.complianceModule.moduleCheck(from, to, 100, context.suite.compliance.address);
        expect(result).to.be.true;
      });
    });
  });
});
