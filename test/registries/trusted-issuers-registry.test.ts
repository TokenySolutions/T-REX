import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { deployFullSuiteFixture } from '../fixtures/deploy-full-suite.fixture';

describe('TrustedIssuersRegistry', () => {
  describe('.addTrustedIssuer()', () => {
    describe('when sender is not the owner', () => {
      it('should revert', async () => {
        const {
          suite: { trustedIssuersRegistry },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(trustedIssuersRegistry.connect(anotherWallet).addTrustedIssuer(anotherWallet.address, [10])).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when sender is the owner', () => {
      describe('when issuer to add is zero address', () => {
        it('should revert', async () => {
          const {
            suite: { trustedIssuersRegistry },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(trustedIssuersRegistry.connect(deployer).addTrustedIssuer(ethers.constants.AddressZero, [10])).to.be.revertedWith(
            'invalid argument - zero address',
          );
        });
      });

      describe('when issuer is already registered', () => {
        it('should revert', async () => {
          const {
            suite: { trustedIssuersRegistry, claimIssuerContract },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          const claimTopics = await trustedIssuersRegistry.getTrustedIssuerClaimTopics(claimIssuerContract.address);

          await expect(trustedIssuersRegistry.connect(deployer).addTrustedIssuer(claimIssuerContract.address, claimTopics)).to.be.revertedWith(
            'trusted Issuer already exists',
          );
        });
      });

      describe('when claim topics array is empty', () => {
        it('should revert', async () => {
          const {
            suite: { trustedIssuersRegistry },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(trustedIssuersRegistry.connect(deployer).addTrustedIssuer(deployer.address, [])).to.be.revertedWith(
            'trusted claim topics cannot be empty',
          );
        });
      });

      describe('when claim topics array exceeds 15 topics', () => {
        it('should revert', async () => {
          const {
            suite: { trustedIssuersRegistry },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          const claimTopics = Array.from({ length: 16 }, (_, i) => i);

          await expect(trustedIssuersRegistry.connect(deployer).addTrustedIssuer(deployer.address, claimTopics)).to.be.revertedWith(
            'cannot have more than 15 claim topics',
          );
        });
      });

      describe('when there are already 49 trusted issuers', () => {
        it('should revert', async () => {
          const {
            suite: { trustedIssuersRegistry },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          const claimTopics = [10];

          await Promise.all(
            Array.from({ length: 49 }).map(() => {
              const wallet = ethers.Wallet.createRandom();
              return trustedIssuersRegistry.connect(deployer).addTrustedIssuer(wallet.address, claimTopics);
            }),
          );

          await expect(trustedIssuersRegistry.connect(deployer).addTrustedIssuer(deployer.address, claimTopics)).to.be.revertedWith(
            'cannot have more than 50 trusted issuers',
          );
        });
      });
    });
  });

  describe('.removeTrustedIssuer()', () => {
    describe('when sender is not the owner', () => {
      it('should revert', async () => {
        const {
          suite: { trustedIssuersRegistry },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(trustedIssuersRegistry.connect(anotherWallet).removeTrustedIssuer(anotherWallet.address)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when sender is the owner', () => {
      describe('when issuer to remove is zero address', () => {
        it('should revert', async () => {
          const {
            suite: { trustedIssuersRegistry },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(trustedIssuersRegistry.connect(deployer).removeTrustedIssuer(ethers.constants.AddressZero)).to.be.revertedWith(
            'invalid argument - zero address',
          );
        });
      });

      describe('when issuer is not registered', () => {
        it('should revert', async () => {
          const {
            suite: { trustedIssuersRegistry },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(trustedIssuersRegistry.connect(deployer).removeTrustedIssuer(deployer.address)).to.be.revertedWith('NOT a trusted issuer');
        });
      });

      describe('when issuer is registered', () => {
        it('should remove the issuer from trusted list', async () => {
          const {
            suite: { trustedIssuersRegistry, claimIssuerContract },
            accounts: { deployer, anotherWallet, charlieWallet, bobWallet },
          } = await loadFixture(deployFullSuiteFixture);

          await trustedIssuersRegistry.addTrustedIssuer(bobWallet.address, [66, 100, 10]);
          await trustedIssuersRegistry.addTrustedIssuer(anotherWallet.address, [10, 42]);
          await trustedIssuersRegistry.addTrustedIssuer(charlieWallet.address, [42, 66, 10]);

          await expect(trustedIssuersRegistry.isTrustedIssuer(anotherWallet.address)).to.eventually.be.true;

          const tx = await trustedIssuersRegistry.connect(deployer).removeTrustedIssuer(anotherWallet.address);
          await expect(tx).to.emit(trustedIssuersRegistry, 'TrustedIssuerRemoved').withArgs(anotherWallet.address);

          await expect(trustedIssuersRegistry.isTrustedIssuer(anotherWallet.address)).to.eventually.be.false;
          await expect(trustedIssuersRegistry.getTrustedIssuers()).to.eventually.deep.eq([
            claimIssuerContract.address,
            bobWallet.address,
            charlieWallet.address,
          ]);
        });
      });
    });
  });

  describe('.updateIssuerClaimTopics()', () => {
    describe('when sender is not the owner', () => {
      it('should revert', async () => {
        const {
          suite: { trustedIssuersRegistry },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(trustedIssuersRegistry.connect(anotherWallet).updateIssuerClaimTopics(anotherWallet.address, [10])).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when sender is the owner', () => {
      describe('when issuer to update is zero address', () => {
        it('should revert', async () => {
          const {
            suite: { trustedIssuersRegistry },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(trustedIssuersRegistry.connect(deployer).updateIssuerClaimTopics(ethers.constants.AddressZero, [10])).to.be.revertedWith(
            'invalid argument - zero address',
          );
        });
      });

      describe('when issuer is not registered', () => {
        it('should revert', async () => {
          const {
            suite: { trustedIssuersRegistry },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(trustedIssuersRegistry.connect(deployer).updateIssuerClaimTopics(deployer.address, [10])).to.be.revertedWith(
            'NOT a trusted issuer',
          );
        });
      });

      describe('when claim topics array have more that 15 elements', () => {
        it('should revert', async () => {
          const {
            suite: { trustedIssuersRegistry, claimIssuerContract },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          const claimTopics = Array.from({ length: 16 }, (_, i) => i);

          await expect(trustedIssuersRegistry.connect(deployer).updateIssuerClaimTopics(claimIssuerContract.address, claimTopics)).to.be.revertedWith(
            'cannot have more than 15 claim topics',
          );
        });
      });

      describe('when claim topics array is empty', () => {
        it('should revert', async () => {
          const {
            suite: { trustedIssuersRegistry, claimIssuerContract },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(trustedIssuersRegistry.connect(deployer).updateIssuerClaimTopics(claimIssuerContract.address, [])).to.be.revertedWith(
            'claim topics cannot be empty',
          );
        });
      });

      describe('when issuer is registered', () => {
        it('should update the topics of the trusted issuers', async () => {
          const {
            suite: { trustedIssuersRegistry, claimIssuerContract },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          const claimTopics = await trustedIssuersRegistry.getTrustedIssuerClaimTopics(claimIssuerContract.address);

          const tx = await trustedIssuersRegistry.connect(deployer).updateIssuerClaimTopics(claimIssuerContract.address, [66, 100]);
          await expect(tx).to.emit(trustedIssuersRegistry, 'ClaimTopicsUpdated').withArgs(claimIssuerContract.address, [66, 100]);

          await expect(trustedIssuersRegistry.hasClaimTopic(claimIssuerContract.address, 66)).to.eventually.be.true;
          await expect(trustedIssuersRegistry.hasClaimTopic(claimIssuerContract.address, 100)).to.eventually.be.true;
          await expect(trustedIssuersRegistry.hasClaimTopic(claimIssuerContract.address, claimTopics[0])).to.eventually.be.false;
          await expect(trustedIssuersRegistry.getTrustedIssuerClaimTopics(claimIssuerContract.address)).to.eventually.deep.eq([66, 100]);
        });
      });
    });
  });

  describe('.getTrustedIssuerClaimTopics()', () => {
    describe('when issuer is not registered', () => {
      it('should revert', async () => {
        const {
          suite: { trustedIssuersRegistry },
          accounts: { deployer },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(trustedIssuersRegistry.connect(deployer).getTrustedIssuerClaimTopics(deployer.address)).to.be.revertedWith(
          "trusted Issuer doesn't exist",
        );
      });
    });
  });
});
