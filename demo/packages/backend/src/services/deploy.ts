import { publicClient, walletClient as defaultWalletClient } from '../chain/client.ts';
import { loadArtifact } from '../chain/artifacts.ts';
import { Address, Hex, createWalletClient, http, checksumAddress, isAddressEqual } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { getCfg, putAsset, getUser, putUser } from '../db/store.ts';
import { BigNumber } from 'bignumber.js';
import { registerIdentity } from './identity.ts';
import { CustodyKey, DeployInput, DeployResponse } from '../utils/types.ts';

const filename = fileURLToPath(import.meta.url);
const directory = dirname(filename);
const toChecksum = (address: Address): Address => checksumAddress(address);
const readOrNullSafe = async <T>(fn: () => Promise<T>): Promise<T | null> => fn().catch(() => null);

async function ensureAgent(walletClient: any, contractAddress: Address, contractAbi: any, agentAddress: Address): Promise<boolean> {
  const isAlreadyAgent =
    (await readOrNullSafe(
      () =>
        publicClient.readContract({
          address: contractAddress,
          abi: contractAbi,
          functionName: 'isAgent',
          args: [toChecksum(agentAddress)],
        }) as Promise<boolean>,
    )) === true;

  if (isAlreadyAgent) return true;

  const transaction = await walletClient.writeContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'addAgent',
    args: [toChecksum(agentAddress)],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: transaction });
  return receipt.status === 'success';
}

async function getOrDeployRegistries(ownerWalletClient: any): Promise<{
  identityRegistry: Address;
  claimTopicsRegistry: Address;
  trustedIssuersRegistry: Address;
}> {
  const trexImplementationAuthority = getCfg('trexImplementationAuthority') as Address;
  if (!trexImplementationAuthority) {
    throw new Error('missing config: trexImplementationAuthority');
  }

  let identityRegistryAddress = getCfg('identityRegistryProxy') as Address;
  let claimTopicsRegistryAddress = getCfg('claimTopicsRegistryProxy') as Address;
  let trustedIssuersRegistryAddress = getCfg('trustedIssuersRegistryProxy') as Address;

  const claimTopicsRegistryExists = claimTopicsRegistryAddress
    ? await readOrNullSafe(() =>
        publicClient.readContract({
          address: toChecksum(claimTopicsRegistryAddress),
          abi: loadArtifact('ClaimTopicsRegistry').abi,
          functionName: 'getClaimTopics',
          args: [],
        }),
      )
    : null;

  if (claimTopicsRegistryExists === null) {
    const claimTopicsRegistryTransaction = await ownerWalletClient.deployContract({
      abi: loadArtifact('ClaimTopicsRegistryProxy').abi,
      bytecode: loadArtifact('ClaimTopicsRegistryProxy').bytecode,
      args: [toChecksum(trexImplementationAuthority)],
    });
    const claimTopicsRegistryReceipt = await publicClient.waitForTransactionReceipt({ hash: claimTopicsRegistryTransaction });
    if (claimTopicsRegistryReceipt.status !== 'success' || !claimTopicsRegistryReceipt.contractAddress) {
      throw new Error('ClaimTopicsRegistryProxy deployment failed');
    }
    claimTopicsRegistryAddress = toChecksum(claimTopicsRegistryReceipt.contractAddress as Address);

    const trustedIssuersRegistryTransaction = await ownerWalletClient.deployContract({
      abi: loadArtifact('TrustedIssuersRegistryProxy').abi,
      bytecode: loadArtifact('TrustedIssuersRegistryProxy').bytecode,
      args: [toChecksum(trexImplementationAuthority)],
    });
    const trustedIssuersRegistryReceipt = await publicClient.waitForTransactionReceipt({ hash: trustedIssuersRegistryTransaction });
    if (trustedIssuersRegistryReceipt.status !== 'success' || !trustedIssuersRegistryReceipt.contractAddress) {
      throw new Error('TrustedIssuersRegistryProxy deployment failed');
    }
    trustedIssuersRegistryAddress = toChecksum(trustedIssuersRegistryReceipt.contractAddress as Address);

    const identityRegistryStorageTransaction = await ownerWalletClient.deployContract({
      abi: loadArtifact('IdentityRegistryStorageProxy').abi,
      bytecode: loadArtifact('IdentityRegistryStorageProxy').bytecode,
      args: [toChecksum(trexImplementationAuthority)],
    });
    const identityRegistryStorageReceipt = await publicClient.waitForTransactionReceipt({ hash: identityRegistryStorageTransaction });
    if (identityRegistryStorageReceipt.status !== 'success' || !identityRegistryStorageReceipt.contractAddress) {
      throw new Error('IdentityRegistryStorageProxy deployment failed');
    }
    const identityRegistryStorageAddress = toChecksum(identityRegistryStorageReceipt.contractAddress as Address);

    const identityRegistryTransaction = await ownerWalletClient.deployContract({
      abi: loadArtifact('IdentityRegistryProxy').abi,
      bytecode: loadArtifact('IdentityRegistryProxy').bytecode,
      args: [toChecksum(trexImplementationAuthority), trustedIssuersRegistryAddress, claimTopicsRegistryAddress, identityRegistryStorageAddress],
    });
    const identityRegistryReceipt = await publicClient.waitForTransactionReceipt({ hash: identityRegistryTransaction });
    if (identityRegistryReceipt.status !== 'success' || !identityRegistryReceipt.contractAddress) {
      throw new Error('IdentityRegistryProxy deployment failed');
    }
    identityRegistryAddress = toChecksum(identityRegistryReceipt.contractAddress as Address);

    const bindTransaction = await ownerWalletClient.writeContract({
      address: identityRegistryStorageAddress,
      abi: loadArtifact('IdentityRegistryStorage').abi,
      functionName: 'bindIdentityRegistry',
      args: [identityRegistryAddress],
    });
    const bindReceipt = await publicClient.waitForTransactionReceipt({ hash: bindTransaction });
    if (bindReceipt.status !== 'success') {
      throw new Error('bindIdentityRegistry failed');
    }
  }

  return {
    identityRegistry: toChecksum(identityRegistryAddress),
    claimTopicsRegistry: toChecksum(claimTopicsRegistryAddress),
    trustedIssuersRegistry: toChecksum(trustedIssuersRegistryAddress),
  };
}

async function getOrDeployCompliance(ownerWalletClient: any): Promise<Address> {
  const existingComplianceAddress = getCfg('defaultCompliance') as Address;

  if (existingComplianceAddress) {
    const isValidCompliance = await readOrNullSafe(() =>
      publicClient.readContract({
        address: toChecksum(existingComplianceAddress),
        abi: loadArtifact('ModularCompliance').abi,
        functionName: 'owner',
        args: [],
      }),
    );
    if (isValidCompliance !== null) {
      return toChecksum(existingComplianceAddress);
    }
  }

  const trexImplementationAuthority = getCfg('trexImplementationAuthority') as Address;
  if (!trexImplementationAuthority) {
    throw new Error('missing config: trexImplementationAuthority');
  }

  const modularComplianceTransaction = await ownerWalletClient.deployContract({
    abi: loadArtifact('ModularComplianceProxy').abi,
    bytecode: loadArtifact('ModularComplianceProxy').bytecode,
    args: [toChecksum(trexImplementationAuthority)],
  });
  const modularComplianceReceipt = await publicClient.waitForTransactionReceipt({ hash: modularComplianceTransaction });
  if (modularComplianceReceipt.status !== 'success' || !modularComplianceReceipt.contractAddress) {
    throw new Error('ModularComplianceProxy deployment failed');
  }
  return toChecksum(modularComplianceReceipt.contractAddress as Address);
}

export async function deployAssetSuite(input: DeployInput): Promise<DeployResponse> {
  const response: DeployResponse = {
    status: false,
    message: '',
    error: '',
    token: '',
    identityRegistry: '',
    compliance: '',
    agentManager: '',
    tokenOID: '',
    userIdentity: '',
    totalSupply: '0',
  };

  try {
    const walletsFileContent = await fs.readFile(resolve(directory, '../artifacts/wallets.json'), 'utf8');
    const availableWallets: CustodyKey[] = JSON.parse(walletsFileContent);
    const ownerWalletEntry = availableWallets.find((wallet) => isAddressEqual(toChecksum(wallet.pubAddress), toChecksum(input.owner)));

    if (!ownerWalletEntry) {
      return { ...response, error: `owner ${input.owner} not found in custody key store` };
    }

    const ownerAccount = privateKeyToAccount(ownerWalletEntry.privateKey);
    const ownerWalletClient = createWalletClient({
      account: ownerAccount,
      chain: defaultWalletClient.chain!,
      transport: http(defaultWalletClient.transport.url!),
    });

    const trexImplementationAuthority = getCfg('trexImplementationAuthority') as Address;
    const identityImplementationAuthority = getCfg('identityImplementationAuthority') as Address;

    if (!trexImplementationAuthority) {
      return { ...response, error: 'missing config: trexImplementationAuthority' };
    }
    if (!identityImplementationAuthority) {
      return { ...response, error: 'missing config: identityImplementationAuthority' };
    }

    const registryAddresses = await getOrDeployRegistries(ownerWalletClient);
    response.identityRegistry = registryAddresses.identityRegistry;

    const onchainIdTransaction = await ownerWalletClient.deployContract({
      abi: loadArtifact('IdentityProxy').abi,
      bytecode: loadArtifact('IdentityProxy').bytecode,
      args: [toChecksum(identityImplementationAuthority), toChecksum(input.owner)],
    });
    const onchainIdReceipt = await publicClient.waitForTransactionReceipt({ hash: onchainIdTransaction });
    if (onchainIdReceipt.status !== 'success' || !onchainIdReceipt.contractAddress) {
      return { ...response, error: 'IdentityProxy deployment failed' };
    }
    response.tokenOID = toChecksum(onchainIdReceipt.contractAddress as Address);

    response.compliance = await getOrDeployCompliance(ownerWalletClient);

    const tokenTransaction = await ownerWalletClient.deployContract({
      abi: loadArtifact('TokenProxy').abi,
      bytecode: loadArtifact('TokenProxy').bytecode,
      args: [
        toChecksum(trexImplementationAuthority),
        registryAddresses.identityRegistry,
        response.compliance,
        input.name,
        input.symbol,
        0n,
        response.tokenOID,
      ],
    });
    const tokenReceipt = await publicClient.waitForTransactionReceipt({ hash: tokenTransaction });
    if (tokenReceipt.status !== 'success' || !tokenReceipt.contractAddress) {
      return { ...response, error: 'TokenProxy deployment failed' };
    }
    response.token = toChecksum(tokenReceipt.contractAddress as Address);

    const agentManagerTransaction = await ownerWalletClient.deployContract({
      abi: loadArtifact('AgentManager').abi,
      bytecode: loadArtifact('AgentManager').bytecode,
      args: [response.token],
    });
    const agentManagerReceipt = await publicClient.waitForTransactionReceipt({ hash: agentManagerTransaction });
    if (agentManagerReceipt.status !== 'success' || !agentManagerReceipt.contractAddress) {
      return { ...response, error: 'AgentManager deployment failed' };
    }
    response.agentManager = toChecksum(agentManagerReceipt.contractAddress as Address);

    const addAdminTransaction = await ownerWalletClient.writeContract({
      address: response.agentManager as Address,
      abi: loadArtifact('AgentManager').abi,
      functionName: 'addAgentAdmin',
      args: [toChecksum(input.owner)],
    });
    const addAdminReceipt = await publicClient.waitForTransactionReceipt({ hash: addAdminTransaction });
    if (addAdminReceipt.status !== 'success') {
      return { ...response, error: 'addAgentAdmin failed' };
    }

    const identityRegistryAgents = [response.token as Address, response.agentManager as Address, ownerAccount.address as Address];

    for (const agentAddress of identityRegistryAgents) {
      const agentAddedSuccessfully = await ensureAgent(
        defaultWalletClient,
        registryAddresses.identityRegistry,
        loadArtifact('IdentityRegistry').abi,
        agentAddress,
      );
      if (!agentAddedSuccessfully) {
        return { ...response, error: 'identityRegistry.addAgent failed' };
      }
    }

    const tokenAgents = [response.agentManager as Address, toChecksum(input.owner), ownerAccount.address as Address];

    for (const agentAddress of tokenAgents) {
      const agentAddedSuccessfully = await ensureAgent(ownerWalletClient, response.token as Address, loadArtifact('Token').abi, agentAddress);
      if (!agentAddedSuccessfully) {
        return { ...response, error: 'token.addAgent failed' };
      }
    }

    const unpauseTransaction = await ownerWalletClient.writeContract({
      address: response.token as Address,
      abi: loadArtifact('Token').abi,
      functionName: 'unpause',
      args: [],
    });
    const unpauseReceipt = await publicClient.waitForTransactionReceipt({ hash: unpauseTransaction });
    if (unpauseReceipt.status !== 'success') {
      return { ...response, error: 'unpause failed' };
    }

    const identityRegistryAddress = toChecksum(getCfg('identityRegistryProxy') as Address);
    const existingIdentityAddress = (await publicClient.readContract({
      address: identityRegistryAddress,
      abi: loadArtifact('IdentityRegistry').abi,
      functionName: 'identity',
      args: [toChecksum(input.owner)],
    })) as Address;

    if (existingIdentityAddress && existingIdentityAddress.toLowerCase() !== '0x0000000000000000000000000000000000000000') {
      response.userIdentity = toChecksum(existingIdentityAddress);

      const isVerified = (await publicClient.readContract({
        address: identityRegistryAddress,
        abi: loadArtifact('IdentityRegistry').abi,
        functionName: 'isVerified',
        args: [toChecksum(input.owner)],
      })) as boolean;

      if (!isVerified) {
        return { ...response, error: 'existing identity not verified' };
      }

      const existingUser = getUser.get(toChecksum(input.owner)) as { address: string; identityAddress: string; createdAt: number } | undefined;
      if (!existingUser) {
        putUser.run(toChecksum(input.owner), response.userIdentity, Date.now());
      }
    } else {
      const identityRegistrationResult = await registerIdentity({
        owner: toChecksum(input.owner),
        country: input.country,
      });

      if (!identityRegistrationResult.status || !identityRegistrationResult.isVerified) {
        return { ...response, error: identityRegistrationResult.error || 'identity not verified' };
      }

      response.userIdentity = identityRegistrationResult.userIdentity;

      putUser.run(toChecksum(input.owner), identityRegistrationResult.userIdentity, Date.now());
    }

    if (new BigNumber(input.supply.toString()).isGreaterThan(0)) {
      const mintTransaction = await ownerWalletClient.writeContract({
        address: response.token as Address,
        abi: loadArtifact('Token').abi,
        functionName: 'mint',
        args: [toChecksum(input.owner), input.supply],
      });
      const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintTransaction });
      if (mintReceipt.status !== 'success') {
        return { ...response, error: 'mint failed' };
      }
    }

    const currentTokenOwner = (await publicClient.readContract({
      address: response.token as Address,
      abi: loadArtifact('Token').abi,
      functionName: 'owner',
      args: [],
    })) as Address;

    if (!isAddressEqual(toChecksum(currentTokenOwner), toChecksum(input.owner))) {
      const transferOwnershipTransaction = await ownerWalletClient.writeContract({
        address: response.token as Address,
        abi: loadArtifact('Token').abi,
        functionName: 'transferOwnership',
        args: [toChecksum(input.owner)],
      });
      const transferOwnershipReceipt = await publicClient.waitForTransactionReceipt({ hash: transferOwnershipTransaction });
      if (transferOwnershipReceipt.status !== 'success') {
        return { ...response, error: 'transferOwnership failed' };
      }
    }

    if (!isAddressEqual(ownerAccount.address as Address, toChecksum(input.owner))) {
      const removeAgentTransaction = await ownerWalletClient.writeContract({
        address: response.token as Address,
        abi: loadArtifact('Token').abi,
        functionName: 'removeAgent',
        args: [ownerAccount.address as Address],
      });
      const removeAgentReceipt = await publicClient.waitForTransactionReceipt({ hash: removeAgentTransaction });
      if (removeAgentReceipt.status !== 'success') {
        return { ...response, error: 'removeAgent failed' };
      }
    }

    const currentTotalSupply = (await publicClient.readContract({
      address: response.token as Address,
      abi: loadArtifact('Token').abi,
      functionName: 'totalSupply',
      args: [],
    })) as bigint;

    response.totalSupply = currentTotalSupply.toString();

    putAsset.run(
      toChecksum(input.owner),
      input.name,
      input.symbol,
      Number(currentTotalSupply),
      publicClient.chain!.id,
      response.token as Address,
      response.identityRegistry,
      response.compliance as Address,
      response.agentManager as Address,
      Date.now(),
    );
    response.status = true;
    response.message = 'Asset suite deployed';

    return response;
  } catch (error: any) {
    return { ...response, error: error?.message || 'deploy failed' };
  }
}
