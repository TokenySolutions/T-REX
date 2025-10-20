import { publicClient, walletClient as defaultWalletClient } from '../chain/client.ts';
import { loadArtifact } from '../chain/artifacts.ts';
import { checksumAddress, createWalletClient, encodeAbiParameters, http, keccak256, stringToHex } from 'viem';
import type { Address, Hex, Abi, Account, WalletClient, Transport, Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { getCfg } from '../db/store.ts';
import { CustodyKey, SetupIdentityResponse, SetupIdentityInput } from '../utils/types.ts';

const filename = fileURLToPath(import.meta.url);
const directory = dirname(filename);
const toChecksum = (a: Address): Address => checksumAddress(a);

let custodyCache: Map<Address, CustodyKey> | null = null;
const walletCache = new Map<Address, WalletClient<Transport, Chain, Account>>();

async function loadCustodyStore(): Promise<Map<Address, CustodyKey>> {
  if (custodyCache) return custodyCache;
  const raw = await fs.readFile(resolve(directory, '../artifacts/wallets.json'), 'utf8');
  const entries = JSON.parse(raw) as CustodyKey[];
  custodyCache = new Map(entries.map((e) => [toChecksum(e.pubAddress), e]));
  return custodyCache;
}

async function getUserWalletClient(addr: Address): Promise<WalletClient<Transport, Chain, Account>> {
  const key = toChecksum(addr);
  const cached = walletCache.get(key);
  if (cached) return cached;
  const store = await loadCustodyStore();
  const entry = store.get(key);
  if (!entry) throw new Error(`owner ${addr} not found in custody key store`);
  const account = privateKeyToAccount(entry.privateKey);
  const client = createWalletClient({
    account,
    chain: defaultWalletClient.chain!,
    transport: http((defaultWalletClient as any).transport?.url ?? undefined),
  });
  walletCache.set(key, client as WalletClient<Transport, Chain, Account>);
  return client as WalletClient<Transport, Chain, Account>;
}

async function deployIdentityProxy(
  wallet: WalletClient<Transport, Chain, Account>,
  implementationAuthorityAddress: Address,
  managementKey: Address,
): Promise<Address> {
  const art = loadArtifact('IdentityProxy');
  const tx = await wallet.deployContract({
    abi: art.abi as Abi,
    bytecode: art.bytecode as Hex,
    args: [toChecksum(implementationAuthorityAddress), toChecksum(managementKey)],
  });
  const rc = await publicClient.waitForTransactionReceipt({ hash: tx });
  if (rc.status !== 'success' || !rc.contractAddress) throw new Error('deployment reverted: IdentityProxy');
  return toChecksum(rc.contractAddress as Address);
}

export async function registerIdentity(input: SetupIdentityInput): Promise<SetupIdentityResponse> {
  const response: SetupIdentityResponse = {
    status: false,
    message: '',
    error: '',
    owner: toChecksum(input.owner),
    userIdentity: '',
    issuer: '',
    identityRegistry: '',
    claimTopicsRegistry: '',
    trustedIssuersRegistry: '',
    isVerified: false,
  };

  try {
    const identityImplementationAuthority = getCfg('identityImplementationAuthority');
    const identityRegistryProxy = getCfg('identityRegistryProxy');
    const claimTopicsRegistryProxy = getCfg('claimTopicsRegistryProxy');
    const trustedIssuersRegistryProxy = getCfg('trustedIssuersRegistryProxy');
    const trustedIssuer = getCfg('trustedIssuer');

    if (!identityImplementationAuthority) return { ...response, error: 'config missing: identityImplementationAuthority' };
    if (!identityRegistryProxy) return { ...response, error: 'config missing: identityRegistryProxy' };
    if (!claimTopicsRegistryProxy) return { ...response, error: 'config missing: claimTopicsRegistryProxy' };
    if (!trustedIssuersRegistryProxy) return { ...response, error: 'config missing: trustedIssuersRegistryProxy' };
    if (!trustedIssuer) return { ...response, error: 'config missing: trustedIssuer' };

    const ia = toChecksum(identityImplementationAuthority as Address);
    const ir = toChecksum(identityRegistryProxy as Address);
    const ctr = toChecksum(claimTopicsRegistryProxy as Address);
    const tir = toChecksum(trustedIssuersRegistryProxy as Address);
    const issuer = toChecksum(trustedIssuer as Address);

    response.identityRegistry = ir;
    response.claimTopicsRegistry = ctr;
    response.trustedIssuersRegistry = tir;
    response.issuer = issuer;

    const irAbi = loadArtifact('IdentityRegistry').abi as Abi;
    const idAbi = loadArtifact('Identity').abi as Abi;

    const owner = toChecksum(input.owner);

    const existingIdentityAddress = (await publicClient.readContract({
      address: ir,
      abi: irAbi,
      functionName: 'identity',
      args: [owner],
    })) as Address;

    let identityAddr: Address;

    if (existingIdentityAddress && existingIdentityAddress.toLowerCase() !== '0x0000000000000000000000000000000000000000') {
      identityAddr = toChecksum(existingIdentityAddress);
      response.userIdentity = identityAddr;

      const isVerified = (await publicClient.readContract({
        address: ir,
        abi: irAbi,
        functionName: 'isVerified',
        args: [owner],
      })) as boolean;

      response.isVerified = isVerified;
      response.status = isVerified;
      response.message = isVerified ? 'Identity already exists and verified' : 'Identity exists but not verified';

      if (isVerified) {
        return response;
      }
    } else {
      identityAddr = await deployIdentityProxy(
        defaultWalletClient as WalletClient<Transport, Chain, Account>,
        ia,
        defaultWalletClient.account!.address,
      );
      response.userIdentity = identityAddr;

      const regTx = await defaultWalletClient.writeContract({
        address: ir,
        abi: irAbi,
        functionName: 'registerIdentity',
        args: [owner, identityAddr, BigInt(input.country ?? 710)],
      });
      const regRc = await publicClient.waitForTransactionReceipt({ hash: regTx });
      if (regRc.status !== 'success') return { ...response, error: 'reverted: registerIdentity' };
    }

    const claimData = stringToHex('Some claim public data.');

    const ctrAbi = loadArtifact('ClaimTopicsRegistry').abi as Abi;
    const requiredTopics = (await publicClient.readContract({
      address: ctr,
      abi: ctrAbi,
      functionName: 'getClaimTopics',
      args: [],
    })) as bigint[];

    for (const topic of requiredTopics) {
      const expectedClaimId = keccak256(encodeAbiParameters([{ type: 'address' }, { type: 'uint256' }], [issuer, topic]));

      let claimExists = false;
      try {
        const existingClaim = (await publicClient.readContract({
          address: identityAddr,
          abi: idAbi,
          functionName: 'getClaim',
          args: [expectedClaimId],
        })) as [bigint, bigint, Address, Hex, Hex, string];

        claimExists = existingClaim[0] === topic;
      } catch {
        claimExists = false;
      }

      if (!claimExists) {
        const digest = keccak256(
          encodeAbiParameters([{ type: 'address' }, { type: 'uint256' }, { type: 'bytes' }], [identityAddr, topic, claimData as Hex]),
        );

        const signature = await defaultWalletClient.signMessage({
          message: { raw: digest },
        });

        const claimTx = await defaultWalletClient.writeContract({
          address: identityAddr,
          abi: idAbi,
          functionName: 'addClaim',
          args: [topic, 1n, issuer, signature, claimData as Hex, '' as Hex],
        });

        const claimRc = await publicClient.waitForTransactionReceipt({ hash: claimTx });
        if (claimRc.status !== 'success') return { ...response, error: `reverted: addClaim topic ${topic}` };
      }
    }

    const isVerified = (await publicClient.readContract({
      address: ir,
      abi: irAbi,
      functionName: 'isVerified',
      args: [owner],
    })) as boolean;

    response.isVerified = isVerified;
    response.status = isVerified;
    response.message = isVerified ? 'Identity created and verified' : 'Identity created but not verified';

    return response;
  } catch (error: any) {
    return {
      ...response,
      error: error?.message || 'identity setup failed',
    };
  }
}

export async function performUserAction(
  userAddress: Address,
  contractAddress: Address,
  contractAbi: Abi,
  functionName: string,
  args: unknown[] = [],
) {
  const userWallet = await getUserWalletClient(userAddress);
  const tx = await userWallet.writeContract({
    address: toChecksum(contractAddress),
    abi: contractAbi,
    functionName,
    args,
  });
  return await publicClient.waitForTransactionReceipt({ hash: tx });
}
