import { ethers, run } from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

async function prodDeploy(chosenNetwork: string, addressContractsDeployer: string) {
  const provider = ethers.provider; // Using the ethers provider from Hardhat environment

  // Fetch the current gas price from the network
  const currentGasPrice = await provider.getGasPrice();

  // Double the gas price
  const doubleGasPrice = currentGasPrice.mul(2);

  // Load private key
  const interactorPrivateKey = process.env.INTERACTOR_PRIVATE_KEY!;

  // Connect to the network
  const interactorWallet = new ethers.Wallet(interactorPrivateKey, provider);

  // variable used for constructor arguments
  let args;

  // Deploy ContractsDeployer contract
  const contractsDeployer = await ethers.getContractAt('ContractsDeployer', addressContractsDeployer, interactorWallet);
  console.log(`ContractsDeployer loaded at : ${contractsDeployer.address}`);

  // Verify ContractsDeployer contract
  try {
    await run('verify:verify', {
      address: contractsDeployer.address,
      constructorArguments: [],
      network: chosenNetwork,
    });
    console.log('ContractsDeployer verification successful');
  } catch (error) {
    console.error('ContractsDeployer verification failed:', error);
  }

  // Deploy Token contract via ContractsDeployer
  const TokenFactory = await ethers.getContractFactory('Token');
  const tokenBytecode = TokenFactory.bytecode;
  let tx = await contractsDeployer.connect(interactorWallet).deployContract('Token_v4.1.3', tokenBytecode, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();

  const deployedTokenAddress = '0x8231Fff8423eeFacfB3551FEC925e212399Fddb8';
  console.log(`Token contract deployed to: ${deployedTokenAddress}`);

  // Verify Token contract
  try {
    await run('verify:verify', {
      address: deployedTokenAddress,
      constructorArguments: [],
      network: chosenNetwork,
    });
    console.log('Token contract verification successful');
  } catch (error) {
    console.error('Token contract verification failed:', error);
  }

  // Deploy Identity Registry contract via ContractsDeployer
  const IRFactory = await ethers.getContractFactory('IdentityRegistry');
  const irBytecode = IRFactory.bytecode;
  tx = await contractsDeployer.connect(interactorWallet).deployContract('IR_v4.1.3', irBytecode, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();

  const deployedIRAddress = await contractsDeployer.getContract('IR_v4.1.3');
  console.log(`IdentityRegistry contract deployed to: ${deployedIRAddress}`);

  // Verify Identity Registry contract
  try {
    await run('verify:verify', {
      address: deployedIRAddress,
      constructorArguments: [],
      network: chosenNetwork,
    });
    console.log('IdentityRegistry contract verification successful');
  } catch (error) {
    console.error('IdentityRegistry contract verification failed:', error);
  }

  // Deploy Identity Registry Storage contract via ContractsDeployer
  const IRSFactory = await ethers.getContractFactory('IdentityRegistryStorage');
  const irsBytecode = IRSFactory.bytecode;
  tx = await contractsDeployer.connect(interactorWallet).deployContract('IRS_v4.1.3', irsBytecode, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();

  const deployedIRSAddress = await contractsDeployer.getContract('IRS_v4.1.3');
  console.log(`IdentityRegistryStorage contract deployed to: ${deployedIRSAddress}`);

  // Verify Identity Registry Storage contract
  try {
    await run('verify:verify', {
      address: deployedIRSAddress,
      constructorArguments: [],
      network: chosenNetwork,
    });
    console.log('IdentityRegistryStorage contract verification successful');
  } catch (error) {
    console.error('IdentityRegistryStorage contract verification failed:', error);
  }

  // Deploy Trusted Issuers Registry contract via ContractsDeployer
  const TIRFactory = await ethers.getContractFactory('TrustedIssuersRegistry');
  const tirBytecode = TIRFactory.bytecode;
  tx = await contractsDeployer.connect(interactorWallet).deployContract('TIR_v4.1.3', tirBytecode, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();

  const deployedTIRAddress = await contractsDeployer.getContract('TIR_v4.1.3');
  console.log(`IdentityRegistryStorage contract deployed to: ${deployedTIRAddress}`);

  // Verify Trusted Issuers Registry contract
  try {
    await run('verify:verify', {
      address: deployedTIRAddress,
      constructorArguments: [],
      network: chosenNetwork,
    });
    console.log('TrustedIssuersRegistry contract verification successful');
  } catch (error) {
    console.error('TrustedIssuersRegistry contract verification failed:', error);
  }

  // Deploy Claim Topics Registry contract via ContractsDeployer
  const CTRFactory = await ethers.getContractFactory('ClaimTopicsRegistry');
  const ctrBytecode = CTRFactory.bytecode;
  tx = await contractsDeployer.connect(interactorWallet).deployContract('CTR_v4.1.3', ctrBytecode, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();

  const deployedCTRAddress = await contractsDeployer.getContract('CTR_v4.1.3');
  console.log(`ClaimTopicsRegistry contract deployed to: ${deployedCTRAddress}`);

  // Verify Claim Topics Registry contract
  try {
    await run('verify:verify', {
      address: deployedCTRAddress,
      constructorArguments: [],
      network: chosenNetwork,
    });
    console.log('ClaimTopicsRegistry contract verification successful');
  } catch (error) {
    console.error('ClaimTopicsRegistry contract verification failed:', error);
  }

  // Deploy Modular Compliance contract via ContractsDeployer
  const MCFactory = await ethers.getContractFactory('ModularCompliance');
  const mcBytecode = MCFactory.bytecode;
  tx = await contractsDeployer.connect(interactorWallet).deployContract('MC_v4.1.3', mcBytecode, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();

  const deployedMCAddress = await contractsDeployer.getContract('MC_v4.1.3');
  console.log(`ModularCompliance contract deployed to: ${deployedMCAddress}`);

  // Verify Modular Compliance contract
  try {
    await run('verify:verify', {
      address: deployedMCAddress,
      constructorArguments: [],
      network: chosenNetwork,
    });
    console.log('ModularCompliance contract verification successful');
  } catch (error) {
    console.error('ModularCompliance contract verification failed:', error);
  }

  // Deploy Identity contract via ContractsDeployer
  const IdentityFactory = await ethers.getContractFactory('Identity');
  const idBytecode = IdentityFactory.bytecode;
  args = ethers.utils.defaultAbiCoder.encode(['address', 'bool'], [contractsDeployer.address, true]);
  const idBytecodeWithArgs = idBytecode + args.slice(2);
  tx = await contractsDeployer.connect(interactorWallet).deployContract('OID_v2.2.0', idBytecodeWithArgs, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();

  const deployedOIDAddress = await contractsDeployer.getContract('OID_v2.2.0');
  console.log(`Identity contract deployed to: ${deployedOIDAddress}`);

  // Verify Identity contract
  try {
    await run('verify:verify', {
      address: deployedOIDAddress,
      constructorArguments: [contractsDeployer.address, true],
      network: chosenNetwork,
    });
    console.log('Identity contract verification successful');
  } catch (error) {
    console.error('Identity contract verification failed:', error);
  }

  // Deploy Implementation Authority (OID version) contract via ContractsDeployer
  const IdIAFactory = await ethers.getContractFactory('ImplementationAuthority');
  const idiaBytecode = IdIAFactory.bytecode;
  args = ethers.utils.defaultAbiCoder.encode(['address'], [deployedOIDAddress]);
  const idiaBytecodeWithArgs = idiaBytecode + args.slice(2);
  tx = await contractsDeployer.connect(interactorWallet).deployContract('OID_IA_v2.2.0', idiaBytecodeWithArgs, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();

  const deployedIdIAAddress = await contractsDeployer.getContract('OID_IA_v2.2.0');
  console.log(`ImplementationAuthority contract deployed to: ${deployedIdIAAddress}`);

  // Verify Implementation Authority (OID version) contract
  try {
    await run('verify:verify', {
      address: deployedIdIAAddress,
      constructorArguments: [deployedOIDAddress],
      network: chosenNetwork,
    });
    console.log('ImplementationAuthority verification successful');
  } catch (error) {
    console.error('ImplementationAuthority verification failed:', error);
  }

  // Recover ownership of ImplementationAuthority
  tx = await contractsDeployer.connect(interactorWallet).recoverContractOwnership(deployedIdIAAddress, interactorWallet.address, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();
  console.log(`Ownership recovery transaction for ImplementationAuthority sent.`);

  // Create a contract instance for ImplementationAuthority
  const implementationAuthorityInstance = await ethers.getContractAt('ImplementationAuthority', deployedIdIAAddress);

  // Check the current owner of the ImplementationAuthority contract
  let currentOwner = await implementationAuthorityInstance.owner();

  // Verify ownership has been transferred to interactorWallet
  if (currentOwner.toLowerCase() === interactorWallet.address.toLowerCase()) {
    console.log(`Ownership of ImplementationAuthority has been successfully transferred to: ${currentOwner}`);
  } else {
    console.error(`Ownership transfer of ImplementationAuthority failed. Current owner is: ${currentOwner}`);
  }

  // Deploy OID Factory contract via ContractsDeployer
  const OIDFactory = await ethers.getContractFactory('IdFactory');
  const oidFactoryBytecode = OIDFactory.bytecode;
  args = ethers.utils.defaultAbiCoder.encode(['address'], [deployedIdIAAddress]);
  const oidFactoryBytecodeWithArgs = oidFactoryBytecode + args.slice(2);
  tx = await contractsDeployer.connect(interactorWallet).deployContract('OID_Factory_v2.2.0', oidFactoryBytecodeWithArgs, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();

  const deployedOIDFactoryAddress = await contractsDeployer.getContract('OID_Factory_v2.2.0');
  console.log(`IdFactory contract deployed to: ${deployedOIDFactoryAddress}`);

  // Verify OID Factory contract
  try {
    await run('verify:verify', {
      address: deployedOIDFactoryAddress,
      constructorArguments: [deployedIdIAAddress],
      network: chosenNetwork,
    });
    console.log('IdFactory verification successful');
  } catch (error) {
    console.error('IdFactory verification failed:', error);
  }
  // Recover ownership of OID Factory
  tx = await contractsDeployer.connect(interactorWallet).recoverContractOwnership(deployedOIDFactoryAddress, interactorWallet.address, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();
  console.log(`Ownership recovery transaction for IdFactory initiated.`);

  // Create a contract instance for IdFactory
  const oidFactoryContract = await ethers.getContractAt('IdFactory', deployedOIDFactoryAddress, interactorWallet);

  // Check the current owner of the OID Factory contract
  currentOwner = await oidFactoryContract.owner();
  if (currentOwner.toLowerCase() === interactorWallet.address.toLowerCase()) {
    console.log(`Ownership of IdFactory successfully transferred to ${currentOwner}.`);
  } else {
    console.error(`Ownership transfer of IdFactory failed. Current owner is ${currentOwner}.`);
  }

  // Deploy TREXImplementationAuthority contract via ContractsDeployer
  const TREXIAFactory = await ethers.getContractFactory('TREXImplementationAuthority');
  const trexiaBytecode = TREXIAFactory.bytecode;
  args = ethers.utils.defaultAbiCoder.encode(['bool', 'address', 'address'], [true, ethers.constants.AddressZero, ethers.constants.AddressZero]);
  const trexiaBytecodeWithArgs = trexiaBytecode + args.slice(2);
  tx = await contractsDeployer.connect(interactorWallet).deployContract('TREX_IA_v1.0.0', trexiaBytecodeWithArgs, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();

  const deployedTrexIAAddress = await contractsDeployer.getContract('TREX_IA_v1.0.0');
  console.log(`TREXImplementationAuthority contract deployed to: ${deployedTrexIAAddress}`);

  // Verify TREXImplementationAuthority contract
  try {
    await run('verify:verify', {
      address: deployedTrexIAAddress,
      constructorArguments: [true, ethers.constants.AddressZero, ethers.constants.AddressZero],
      network: chosenNetwork,
    });
    console.log('TREXImplementationAuthority verification successful');
  } catch (error) {
    console.error('TREXImplementationAuthority verification failed:', error);
  }

  // Recover ownership of TREXImplementationAuthority
  tx = await contractsDeployer.connect(interactorWallet).recoverContractOwnership(deployedTrexIAAddress, interactorWallet.address, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();
  console.log(`Ownership recovery transaction for TREXImplementationAuthority initiated.`);

  // Create a contract instance for TREXImplementationAuthority
  const trexIAContract = await ethers.getContractAt('TREXImplementationAuthority', deployedTrexIAAddress, interactorWallet);

  // Check the current owner of the TREXImplementationAuthority contract
  const currentOwnerTrexIA = await trexIAContract.owner();
  if (currentOwnerTrexIA.toLowerCase() === interactorWallet.address.toLowerCase()) {
    console.log(`Ownership of TREXImplementationAuthority successfully transferred to ${currentOwnerTrexIA}.`);
  } else {
    console.error(`Ownership transfer of TREXImplementationAuthority failed. Current owner is ${currentOwnerTrexIA}.`);
  }
  const version = {
    major: 4,
    minor: 1,
    patch: 3,
  };

  const trexContracts = {
    tokenImplementation: deployedTokenAddress,
    ctrImplementation: deployedCTRAddress,
    irImplementation: deployedIRAddress,
    irsImplementation: deployedIRSAddress,
    tirImplementation: deployedTIRAddress,
    mcImplementation: deployedMCAddress,
  };
  tx = await trexIAContract.connect(interactorWallet).addAndUseTREXVersion(version, trexContracts, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  const receipt = await tx.wait();
  const trexVersionAddedEvent = receipt.events?.find((e) => e.event === 'TREXVersionAdded');
  const versionUpdatedEvent = receipt.events?.find((e) => e.event === 'VersionUpdated');

  if (trexVersionAddedEvent && versionUpdatedEvent) {
    console.log('TREXVersionAdded and VersionUpdated events were successfully emitted.');
  } else {
    console.error('Failed to emit TREXVersionAdded and/or VersionUpdated events.');
  }
  // Deploy TREXFactory contract via ContractsDeployer
  const TREXFactory = await ethers.getContractFactory('TREXFactory');
  const trexFactoryBytecode = TREXFactory.bytecode;
  args = ethers.utils.defaultAbiCoder.encode(['address', 'address'], [deployedTrexIAAddress, deployedOIDFactoryAddress]);
  const trexFactoryBytecodeWithArgs = trexFactoryBytecode + args.slice(2);
  tx = await contractsDeployer.connect(interactorWallet).deployContract('TREX_Factory_v4.1.3', trexFactoryBytecodeWithArgs, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();

  const deployedTREXFactoryAddress = await contractsDeployer.getContract('TREX_Factory_v4.1.3');
  console.log(`TREXFactory contract deployed to: ${deployedTREXFactoryAddress}`);

  // Verify TREXFactory contract
  try {
    await run('verify:verify', {
      address: deployedTREXFactoryAddress,
      constructorArguments: [deployedTrexIAAddress, deployedOIDFactoryAddress],
      network: chosenNetwork,
    });
    console.log('TREXFactory verification successful');
  } catch (error) {
    console.error('TREXFactory verification failed:', error);
  }
  // Recover ownership of TREXFactory
  tx = await contractsDeployer.connect(interactorWallet).recoverContractOwnership(deployedTREXFactoryAddress, interactorWallet.address, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();
  console.log(`Ownership recovery transaction for TREXFactory initiated.`);

  // Verify the ownership transfer
  const trexFactoryContract = await ethers.getContractAt('TREXFactory', deployedTREXFactoryAddress, interactorWallet);
  const currentOwnerTREXFactory = await trexFactoryContract.owner();
  if (currentOwnerTREXFactory.toLowerCase() === interactorWallet.address.toLowerCase()) {
    console.log(`Ownership of TREXFactory successfully transferred to ${currentOwnerTREXFactory}.`);
  } else {
    console.error(`Ownership transfer of TREXFactory failed. Current owner is ${currentOwnerTREXFactory}.`);
  }
  // Deploy TREXGateway contract via ContractsDeployer
  const TREXGatewayFactory = await ethers.getContractFactory('TREXGateway');
  const trexGatewayBytecode = TREXGatewayFactory.bytecode;
  const argsTREXGateway = ethers.utils.defaultAbiCoder.encode(
    ['address', 'bool'],
    [deployedTREXFactoryAddress, false], // Using the deployed TREXFactory address and setting publicDeploymentStatus to false
  );
  const trexGatewayBytecodeWithArgs = trexGatewayBytecode + argsTREXGateway.slice(2);
  tx = await contractsDeployer.connect(interactorWallet).deployContract('TREX_Gateway', trexGatewayBytecodeWithArgs, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();

  const deployedTREXGatewayAddress = await contractsDeployer.getContract('TREX_Gateway');
  console.log(`TREXGateway contract deployed to: ${deployedTREXGatewayAddress}`);

  try {
    await run('verify:verify', {
      address: deployedTREXGatewayAddress,
      constructorArguments: [deployedTREXFactoryAddress, false],
      network: chosenNetwork,
    });
    console.log('TREXGateway verification successful');
  } catch (error) {
    console.error('TREXGateway verification failed:', error);
  }
  // Recover ownership of TREXGateway
  tx = await contractsDeployer.connect(interactorWallet).recoverContractOwnership(deployedTREXGatewayAddress, interactorWallet.address, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();
  console.log(`Ownership recovery transaction for TREXGateway initiated.`);

  // Confirm the ownership transfer
  const trexGatewayContract = await ethers.getContractAt('Ownable', deployedTREXGatewayAddress, interactorWallet);
  const currentOwnerTREXGateway = await trexGatewayContract.owner();
  if (currentOwnerTREXGateway.toLowerCase() === interactorWallet.address.toLowerCase()) {
    console.log(`Ownership of TREXGateway successfully transferred to ${currentOwnerTREXGateway}.`);
  } else {
    console.error(`Ownership transfer of TREXGateway failed. Current owner is ${currentOwnerTREXGateway}.`);
  }
  tx = await trexFactoryContract.connect(interactorWallet).transferOwnership(deployedTREXGatewayAddress, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();
  console.log(`Ownership of TREX Factory transferred to TREXGateway.`);
  tx = await oidFactoryContract.connect(interactorWallet).addTokenFactory(deployedTREXFactoryAddress, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();
  console.log(`TREX Factory registered in IdFactory as a Token Factory`);

  // Deploy Gateway contract via ContractsDeployer
  const GatewayFactory = await ethers.getContractFactory('Gateway');
  const gatewayBytecode = GatewayFactory.bytecode;
  args = ethers.utils.defaultAbiCoder.encode(['address', 'address[]'], [deployedOIDFactoryAddress, []]);
  const gatewayBytecodeWithArgs = gatewayBytecode + args.slice(2);
  tx = await contractsDeployer.connect(interactorWallet).deployContract('Gateway', gatewayBytecodeWithArgs, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();

  const deployedGatewayAddress = await contractsDeployer.getContract('Gateway');
  console.log(`Gateway contract deployed to: ${deployedGatewayAddress}`);

  try {
    await run('verify:verify', {
      address: deployedGatewayAddress,
      constructorArguments: [deployedOIDFactoryAddress, []],
      network: chosenNetwork,
    });
    console.log('Gateway verification successful');
  } catch (error) {
    console.error('Gateway verification failed:', error);
  }
  // Recover ownership of Gateway
  tx = await contractsDeployer.connect(interactorWallet).recoverContractOwnership(deployedGatewayAddress, interactorWallet.address, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();
  console.log(`Ownership recovery transaction for Gateway initiated.`);

  // Confirm the ownership transfer
  const gatewayContract = await ethers.getContractAt('Gateway', deployedGatewayAddress, interactorWallet);
  const currentOwnerGateway = await gatewayContract.owner();
  if (currentOwnerGateway.toLowerCase() === interactorWallet.address.toLowerCase()) {
    console.log(`Ownership of Gateway successfully transferred to ${currentOwnerGateway}.`);
  } else {
    console.error(`Ownership transfer of Gateway failed. Current owner is ${currentOwnerGateway}.`);
  }
  tx = await oidFactoryContract.connect(interactorWallet).transferOwnership(deployedGatewayAddress, {
    gasPrice: doubleGasPrice, // Use the doubled gas price for this transaction
  });
  await tx.wait();
  console.log(`Ownership of TREX Factory transferred to TREXGateway.`);
}

// set manually the name of the network on which you want to run the script
// and the address of the ContractsDeployer that you pre-deployed
// normally the address of the ContractsDeployer should ALWAYS be the same in prod
// this ensures consistent addresses for the whole suite of smart contracts
// run the script with command $npx hardhat run scripts/prodDeploy.ts --network chosenNetwork
// change `chosenNetwork` for the network you launch the script on in the command
prodDeploy('avalanche', '0xb52a36D21Bc70156AeD729Ade308F880d1707d47').catch((error) => {
  console.error(error);
  process.exit(1);
});
