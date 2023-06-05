const glob = require("glob");
const fs = require("fs-extra");
const { spawnSync } = require("child_process");

// Get a list of all solidity files in the contracts directory
const files = glob.sync("contracts/**/*.sol");

files.forEach((file) => {
  // Generate the output file path
  const outputFilePath = file.replace("contracts", "flat");

  // Ensure the output directory exists
  fs.ensureDirSync(
    outputFilePath.substring(0, outputFilePath.lastIndexOf("/"))
  );

  // Flatten the contract and write it to the output file
  const flatten = spawnSync("npx", ["hardhat", "flatten", file], {
    stdio: ["ignore", fs.openSync(outputFilePath, "w"), "inherit"],
  });

  if (flatten.error) {
    console.error(`Error flattening ${file}: ${flatten.error.message}`);
  }
});
