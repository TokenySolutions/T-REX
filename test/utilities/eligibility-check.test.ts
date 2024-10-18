import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { deployClaimIssuer, deployFullSuiteFixture } from '../fixtures/deploy-full-suite.fixture';

async function addClaim(claimIssuerContract, claimIssuerSigningKey, claimTopic, wallet, identity) {
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

describe('UtilityChecker.testVerifiedDetails', () => {
  it('should return false when the identity is registered with topics', async () => {
    const {
      suite: { identityRegistry, token },
      accounts: { tokenAgent, charlieWallet },
      identities: { charlieIdentity },
    } = await loadFixture(deployFullSuiteFixture);

    await identityRegistry.connect(tokenAgent).registerIdentity(charlieWallet.address, charlieIdentity.target, 0);

    const eligibilityChecker = await ethers.deployContract('UtilityChecker');
    const results = await eligibilityChecker.testVerifiedDetails(token.target, charlieWallet.address);
    expect(results.length).to.be.equal(1);
    const result = results[0];
    expect(result[0]).to.be.equal(ethers.ZeroAddress);
    expect(result[1]).to.be.equal(0);
    expect(result[2]).to.be.equal(false);
  });

  it('should return empty result when the identity is registered without topics', async () => {
    const {
      suite: { identityRegistry, claimTopicsRegistry, token },
      accounts: { tokenAgent, charlieWallet },
      identities: { charlieIdentity },
    } = await loadFixture(deployFullSuiteFixture);

    await identityRegistry.connect(tokenAgent).registerIdentity(charlieWallet.address, charlieIdentity.target, 0);
    const topics = await claimTopicsRegistry.getClaimTopics();
    await Promise.all(topics.map((topic) => claimTopicsRegistry.removeClaimTopic(topic)));

    const eligibilityChecker = await ethers.deployContract('UtilityChecker');
    const results = await eligibilityChecker.testVerifiedDetails(token.target, charlieWallet.address);
    expect(results.length).to.be.equal(0);
  });

  it('should return true after fixture', async () => {
    const {
      suite: { token, claimTopicsRegistry, trustedIssuersRegistry },
      accounts: { aliceWallet },
    } = await loadFixture(deployFullSuiteFixture);

    const eligibilityChecker = await ethers.deployContract('UtilityChecker');
    const results = await eligibilityChecker.testVerifiedDetails(token.target, aliceWallet.address);
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
      suite: { token, claimTopicsRegistry, trustedIssuersRegistry },
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
    const results = await eligibilityChecker.testVerifiedDetails(token.target, aliceWallet.address);

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
