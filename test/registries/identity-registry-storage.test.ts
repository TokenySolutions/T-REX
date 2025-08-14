import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployFullSuiteFixture } from "../fixtures/deploy-full-suite.fixture";

describe("IdentityRegistryStorage", () => {
  describe(".init", () => {
    describe("when contract was already initialized", () => {
      it("should revert", async () => {
        const {
          suite: { identityRegistryStorage },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(identityRegistryStorage.init()).to.be.revertedWith(
          "Initializable: contract is already initialized"
        );
      });
    });
  });

  describe(".addIdentityToStorage()", () => {
    describe("when sender is not agent", () => {
      it("should revert", async () => {
        const {
          suite: { identityRegistryStorage },
          accounts: { anotherWallet, charlieWallet },
          identities: { charlieIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          identityRegistryStorage
            .connect(anotherWallet)
            .addIdentityToStorage(
              charlieWallet.address,
              charlieIdentity.target,
              42
            )
        ).to.be.revertedWithCustomError(
          identityRegistryStorage,
          "CallerDoesNotHaveAgentRole"
        );
      });
    });

    describe("when sender is agent", () => {
      describe("when identity is zero address", () => {
        it("should revert", async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent, charlieWallet },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(
            identityRegistryStorage
              .connect(tokenAgent)
              .addIdentityToStorage(
                charlieWallet.address,
                ethers.ZeroAddress,
                42
              )
          ).to.be.revertedWithCustomError(
            identityRegistryStorage,
            "ZeroAddress"
          );
        });
      });

      describe("when wallet is zero address", () => {
        it("should revert", async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent },
            identities: { charlieIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(
            identityRegistryStorage
              .connect(tokenAgent)
              .addIdentityToStorage(
                ethers.ZeroAddress,
                charlieIdentity.target,
                42
              )
          ).to.be.revertedWithCustomError(
            identityRegistryStorage,
            "ZeroAddress"
          );
        });
      });

      describe("when wallet is already registered", () => {
        it("should revert", async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent, bobWallet },
            identities: { charlieIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(
            identityRegistryStorage
              .connect(tokenAgent)
              .addIdentityToStorage(
                bobWallet.address,
                charlieIdentity.target,
                42
              )
          ).to.be.revertedWithCustomError(
            identityRegistryStorage,
            "AddressAlreadyStored"
          );
        });
      });
    });
  });

  describe(".modifyStoredIdentity()", () => {
    describe("when sender is not agent", () => {
      it("should revert", async () => {
        const {
          suite: { identityRegistryStorage },
          accounts: { anotherWallet, charlieWallet },
          identities: { charlieIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          identityRegistryStorage
            .connect(anotherWallet)
            .modifyStoredIdentity(charlieWallet.address, charlieIdentity.target)
        ).to.be.revertedWithCustomError(
          identityRegistryStorage,
          "CallerDoesNotHaveAgentRole"
        );
      });
    });

    describe("when sender is agent", () => {
      describe("when identity is zero address", () => {
        it("should revert", async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent, charlieWallet },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(
            identityRegistryStorage
              .connect(tokenAgent)
              .modifyStoredIdentity(charlieWallet.address, ethers.ZeroAddress)
          ).to.be.revertedWithCustomError(
            identityRegistryStorage,
            "ZeroAddress"
          );
        });
      });

      describe("when wallet is zero address", () => {
        it("should revert", async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent },
            identities: { charlieIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(
            identityRegistryStorage
              .connect(tokenAgent)
              .modifyStoredIdentity(ethers.ZeroAddress, charlieIdentity.target)
          ).to.be.revertedWithCustomError(
            identityRegistryStorage,
            "ZeroAddress"
          );
        });
      });

      describe("when wallet is not registered", () => {
        it("should revert", async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent, charlieWallet },
            identities: { charlieIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(
            identityRegistryStorage
              .connect(tokenAgent)
              .modifyStoredIdentity(
                charlieWallet.address,
                charlieIdentity.target
              )
          ).to.be.revertedWithCustomError(
            identityRegistryStorage,
            "AddressNotYetStored"
          );
        });
      });
    });
  });

  describe(".modifyStoredInvestorCountry()", () => {
    describe("when sender is not agent", () => {
      it("should revert", async () => {
        const {
          suite: { identityRegistryStorage },
          accounts: { anotherWallet, charlieWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          identityRegistryStorage
            .connect(anotherWallet)
            .modifyStoredInvestorCountry(charlieWallet.address, 42)
        ).to.be.revertedWithCustomError(
          identityRegistryStorage,
          "CallerDoesNotHaveAgentRole"
        );
      });
    });

    describe("when sender is agent", () => {
      describe("when wallet is zero address", () => {
        it("should revert", async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(
            identityRegistryStorage
              .connect(tokenAgent)
              .modifyStoredInvestorCountry(ethers.ZeroAddress, 42)
          ).to.be.revertedWithCustomError(
            identityRegistryStorage,
            "ZeroAddress"
          );
        });
      });

      describe("when wallet is not registered", () => {
        it("should revert", async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent, charlieWallet },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(
            identityRegistryStorage
              .connect(tokenAgent)
              .modifyStoredInvestorCountry(charlieWallet.address, 42)
          ).to.be.revertedWithCustomError(
            identityRegistryStorage,
            "AddressNotYetStored"
          );
        });
      });
    });
  });

  describe(".removeIdentityFromStorage()", () => {
    describe("when sender is not agent", () => {
      it("should revert", async () => {
        const {
          suite: { identityRegistryStorage },
          accounts: { anotherWallet, charlieWallet },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          identityRegistryStorage
            .connect(anotherWallet)
            .removeIdentityFromStorage(charlieWallet.address)
        ).to.be.revertedWithCustomError(
          identityRegistryStorage,
          "CallerDoesNotHaveAgentRole"
        );
      });
    });

    describe("when sender is agent", () => {
      describe("when wallet is zero address", () => {
        it("should revert", async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(
            identityRegistryStorage
              .connect(tokenAgent)
              .removeIdentityFromStorage(ethers.ZeroAddress)
          ).to.be.revertedWithCustomError(
            identityRegistryStorage,
            "ZeroAddress"
          );
        });
      });

      describe("when wallet is not registered", () => {
        it("should revert", async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { tokenAgent, charlieWallet },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.addAgent(tokenAgent.address);

          await expect(
            identityRegistryStorage
              .connect(tokenAgent)
              .removeIdentityFromStorage(charlieWallet.address)
          ).to.be.revertedWithCustomError(
            identityRegistryStorage,
            "AddressNotYetStored"
          );
        });
      });
    });
  });

  describe(".bindIdentityRegistry()", () => {
    describe("when sender is not owner", () => {
      it("should revert", async () => {
        const {
          suite: { identityRegistryStorage },
          accounts: { anotherWallet },
          identities: { charlieIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          identityRegistryStorage
            .connect(anotherWallet)
            .bindIdentityRegistry(charlieIdentity.target)
        ).to.be.revertedWithCustomError(
          identityRegistryStorage,
          "OwnableUnauthorizedAccount"
        );
      });
    });

    describe("when sender is owner", () => {
      describe("when identity registries is zero address", () => {
        it("should revert", async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(
            identityRegistryStorage
              .connect(deployer)
              .bindIdentityRegistry(ethers.ZeroAddress)
          ).to.be.revertedWithCustomError(
            identityRegistryStorage,
            "ZeroAddress"
          );
        });
      });

      describe("when there are already 299 identity registries bound", () => {
        it("should revert", async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { deployer },
            identities: { charlieIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await Promise.all(
            Array.from({ length: 299 }, () =>
              identityRegistryStorage
                .connect(deployer)
                .bindIdentityRegistry(ethers.Wallet.createRandom().address)
            )
          );

          await expect(
            identityRegistryStorage
              .connect(deployer)
              .bindIdentityRegistry(charlieIdentity.target)
          ).to.be.revertedWithCustomError(
            identityRegistryStorage,
            "MaxIRByIRSReached"
          );
        });
      });
    });
  });

  describe(".unbindIdentityRegistry()", () => {
    describe("when sender is not agent", () => {
      it("should revert", async () => {
        const {
          suite: { identityRegistryStorage },
          accounts: { anotherWallet },
          identities: { charlieIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          identityRegistryStorage
            .connect(anotherWallet)
            .unbindIdentityRegistry(charlieIdentity.target)
        ).to.be.revertedWithCustomError(
          identityRegistryStorage,
          "OwnableUnauthorizedAccount"
        );
      });
    });

    describe("when sender is agent", () => {
      describe("when identity registries is zero address", () => {
        it("should revert", async () => {
          const {
            suite: { identityRegistryStorage },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(
            identityRegistryStorage
              .connect(deployer)
              .unbindIdentityRegistry(ethers.ZeroAddress)
          ).to.be.revertedWithCustomError(
            identityRegistryStorage,
            "ZeroAddress"
          );
        });
      });

      describe("when identity registries not bound", () => {
        it("should revert", async () => {
          const {
            suite: { identityRegistryStorage, identityRegistry },
            accounts: { deployer },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.unbindIdentityRegistry(
            identityRegistry.target
          );

          await expect(
            identityRegistryStorage
              .connect(deployer)
              .unbindIdentityRegistry(identityRegistry.target)
          ).to.be.revertedWithCustomError(
            identityRegistryStorage,
            "IdentityRegistryNotStored"
          );
        });
      });

      describe("when identity registries is bound", () => {
        it("should unbind the identity registry", async () => {
          const {
            suite: { identityRegistryStorage, identityRegistry },
            accounts: { deployer },
            identities: { charlieIdentity, bobIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistryStorage.bindIdentityRegistry(
            charlieIdentity.target
          );
          await identityRegistryStorage.bindIdentityRegistry(
            bobIdentity.target
          );

          const tx = await identityRegistryStorage
            .connect(deployer)
            .unbindIdentityRegistry(charlieIdentity.target);
          await expect(tx)
            .to.emit(identityRegistryStorage, "IdentityRegistryUnbound")
            .withArgs(charlieIdentity.target);

          await expect(
            identityRegistryStorage.linkedIdentityRegistries()
          ).to.eventually.be.deep.equal([
            identityRegistry.target,
            bobIdentity.target,
          ]);
        });
      });
    });
  });
  describe(".supportsInterface()", () => {
    it("should return false for unsupported interfaces", async () => {
      const {
        suite: { identityRegistryStorage },
      } = await loadFixture(deployFullSuiteFixture);

      const unsupportedInterfaceId = "0x12345678";
      expect(
        await identityRegistryStorage.supportsInterface(unsupportedInterfaceId)
      ).to.equal(false);
    });

    it("should correctly identify the IERC3643IdentityRegistryStorage interface ID", async () => {
      const {
        suite: { identityRegistryStorage },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory(
        "InterfaceIdCalculator"
      );
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const iIdentityRegistryStorageInterfaceId =
        await interfaceIdCalculator.getIERC3643IdentityRegistryStorageInterfaceId();
      expect(
        await identityRegistryStorage.supportsInterface(
          iIdentityRegistryStorageInterfaceId
        )
      ).to.equal(true);
    });

    it("should correctly identify the IERC173 interface ID", async () => {
      const {
        suite: { identityRegistryStorage },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory(
        "InterfaceIdCalculator"
      );
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc173InterfaceId =
        await interfaceIdCalculator.getIERC173InterfaceId();
      expect(
        await identityRegistryStorage.supportsInterface(ierc173InterfaceId)
      ).to.equal(true);
    });

    it("should correctly identify the IERC165 interface ID", async () => {
      const {
        suite: { identityRegistryStorage },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory(
        "InterfaceIdCalculator"
      );
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc165InterfaceId =
        await interfaceIdCalculator.getIERC165InterfaceId();
      expect(
        await identityRegistryStorage.supportsInterface(ierc165InterfaceId)
      ).to.equal(true);
    });
  });
});
