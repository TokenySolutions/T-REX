const hre = require("hardhat");

async function main() {
  // Replace these addresses with actual deployed contract addresses
  const UTILITY_CHECKER_ADDRESS = "0x1Bc5FD60810B2B8F58043289C110863359157A46";
  const IDENTITY_REGISTRY_ADDRESS = "0xfe8Da47c18F18690c0E3603A4871181c0Fb3DEBc";
  const TO_ADDRESS = "0xaae02a45443a4D8155FD41478e5491EBBC680c90";

  const tokenAddresses = [
    "0xCf955Aeb7D218DF9DAB2f6F49DFF2037CCc2db43", // Apex Capital Partners (ACP)
    "0xCe3A3EDE4A68aF6986736Aaa0C1ff3b66eBaB658", // Amoy Token Test (ATT)
  ];

  const userAddresses = [
    "0xaae02a45443a4D8155FD41478e5491EBBC680c90",
    "0xFdE220131865a6a02346f3eeCFd85d0D67ED431A"
  ];

  // Get the UtilityChecker contract instance
  const UtilityChecker = await hre.ethers.getContractAt("UtilityChecker", UTILITY_CHECKER_ADDRESS);
  console.log("Interacting with UtilityChecker at:", UTILITY_CHECKER_ADDRESS);

  for (let t=0; t<tokenAddresses.length; t++) {
    const TOKEN_ADDRESS = tokenAddresses[t];

    // Get the Token contract instance
    const Token = await hre.ethers.getContractAt("IToken", TOKEN_ADDRESS);
    const tokenSymbol = await Token.symbol();
    const tokenDecimals = await Token.decimals();
    const AMOUNT = ethers.parseUnits("100", tokenDecimals);
    console.log("========== Token :", await Token.name(), tokenSymbol, "==========");
    console.log("\tPaused :", await Token.paused());

    for (let i = 0; i < userAddresses.length; i++) {
      const FROM_ADDRESS = userAddresses[i];
      console.log(` ----- Testing user address: ${FROM_ADDRESS} -----`);

      const totalBalance = await Token.balanceOf(FROM_ADDRESS);
      const frozenBalance = await Token.getFrozenTokens(FROM_ADDRESS);
      console.log("\tTotal balance:", ethers.formatUnits(totalBalance, tokenDecimals), tokenSymbol);
      console.log("\tFrozen balance:", ethers.formatUnits(frozenBalance, tokenDecimals), tokenSymbol);

      // Call testTransfer
      console.log("\nTesting transfer...");
      const canTransfer = await UtilityChecker.testTransfer(TOKEN_ADDRESS, FROM_ADDRESS, TO_ADDRESS, AMOUNT);
      console.log("Can transfer:", canTransfer);

      // Call testVerifiedDetails
      console.log("\nTesting verified details...");
      const verifiedDetails = await UtilityChecker.testVerifiedDetails(IDENTITY_REGISTRY_ADDRESS, FROM_ADDRESS);
      console.log("Verified details:", verifiedDetails);

      // Call testFreeze
      console.log("\nTesting freeze...");
      const [frozen, availableBalance] = await UtilityChecker.testFreeze(TOKEN_ADDRESS, FROM_ADDRESS, TO_ADDRESS, AMOUNT);
      console.log("Frozen:", frozen);
      console.log("Available balance:", ethers.formatUnits(availableBalance, tokenDecimals), tokenSymbol);

      // Call testTransferDetails
      console.log("\nTesting transfer details...");
      const transferDetails = await UtilityChecker.testTransferDetails(TOKEN_ADDRESS, FROM_ADDRESS, TO_ADDRESS, AMOUNT);
      console.log("Transfer details:", transferDetails);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});