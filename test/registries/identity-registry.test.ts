import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { deployFullSuiteFixture } from '../fixtures/deploy-full-suite.fixture';

describe('IdentityRegistry', () => {
  describe('.init()', () => {
    it('should prevent re-initialization', async () => {
      const {
        suite: { identityRegistry },
        accounts: { deployer },
      } = await loadFixture(deployFullSuiteFixture);

      await expect(identityRegistry.connect(deployer).init(ethers.ZeroAddress, ethers.ZeroAddress, ethers.ZeroAddress)).to.be.revertedWith(
        'Initializable: contract is already initialized',
      );
    });

    it('should reject zero address for Trusted Issuers Registry', async () => {
      const identityRegistry = await ethers.deployContract('IdentityRegistry');
      const address = ethers.Wallet.createRandom().address;
      await expect(identityRegistry.init(ethers.ZeroAddress, address, address)).to.be.revertedWithCustomError(identityRegistry, 'ZeroAddress');
    });

    it('should reject zero address for Claim Topics Registry', async () => {
      const identityRegistry = await ethers.deployContract('IdentityRegistry');
      const address = ethers.Wallet.createRandom().address;
      await expect(identityRegistry.init(address, ethers.ZeroAddress, address)).to.be.revertedWithCustomError(identityRegistry, 'ZeroAddress');
    });

    it('should reject zero address for Identity Storage', async () => {
      const identityRegistry = await ethers.deployContract('IdentityRegistry');
      const address = ethers.Wallet.createRandom().address;
      await expect(identityRegistry.init(address, address, ethers.ZeroAddress)).to.be.revertedWithCustomError(identityRegistry, 'ZeroAddress');
    });
  });

  describe('.updateIdentity()', () => {
    describe('when sender is not an agent', () => {
      it('should revert', async () => {
        const {
          suite: { identityRegistry },
          accounts: { anotherWallet },
          identities: { bobIdentity, charlieIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          identityRegistry.connect(anotherWallet).updateIdentity(bobIdentity.target, charlieIdentity.target),
        ).to.be.revertedWithCustomError(identityRegistry, 'CallerDoesNotHaveAgentRole');
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

        await expect(identityRegistry.connect(anotherWallet).updateCountry(bobIdentity.target, 100)).to.be.revertedWithCustomError(
          identityRegistry,
          'CallerDoesNotHaveAgentRole',
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

        await expect(identityRegistry.connect(anotherWallet).deleteIdentity(bobWallet.address)).to.be.revertedWithCustomError(
          identityRegistry,
          'CallerDoesNotHaveAgentRole',
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
          identityRegistry.connect(anotherWallet).registerIdentity(ethers.ZeroAddress, ethers.ZeroAddress, 0),
        ).to.be.revertedWithCustomError(identityRegistry, 'CallerDoesNotHaveAgentRole');
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

        await expect(identityRegistry.connect(anotherWallet).setIdentityRegistryStorage(ethers.ZeroAddress)).to.be.revertedWith(
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

        const tx = await identityRegistry.connect(deployer).setIdentityRegistryStorage(ethers.ZeroAddress);
        await expect(tx).to.emit(identityRegistry, 'IdentityStorageSet').withArgs(ethers.ZeroAddress);
        expect(await identityRegistry.identityStorage()).to.be.equal(ethers.ZeroAddress);
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

        await expect(identityRegistry.connect(anotherWallet).setClaimTopicsRegistry(ethers.ZeroAddress)).to.be.revertedWith(
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

        const tx = await identityRegistry.connect(deployer).setClaimTopicsRegistry(ethers.ZeroAddress);
        await expect(tx).to.emit(identityRegistry, 'ClaimTopicsRegistrySet').withArgs(ethers.ZeroAddress);
        expect(await identityRegistry.topicsRegistry()).to.be.equal(ethers.ZeroAddress);
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

        await expect(identityRegistry.connect(anotherWallet).setTrustedIssuersRegistry(ethers.ZeroAddress)).to.be.revertedWith(
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

        const tx = await identityRegistry.connect(deployer).setTrustedIssuersRegistry(ethers.ZeroAddress);
        await expect(tx).to.emit(identityRegistry, 'TrustedIssuersRegistrySet').withArgs(ethers.ZeroAddress);
        expect(await identityRegistry.issuersRegistry()).to.be.equal(ethers.ZeroAddress);
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

        await identityRegistry.connect(tokenAgent).registerIdentity(charlieWallet.address, charlieIdentity.target, 0);

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

    describe('when the claim issuer throws an error', () => {
      it('should return true if there is another valid claim', async () => {
        const {
          suite: { identityRegistry, claimTopicsRegistry, trustedIssuersRegistry, claimIssuerContract },
          accounts: { aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        const trickyClaimIssuer = await ethers.deployContract('ClaimIssuerTrick');
        const claimTopics = await claimTopicsRegistry.getClaimTopics();
        await trustedIssuersRegistry.removeTrustedIssuer(claimIssuerContract.target);
        await trustedIssuersRegistry.addTrustedIssuer(trickyClaimIssuer.target, Array.from(claimTopics));
        await trustedIssuersRegistry.addTrustedIssuer(claimIssuerContract.target, Array.from(claimTopics));
        const claimIds = await aliceIdentity.getClaimIdsByTopic(claimTopics[0]);
        const claim = await aliceIdentity.getClaim(claimIds[0]);
        await aliceIdentity.connect(aliceWallet).removeClaim(claimIds[0]);
        await aliceIdentity.connect(aliceWallet).addClaim(claimTopics[0], 1, trickyClaimIssuer.target, '0x00', '0x00', '');
        await aliceIdentity.connect(aliceWallet).addClaim(claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);

        await expect(identityRegistry.isVerified(aliceWallet.address)).to.eventually.be.true;
      });

      it('should return false if there are no other valid claim', async () => {
        const {
          suite: { identityRegistry, claimTopicsRegistry, trustedIssuersRegistry },
          accounts: { aliceWallet },
          identities: { aliceIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        const trickyClaimIssuer = await ethers.deployContract('ClaimIssuerTrick');
        const claimTopics = await claimTopicsRegistry.getClaimTopics();
        await trustedIssuersRegistry.addTrustedIssuer(trickyClaimIssuer.target, Array.from(claimTopics));
        const claimIds = await aliceIdentity.getClaimIdsByTopic(claimTopics[0]);
        await aliceIdentity.connect(aliceWallet).removeClaim(claimIds[0]);
        await aliceIdentity.connect(aliceWallet).addClaim(claimTopics[0], 1, trickyClaimIssuer.target, '0x00', '0x00', '');

        await expect(identityRegistry.isVerified(aliceWallet.address)).to.eventually.be.false;
      });
    });
  });
  describe('.disableEligibilityChecks()', () => {
    describe('when called by a non-owner', () => {
      it('should revert with Ownable: caller is not the owner', async () => {
        const {
          suite: { identityRegistry },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistry.connect(anotherWallet).disableEligibilityChecks()).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });
    describe('when called by the owner', () => {
      it('should disable eligibility checks and allow all addresses to be verified', async () => {
        const {
          suite: { identityRegistry },
          accounts: { deployer, aliceWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistry.connect(deployer).disableEligibilityChecks()).to.emit(identityRegistry, 'EligibilityChecksDisabled');

        await expect(identityRegistry.isVerified(aliceWallet.address)).to.eventually.be.true;
      });
    });

    describe('when eligibility checks are already disabled', () => {
      it('should revert with EligibilityChecksDisabledAlready', async () => {
        const {
          suite: { identityRegistry },
          accounts: { deployer },
        } = await loadFixture(deployFullSuiteFixture);

        await identityRegistry.connect(deployer).disableEligibilityChecks();

        await expect(identityRegistry.connect(deployer).disableEligibilityChecks()).to.be.revertedWithCustomError(
          identityRegistry,
          'EligibilityChecksDisabledAlready',
        );
      });
    });
  });
  describe('.enableEligibilityChecks()', () => {
    describe('when called by a non-owner', () => {
      it('should revert with Ownable: caller is not the owner', async () => {
        const {
          suite: { identityRegistry },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistry.connect(anotherWallet).enableEligibilityChecks()).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });
    describe('when called by the owner after disabling', () => {
      it('should re-enable eligibility checks and enforce normal verification', async () => {
        const {
          suite: { identityRegistry },
          accounts: { deployer, anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await identityRegistry.connect(deployer).disableEligibilityChecks();
        await expect(identityRegistry.isVerified(anotherWallet.address)).to.eventually.be.true;

        await expect(identityRegistry.connect(deployer).enableEligibilityChecks()).to.emit(identityRegistry, 'EligibilityChecksEnabled');

        await expect(identityRegistry.isVerified(anotherWallet.address)).to.eventually.be.false;
      });
    });

    describe('when eligibility checks are already enabled', () => {
      it('should revert with EligibilityChecksEnabledAlready', async () => {
        const {
          suite: { identityRegistry },
          accounts: { deployer },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistry.connect(deployer).enableEligibilityChecks()).to.be.revertedWithCustomError(
          identityRegistry,
          'EligibilityChecksEnabledAlready',
        );
      });
    });
  });

  describe('.isVerified()', () => {
    describe('when eligibility checks are disabled', () => {
      it('should return true for any address', async () => {
        const {
          suite: { identityRegistry },
          accounts: { deployer, charlieWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await identityRegistry.connect(deployer).disableEligibilityChecks();
        await expect(identityRegistry.isVerified(charlieWallet.address)).to.eventually.be.true;
      });
    });

    describe('when eligibility checks are re-enabled', () => {
      it('should resume normal eligibility checks', async () => {
        const {
          suite: { identityRegistry, claimTopicsRegistry },
          accounts: { deployer, charlieWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await identityRegistry.connect(deployer).disableEligibilityChecks();
        await expect(identityRegistry.isVerified(charlieWallet.address)).to.eventually.be.true;

        await identityRegistry.connect(deployer).enableEligibilityChecks();

        const topics = await claimTopicsRegistry.getClaimTopics();
        if (topics.length > 0) {
          await expect(identityRegistry.isVerified(charlieWallet.address)).to.eventually.be.false;
        } else {
          await expect(identityRegistry.isVerified(charlieWallet.address)).to.eventually.be.true;
        }
      });
    });
  });
  describe('.supportsInterface()', () => {
    it('should return false for unsupported interfaces', async () => {
      const {
        suite: { identityRegistry },
      } = await loadFixture(deployFullSuiteFixture);

      const unsupportedInterfaceId = '0x12345678';
      expect(await identityRegistry.supportsInterface(unsupportedInterfaceId)).to.equal(false);
    });

    it('should correctly identify the IIdentityRegistry interface ID', async () => {
      const {
        suite: { identityRegistry },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const iIdentityRegistryInterfaceId = await interfaceIdCalculator.getIIdentityRegistryInterfaceId();
      expect(await identityRegistry.supportsInterface(iIdentityRegistryInterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC173 interface ID', async () => {
      const {
        suite: { identityRegistry },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc173InterfaceId = await interfaceIdCalculator.getIERC173InterfaceId();
      expect(await identityRegistry.supportsInterface(ierc173InterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC165 interface ID', async () => {
      const {
        suite: { identityRegistry },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc165InterfaceId = await interfaceIdCalculator.getIERC165InterfaceId();
      expect(await identityRegistry.supportsInterface(ierc165InterfaceId)).to.equal(true);
    });
  });
});
