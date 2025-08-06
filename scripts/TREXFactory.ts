import hre from "hardhat";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';

const DEPOSIT_LIMIT = BigInt('340282366920938463463374607431768211455');

function validateBytecode(bytecode: string): boolean {
  if (!bytecode || bytecode === '0x') throw new Error('Invalid bytecode: empty');
  if (!bytecode.startsWith('0x')) throw new Error('Bytecode must start with 0x');
  const cleanBytecode = bytecode.slice(2);
  if (cleanBytecode.length % 2 !== 0) throw new Error('Bytecode must have even number of hex characters');
  return true;
}

async function uploadCode(api: ApiPromise, contractName: string, bytecode: string, signer: any): Promise<string> {
  validateBytecode(bytecode);
  
  const reviveApi = (api.call as any).reviveApi;
  if (!reviveApi?.uploadCode) throw new Error('reviveApi.uploadCode not available');
  
  const result = await reviveApi.uploadCode(
    signer.address,
    bytecode,
    DEPOSIT_LIMIT.toString()
  );
  
  if (result.isOk) {
    const { codeHash } = result.asOk;
    console.log(`${contractName} uploaded. Code hash: ${codeHash.toString()}`);
    return codeHash.toString();
  } else {
    throw new Error(`Upload failed: ${JSON.stringify(result.asErr.toHuman())}`);
  }
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("EVM Deployer:", deployer.address);
  
  const provider = new WsProvider('ws://localhost:9944');
  const api = await ApiPromise.create({ provider });
  await api.isReady;
  
  const keyring = new Keyring({ type: 'sr25519' });
  const signer = keyring.addFromUri('//Alice');
  console.log('Substrate signer:', signer.address);
  
  try {
    const contractsToUpload = [
      'TokenProxy',
      'ClaimTopicsRegistryProxy', 
      'IdentityRegistryProxy',
      'IdentityRegistryStorageProxy',
      'TrustedIssuersRegistryProxy',
      'ModularComplianceProxy',
      'TREXImplementationAuthority',
      'IdFactory',
      'IAFactory',
      'TREXFactory'
    ];
    
    const codeHashes: Record<string, string> = {};
    
    for (const contractName of contractsToUpload) {
      try {
        const contract = await hre.ethers.getContractFactory(contractName);
        const bytecode = contract.bytecode;
        codeHashes[contractName] = await uploadCode(api, contractName, bytecode, signer);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.log(`Skipping ${contractName}: ${error.message}`);
      }
    }
    
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const IAFactory = await hre.ethers.getContractFactory("IAFactory");
    const iaFactory = await IAFactory.deploy(zeroAddress);
    await iaFactory.deployed();
    console.log("IAFactory deployed at:", iaFactory.address);
    const ImplementationAuthority = await hre.ethers.getContractFactory("TREXImplementationAuthority");
    const implementationAuthority = await ImplementationAuthority.deploy(
      true,
      zeroAddress,
      iaFactory.address
    );
    
    await implementationAuthority.deployed();
    console.log("Implementation Authority deployed at:", implementationAuthority.address);
    
    const IdFactory = await hre.ethers.getContractFactory("IdFactory");
    const idFactory = await IdFactory.deploy(implementationAuthority.address);
    await idFactory.deployed();
    console.log("IdFactory deployed at:", idFactory.address);
    
    const Factory = await hre.ethers.getContractFactory("TREXFactory");
    const factory = await Factory.deploy(implementationAuthority.address, idFactory.address);
    await factory.deployed();
    console.log("TREXFactory deployed at:", factory.address);
    
    const updateIATx = await iaFactory.setTREXFactory(factory.address);
    await updateIATx.wait();
    console.log("Updated TREXFactory address in IAFactory");
    
    const updateImplTx = await implementationAuthority.setTREXFactory(factory.address);
    await updateImplTx.wait();
    console.log("Updated TREXFactory address in Implementation Authority");
    
    console.log("\nDeployment Summary:");
    console.log("TREXFactory:", factory.address);
    console.log("TREXImplementationAuthority:", implementationAuthority.address);
    console.log("IdFactory:", idFactory.address);
    console.log("IAFactory:", iaFactory.address);
    console.log("\nUploaded code hashes:", codeHashes);
    
  } finally {
    await api.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});