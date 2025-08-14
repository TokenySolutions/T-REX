import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { deploySuiteWithModularCompliancesFixture } from "../fixtures/deploy-full-suite.fixture";
import {
  ModularCompliance,
  InitialLockupPeriodModule,
} from "../../typechain-types";

describe("InitialLockupPeriodModule", () => {
  // Test fixture
  async function deployInitialLockupPeriodModuleFullSuite() {
    const context = await loadFixture(deploySuiteWithModularCompliancesFixture);

    const module = await ethers.deployContract("InitialLockupPeriodModule");
    const proxy = await ethers.deployContract("ModuleProxy", [
      module.target,
      module.interface.encodeFunctionData("initialize"),
    ]);
    const complianceModule = await ethers.getContractAt(
      "InitialLockupPeriodModule",
      proxy.target
    );

    await context.suite.compliance.bindToken(context.suite.token.target);
    await context.suite.compliance.addModule(complianceModule.target);

    // Reset already minted tokens to have 0 balance
    const token = context.suite.token;
    await token
      .connect(context.accounts.tokenAgent)
      .burn(
        context.accounts.aliceWallet.address,
        await token.balanceOf(context.accounts.aliceWallet.address)
      );
    await token
      .connect(context.accounts.tokenAgent)
      .burn(
        context.accounts.bobWallet.address,
        await token.balanceOf(context.accounts.bobWallet.address)
      );

    return {
      ...context,
      suite: {
        ...context.suite,
        complianceModule,
      },
      accounts: {
        ...context.accounts,
        complianceSigner: await ethers.getImpersonatedSigner(
          context.suite.compliance.target.toString()
        ),
      },
    };
  }

  async function increaseTimestamp(days: number) {
    await ethers.provider.send("evm_increaseTime", [days * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);
  }

  async function setLockupPeriod(
    compliance: ModularCompliance,
    complianceModule: InitialLockupPeriodModule,
    lockupPeriod: number
  ) {
    return compliance.callModuleFunction(
      new ethers.Interface([
        "function setLockupPeriod(uint256 _lockupPeriod)",
      ]).encodeFunctionData("setLockupPeriod", [lockupPeriod]),
      complianceModule.target
    );
  }

  describe("Initialization", () => {
    it("should initialize correctly", async () => {
      const {
        suite: { complianceModule },
      } = await loadFixture(deployInitialLockupPeriodModuleFullSuite);

      expect(await complianceModule.name()).to.equal(
        "InitialLockupPeriodModule"
      );
      expect(await complianceModule.isPlugAndPlay()).to.be.true;
    });
  });

  describe("Lockup Period Management", () => {
    it("should revert when calling by not owner", async () => {
      const {
        suite: { complianceModule },
        accounts: { aliceWallet },
      } = await loadFixture(deployInitialLockupPeriodModuleFullSuite);

      await expect(
        complianceModule.connect(aliceWallet).setLockupPeriod(10)
      ).to.be.revertedWithCustomError(
        complianceModule,
        "OnlyBoundComplianceCanCall"
      );
    });

    it("should set lockup period correctly", async () => {
      const {
        suite: { compliance, complianceModule },
      } = await loadFixture(deployInitialLockupPeriodModuleFullSuite);

      const lockupPeriod = 10;
      const tx = await setLockupPeriod(
        compliance,
        complianceModule,
        lockupPeriod
      );

      await expect(tx)
        .to.emit(complianceModule, "LockupPeriodSet")
        .withArgs(compliance.target, lockupPeriod);
    });
  });

  describe("Transfer Checks", () => {
    it("should allow transfer after lockup period", async () => {
      const {
        suite: { compliance, complianceModule, token },
        accounts: { aliceWallet, bobWallet, tokenAgent, complianceSigner },
      } = await loadFixture(deployInitialLockupPeriodModuleFullSuite);

      const lockupPeriod = 10;
      await setLockupPeriod(compliance, complianceModule, lockupPeriod);

      await token.connect(tokenAgent).mint(aliceWallet.address, 100);

      // Advance time beyond lockup period
      await increaseTimestamp(lockupPeriod + 1);
      expect(
        await complianceModule
          .connect(complianceSigner)
          .moduleCheck(
            aliceWallet.address,
            bobWallet.address,
            100,
            compliance.target
          )
      ).to.be.true;
    });

    it("should prevent transfer during lockup period", async () => {
      const {
        suite: { compliance, complianceModule, token },
        accounts: { aliceWallet, bobWallet, tokenAgent },
      } = await loadFixture(deployInitialLockupPeriodModuleFullSuite);

      const lockupPeriod = 100;
      await setLockupPeriod(compliance, complianceModule, lockupPeriod);

      await token.connect(tokenAgent).mint(aliceWallet.address, 100);
      expect(
        await complianceModule.moduleCheck(
          aliceWallet.address,
          bobWallet.address,
          100,
          compliance.target
        )
      ).to.be.false;

      await increaseTimestamp(lockupPeriod - 1);
      expect(
        await complianceModule.moduleCheck(
          aliceWallet.address,
          bobWallet.address,
          100,
          compliance.target
        )
      ).to.be.false;
    });

    describe("Transfer Checks with multiple lockup periods", () => {
      it("should allow transfer after lockup period", async () => {
        const {
          suite: { compliance, complianceModule, token },
          accounts: { aliceWallet, bobWallet, tokenAgent },
        } = await loadFixture(deployInitialLockupPeriodModuleFullSuite);

        const lockupPeriod = 100;
        await setLockupPeriod(compliance, complianceModule, lockupPeriod);

        await token.connect(tokenAgent).mint(aliceWallet.address, 100);
        expect(
          await complianceModule.moduleCheck(
            aliceWallet.address,
            bobWallet.address,
            100,
            compliance.target
          )
        ).to.be.false;

        await increaseTimestamp(lockupPeriod);
        await token.connect(tokenAgent).mint(aliceWallet.address, 100);

        expect(
          await complianceModule.moduleCheck(
            aliceWallet.address,
            bobWallet.address,
            200,
            compliance.target
          )
        ).to.be.false;
        expect(
          await complianceModule.moduleCheck(
            aliceWallet.address,
            bobWallet.address,
            100,
            compliance.target
          )
        ).to.be.true;

        await increaseTimestamp(lockupPeriod);
        expect(
          await complianceModule.moduleCheck(
            aliceWallet.address,
            bobWallet.address,
            200,
            compliance.target
          )
        ).to.be.true;
      });
    });
  });

  describe("Burn Checks", () => {
    it("should allow burn after lockup period", async () => {
      const {
        suite: { compliance, complianceModule, token },
        accounts: { aliceWallet, tokenAgent },
      } = await loadFixture(deployInitialLockupPeriodModuleFullSuite);

      const lockupPeriod = 10;
      await setLockupPeriod(compliance, complianceModule, lockupPeriod);

      await token.connect(tokenAgent).mint(aliceWallet.address, 100);

      // Burn will fail because the lockup period is not over
      await expect(token.connect(tokenAgent).burn(aliceWallet.address, 100))
        .to.be.revertedWithCustomError(
          complianceModule,
          "InsufficientBalanceTokensLocked"
        )
        .withArgs(aliceWallet.address, 100, 0);

      // Burn will succeed because the lockup period is over
      await increaseTimestamp(lockupPeriod);
      await token.connect(tokenAgent).burn(aliceWallet.address, 100);
    });
  });
});
