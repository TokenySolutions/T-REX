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

          await expect(trustedIssuersRegistry.connect(deployer).addTrustedIssuer(ethers.ZeroAddress, [10])).to.be.revertedWithCustomError(
            trustedIssuersRegistry,
            'ZeroAddress',
          );
        });
      });

      describe('when issuer is already registered', () => {
        it('should revert', async () => {
          const {
            suite: { trustedIssuersRegistry, claimIssuerContract },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          const claimTopics = await trustedIssuersRegistry.getTrustedIssuerClaimTopics(claimIssuerContract.target);

          await expect(
            trustedIssuersRegistry.connect(deployer).addTrustedIssuer(claimIssuerContract.target, Array.from(claimTopics)),
          ).to.be.revertedWithCustomError(trustedIssuersRegistry, 'TrustedIssuerAlreadyExists');
        });
      });

      describe('when claim topics array is empty', () => {
        it('should revert', async () => {
          const {
            suite: { trustedIssuersRegistry },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(trustedIssuersRegistry.connect(deployer).addTrustedIssuer(deployer.address, [])).to.be.revertedWithCustomError(
            trustedIssuersRegistry,
            'TrustedClaimTopicsCannotBeEmpty',
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

          await expect(trustedIssuersRegistry.connect(deployer).addTrustedIssuer(deployer.address, claimTopics)).to.be.revertedWithCustomError(
            trustedIssuersRegistry,
            'MaxClaimTopcisReached',
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

          await expect(trustedIssuersRegistry.connect(deployer).addTrustedIssuer(deployer.address, claimTopics)).to.be.revertedWithCustomError(
            trustedIssuersRegistry,
            'MaxTrustedIssuersReached',
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

          await expect(trustedIssuersRegistry.connect(deployer).removeTrustedIssuer(ethers.ZeroAddress)).to.be.revertedWithCustomError(
            trustedIssuersRegistry,
            'ZeroAddress',
          );
        });
      });

      describe('when issuer is not registered', () => {
        it('should revert', async () => {
          const {
            suite: { trustedIssuersRegistry },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(trustedIssuersRegistry.connect(deployer).removeTrustedIssuer(deployer.address)).to.be.revertedWithCustomError(
            trustedIssuersRegistry,
            'NotATrustedIssuer',
          );
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
            claimIssuerContract.target,
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

          await expect(trustedIssuersRegistry.connect(deployer).updateIssuerClaimTopics(ethers.ZeroAddress, [10])).to.be.revertedWithCustomError(
            trustedIssuersRegistry,
            'ZeroAddress',
          );
        });
      });

      describe('when issuer is not registered', () => {
        it('should revert', async () => {
          const {
            suite: { trustedIssuersRegistry },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(trustedIssuersRegistry.connect(deployer).updateIssuerClaimTopics(deployer.address, [10])).to.be.revertedWithCustomError(
            trustedIssuersRegistry,
            'NotATrustedIssuer',
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

          await expect(
            trustedIssuersRegistry.connect(deployer).updateIssuerClaimTopics(claimIssuerContract.target, claimTopics),
          ).to.be.revertedWithCustomError(trustedIssuersRegistry, 'MaxClaimTopcisReached');
        });
      });

      describe('when claim topics array is empty', () => {
        it('should revert', async () => {
          const {
            suite: { trustedIssuersRegistry, claimIssuerContract },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(
            trustedIssuersRegistry.connect(deployer).updateIssuerClaimTopics(claimIssuerContract.target, []),
          ).to.be.revertedWithCustomError(trustedIssuersRegistry, 'ClaimTopicsCannotBeEmpty');
        });
      });

      describe('when issuer is registered', () => {
        it('should update the topics of the trusted issuers', async () => {
          const {
            suite: { trustedIssuersRegistry, claimIssuerContract },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          const claimTopics = await trustedIssuersRegistry.getTrustedIssuerClaimTopics(claimIssuerContract.target);

          const tx = await trustedIssuersRegistry.connect(deployer).updateIssuerClaimTopics(claimIssuerContract.target, [66, 100]);
          await expect(tx).to.emit(trustedIssuersRegistry, 'ClaimTopicsUpdated').withArgs(claimIssuerContract.target, [66, 100]);

          await expect(trustedIssuersRegistry.hasClaimTopic(claimIssuerContract.target, 66)).to.eventually.be.true;
          await expect(trustedIssuersRegistry.hasClaimTopic(claimIssuerContract.target, 100)).to.eventually.be.true;
          await expect(trustedIssuersRegistry.hasClaimTopic(claimIssuerContract.target, claimTopics[0])).to.eventually.be.false;
          await expect(trustedIssuersRegistry.getTrustedIssuerClaimTopics(claimIssuerContract.target)).to.eventually.deep.eq([66, 100]);
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

        await expect(trustedIssuersRegistry.connect(deployer).getTrustedIssuerClaimTopics(deployer.address)).to.be.revertedWithCustomError(
          trustedIssuersRegistry,
          'TrustedIssuerDoesNotExist',
        );
      });
    });
  });
  describe('.supportsInterface()', () => {
    it('should return false for unsupported interfaces', async () => {
      const {
        suite: { trustedIssuersRegistry },
      } = await loadFixture(deployFullSuiteFixture);

      const unsupportedInterfaceId = '0x12345678';
      expect(await trustedIssuersRegistry.supportsInterface(unsupportedInterfaceId)).to.equal(false);
    });

    it('should correctly identify the IERC3643TrustedIssuersRegistry interface ID', async () => {
      const {
        suite: { trustedIssuersRegistry },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const iTrustedIssuersRegistryInterfaceId = await interfaceIdCalculator.getIERC3643TrustedIssuersRegistryInterfaceId();
      expect(await trustedIssuersRegistry.supportsInterface(iTrustedIssuersRegistryInterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC173 interface ID', async () => {
      const {
        suite: { trustedIssuersRegistry },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc173InterfaceId = await interfaceIdCalculator.getIERC173InterfaceId();
      expect(await trustedIssuersRegistry.supportsInterface(ierc173InterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC165 interface ID', async () => {
      const {
        suite: { trustedIssuersRegistry },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc165InterfaceId = await interfaceIdCalculator.getIERC165InterfaceId();
      expect(await trustedIssuersRegistry.supportsInterface(ierc165InterfaceId)).to.equal(true);
    });
  });
});
