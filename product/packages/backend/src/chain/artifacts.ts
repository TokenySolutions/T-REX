import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

type ArtifactFile = {
  abi: any;
  bytecode: string;
};

type LoadedArtifact = {
  abi: any;
  bytecode: `0x${string}`;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.env.ARTIFACTS_DIR ?? path.join(__dirname, '../artifacts');

export function loadArtifact(contractName: string): LoadedArtifact {
  if (!contractName.trim()) {
    throw new Error('Contract name cannot be empty');
  }

  const files: string[] = [];

  const walk = (dir: string) => {
    try {
      for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        const st = fs.statSync(p);
        if (st.isDirectory()) {
          walk(p);
        } else if (f === `${contractName}.json`) {
          files.push(p);
        }
      }
    } catch (error) {
      console.warn(`Cannot access directory ${dir}: ${error}`);
    }
  };

  walk(ROOT);

  if (!files.length) {
    throw new Error(`Artifact not found: ${contractName}.json under ${ROOT}`);
  }

  if (files.length > 1) {
    console.warn(`Multiple artifacts found for ${contractName}, using: ${files[0]}`);
  }

  let raw: ArtifactFile;
  try {
    raw = JSON.parse(fs.readFileSync(files[0], 'utf-8'));
  } catch (error) {
    throw new Error(`Failed to parse artifact ${files[0]}: ${error}`);
  }

  const { abi, bytecode } = raw;

  if (!abi) {
    throw new Error(`Missing ABI in artifact: ${contractName}`);
  }

  if (!bytecode) {
    throw new Error(`Missing bytecode in artifact: ${contractName}`);
  }

  if (typeof bytecode !== 'string') {
    throw new Error(`Invalid bytecode type in ${contractName}: expected string, got ${typeof bytecode}`);
  }

  const normalizedBytecode = bytecode.startsWith('0x') ? bytecode : `0x${bytecode}`;

  if (normalizedBytecode !== '0x' && !/^0x[0-9a-fA-F]*$/.test(normalizedBytecode)) {
    throw new Error(`Invalid bytecode format in ${contractName}: contains non-hex characters`);
  }

  return {
    abi,
    bytecode: normalizedBytecode as `0x${string}`,
  };
}
