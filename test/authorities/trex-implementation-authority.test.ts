import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { deployFullSuiteFixture } from '../fixtures/deploy-full-suite.fixture';

describe('TrexImplementationAuthority', () => {
  describe('.setTREXFactory()', () => {
    describe('When not called by the owner', () => {
      it('Should revert', async () => {
        const {
          authorities: { trexImplementationAuthority },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(trexImplementationAuthority.connect(anotherWallet).setTREXFactory(ethers.ZeroAddress)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('When called by the owner', () => {
      describe('When the authority has reference status true', () => {
        describe('When the trex factory to add is not using this authority contract', () => {
          it('Should revert for invalid link between the factory and the authority', async () => {
            const {
              accounts: { deployer },
              authorities: { trexImplementationAuthority },
              factories: { identityFactory },
              implementations,
            } = await loadFixture(deployFullSuiteFixture);

            const otherTrexImplementationAuthority = await ethers.deployContract(
              'TREXImplementationAuthority',
              [true, ethers.ZeroAddress, ethers.ZeroAddress],
              deployer,
            );
            const versionStruct = {
              major: 4,
              minor: 0,
              patch: 0,
            };
            const contractsStruct = {
              tokenImplementation: implementations.tokenImplementation.target,
              ctrImplementation: implementations.claimTopicsRegistryImplementation.target,
              irImplementation: implementations.identityRegistryImplementation.target,
              irsImplementation: implementations.identityRegistryStorageImplementation.target,
              tirImplementation: implementations.trustedIssuersRegistryImplementation.target,
              mcImplementation: implementations.modularComplianceImplementation.target,
            };
            await otherTrexImplementationAuthority.connect(deployer).addAndUseTREXVersion(versionStruct, contractsStruct);

            const trexFactory = await ethers.deployContract(
              'TREXFactory',
              [otherTrexImplementationAuthority.target, identityFactory.target],
              deployer,
            );

            await expect(trexImplementationAuthority.setTREXFactory(trexFactory.target)).to.be.revertedWithCustomError(
              trexImplementationAuthority,
              'OnlyReferenceContractCanCall',
            );
          });
        });

        describe('When the trex factory to add is using this authority contract', () => {
          it('should set the trex factory address', async () => {
            const {
              accounts: { deployer },
              authorities: { trexImplementationAuthority },
              factories: { identityFactory },
            } = await loadFixture(deployFullSuiteFixture);

            const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.target, identityFactory.target], deployer);

            const tx = await trexImplementationAuthority.setTREXFactory(trexFactory.target);
            await expect(tx).to.emit(trexImplementationAuthority, 'TREXFactorySet').withArgs(trexFactory.target);
            await expect(trexImplementationAuthority.getTREXFactory()).to.eventually.equal(trexFactory.target);
          });
        });
      });
    });
  });

  describe('.setIAFactory()', () => {
    describe('When not called by the owner', () => {
      it('Should revert', async () => {
        const {
          authorities: { trexImplementationAuthority },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(trexImplementationAuthority.connect(anotherWallet).setIAFactory(ethers.ZeroAddress)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('When called by the owner', () => {
      describe('When the authority has reference status true', () => {
        describe('When the trex factory to add is using this authority contract', () => {
          it('should set the trex factory address', async () => {
            const {
              accounts: { deployer },
              authorities: { trexImplementationAuthority },
              factories: { identityFactory },
            } = await loadFixture(deployFullSuiteFixture);

            const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.target, identityFactory.target], deployer);
            await trexImplementationAuthority.setTREXFactory(trexFactory.target);

            const implementationAuthorityFactory = await ethers.deployContract(
              'TREXImplementationAuthority',
              [true, ethers.ZeroAddress, ethers.ZeroAddress],
              deployer,
            );

            const tx = await trexImplementationAuthority.setIAFactory(implementationAuthorityFactory.target);
            await expect(tx).to.emit(trexImplementationAuthority, 'IAFactorySet').withArgs(implementationAuthorityFactory.target);
          });
        });
      });
    });
  });

  describe('.fetchVersion()', () => {
    describe('when called on the reference contract', () => {
      it('should revert because the reference contract cannot fetch its own versions', async () => {
        const {
          authorities: { trexImplementationAuthority },
        } = await loadFixture(deployFullSuiteFixture);

        const versionStruct = {
          major: 4,
          minor: 0,
          patch: 0,
        };

        await expect(trexImplementationAuthority.fetchVersion(versionStruct)).to.be.revertedWithCustomError(
          trexImplementationAuthority,
          'CannotCallOnReferenceContract',
        );
      });
    });

    describe('when version were already fetched', () => {
      it('should revert', async () => {
        const {
          accounts: { deployer },
          authorities: { trexImplementationAuthority },
          factories: { identityFactory },
        } = await loadFixture(deployFullSuiteFixture);

        const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.target, identityFactory.target], deployer);

        const otherTrexImplementationAuthority = await ethers.deployContract(
          'TREXImplementationAuthority',
          [false, trexFactory.target, trexImplementationAuthority.target],
          deployer,
        );

        const versionStruct = {
          major: 4,
          minor: 0,
          patch: 0,
        };

        await otherTrexImplementationAuthority.fetchVersion(versionStruct);

        await expect(otherTrexImplementationAuthority.fetchVersion(versionStruct)).to.be.revertedWithCustomError(
          otherTrexImplementationAuthority,
          'VersionAlreadyFetched',
        );
      });
    });

    describe('when version should be setup', () => {
      it('should fetch and set the versions of the implementation from the reference contract', async () => {
        const {
          accounts: { deployer },
          authorities: { trexImplementationAuthority },
          factories: { identityFactory },
        } = await loadFixture(deployFullSuiteFixture);

        const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.target, identityFactory.target], deployer);

        const otherTrexImplementationAuthority = await ethers.deployContract(
          'TREXImplementationAuthority',
          [false, trexFactory.target, trexImplementationAuthority.target],
          deployer,
        );

        const versionStruct = {
          major: 4,
          minor: 0,
          patch: 0,
        };

        const tx = await otherTrexImplementationAuthority.fetchVersion(versionStruct);
        expect(tx).to.emit(otherTrexImplementationAuthority, 'TREXVersionFetched');
      });
    });
  });

  describe('.addTREXVersion()', () => {
    describe('when called not as owner', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          authorities: { trexImplementationAuthority },
          implementations,
        } = await loadFixture(deployFullSuiteFixture);

        const versionStruct = {
          major: 4,
          minor: 0,
          patch: 1,
        };
        const contractsStruct = {
          tokenImplementation: implementations.tokenImplementation.target,
          ctrImplementation: implementations.claimTopicsRegistryImplementation.target,
          irImplementation: implementations.identityRegistryImplementation.target,
          irsImplementation: ethers.ZeroAddress,
          tirImplementation: implementations.trustedIssuersRegistryImplementation.target,
          mcImplementation: implementations.modularComplianceImplementation.target,
        };

        await expect(trexImplementationAuthority.connect(anotherWallet).addTREXVersion(versionStruct, contractsStruct)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when called as owner', () => {
      describe('when called on a non-reference contract', () => {
        it('should revert', async () => {
          const {
            accounts: { deployer },
            authorities: { trexImplementationAuthority },
            factories: { identityFactory },
            implementations,
          } = await loadFixture(deployFullSuiteFixture);

          const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.target, identityFactory.target], deployer);

          const otherTrexImplementationAuthority = await ethers.deployContract(
            'TREXImplementationAuthority',
            [false, trexFactory.target, trexImplementationAuthority.target],
            deployer,
          );

          const versionStruct = {
            major: 4,
            minor: 0,
            patch: 0,
          };
          const contractsStruct = {
            tokenImplementation: implementations.tokenImplementation.target,
            ctrImplementation: implementations.claimTopicsRegistryImplementation.target,
            irImplementation: implementations.identityRegistryImplementation.target,
            irsImplementation: implementations.identityRegistryStorageImplementation.target,
            tirImplementation: implementations.trustedIssuersRegistryImplementation.target,
            mcImplementation: implementations.modularComplianceImplementation.target,
          };

          await expect(otherTrexImplementationAuthority.addTREXVersion(versionStruct, contractsStruct)).to.be.revertedWithCustomError(
            otherTrexImplementationAuthority,
            'OnlyReferenceContractCanCall',
          );
        });
      });

      describe('when called on a reference contract', () => {
        describe('when version were already added', () => {
          it('should revert', async () => {
            const {
              authorities: { trexImplementationAuthority },
              implementations,
            } = await loadFixture(deployFullSuiteFixture);

            const versionStruct = {
              major: 4,
              minor: 0,
              patch: 0,
            };
            const contractsStruct = {
              tokenImplementation: implementations.tokenImplementation.target,
              ctrImplementation: implementations.claimTopicsRegistryImplementation.target,
              irImplementation: implementations.identityRegistryImplementation.target,
              irsImplementation: implementations.identityRegistryStorageImplementation.target,
              tirImplementation: implementations.trustedIssuersRegistryImplementation.target,
              mcImplementation: implementations.modularComplianceImplementation.target,
            };

            await expect(trexImplementationAuthority.addTREXVersion(versionStruct, contractsStruct)).to.be.revertedWithCustomError(
              trexImplementationAuthority,
              'VersionAlreadyExists',
            );
          });
        });

        describe('when a contract implementation address is the zero address', () => {
          it('should revert', async () => {
            const {
              authorities: { trexImplementationAuthority },
              implementations,
            } = await loadFixture(deployFullSuiteFixture);

            const versionStruct = {
              major: 4,
              minor: 0,
              patch: 1,
            };
            const contractsStruct = {
              tokenImplementation: implementations.tokenImplementation.target,
              ctrImplementation: implementations.claimTopicsRegistryImplementation.target,
              irImplementation: implementations.identityRegistryImplementation.target,
              irsImplementation: ethers.ZeroAddress,
              tirImplementation: implementations.trustedIssuersRegistryImplementation.target,
              mcImplementation: implementations.modularComplianceImplementation.target,
            };

            await expect(trexImplementationAuthority.addTREXVersion(versionStruct, contractsStruct)).to.be.revertedWithCustomError(
              trexImplementationAuthority,
              'ZeroAddress',
            );
          });
        });
      });
    });
  });

  describe('.useTREXVersion()', () => {
    describe('when called not as owner', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          authorities: { trexImplementationAuthority },
        } = await loadFixture(deployFullSuiteFixture);

        const versionStruct = {
          major: 4,
          minor: 0,
          patch: 0,
        };

        await expect(trexImplementationAuthority.connect(anotherWallet).useTREXVersion(versionStruct)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when called as owner', () => {
      describe('when version is already in use', () => {
        it('should revert', async () => {
          const {
            authorities: { trexImplementationAuthority },
          } = await loadFixture(deployFullSuiteFixture);

          const versionStruct = {
            major: 4,
            minor: 0,
            patch: 0,
          };

          await expect(trexImplementationAuthority.useTREXVersion(versionStruct)).to.be.revertedWithCustomError(
            trexImplementationAuthority,
            'VersionAlreadyInUse',
          );
        });
      });

      describe('when version does not exist', () => {
        it('should revert', async () => {
          const {
            authorities: { trexImplementationAuthority },
          } = await loadFixture(deployFullSuiteFixture);

          const versionStruct = {
            major: 4,
            minor: 0,
            patch: 1,
          };

          await expect(trexImplementationAuthority.useTREXVersion(versionStruct)).to.be.revertedWithCustomError(
            trexImplementationAuthority,
            'NonExistingVersion',
          );
        });
      });
    });
  });

  describe('.changeImplementationAuthority()', () => {
    describe('when token to update is the zero address', () => {
      it('should revert', async () => {
        const {
          accounts: { anotherWallet },
          authorities: { trexImplementationAuthority },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          trexImplementationAuthority.changeImplementationAuthority(ethers.ZeroAddress, anotherWallet.address),
        ).to.be.revertedWithCustomError(trexImplementationAuthority, 'ZeroAddress');
      });
    });

    describe('whe new authority is the zero address', () => {
      describe('when called on a non-reference authority contract', () => {
        it('should revert', async () => {
          const {
            accounts: { deployer },
            authorities: { trexImplementationAuthority },
            factories: { identityFactory },
            suite: { token },
          } = await loadFixture(deployFullSuiteFixture);

          const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.target, identityFactory.target], deployer);

          const otherTrexImplementationAuthority = await ethers.deployContract(
            'TREXImplementationAuthority',
            [false, trexFactory.target, trexImplementationAuthority.target],
            deployer,
          );

          await expect(
            otherTrexImplementationAuthority.changeImplementationAuthority(token.target, ethers.ZeroAddress),
          ).to.be.revertedWithCustomError(otherTrexImplementationAuthority, 'OnlyReferenceContractCanCall');
        });
      });

      describe('when called on a reference authority contract', () => {
        describe('when caller is not owner of the token (or any contract of the suite)', () => {
          it('should revert', async () => {
            const {
              accounts: { anotherWallet },
              authorities: { trexImplementationAuthority },
              suite: { token },
            } = await loadFixture(deployFullSuiteFixture);

            await expect(
              trexImplementationAuthority.connect(anotherWallet).changeImplementationAuthority(token.target, ethers.ZeroAddress),
            ).to.be.revertedWithCustomError(trexImplementationAuthority, 'CallerNotOwnerOfAllImpactedContracts');
          });
        });

        describe('when caller is owner of every contract of the suite of the token', () => {
          it('should deploy a new authority contract', async () => {
            const {
              accounts: { deployer },
              authorities: { trexImplementationAuthority },
              factories: { identityFactory },
              suite: { token },
            } = await loadFixture(deployFullSuiteFixture);

            const compliance = await ethers.deployContract('ModularComplianceProxy', [trexImplementationAuthority.target], deployer);
            await token.setCompliance(compliance.target);

            const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.target, identityFactory.target], deployer);

            const implementationAuthorityFactory = await ethers.deployContract('IAFactory', [trexFactory.target], deployer);
            await trexImplementationAuthority.setTREXFactory(trexFactory.target);
            await trexImplementationAuthority.setIAFactory(implementationAuthorityFactory.target);

            const tx = await trexImplementationAuthority.changeImplementationAuthority(token.target, ethers.ZeroAddress);
            expect(tx).to.emit(trexImplementationAuthority, 'ImplementationAuthorityChanged');
          });
        });
      });
    });

    describe('when new authority is not the zero address', () => {
      describe('when caller is owner of every contract of the suite of the token', () => {
        describe('when version used by the reference contract is not the same as currently deployed implementations', () => {
          it('should revert', async () => {
            const {
              accounts: { deployer },
              authorities: { trexImplementationAuthority },
              factories: { identityFactory },
              suite: { token },
              implementations,
            } = await loadFixture(deployFullSuiteFixture);

            const compliance = await ethers.deployContract('ModularComplianceProxy', [trexImplementationAuthority.target], deployer);
            await token.setCompliance(compliance.target);

            const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.target, identityFactory.target], deployer);

            const implementationAuthorityFactory = await ethers.deployContract('IAFactory', [trexFactory.target], deployer);
            await trexImplementationAuthority.setTREXFactory(trexFactory.target);
            await trexImplementationAuthority.setIAFactory(implementationAuthorityFactory.target);

            const otherTrexImplementationAuthority = await ethers.deployContract(
              'TREXImplementationAuthority',
              [true, trexFactory.target, trexImplementationAuthority.target],
              deployer,
            );
            await otherTrexImplementationAuthority.addAndUseTREXVersion(
              { major: 4, minor: 0, patch: 1 },
              {
                tokenImplementation: implementations.tokenImplementation.target,
                ctrImplementation: implementations.claimTopicsRegistryImplementation.target,
                irImplementation: implementations.identityRegistryImplementation.target,
                irsImplementation: implementations.identityRegistryStorageImplementation.target,
                tirImplementation: implementations.trustedIssuersRegistryImplementation.target,
                mcImplementation: implementations.modularComplianceImplementation.target,
              },
            );

            await expect(
              trexImplementationAuthority.changeImplementationAuthority(token.target, otherTrexImplementationAuthority.target),
            ).to.be.revertedWithCustomError(trexImplementationAuthority, 'VersionOfNewIAMustBeTheSameAsCurrentIA');
          });
        });

        describe('when the new implementation authority is a reference contract but not the current one', () => {
          it('should revert', async () => {
            const {
              accounts: { deployer },
              authorities: { trexImplementationAuthority },
              factories: { identityFactory },
              suite: { token },
              implementations,
            } = await loadFixture(deployFullSuiteFixture);

            const compliance = await ethers.deployContract('ModularComplianceProxy', [trexImplementationAuthority.target], deployer);
            await token.setCompliance(compliance.target);

            const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.target, identityFactory.target], deployer);

            const implementationAuthorityFactory = await ethers.deployContract('IAFactory', [trexFactory.target], deployer);
            await trexImplementationAuthority.setTREXFactory(trexFactory.target);
            await trexImplementationAuthority.setIAFactory(implementationAuthorityFactory.target);

            const otherTrexImplementationAuthority = await ethers.deployContract(
              'TREXImplementationAuthority',
              [true, trexFactory.target, trexImplementationAuthority.target],
              deployer,
            );
            await otherTrexImplementationAuthority.addAndUseTREXVersion(
              { major: 4, minor: 0, patch: 0 },
              {
                tokenImplementation: implementations.tokenImplementation.target,
                ctrImplementation: implementations.claimTopicsRegistryImplementation.target,
                irImplementation: implementations.identityRegistryImplementation.target,
                irsImplementation: implementations.identityRegistryStorageImplementation.target,
                tirImplementation: implementations.trustedIssuersRegistryImplementation.target,
                mcImplementation: implementations.modularComplianceImplementation.target,
              },
            );

            await expect(
              trexImplementationAuthority.changeImplementationAuthority(token.target, otherTrexImplementationAuthority.target),
            ).to.be.revertedWithCustomError(trexImplementationAuthority, 'NewIAIsNotAReferenceContract');
          });
        });

        describe('when the new implementation authority is not a reference contract and is not valid', () => {
          it('should revert', async () => {
            const {
              accounts: { deployer },
              authorities: { trexImplementationAuthority },
              factories: { identityFactory },
              suite: { token },
            } = await loadFixture(deployFullSuiteFixture);

            const compliance = await ethers.deployContract('ModularComplianceProxy', [trexImplementationAuthority.target], deployer);
            await token.setCompliance(compliance.target);

            const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.target, identityFactory.target], deployer);

            const implementationAuthorityFactory = await ethers.deployContract('IAFactory', [trexFactory.target], deployer);
            await trexImplementationAuthority.setTREXFactory(trexFactory.target);
            await trexImplementationAuthority.setIAFactory(implementationAuthorityFactory.target);

            const otherTrexImplementationAuthority = await ethers.deployContract(
              'TREXImplementationAuthority',
              [false, trexFactory.target, trexImplementationAuthority.target],
              deployer,
            );
            await otherTrexImplementationAuthority.fetchVersion({ major: 4, minor: 0, patch: 0 });
            await otherTrexImplementationAuthority.useTREXVersion({ major: 4, minor: 0, patch: 0 });

            await expect(
              trexImplementationAuthority.changeImplementationAuthority(token.target, otherTrexImplementationAuthority.target),
            ).to.be.revertedWithCustomError(trexImplementationAuthority, 'InvalidImplementationAuthority');
          });
        });
      });
    });
  });
  describe('ERC165 tests', () => {
    describe('TREXImplementationAuthority', () => {
      describe('.supportsInterface()', () => {
        it('should return false for unsupported interfaces', async () => {
          const {
            authorities: { trexImplementationAuthority },
          } = await loadFixture(deployFullSuiteFixture);

          const unsupportedInterfaceId = '0x12345678';
          expect(await trexImplementationAuthority.supportsInterface(unsupportedInterfaceId)).to.equal(false);
        });

        it('should correctly identify the ITREXImplementationAuthority interface ID', async () => {
          const {
            authorities: { trexImplementationAuthority },
          } = await loadFixture(deployFullSuiteFixture);
          const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
          const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

          const iTREXImplementationAuthorityInterfaceId = await interfaceIdCalculator.getITREXImplementationAuthorityInterfaceId();
          expect(await trexImplementationAuthority.supportsInterface(iTREXImplementationAuthorityInterfaceId)).to.equal(true);
        });

        it('should correctly identify the IERC173 interface ID', async () => {
          const {
            authorities: { trexImplementationAuthority },
          } = await loadFixture(deployFullSuiteFixture);
          const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
          const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

          const ierc173InterfaceId = await interfaceIdCalculator.getIERC173InterfaceId();
          expect(await trexImplementationAuthority.supportsInterface(ierc173InterfaceId)).to.equal(true);
        });

        it('should correctly identify the IERC165 interface ID', async () => {
          const {
            authorities: { trexImplementationAuthority },
          } = await loadFixture(deployFullSuiteFixture);
          const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
          const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

          const ierc165InterfaceId = await interfaceIdCalculator.getIERC165InterfaceId();
          expect(await trexImplementationAuthority.supportsInterface(ierc165InterfaceId)).to.equal(true);
        });
      });
    });
    describe('IAFactory', () => {
      describe('.supportsInterface()', () => {
        it('should return false for unsupported interfaces', async () => {
          const {
            accounts: { deployer },
            authorities: { trexImplementationAuthority },
            factories: { identityFactory },
          } = await loadFixture(deployFullSuiteFixture);
          const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.target, identityFactory.target], deployer);
          await trexImplementationAuthority.setTREXFactory(trexFactory.target);

          const iaFactory = await ethers.deployContract('IAFactory', [trexFactory.target], deployer);

          const unsupportedInterfaceId = '0x12345678';
          expect(await iaFactory.supportsInterface(unsupportedInterfaceId)).to.equal(false);
        });

        it('should correctly identify the IIAFactory interface ID', async () => {
          const {
            accounts: { deployer },
            authorities: { trexImplementationAuthority },
            factories: { identityFactory },
          } = await loadFixture(deployFullSuiteFixture);
          const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.target, identityFactory.target], deployer);
          await trexImplementationAuthority.setTREXFactory(trexFactory.target);

          const iaFactory = await ethers.deployContract('IAFactory', [trexFactory.target], deployer);
          const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
          const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

          const iIAFactoryInterfaceId = await interfaceIdCalculator.getIIAFactoryInterfaceId();
          expect(await iaFactory.supportsInterface(iIAFactoryInterfaceId)).to.equal(true);
        });

        it('should correctly identify the IERC165 interface ID', async () => {
          const {
            accounts: { deployer },
            authorities: { trexImplementationAuthority },
            factories: { identityFactory },
          } = await loadFixture(deployFullSuiteFixture);
          const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.target, identityFactory.target], deployer);
          await trexImplementationAuthority.setTREXFactory(trexFactory.target);

          const iaFactory = await ethers.deployContract('IAFactory', [trexFactory.target], deployer);
          const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
          const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

          const ierc165InterfaceId = await interfaceIdCalculator.getIERC165InterfaceId();
          expect(await iaFactory.supportsInterface(ierc165InterfaceId)).to.equal(true);
        });
      });
    });
  });
});
