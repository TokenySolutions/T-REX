const glob = require('glob');
const fs = require('fs-extra');
const { spawnSync } = require('child_process');

// Get a list of all solidity files in the contracts directory
const files = glob.sync('contracts/**/*.sol');

let processedCount = 0; // to keep track of processed files

files.forEach((file) => {
  processedCount += 1;

  console.log(`[${processedCount}/${files.length}] Flattening: ${file} ...`);

  // Generate the output file path
  const outputFilePath = file.replace('contracts', 'flat');

  // Ensure the output directory exists
  fs.ensureDirSync(outputFilePath.substring(0, outputFilePath.lastIndexOf('/')));

  // Flatten the contract and write it directly to the output file
  const flatten = spawnSync('npx', ['hardhat', 'flatten', file], {
    stdio: ['ignore', fs.openSync(outputFilePath, 'w'), 'inherit'],
  });

  if (flatten.error) {
    console.error(`Error flattening ${file}: ${flatten.error.message}`);
  } else {
    // Read the file back
    const flattenedContent = fs.readFileSync(outputFilePath, 'utf-8');

    // Process content
    let modifiedContent = flattenedContent
      .split('\n')
      .filter((line) => !line.trim().startsWith('// SPDX-License-Identifier') && !line.trim().startsWith('pragma solidity'))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');

    // Add the single SPDX and pragma declaration at the top
    modifiedContent = `// SPDX-License-Identifier: GPL-3.0\npragma solidity 0.8.17;\n\n${modifiedContent}`;

    // Write the modified content back to the file
    fs.writeFileSync(outputFilePath, modifiedContent);

    console.log(`[${processedCount}/${files.length}] Flattened: ${file}`);
  }
});

console.log('All files processed!');
