import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';

async function deployComplianceWithCountryAllowModule() {
  const context = await loadFixture(deployComplianceFixture);
  const { compliance } = context.suite;

  const module = await ethers.deployContract('CountryAllowModule');
  const proxy = await ethers.deployContract('ModuleProxy', [module.target, module.interface.encodeFunctionData('initialize')]);
  const countryAllowModule = await ethers.getContractAt('CountryAllowModule', proxy.target);
  await compliance.addModule(countryAllowModule.target);

  const contract = await ethers.deployContract('MockContract');
  await compliance.bindToken(contract.target);

  return { ...context, suite: { ...context.suite, countryAllowModule, mock: contract } };
}

describe('UtilityChecker.testTransferDetails', () => {
  it('should return no pass for single module', async () => {
    const context = await loadFixture(deployComplianceWithCountryAllowModule);

    const complianceChecker = await ethers.deployContract('UtilityChecker');
    const results = await complianceChecker.testTransferDetails(
      context.suite.compliance,
      context.accounts.aliceWallet,
      context.accounts.bobWallet,
      100,
    );
    expect(results.length).to.equal(1);
    expect(results[0][0]).to.equal('CountryAllowModule');
    expect(results[0][1]).to.equal(false);
  });

  it('should return no pass for multiple modules', async () => {
    const context = await loadFixture(deployComplianceWithCountryAllowModule);

    const transferRestrictModule = await ethers.deployContract('TransferRestrictModule');
    await ethers.deployContract('ModuleProxy', [transferRestrictModule.target, transferRestrictModule.interface.encodeFunctionData('initialize')]);
    await context.suite.compliance.addModule(transferRestrictModule.target);

    const complianceChecker = await ethers.deployContract('UtilityChecker');
    const results = await complianceChecker.testTransferDetails(
      context.suite.compliance,
      context.accounts.aliceWallet,
      context.accounts.bobWallet,
      100,
    );
    expect(results.length).to.equal(2);
    expect(results[0][0]).to.equal('CountryAllowModule');
    expect(results[0][1]).to.equal(false);
    expect(results[1][0]).to.equal('TransferRestrictModule');
    expect(results[1][1]).to.equal(false);
  });

  it('should return pass for multiple modules', async () => {
    const context = await loadFixture(deployComplianceWithCountryAllowModule);

    const transferRestrictModule = await ethers.deployContract('TransferRestrictModule');
    await ethers.deployContract('ModuleProxy', [transferRestrictModule.target, transferRestrictModule.interface.encodeFunctionData('initialize')]);
    await context.suite.compliance.addModule(transferRestrictModule.target);

    await context.suite.compliance
      .connect(context.accounts.deployer)
      .callModuleFunction(
        new ethers.Interface(['function addAllowedCountry(uint16 country)']).encodeFunctionData('addAllowedCountry', [42]),
        context.suite.countryAllowModule.target,
      );
    await context.suite.mock.setInvestorCountry(42);

    await context.suite.compliance.callModuleFunction(
      new ethers.Interface(['function allowUser(address _userAddress)']).encodeFunctionData('allowUser', [context.accounts.aliceWallet.address]),
      transferRestrictModule.target,
    );

    const complianceChecker = await ethers.deployContract('UtilityChecker');
    const results = await complianceChecker.testTransferDetails(
      context.suite.compliance,
      context.accounts.aliceWallet,
      context.accounts.bobWallet,
      100,
    );
    expect(results.length).to.equal(2);
    expect(results[0][0]).to.equal('CountryAllowModule');
    expect(results[0][1]).to.equal(true);
    expect(results[1][0]).to.equal('TransferRestrictModule');
    expect(results[1][1]).to.equal(true);
  });
});
