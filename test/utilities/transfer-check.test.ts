import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { HDNodeWallet } from 'ethers';
import { deployClaimIssuer, deployFullSuiteFixture } from '../fixtures/deploy-full-suite.fixture';

import { IIdFactory, Token } from '../../typechain-types';

async function deployComplianceAndCountryAllowModule(token: Token, deployer: HardhatEthersSigner) {
  const compliance = await ethers.deployContract('ModularCompliance');
  await compliance.init();
  await token.connect(deployer).setCompliance(compliance.target);

  const module = await ethers.deployContract('CountryAllowModule');
  const proxy = await ethers.deployContract('ModuleProxy', [module.target, module.interface.encodeFunctionData('initialize')]);
  const countryAllowModule = await ethers.getContractAt('CountryAllowModule', proxy.target);

  await compliance.addModule(countryAllowModule.target);
  await compliance.bindToken(token.target);
  await compliance
    .connect(deployer)
    .callModuleFunction(
      new ethers.Interface(['function addAllowedCountry(uint16 country)']).encodeFunctionData('addAllowedCountry', [42]),
      countryAllowModule.target,
    );
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

      const utilityChecker = await ethers.deployContract('UtilityChecker');

      await token.connect(tokenAgent).setAddressFrozen(aliceWallet.address, true);
      const success = await utilityChecker.testTransfer(token.target, aliceWallet.address, bobWallet.address, 100);
      expect(success).to.be.equal(false);
    });
  });

  describe('When recipient is frozen', () => {
    it('should return false', async () => {
      const {
        suite: { token },
        accounts: { tokenAgent, aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);

      const utilityChecker = await ethers.deployContract('UtilityChecker');

      await token.connect(tokenAgent).setAddressFrozen(bobWallet.address, true);
      const success = await utilityChecker.testTransfer(token.target, aliceWallet.address, bobWallet.address, 100);
      expect(success).to.be.equal(false);
    });
  });

  describe('When unfrozen balance is unsufficient', () => {
    it('should return false', async () => {
      const {
        suite: { token },
        accounts: { tokenAgent, aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);

      const utilityChecker = await ethers.deployContract('UtilityChecker');

      const initialBalance = await token.balanceOf(aliceWallet.address);
      await token.connect(tokenAgent).freezePartialTokens(aliceWallet.address, initialBalance - 10n);
      const success = await utilityChecker.testTransfer(token.target, aliceWallet.address, bobWallet.address, 100);
      expect(success).to.be.equal(false);
    });
  });

  describe('When nominal case', () => {
    it('should return true', async () => {
      const {
        suite: { token, identityRegistry },
        accounts: { deployer, tokenAgent, aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);

      await deployComplianceAndCountryAllowModule(token, deployer);
      await identityRegistry.connect(tokenAgent).updateCountry(bobWallet.address, 42);

      const utilityChecker = await ethers.deployContract('UtilityChecker');

      const success = await utilityChecker.testTransfer(token.target, aliceWallet.address, bobWallet.address, 100);
      expect(success).to.be.equal(true);
    });
  });

  describe('When the identity is registered with topics', () => {
    it('should return false', async () => {
      const {
        suite: { identityRegistry, token },
        accounts: { deployer, tokenAgent, aliceWallet, bobWallet, charlieWallet },
        identities: { charlieIdentity },
      } = await loadFixture(deployFullSuiteFixture);

      await identityRegistry.connect(tokenAgent).registerIdentity(charlieWallet.address, charlieIdentity.target, 0);

      await deployComplianceAndCountryAllowModule(token, deployer);

      const utilityChecker = await ethers.deployContract('UtilityChecker');
      const success = await utilityChecker.testTransfer(token.target, aliceWallet.address, bobWallet.address, 100);
      expect(success).to.be.equal(false);
    });
  });

  describe('when the identity is registered without topics', () => {
    it('should return false', async () => {
      const {
        suite: { identityRegistry, claimTopicsRegistry, token },
        accounts: { deployer, tokenAgent, aliceWallet, bobWallet, charlieWallet },
        identities: { charlieIdentity },
      } = await loadFixture(deployFullSuiteFixture);

      await deployComplianceAndCountryAllowModule(token, deployer);

      await identityRegistry.connect(tokenAgent).registerIdentity(charlieWallet.address, charlieIdentity.target, 0);
      const topics = await claimTopicsRegistry.getClaimTopics();
      await Promise.all(topics.map((topic) => claimTopicsRegistry.removeClaimTopic(topic)));

      const utilityChecker = await ethers.deployContract('UtilityChecker');
      const success = await utilityChecker.testTransfer(token.target, aliceWallet.address, bobWallet.address, 100);
      expect(success).to.be.equal(false);
    });
  });

  describe('After fixture', () => {
    it('should return true ', async () => {
      const {
        suite: { token, identityRegistry },
        accounts: { deployer, tokenAgent, aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);

      await deployComplianceAndCountryAllowModule(token, deployer);
      await identityRegistry.connect(tokenAgent).updateCountry(bobWallet.address, 42);

      const utilityChecker = await ethers.deployContract('UtilityChecker');
      const success = await utilityChecker.testTransfer(token.target, aliceWallet.address, bobWallet.address, 100);
      expect(success).to.be.equal(true);
    });
  });

  describe('when multiple issuers and topics', () => {
    it('should return true', async () => {
      const {
        suite: { claimTopicsRegistry, trustedIssuersRegistry, identityRegistry, token },
        accounts: { deployer, tokenAgent, aliceWallet, bobWallet },
        identities: { aliceIdentity },
      } = await loadFixture(deployFullSuiteFixture);

      await deployComplianceAndCountryAllowModule(token, deployer);
      await identityRegistry.connect(tokenAgent).updateCountry(bobWallet.address, 42);

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

      const utilityChecker = await ethers.deployContract('UtilityChecker');
      const success = await utilityChecker.testTransfer(token.target, aliceWallet.address, bobWallet.address, 100);
      expect(success).to.be.equal(true);
    });
  });
});
