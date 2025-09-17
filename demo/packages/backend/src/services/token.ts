import { publicClient, walletClient as defaultWalletClient } from '../chain/client.ts';
import { Address, Hex, checksumAddress, createWalletClient, http, isAddressEqual, WaitForTransactionReceiptReturnType } from 'viem';
import { loadArtifact } from '../chain/artifacts.ts';
import BigNumber from 'bignumber.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import * as fs from 'fs/promises';
import { privateKeyToAccount } from 'viem/accounts';
import { CustodyKey, PreflightParams, PreflightResult, ValidationCheck, ComplianceCheckResults } from '../utils/types.ts';

const filename = fileURLToPath(import.meta.url);
const directory = dirname(filename);

async function loadWalletClientForAddress(address: Address) {
  const walletsFileContent = await fs.readFile(resolve(directory, '../artifacts/wallets.json'), 'utf8');
  const availableWallets: CustodyKey[] = JSON.parse(walletsFileContent);
  const walletEntry = availableWallets.find((wallet) => isAddressEqual(checksumAddress(wallet.pubAddress), checksumAddress(address)));
  if (!walletEntry) {
    throw new Error(`address ${address} not found in custody key store`);
  }
  const account = privateKeyToAccount(walletEntry.privateKey);
  return createWalletClient({
    account,
    chain: defaultWalletClient.chain!,
    transport: http(defaultWalletClient.transport.url!),
  });
}

async function convertToSmallestUnits(tokenAddress: Address, humanReadableAmount: string): Promise<bigint> {
  const tokenAbi = loadArtifact('Token').abi;
  const decimals = (await publicClient.readContract({
    address: tokenAddress,
    abi: tokenAbi,
    functionName: 'decimals',
    args: [],
  })) as number;
  const scaleFactor = new BigNumber(10).pow(decimals);
  const smallestUnits = new BigNumber(humanReadableAmount).multipliedBy(scaleFactor).integerValue(BigNumber.ROUND_DOWN);
  return BigInt(smallestUnits.toFixed(0));
}

async function readTokenConfiguration(tokenAddress: Address) {
  const tokenAbi = loadArtifact('Token').abi;
  const [paused, identityRegistry, compliance, decimals] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress,
      abi: tokenAbi,
      functionName: 'paused',
      args: [],
    }) as Promise<boolean>,
    publicClient.readContract({
      address: tokenAddress,
      abi: tokenAbi,
      functionName: 'identityRegistry',
      args: [],
    }) as Promise<Address>,
    publicClient.readContract({
      address: tokenAddress,
      abi: tokenAbi,
      functionName: 'compliance',
      args: [],
    }) as Promise<Address>,
    publicClient.readContract({
      address: tokenAddress,
      abi: tokenAbi,
      functionName: 'decimals',
      args: [],
    }) as Promise<number>,
  ]);
  return {
    paused,
    identityRegistry: checksumAddress(identityRegistry),
    compliance: checksumAddress(compliance),
    decimals,
  };
}

async function checkCanTransferCompliance(
  complianceAddress: Address,
  fromAddress: Address,
  toAddress: Address,
  transferAmount: bigint,
): Promise<ComplianceCheckResults> {
  const modularComplianceAbi = loadArtifact('ModularCompliance').abi;
  try {
    const canTransferResult = (await publicClient.readContract({
      address: complianceAddress,
      abi: modularComplianceAbi,
      functionName: 'canTransfer',
      args: [fromAddress, toAddress, transferAmount],
    })) as boolean;
    return { canTransfer: canTransferResult === true };
  } catch (error: any) {
    return { canTransfer: false, errorMessage: error?.message || 'canTransfer read failed' };
  }
}

export async function preflightTransfer(parameters: PreflightParams): Promise<PreflightResult> {
  const tokenAddress = checksumAddress(parameters.tokenAddress);
  const fromAddress = checksumAddress(parameters.fromAddress);
  const toAddress = checksumAddress(parameters.toAddress);

  const tokenAbi = loadArtifact('Token').abi;
  const identityRegistryAbi = loadArtifact('IdentityRegistry').abi;

  const tokenConfiguration = await readTokenConfiguration(tokenAddress);
  const identityRegistryAddress = parameters.identityRegistryAddress
    ? checksumAddress(parameters.identityRegistryAddress)
    : tokenConfiguration.identityRegistry;

  const transferAmountInSmallestUnits = await convertToSmallestUnits(tokenAddress, parameters.amount);

  const [fromBalance, fromAddressFrozen, toAddressFrozen, senderVerified, recipientVerified] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress,
      abi: tokenAbi,
      functionName: 'balanceOf',
      args: [fromAddress],
    }) as Promise<bigint>,
    publicClient.readContract({
      address: tokenAddress,
      abi: tokenAbi,
      functionName: 'isFrozen',
      args: [fromAddress],
    }) as Promise<boolean>,
    publicClient.readContract({
      address: tokenAddress,
      abi: tokenAbi,
      functionName: 'isFrozen',
      args: [toAddress],
    }) as Promise<boolean>,
    publicClient.readContract({
      address: identityRegistryAddress,
      abi: identityRegistryAbi,
      functionName: 'isVerified',
      args: [fromAddress],
    }) as Promise<boolean>,
    publicClient.readContract({
      address: identityRegistryAddress,
      abi: identityRegistryAbi,
      functionName: 'isVerified',
      args: [toAddress],
    }) as Promise<boolean>,
  ]);

  const frozenTokensAmount = (await publicClient.readContract({
    address: tokenAddress,
    abi: tokenAbi,
    functionName: 'getFrozenTokens',
    args: [fromAddress],
  })) as bigint;

  const availableBalance = BigInt(fromBalance) - BigInt(frozenTokensAmount);
  const hasSufficientBalance = availableBalance >= transferAmountInSmallestUnits && transferAmountInSmallestUnits > 0n;

  let complianceCheck: ComplianceCheckResults = { canTransfer: false, errorMessage: 'skipped' };
  if (!tokenConfiguration.paused && !fromAddressFrozen && !toAddressFrozen && senderVerified && recipientVerified && hasSufficientBalance) {
    complianceCheck = await checkCanTransferCompliance(tokenConfiguration.compliance, fromAddress, toAddress, transferAmountInSmallestUnits);
  }

  const validationChecks: ValidationCheck[] = [
    { name: 'token-paused', passed: tokenConfiguration.paused === false },
    { name: 'sender-frozen', passed: fromAddressFrozen === false },
    { name: 'recipient-frozen', passed: toAddressFrozen === false },
    { name: 'sender-verified', passed: senderVerified },
    { name: 'recipient-verified', passed: recipientVerified },
    {
      name: 'balance-sufficient',
      passed: hasSufficientBalance,
      details: `free=${availableBalance.toString()} need=${transferAmountInSmallestUnits.toString()}`,
    },
    {
      name: 'compliance-canTransfer',
      passed: complianceCheck.canTransfer,
      details: complianceCheck.errorMessage,
    },
  ];

  const transferAllowed = validationChecks.every((check) => check.passed);

  return {
    allowed: transferAllowed,
    checks: validationChecks,
    wiring: {
      token: tokenAddress,
      identityRegistry: identityRegistryAddress,
      compliance: tokenConfiguration.compliance,
      decimals: tokenConfiguration.decimals,
      paused: tokenConfiguration.paused,
    },
  };
}

export async function transfer(parameters: PreflightParams): Promise<WaitForTransactionReceiptReturnType> {
  const tokenAbi = loadArtifact('Token').abi;
  const tokenAddress = checksumAddress(parameters.tokenAddress);
  const toAddress = checksumAddress(parameters.toAddress);

  const [walletClient, transferAmountInSmallestUnits, preflightResult] = await Promise.all([
    loadWalletClientForAddress(checksumAddress(parameters.fromAddress)),
    convertToSmallestUnits(tokenAddress, parameters.amount),
    preflightTransfer(parameters),
  ]);

  if (!preflightResult.allowed) {
    const failedCheckNames = preflightResult.checks
      .filter((check: any) => !check.passed)
      .map((check: any) => check.name)
      .join(',');
    throw new Error(`preflight failed: ${failedCheckNames}`);
  }

  const transactionHash = await walletClient.writeContract({
    address: tokenAddress,
    abi: tokenAbi,
    functionName: 'transfer',
    args: [toAddress, transferAmountInSmallestUnits],
  });
  return await publicClient.waitForTransactionReceipt({ hash: transactionHash });
}

export async function mint(parameters: PreflightParams) {
  const tokenAbi = loadArtifact('Token').abi;
  const tokenAddress = checksumAddress(parameters.tokenAddress);
  const toAddress = checksumAddress(parameters.fromAddress);

  const [walletClient, mintAmountInSmallestUnits] = await Promise.all([
    loadWalletClientForAddress(toAddress),
    convertToSmallestUnits(tokenAddress, parameters.amount),
  ]);

  const transactionHash = await walletClient.writeContract({
    address: tokenAddress,
    abi: tokenAbi,
    functionName: 'mint',
    args: [toAddress, mintAmountInSmallestUnits],
  });
  return await publicClient.waitForTransactionReceipt({ hash: transactionHash });
}

export async function probeIdentityDetails(identityRegistryAddress: Address, ownerAddress: Address) {
  const identityRegistry = checksumAddress(identityRegistryAddress);
  const owner = checksumAddress(ownerAddress);
  const identityRegistryAbi = loadArtifact('IdentityRegistry').abi;
  const identityAbi = loadArtifact('Identity').abi;
  const claimTopicsRegistryAbi = loadArtifact('ClaimTopicsRegistry').abi;
  const trustedIssuersRegistryAbi = loadArtifact('TrustedIssuersRegistry').abi;
  const claimIssuerAbi = loadArtifact('ClaimIssuer').abi;

  const claimTopicsRegistry = (await publicClient.readContract({
    address: identityRegistry,
    abi: identityRegistryAbi,
    functionName: 'claimTopicsRegistry',
    args: [],
  })) as Address;

  const trustedIssuersRegistry = (await publicClient.readContract({
    address: identityRegistry,
    abi: identityRegistryAbi,
    functionName: 'trustedIssuersRegistry',
    args: [],
  })) as Address;

  const onchainIdentityAddress = (await publicClient.readContract({
    address: identityRegistry,
    abi: identityRegistryAbi,
    functionName: 'identity',
    args: [owner],
  })) as Address;

  const isIdentityMapped = onchainIdentityAddress.toLowerCase() !== '0x0000000000000000000000000000000000000000';
  const requiredClaimTopics = (await publicClient.readContract({
    address: claimTopicsRegistry,
    abi: claimTopicsRegistryAbi,
    functionName: 'getClaimTopics',
    args: [],
  })) as bigint[];

  const claimValidationResults = [];
  if (isIdentityMapped) {
    for (const claimTopic of requiredClaimTopics) {
      const claimIds = (await publicClient.readContract({
        address: onchainIdentityAddress,
        abi: identityAbi,
        functionName: 'getClaimIdsByTopic',
        args: [claimTopic],
      })) as Hex[];

      let hasValidClaim = false;
      for (const claimId of claimIds) {
        const [, , claimIssuer, claimSignature, claimData] = (await publicClient.readContract({
          address: onchainIdentityAddress,
          abi: identityAbi,
          functionName: 'getClaim',
          args: [claimId],
        })) as [bigint, bigint, Address, Hex, Hex, string];

        const isIssuerTrusted = (await publicClient.readContract({
          address: trustedIssuersRegistry,
          abi: trustedIssuersRegistryAbi,
          functionName: 'isTrustedIssuer',
          args: [claimIssuer],
        })) as boolean;

        let isIssuerAuthorized = false;
        if (isIssuerTrusted) {
          const issuerAuthorizedTopics = (await publicClient.readContract({
            address: trustedIssuersRegistry,
            abi: trustedIssuersRegistryAbi,
            functionName: 'getTrustedIssuerClaimTopics',
            args: [claimIssuer],
          })) as bigint[];
          isIssuerAuthorized = issuerAuthorizedTopics.some((authorizedTopic) => authorizedTopic === claimTopic);
        }

        let isSignatureValid = false;
        if (isIssuerTrusted && isIssuerAuthorized) {
          isSignatureValid = (await publicClient.readContract({
            address: claimIssuer,
            abi: claimIssuerAbi,
            functionName: 'isClaimValid',
            args: [onchainIdentityAddress, claimTopic, claimSignature, claimData],
          })) as boolean;
        }

        if (isIssuerTrusted && isIssuerAuthorized && isSignatureValid) {
          hasValidClaim = true;
          break;
        }
      }
      claimValidationResults.push({
        topic: claimTopic,
        validClaimPresent: hasValidClaim,
        claimCount: claimIds.length,
      });
    }
  }

  const isVerified = isIdentityMapped
    ? ((await publicClient.readContract({
        address: identityRegistry,
        abi: identityRegistryAbi,
        functionName: 'isVerified',
        args: [owner],
      })) as boolean)
    : false;

  return {
    owner,
    identityRegistry,
    onchainId: isIdentityMapped ? onchainIdentityAddress : null,
    requiredTopics: requiredClaimTopics,
    perTopic: claimValidationResults,
    isVerified,
  };
}
