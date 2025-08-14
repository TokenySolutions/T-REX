import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { deployFullSuiteFixture } from "../fixtures/deploy-full-suite.fixture";

import { Token } from "../../typechain-types";

async function deployComplianceAndCountryAllowModule(
  token: Token,
  deployer: HardhatEthersSigner
) {
  const compliance = await ethers.deployContract("ModularCompliance");
  await compliance.init();
  await token.connect(deployer).setCompliance(compliance.target);

  const module = await ethers.deployContract("CountryAllowModule");
  const proxy = await ethers.deployContract("ModuleProxy", [
    module.target,
    module.interface.encodeFunctionData("initialize"),
  ]);
  const countryAllowModule = await ethers.getContractAt(
    "CountryAllowModule",
    proxy.target
  );

  await compliance.addModule(countryAllowModule.target);
  await compliance.bindToken(token.target);

  await compliance
    .connect(deployer)
    .callModuleFunction(
      new ethers.Interface([
        "function addAllowedCountry(uint16 country)",
      ]).encodeFunctionData("addAllowedCountry", [42]),
      countryAllowModule.target
    );
}

describe("UtilityChecker.testTransfer", () => {
  describe("When sender is frozen", () => {
    it("should return false", async () => {
      const {
        suite: { token },
        accounts: { tokenAgent, aliceWallet, bobWallet, deployer },
      } = await loadFixture(deployFullSuiteFixture);
      await deployComplianceAndCountryAllowModule(token, deployer);

      const utilityChecker = await ethers.deployContract("UtilityChecker");

      await token
        .connect(tokenAgent)
        .setAddressFrozen(aliceWallet.address, true);
      const result = await utilityChecker.testTransfer(
        token.target,
        aliceWallet.address,
        bobWallet.address,
        100
      );
      expect(result[0]).to.be.equal(false);
      expect(result[1]).to.be.equal(true);
      expect(result[2]).to.be.equal(true);
    });
  });

  describe("When recipient is frozen", () => {
    it("should return false", async () => {
      const {
        suite: { token },
        accounts: { tokenAgent, aliceWallet, bobWallet, deployer },
      } = await loadFixture(deployFullSuiteFixture);
      await deployComplianceAndCountryAllowModule(token, deployer);

      const utilityChecker = await ethers.deployContract("UtilityChecker");

      await token.connect(tokenAgent).setAddressFrozen(bobWallet.address, true);
      const result = await utilityChecker.testTransfer(
        token.target,
        aliceWallet.address,
        bobWallet.address,
        100
      );
      expect(result[0]).to.be.equal(false);
      expect(result[1]).to.be.equal(true);
      expect(result[2]).to.be.equal(true);
    });
  });

  describe("When unfrozen balance is unsufficient", () => {
    it("should return false", async () => {
      const {
        suite: { token },
        accounts: { tokenAgent, aliceWallet, bobWallet, deployer },
      } = await loadFixture(deployFullSuiteFixture);
      await deployComplianceAndCountryAllowModule(token, deployer);

      const utilityChecker = await ethers.deployContract("UtilityChecker");

      const initialBalance = await token.balanceOf(aliceWallet.address);
      await token
        .connect(tokenAgent)
        .freezePartialTokens(aliceWallet.address, initialBalance - 10n);
      const result = await utilityChecker.testTransfer(
        token.target,
        aliceWallet.address,
        bobWallet.address,
        100
      );
      expect(result[0]).to.be.equal(false);
      expect(result[1]).to.be.equal(true);
      expect(result[2]).to.be.equal(true);
    });
  });

  describe("When nominal case", () => {
    it("should return true", async () => {
      const {
        suite: { token, identityRegistry },
        accounts: { deployer, tokenAgent, aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);

      await deployComplianceAndCountryAllowModule(token, deployer);
      await identityRegistry
        .connect(tokenAgent)
        .updateCountry(bobWallet.address, 42);

      const utilityChecker = await ethers.deployContract("UtilityChecker");

      const result = await utilityChecker.testTransfer(
        token.target,
        aliceWallet.address,
        bobWallet.address,
        100
      );
      expect(result[0]).to.be.equal(true);
      expect(result[1]).to.be.equal(true);
      expect(result[2]).to.be.equal(true);
    });
  });

  describe("When no identity is registered", () => {
    it("should return false", async () => {
      const {
        suite: { token, identityRegistry },
        accounts: { deployer, tokenAgent, aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);
      await deployComplianceAndCountryAllowModule(token, deployer);
      await identityRegistry
        .connect(tokenAgent)
        .deleteIdentity(bobWallet.address);

      const utilityChecker = await ethers.deployContract("UtilityChecker");

      const result = await utilityChecker.testTransfer(
        token.target,
        aliceWallet.address,
        bobWallet.address,
        100
      );
      expect(result[0]).to.be.equal(true);
      expect(result[1]).to.be.equal(false);
      expect(result[2]).to.be.equal(true);
    });
  });

  describe("When the identity is registered with topics", () => {
    it("should return false", async () => {
      const {
        suite: { identityRegistry, token },
        accounts: { deployer, tokenAgent, aliceWallet, charlieWallet },
        identities: { charlieIdentity },
      } = await loadFixture(deployFullSuiteFixture);

      await identityRegistry
        .connect(tokenAgent)
        .registerIdentity(charlieWallet.address, charlieIdentity.target, 0);

      await deployComplianceAndCountryAllowModule(token, deployer);
      const utilityChecker = await ethers.deployContract("UtilityChecker");

      const result = await utilityChecker.testTransfer(
        token.target,
        aliceWallet.address,
        charlieWallet.address,
        100
      );
      expect(result[0]).to.be.equal(true);
      expect(result[1]).to.be.equal(false);
      expect(result[2]).to.be.equal(true);
    });
  });

  describe("After fixture", () => {
    it("should return true ", async () => {
      const {
        suite: { token, identityRegistry },
        accounts: { deployer, tokenAgent, aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);

      await deployComplianceAndCountryAllowModule(token, deployer);
      await identityRegistry
        .connect(tokenAgent)
        .updateCountry(bobWallet.address, 42);

      const utilityChecker = await ethers.deployContract("UtilityChecker");
      const result = await utilityChecker.testTransfer(
        token.target,
        aliceWallet.address,
        bobWallet.address,
        100
      );
      expect(result[0]).to.be.equal(true);
      expect(result[1]).to.be.equal(true);
      expect(result[2]).to.be.equal(true);
    });
  });
});
