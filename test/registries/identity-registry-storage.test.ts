import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { deployFullSuiteFixture } from '../fixtures/deploy-full-suite.fixture';

describe('IdentityRegistryStorage', () => {
  describe('.init', () => {
    describe('when contract was already initialized', () => {
      it('should revert', async () => {
        const {
          suite: { identityRegistryStorage },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistryStorage.init()).to.be.revertedWith('Initializable: contract is already initialized');
      });
    });
  });

  describe('.addIdentityToStorage()', () => {
    describe('when sender is not agent', () => {
      it('should revert', async () => {
        const {
          suite: { identityRegistryStorage },
          accounts: { anotherWallet, charlieWallet },
          identities: { charlieIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          identityRegistryStorage.connect(anotherWallet).addIdentityToStorage(charlieWallet.address, charlieIdentity.address, 42),
        ).to.be.revertedWith('AgentRole: caller does not have the Agent role');
      });
    });

    describe('when sender is agent', () => {
      describe('when identity is zero address', () => {
        it('should revert', async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent, charlieWallet },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(
            identityRegistryStorage.connect(tokenAgent).addIdentityToStorage(charlieWallet.address, ethers.constants.AddressZero, 42),
          ).to.be.revertedWith('invalid argument - zero address');
        });
      });

      describe('when wallet is zero address', () => {
        it('should revert', async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent },
            identities: { charlieIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(
            identityRegistryStorage.connect(tokenAgent).addIdentityToStorage(ethers.constants.AddressZero, charlieIdentity.address, 42),
          ).to.be.revertedWith('invalid argument - zero address');
        });
      });

      describe('when wallet is already registered', () => {
        it('should revert', async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent, bobWallet },
            identities: { charlieIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(
            identityRegistryStorage.connect(tokenAgent).addIdentityToStorage(bobWallet.address, charlieIdentity.address, 42),
          ).to.be.revertedWith('address stored already');
        });
      });
    });
  });

  describe('.modifyStoredIdentity()', () => {
    describe('when sender is not agent', () => {
      it('should revert', async () => {
        const {
          suite: { identityRegistryStorage },
          accounts: { anotherWallet, charlieWallet },
          identities: { charlieIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          identityRegistryStorage.connect(anotherWallet).modifyStoredIdentity(charlieWallet.address, charlieIdentity.address),
        ).to.be.revertedWith('AgentRole: caller does not have the Agent role');
      });
    });

    describe('when sender is agent', () => {
      describe('when identity is zero address', () => {
        it('should revert', async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent, charlieWallet },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(
            identityRegistryStorage.connect(tokenAgent).modifyStoredIdentity(charlieWallet.address, ethers.constants.AddressZero),
          ).to.be.revertedWith('invalid argument - zero address');
        });
      });

      describe('when wallet is zero address', () => {
        it('should revert', async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent },
            identities: { charlieIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(
            identityRegistryStorage.connect(tokenAgent).modifyStoredIdentity(ethers.constants.AddressZero, charlieIdentity.address),
          ).to.be.revertedWith('invalid argument - zero address');
        });
      });

      describe('when wallet is not registered', () => {
        it('should revert', async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent, charlieWallet },
            identities: { charlieIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(
            identityRegistryStorage.connect(tokenAgent).modifyStoredIdentity(charlieWallet.address, charlieIdentity.address),
          ).to.be.revertedWith('address not stored yet');
        });
      });
    });
  });

  describe('.modifyStoredInvestorCountry()', () => {
    describe('when sender is not agent', () => {
      it('should revert', async () => {
        const {
          suite: { identityRegistryStorage },
          accounts: { anotherWallet, charlieWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistryStorage.connect(anotherWallet).modifyStoredInvestorCountry(charlieWallet.address, 42)).to.be.revertedWith(
          'AgentRole: caller does not have the Agent role',
        );
      });
    });

    describe('when sender is agent', () => {
      describe('when wallet is zero address', () => {
        it('should revert', async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(identityRegistryStorage.connect(tokenAgent).modifyStoredInvestorCountry(ethers.constants.AddressZero, 42)).to.be.revertedWith(
            'invalid argument - zero address',
          );
        });
      });

      describe('when wallet is not registered', () => {
        it('should revert', async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent, charlieWallet },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(identityRegistryStorage.connect(tokenAgent).modifyStoredInvestorCountry(charlieWallet.address, 42)).to.be.revertedWith(
            'address not stored yet',
          );
        });
      });
    });
  });

  describe('.removeIdentityFromStorage()', () => {
    describe('when sender is not agent', () => {
      it('should revert', async () => {
        const {
          suite: { identityRegistryStorage },
          accounts: { anotherWallet, charlieWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistryStorage.connect(anotherWallet).removeIdentityFromStorage(charlieWallet.address)).to.be.revertedWith(
          'AgentRole: caller does not have the Agent role',
        );
      });
    });

    describe('when sender is agent', () => {
      describe('when wallet is zero address', () => {
        it('should revert', async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(identityRegistryStorage.connect(tokenAgent).removeIdentityFromStorage(ethers.constants.AddressZero)).to.be.revertedWith(
            'invalid argument - zero address',
          );
        });
      });

      describe('when wallet is not registered', () => {
        it('should revert', async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent, charlieWallet },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(identityRegistryStorage.connect(tokenAgent).removeIdentityFromStorage(charlieWallet.address)).to.be.revertedWith(
            'address not stored yet',
          );
        });
      });
    });
  });

  describe('.bindIdentityRegistry()', () => {
    describe('when sender is not owner', () => {
      it('should revert', async () => {
        const {
          suite: { identityRegistryStorage },
          accounts: { anotherWallet },
          identities: { charlieIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistryStorage.connect(anotherWallet).bindIdentityRegistry(charlieIdentity.address)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when sender is owner', () => {
      describe('when identity registries is zero address', () => {
        it('should revert', async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(identityRegistryStorage.connect(deployer).bindIdentityRegistry(ethers.constants.AddressZero)).to.be.revertedWith(
            'invalid argument - zero address',
          );
        });
      });

      describe('when there are already 299 identity registries bound', () => {
        it('should revert', async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { deployer },
            identities: { charlieIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await Promise.all(
            Array.from({ length: 299 }, () => identityRegistryStorage.connect(deployer).bindIdentityRegistry(ethers.Wallet.createRandom().address)),
          );

          await expect(identityRegistryStorage.connect(deployer).bindIdentityRegistry(charlieIdentity.address)).to.be.revertedWith(
            'cannot bind more than 300 IR to 1 IRS',
          );
        });
      });
    });
  });

  describe('.unbindIdentityRegistry()', () => {
    describe('when sender is not agent', () => {
      it('should revert', async () => {
        const {
          suite: { identityRegistryStorage },
          accounts: { anotherWallet },
          identities: { charlieIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistryStorage.connect(anotherWallet).unbindIdentityRegistry(charlieIdentity.address)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when sender is agent', () => {
      describe('when identity registries is zero address', () => {
        it('should revert', async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(identityRegistryStorage.connect(deployer).unbindIdentityRegistry(ethers.constants.AddressZero)).to.be.revertedWith(
            'invalid argument - zero address',
          );
        });
      });

      describe('when identity registries not bound', () => {
        it('should revert', async () => {
          const {
            suite: { identityRegistryStorage, identityRegistry },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.unbindIdentityRegistry(identityRegistry.address);

          await expect(identityRegistryStorage.connect(deployer).unbindIdentityRegistry(identityRegistry.address)).to.be.revertedWith(
            'identity registry is not stored',
          );
        });
      });

      describe('when identity registries is bound', () => {
        it('should unbind the identity registry', async () => {
          const {
            suite: { identityRegistryStorage, identityRegistry },
            accounts: { deployer },
            identities: { charlieIdentity, bobIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.bindIdentityRegistry(charlieIdentity.address);
          await identityRegistryStorage.bindIdentityRegistry(bobIdentity.address);

          const tx = await identityRegistryStorage.connect(deployer).unbindIdentityRegistry(charlieIdentity.address);
          await expect(tx).to.emit(identityRegistryStorage, 'IdentityRegistryUnbound').withArgs(charlieIdentity.address);

          await expect(identityRegistryStorage.linkedIdentityRegistries()).to.eventually.be.deep.equal([
            identityRegistry.address,
            bobIdentity.address,
          ]);
        });
      });
    });
  });
});
