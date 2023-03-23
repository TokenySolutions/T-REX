import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { deployFullSuiteFixture } from '../fixtures/deploy-full-suite.fixture';

describe('IdentityRegistry', () => {
  describe('.updateIdentity()', () => {
    describe('when sender is not an agent', () => {
      it('should revert', async () => {
        const {
          suite: { identityRegistry },
          accounts: { anotherWallet },
          identities: { bobIdentity, charlieIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistry.connect(anotherWallet).updateIdentity(bobIdentity.address, charlieIdentity.address)).to.be.revertedWith(
          'AgentRole: caller does not have the Agent role',
        );
      });
    });
  });

  describe('.updateCountry()', () => {
    describe('when sender is not an agent', () => {
      it('should revert', async () => {
        const {
          suite: { identityRegistry },
          accounts: { anotherWallet },
          identities: { bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistry.connect(anotherWallet).updateCountry(bobIdentity.address, 100)).to.be.revertedWith(
          'AgentRole: caller does not have the Agent role',
        );
      });
    });
  });

  describe('.deleteIdentity()', () => {
    describe('when sender is not an agent', () => {
      it('should revert', async () => {
        const {
          suite: { identityRegistry },
          accounts: { anotherWallet, bobWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistry.connect(anotherWallet).deleteIdentity(bobWallet.address)).to.be.revertedWith(
          'AgentRole: caller does not have the Agent role',
        );
      });
    });
  });

  describe('.registerIdentity()', () => {
    describe('when sender is not an agent', () => {
      it('should revert', async () => {
        const {
          suite: { identityRegistry },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          identityRegistry.connect(anotherWallet).registerIdentity(ethers.constants.AddressZero, ethers.constants.AddressZero, 0),
        ).to.be.revertedWith('AgentRole: caller does not have the Agent role');
      });
    });
  });

  describe('.setIdentityRegistryStorage()', () => {
    describe('when sender is not the owner', () => {
      it('should revert', async () => {
        const {
          suite: { identityRegistry },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistry.connect(anotherWallet).setIdentityRegistryStorage(ethers.constants.AddressZero)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when sender is the owner', () => {
      it('should set the identity registry storage', async () => {
        const {
          suite: { identityRegistry },
          accounts: { deployer },
        } = await loadFixture(deployFullSuiteFixture);

        const tx = await identityRegistry.connect(deployer).setIdentityRegistryStorage(ethers.constants.AddressZero);
        await expect(tx).to.emit(identityRegistry, 'IdentityStorageSet').withArgs(ethers.constants.AddressZero);
        expect(await identityRegistry.identityStorage()).to.be.equal(ethers.constants.AddressZero);
      });
    });
  });

  describe('.setClaimTopicsRegistry()', () => {
    describe('when sender is not the owner', () => {
      it('should revert', async () => {
        const {
          suite: { identityRegistry },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistry.connect(anotherWallet).setClaimTopicsRegistry(ethers.constants.AddressZero)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when sender is the owner', () => {
      it('should set the claim topics registry', async () => {
        const {
          suite: { identityRegistry },
          accounts: { deployer },
        } = await loadFixture(deployFullSuiteFixture);

        const tx = await identityRegistry.connect(deployer).setClaimTopicsRegistry(ethers.constants.AddressZero);
        await expect(tx).to.emit(identityRegistry, 'ClaimTopicsRegistrySet').withArgs(ethers.constants.AddressZero);
        expect(await identityRegistry.topicsRegistry()).to.be.equal(ethers.constants.AddressZero);
      });
    });
  });

  describe('.setTrustedIssuersRegistry()', () => {
    describe('when sender is not the owner', () => {
      it('should revert', async () => {
        const {
          suite: { identityRegistry },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistry.connect(anotherWallet).setTrustedIssuersRegistry(ethers.constants.AddressZero)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when sender is the owner', () => {
      it('should set the trusted issuers registry', async () => {
        const {
          suite: { identityRegistry },
          accounts: { deployer },
        } = await loadFixture(deployFullSuiteFixture);

        const tx = await identityRegistry.connect(deployer).setTrustedIssuersRegistry(ethers.constants.AddressZero);
        await expect(tx).to.emit(identityRegistry, 'TrustedIssuersRegistrySet').withArgs(ethers.constants.AddressZero);
        expect(await identityRegistry.issuersRegistry()).to.be.equal(ethers.constants.AddressZero);
      });
    });
  });

  describe('.isVerified()', () => {
    describe('when there are no require claim topics', () => {
      it('should return true when the identity is registered', async () => {
        const {
          suite: { identityRegistry, claimTopicsRegistry },
          accounts: { tokenAgent, charlieWallet },
          identities: { charlieIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await identityRegistry.connect(tokenAgent).registerIdentity(charlieWallet.address, charlieIdentity.address, 0);

        await expect(identityRegistry.isVerified(charlieWallet.address)).to.eventually.be.false;

        const topics = await claimTopicsRegistry.getClaimTopics();
        await Promise.all(topics.map((topic) => claimTopicsRegistry.removeClaimTopic(topic)));

        await expect(identityRegistry.isVerified(charlieWallet.address)).to.eventually.be.true;
      });
    });

    describe('when claim topics are required but there are not trusted issuers for them', () => {
      it('should return false', async () => {
        const {
          suite: { identityRegistry, claimTopicsRegistry, trustedIssuersRegistry },
          accounts: { aliceWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistry.isVerified(aliceWallet.address)).to.eventually.be.true;

        const topics = await claimTopicsRegistry.getClaimTopics();
        const trustedIssuers = await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(topics[0]);
        await Promise.all(trustedIssuers.map((issuer) => trustedIssuersRegistry.removeTrustedIssuer(issuer)));

        await expect(identityRegistry.isVerified(aliceWallet.address)).to.eventually.be.false;
      });
    });

    describe('when the only claim required was revoked', () => {
      it('should return false', async () => {
        const {
          suite: { identityRegistry, claimTopicsRegistry, claimIssuerContract },
          accounts: { aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistry.isVerified(aliceWallet.address)).to.eventually.be.true;

        const topics = await claimTopicsRegistry.getClaimTopics();
        const claimIds = await aliceIdentity.getClaimIdsByTopic(topics[0]);
        const claim = await aliceIdentity.getClaim(claimIds[0]);

        await claimIssuerContract.revokeClaimBySignature(claim.signature);

        await expect(identityRegistry.isVerified(aliceWallet.address)).to.eventually.be.false;
      });
    });
  });
});
