import { createPublicClient, createWalletClient, custom, http, getAddress } from 'viem';

const RPC = import.meta.env.VITE_RPC_HTTP as string;
const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID);

export function hasProvider(): boolean {
  return typeof (window as any).ethereum !== 'undefined';
}

export function makeClients() {
  const transport = hasProvider() ? custom((window as any).ethereum) : http(RPC);
  const publicClient = createPublicClient({
    transport,
    chain: { id: CHAIN_ID, name: 'POC', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [RPC] } } } as any,
  });
  const walletClient = hasProvider() ? createWalletClient({ transport, chain: publicClient.chain }) : undefined;
  return { publicClient, walletClient };
}

export async function connectWallet(): Promise<{ address: `0x${string}`; chainId: number }> {
  if (!hasProvider()) throw new Error('No injected wallet');
  const ethereum = (window as any).ethereum;
  const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
  const chainIdHex: string = await ethereum.request({ method: 'eth_chainId' });
  return { address: getAddress(accounts[0] as `0x${string}`), chainId: parseInt(chainIdHex, 16) };
}
