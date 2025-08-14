import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployFullSuiteFixture } from "../fixtures/deploy-full-suite.fixture";

describe("Token - Recovery", () => {
  describe(".recoveryAddress()", () => {
    describe("when sender is not an agent", () => {
      it("should reverts", async () => {
        const {
          suite: { token },
          accounts: { bobWallet, anotherWallet },
          identities: { bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await bobIdentity
          .connect(bobWallet)
          .addKey(
            ethers.keccak256(
              ethers.AbiCoder.defaultAbiCoder().encode(
                ["address"],
                [anotherWallet.address]
              )
            ),
            1,
            1
          );

        await expect(
          token
            .connect(anotherWallet)
            .recoveryAddress(
              bobWallet.address,
              anotherWallet.address,
              bobIdentity.target
            )
        ).to.be.revertedWithCustomError(token, "CallerDoesNotHaveAgentRole");
      });
    });

    describe("when agent permission is restricted", () => {
      it("should reverts", async () => {
        const {
          suite: { token },
          accounts: { bobWallet, anotherWallet, tokenAgent },
          identities: { bobIdentity },
        } = await loadFixture(deployFullSuiteFixture);

        await bobIdentity
          .connect(bobWallet)
          .addKey(
            ethers.keccak256(
              ethers.AbiCoder.defaultAbiCoder().encode(
                ["address"],
                [anotherWallet.address]
              )
            ),
            1,
            1
          );

        await token.setAgentRestrictions(tokenAgent.address, {
          disableAddressFreeze: false,
          disableBurn: false,
          disableForceTransfer: false,
          disableMint: false,
          disablePartialFreeze: false,
          disablePause: false,
          disableRecovery: true,
        });

        await expect(
          token
            .connect(tokenAgent)
            .recoveryAddress(
              bobWallet.address,
              anotherWallet.address,
              bobIdentity.target
            )
        ).to.be.revertedWithCustomError(token, "AgentNotAuthorized");
      });
    });

    describe("when sender is an agent", () => {
      describe("when wallet to recover has no balance", () => {
        it("should revert", async () => {
          const {
            suite: { token },
            accounts: { tokenAgent, aliceWallet, bobWallet, anotherWallet },
            identities: { bobIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await token
            .connect(bobWallet)
            .transfer(
              aliceWallet.address,
              await token.balanceOf(bobWallet.address)
            );

          await expect(
            token
              .connect(tokenAgent)
              .recoveryAddress(
                bobWallet.address,
                anotherWallet.address,
                bobIdentity.target
              )
          ).to.be.revertedWithCustomError(token, "NoTokenToRecover");
        });
      });
      describe("when wallet has frozen token", () => {
        it("should recover and freeze tokens on the new wallet", async () => {
          const {
            suite: { token },
            accounts: { tokenAgent, bobWallet, anotherWallet },
            identities: { bobIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await bobIdentity
            .connect(bobWallet)
            .addKey(
              ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                  ["address"],
                  [anotherWallet.address]
                )
              ),
              1,
              1
            );

          await token
            .connect(tokenAgent)
            .freezePartialTokens(bobWallet.address, 50);

          const tx = await token
            .connect(tokenAgent)
            .recoveryAddress(
              bobWallet.address,
              anotherWallet.address,
              bobIdentity.target
            );
          await expect(
            token.getFrozenTokens(anotherWallet.address)
          ).to.be.eventually.eq(50);
          await expect(tx)
            .to.emit(token, "RecoverySuccess")
            .withArgs(
              bobWallet.address,
              anotherWallet.address,
              bobIdentity.target
            );
          await expect(tx)
            .to.emit(token, "TokensFrozen")
            .withArgs(anotherWallet.address, 50);
        });
      });
      describe("when identity registry does not contain the lost or new wallet", () => {
        it("should revert", async () => {
          const {
            suite: { token, identityRegistry },
            accounts: { tokenAgent, bobWallet, anotherWallet },
            identities: { bobIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistry
            .connect(tokenAgent)
            .deleteIdentity(bobWallet.address);

          await expect(
            token
              .connect(tokenAgent)
              .recoveryAddress(
                bobWallet.address,
                anotherWallet.address,
                bobIdentity.target
              )
          ).to.be.revertedWithCustomError(token, "RecoveryNotPossible");
        });
      });

      describe("when recovery is successful with identity transfer", () => {
        it("should update the identity registry correctly", async () => {
          const {
            suite: { token, identityRegistry },
            accounts: { tokenAgent, bobWallet, anotherWallet },
            identities: { bobIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          const tx = await token
            .connect(tokenAgent)
            .recoveryAddress(
              bobWallet.address,
              anotherWallet.address,
              bobIdentity.target
            );

          await expect(identityRegistry.contains(bobWallet.address)).to
            .eventually.be.false;
          await expect(identityRegistry.contains(anotherWallet.address)).to
            .eventually.be.true;
          await expect(tx)
            .to.emit(token, "RecoverySuccess")
            .withArgs(
              bobWallet.address,
              anotherWallet.address,
              bobIdentity.target
            );
        });
      });

      describe("when the new wallet is already in the identity registry", () => {
        it("should only remove the lost wallet from the registry", async () => {
          const {
            suite: { token, identityRegistry },
            accounts: { tokenAgent, bobWallet, anotherWallet },
            identities: { bobIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistry
            .connect(tokenAgent)
            .registerIdentity(anotherWallet.address, bobIdentity.target, 1);

          const tx = await token
            .connect(tokenAgent)
            .recoveryAddress(
              bobWallet.address,
              anotherWallet.address,
              bobIdentity.target
            );

          await expect(identityRegistry.contains(bobWallet.address)).to
            .eventually.be.false;
          await expect(identityRegistry.contains(anotherWallet.address)).to
            .eventually.be.true;
          await expect(tx)
            .to.emit(token, "RecoverySuccess")
            .withArgs(
              bobWallet.address,
              anotherWallet.address,
              bobIdentity.target
            );
        });
      });

      describe("when a recovery already happened on another token with same IRS", () => {
        it("should recover without touching IRS", async () => {
          const {
            suite: { token, identityRegistry },
            accounts: { tokenAgent, bobWallet, anotherWallet },
            identities: { bobIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          await identityRegistry
            .connect(tokenAgent)
            .deleteIdentity(bobWallet.address);
          await identityRegistry
            .connect(tokenAgent)
            .registerIdentity(anotherWallet.address, bobIdentity.target, 1);

          const tx = await token
            .connect(tokenAgent)
            .recoveryAddress(
              bobWallet.address,
              anotherWallet.address,
              bobIdentity.target
            );

          await expect(identityRegistry.contains(bobWallet.address)).to
            .eventually.be.false;
          await expect(identityRegistry.contains(anotherWallet.address)).to
            .eventually.be.true;
          await expect(tx)
            .to.emit(token, "RecoverySuccess")
            .withArgs(
              bobWallet.address,
              anotherWallet.address,
              bobIdentity.target
            );
        });
      });

      describe("when the old wallet is frozen", () => {
        describe("when the new wallet is not frozen", () => {
          it("should transfer the frozen status and transfer frozen tokens", async () => {
            const {
              suite: { token },
              accounts: { tokenAgent, bobWallet, anotherWallet },
              identities: { bobIdentity },
            } = await loadFixture(deployFullSuiteFixture);

            await token
              .connect(tokenAgent)
              .setAddressFrozen(bobWallet.address, true);
            await token
              .connect(tokenAgent)
              .freezePartialTokens(bobWallet.address, 50);

            const tx = await token
              .connect(tokenAgent)
              .recoveryAddress(
                bobWallet.address,
                anotherWallet.address,
                bobIdentity.target
              );

            await expect(token.isFrozen(anotherWallet.address)).to.eventually.be
              .true;
            await expect(
              token.getFrozenTokens(anotherWallet.address)
            ).to.eventually.eq(50);
            await expect(tx)
              .to.emit(token, "TokensFrozen")
              .withArgs(anotherWallet.address, 50);
          });
        });
        describe("when the new wallet is already frozen", () => {
          it("should transfer frozen tokens and keep freeze status", async () => {
            const {
              suite: { token },
              accounts: { tokenAgent, bobWallet, anotherWallet },
              identities: { bobIdentity },
            } = await loadFixture(deployFullSuiteFixture);

            await token
              .connect(tokenAgent)
              .setAddressFrozen(bobWallet.address, true);
            await token
              .connect(tokenAgent)
              .setAddressFrozen(anotherWallet.address, true);
            await token
              .connect(tokenAgent)
              .freezePartialTokens(bobWallet.address, 30);

            const tx = await token
              .connect(tokenAgent)
              .recoveryAddress(
                bobWallet.address,
                anotherWallet.address,
                bobIdentity.target
              );

            await expect(token.isFrozen(anotherWallet.address)).to.eventually.be
              .true;
            await expect(
              token.getFrozenTokens(anotherWallet.address)
            ).to.eventually.eq(30);
            await expect(tx)
              .to.emit(token, "TokensFrozen")
              .withArgs(anotherWallet.address, 30);
          });
        });
      });
      describe("when there are no frozen tokens", () => {
        it("should recover tokens without freezing any", async () => {
          const {
            suite: { token },
            accounts: { tokenAgent, bobWallet, anotherWallet },
            identities: { bobIdentity },
          } = await loadFixture(deployFullSuiteFixture);

          const tx = await token
            .connect(tokenAgent)
            .recoveryAddress(
              bobWallet.address,
              anotherWallet.address,
              bobIdentity.target
            );

          await expect(
            token.getFrozenTokens(anotherWallet.address)
          ).to.eventually.eq(0);
          await expect(tx)
            .to.emit(token, "RecoverySuccess")
            .withArgs(
              bobWallet.address,
              anotherWallet.address,
              bobIdentity.target
            );
        });
      });
    });
  });
});
