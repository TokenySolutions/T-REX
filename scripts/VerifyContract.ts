import { ethers, run } from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

async function verifyProxies(tokenProxyAddress: string, chosenNetwork: string): Promise<void> {
  const provider = ethers.provider; // Using the ethers provider from Hardhat environment
  // Load private key
  const interactorPrivateKey = process.env.INTERACTOR_PRIVATE_KEY!;

  // Connect to the network
  const interactorWallet = new ethers.Wallet(interactorPrivateKey, provider);

  console.log('load data for TokenProxy Constructor');
  const tokenProxy = await ethers.getContractAt('TokenProxy', tokenProxyAddress, interactorWallet);
  const implementationAuthority = await tokenProxy.getImplementationAuthority();
  const token = await ethers.getContractAt('Token', tokenProxyAddress, interactorWallet);
  const identityRegistry = await token.identityRegistry();
  const compliance = await token.compliance();
  const tokenName = await token.name();
  const symbol = await token.symbol();
  const decimals = Number(await token.decimals());
  const onchainID = await token.onchainID();
  console.log('loaded all data for TokenProxy Constructor');
  console.log('Try verification of Token Proxy');
  try {
    await run('verify:verify', {
      address: tokenProxyAddress,
      constructorArguments: [
        implementationAuthority,
        identityRegistry,
        compliance,
        tokenName,
        symbol,
        decimals,
        '0x0000000000000000000000000000000000000000',
      ],
      network: chosenNetwork,
    });
    console.log('Token Proxy verification successful');
  } catch (error) {
    console.error('Token Proxy verification failed:', error);
  }
  console.log('load data for IdentityProxy Constructor');
  const idProxy = await ethers.getContractAt('IdentityProxy', onchainID, interactorWallet);
  const idIA = await idProxy.implementationAuthority();
  const owner = await token.owner();
  console.log('Try verification of IdentityProxy');
  try {
    await run('verify:verify', {
      address: onchainID,
      constructorArguments: [idIA, owner],
      network: chosenNetwork,
    });
    console.log('IdentityProxy verification successful');
  } catch (error) {
    console.error('IdentityProxy verification failed:', error);
  }
  console.log('load data for IdentityRegistryProxy Constructor');
  const IR = await ethers.getContractAt('IdentityRegistry', identityRegistry, interactorWallet);
  const trustedIssuersRegistry = await IR.issuersRegistry();
  const claimTopicsRegistry = await IR.topicsRegistry();
  const identityStorage = await IR.identityStorage();
  console.log('loaded all data for IdentityRegistryProxy Constructor');
  console.log('Try verification of IdentityRegistryProxy');
  try {
    await run('verify:verify', {
      address: identityRegistry,
      constructorArguments: [implementationAuthority, trustedIssuersRegistry, claimTopicsRegistry, identityStorage],
      network: chosenNetwork,
    });
    console.log('IdentityRegistryProxy verification successful');
  } catch (error) {
    console.error('IdentityRegistryProxy verification failed:', error);
  }
  console.log('Try verification of ClaimTopicsRegistryProxy');
  try {
    await run('verify:verify', {
      address: claimTopicsRegistry,
      constructorArguments: [implementationAuthority],
      network: chosenNetwork,
    });
    console.log('ClaimTopicsRegistryProxy verification successful');
  } catch (error) {
    console.error('ClaimTopicsRegistryProxy verification failed:', error);
  }
  console.log('Try verification of IdentityRegistryStorageProxy');
  try {
    await run('verify:verify', {
      address: identityStorage,
      constructorArguments: [implementationAuthority],
      network: chosenNetwork,
    });
    console.log('IdentityRegistryStorageProxy verification successful');
  } catch (error) {
    console.error('IdentityRegistryStorageProxy verification failed:', error);
  }
  console.log('Try verification of ModularComplianceProxy');
  try {
    await run('verify:verify', {
      address: compliance,
      constructorArguments: [implementationAuthority],
      network: chosenNetwork,
    });
    console.log('ModularComplianceProxy verification successful');
  } catch (error) {
    console.error('ModularComplianceProxy verification failed:', error);
  }
  console.log('Try verification of TrustedIssuersRegistryProxy');
  try {
    await run('verify:verify', {
      address: trustedIssuersRegistry,
      constructorArguments: [implementationAuthority],
      network: chosenNetwork,
    });
    console.log('TrustedIssuersRegistryProxy verification successful');
  } catch (error) {
    console.error('TrustedIssuersRegistryProxy verification failed:', error);
  }
}

// modify the token proxy address hereunder to make the verification
// The address has to be a proxy token deployed by the TREX factory
// change the network name to fit the one used by `hardhat-etherscan`
// run the script with the command $npx hardhat run scripts/verifyContract.ts --network chosenNetwork
// change `chosenNetwork` for the network you launch the script on in the command

verifyProxies('0x58a1e2aF8dbbe3c443209070B2141a4811fA30B0', 'mumbai').catch((error) => {
  console.error(error);
  process.exit(1);
});
