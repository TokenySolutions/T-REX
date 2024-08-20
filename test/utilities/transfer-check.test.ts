import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { HDNodeWallet } from 'ethers';
import { deployComplianceFixture } from '../fixtures/deploy-compliance.fixture';
import { deployClaimIssuer, deployFullSuiteFixture } from '../fixtures/deploy-full-suite.fixture';

import { IIdFactory } from '../../typechain-types';

async function deployComplianceWithCountryAllowModule() {
  const context = await loadFixture(deployComplianceFixture);
  const { compliance } = context.suite;

  const module = await ethers.deployContract('CountryAllowModule');
  const proxy = await ethers.deployContract('ModuleProxy', [module.target, module.interface.encodeFunctionData('initialize')]);
  const countryAllowModule = await ethers.getContractAt('CountryAllowModule', proxy.target);
  await compliance.addModule(countryAllowModule.target);

  const contract = await ethers.deployContract('MockContract');
  await compliance.bindToken(contract.target);

  await compliance
    .connect(context.accounts.deployer)
    .callModuleFunction(
      new ethers.Interface(['function addAllowedCountry(uint16 country)']).encodeFunctionData('addAllowedCountry', [42]),
      countryAllowModule.target,
    );
  await contract.setInvestorCountry(42);

  return { ...context, suite: { ...context.suite, countryAllowModule, mock: contract } };
}

async function addClaim(
  claimIssuerContract: IIdFactory,
  claimIssuerSigningKey: HDNodeWallet,
  claimTopic: string,
  wallet: HardhatEthersSigner,
  identity: IIdFactory,
) {
  const claim = {
    data: ethers.hexlify(ethers.toUtf8Bytes('Some claim public data 2.')),
    issuer: claimIssuerContract.target,
    topic: claimTopic,
    scheme: 1,
    identity: identity.target,
    signature: '',
  };
  claim.signature = await claimIssuerSigningKey.signMessage(
    ethers.getBytes(
      ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [claim.identity, claim.topic, claim.data])),
    ),
  );

  await identity.connect(wallet).addClaim(claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, '');
}

describe('UtilityChecker.testTransfer', () => {
  describe('When sender is frozen', () => {
    it('should return false', async () => {
      const {
        suite: { token },
        accounts: { tokenAgent, aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);
      const {
        suite: { compliance },
      } = await deployComplianceWithCountryAllowModule();

      const utilityChecker = await ethers.deployContract('UtilityChecker');

      await token.connect(tokenAgent).setAddressFrozen(aliceWallet.address, true);
      const success = await utilityChecker.testTransfer(compliance.target, token.target, aliceWallet.address, bobWallet.address, 100);
      expect(success).to.be.equal(false);
    });
  });

  describe('When recipient is frozen', () => {
    it('should return false', async () => {
      const {
        suite: { token },
        accounts: { tokenAgent, aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);
      const {
        suite: { compliance },
      } = await deployComplianceWithCountryAllowModule();

      const utilityChecker = await ethers.deployContract('UtilityChecker');

      await token.connect(tokenAgent).setAddressFrozen(bobWallet.address, true);
      const success = await utilityChecker.testTransfer(compliance.target, token.target, aliceWallet.address, bobWallet.address, 100);
      expect(success).to.be.equal(false);
    });
  });

  describe('When unfrozen balance is unsufficient', () => {
    it('should return false', async () => {
      const {
        suite: { token },
        accounts: { tokenAgent, aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);
      const {
        suite: { compliance },
      } = await deployComplianceWithCountryAllowModule();

      const utilityChecker = await ethers.deployContract('UtilityChecker');

      const initialBalance = await token.balanceOf(aliceWallet.address);
      await token.connect(tokenAgent).freezePartialTokens(aliceWallet.address, initialBalance - 10n);
      const success = await utilityChecker.testTransfer(compliance.target, token.target, aliceWallet.address, bobWallet.address, 100);
      expect(success).to.be.equal(false);
    });
  });

  describe('When nominal case', () => {
    it('should return true', async () => {
      const {
        suite: { token, identityRegistry },
        accounts: { tokenAgent, aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);
      const {
        suite: { compliance },
      } = await deployComplianceWithCountryAllowModule();

      await identityRegistry.connect(tokenAgent).updateCountry(aliceWallet.address, 42);

      const utilityChecker = await ethers.deployContract('UtilityChecker');

      const success = await utilityChecker.testTransfer(compliance.target, token.target, aliceWallet.address, bobWallet.address, 100);
      expect(success).to.be.equal(true);
    });
  });

  it('should return false when the identity is registered with topics', async () => {
    const {
      suite: { identityRegistry },
      accounts: { tokenAgent, charlieWallet },
      identities: { charlieIdentity },
    } = await loadFixture(deployFullSuiteFixture);

    await identityRegistry.connect(tokenAgent).registerIdentity(charlieWallet.address, charlieIdentity.target, 0);

    const eligibilityChecker = await ethers.deployContract('UtilityChecker');
    const results = await eligibilityChecker.testVerifiedDetails(identityRegistry.target, charlieWallet.address);
    expect(results.length).to.be.equal(1);
    const result = results[0];
    expect(result[0]).to.be.equal(ethers.ZeroAddress);
    expect(result[1]).to.be.equal(0);
    expect(result[2]).to.be.equal(false);
  });

  it('should return empty result when the identity is registered without topics', async () => {
    const {
      suite: { identityRegistry, claimTopicsRegistry },
      accounts: { tokenAgent, charlieWallet },
      identities: { charlieIdentity },
    } = await loadFixture(deployFullSuiteFixture);

    await identityRegistry.connect(tokenAgent).registerIdentity(charlieWallet.address, charlieIdentity.target, 0);
    const topics = await claimTopicsRegistry.getClaimTopics();
    await Promise.all(topics.map((topic) => claimTopicsRegistry.removeClaimTopic(topic)));

    const eligibilityChecker = await ethers.deployContract('UtilityChecker');
    const results = await eligibilityChecker.testVerifiedDetails(identityRegistry.target, charlieWallet.address);
    expect(results.length).to.be.equal(0);
  });

  it('should return true after fixture', async () => {
    const {
      suite: { identityRegistry, claimTopicsRegistry, trustedIssuersRegistry },
      accounts: { aliceWallet },
    } = await loadFixture(deployFullSuiteFixture);

    const eligibilityChecker = await ethers.deployContract('UtilityChecker');
    const results = await eligibilityChecker.testVerifiedDetails(identityRegistry.target, aliceWallet.address);
    expect(results.length).to.be.equal(1);

    const topics = await claimTopicsRegistry.getClaimTopics();
    topics.forEach(async (topic, i) => {
      const result = results[i];
      expect(result[0]).to.be.equal(await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(topic));
      expect(result[1]).to.be.equal(topic);
      expect(result[2]).to.be.equal(true);
    });
  });

  it('should return true for multiple issuers and topics', async () => {
    const {
      suite: { identityRegistry, claimTopicsRegistry, trustedIssuersRegistry },
      accounts: { deployer, aliceWallet },
      identities: { aliceIdentity },
    } = await loadFixture(deployFullSuiteFixture);

    const [, , , , , , , , , , claimIssuer] = await ethers.getSigners();
    const claimIssuerSigningKey = ethers.Wallet.createRandom();

    const claimIssuerContract = await deployClaimIssuer(claimIssuer.address, claimIssuer);
    await claimIssuerContract
      .connect(claimIssuer)
      .addKey(ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address'], [claimIssuerSigningKey.address])), 3, 1);

    const claimTopics = [ethers.keccak256(ethers.toUtf8Bytes('CLAIM_TOPIC_2')), ethers.keccak256(ethers.toUtf8Bytes('CLAIM_TOPIC_3'))];
    await claimTopicsRegistry.connect(deployer).addClaimTopic(claimTopics[0]);
    await claimTopicsRegistry.connect(deployer).addClaimTopic(claimTopics[1]);
    await trustedIssuersRegistry.connect(deployer).addTrustedIssuer(claimIssuerContract.target, claimTopics);

    await addClaim(claimIssuerContract, claimIssuerSigningKey, claimTopics[0], aliceWallet, aliceIdentity);
    await addClaim(claimIssuerContract, claimIssuerSigningKey, claimTopics[1], aliceWallet, aliceIdentity);

    const eligibilityChecker = await ethers.deployContract('UtilityChecker');
    const results = await eligibilityChecker.testVerifiedDetails(identityRegistry.target, aliceWallet.address);

    expect(results.length).to.be.equal(3);
    const topics = await claimTopicsRegistry.getClaimTopics();
    topics.forEach(async (topic, i) => {
      const result = results[i];
      expect(result[0]).to.be.equal(await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(topic));
      expect(result[1]).to.be.equal(topic);
      expect(result[2]).to.be.equal(true);
    });
  });
});
