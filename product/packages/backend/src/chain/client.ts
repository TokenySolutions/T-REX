import { createPublicClient, createWalletClient, http, defineChain, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const CHAIN_ID = Number(process.env.CHAIN_ID);
if (!process.env.RPC_HTTP || !process.env.CUSTODIAL_PRIVATE_KEY || !CHAIN_ID) {
  throw new Error(`Missing RPC_HTTP, CUSTODIAL_PRIVATE_KEY or CHAIN_ID in env`);
}

export const chain = defineChain({
  id: CHAIN_ID,
  name: 'POC',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [process.env.RPC_HTTP], webSocket: process.env.RPC_WS ? [process.env.RPC_WS] : [] } },
});

export const publicClient = createPublicClient({
  chain,
  transport: http(process.env.RPC_HTTP),
});

const account = privateKeyToAccount(process.env.CUSTODIAL_PRIVATE_KEY as `0x${string}`);

export const walletClient = createWalletClient({
  account,
  chain,
  transport: http(process.env.RPC_HTTP),
});

export const checksum = (addr: string) => {
  return getAddress(addr as `0x${string}`);
};
