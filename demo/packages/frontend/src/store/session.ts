import { defineStore } from 'pinia';
import { connectWallet, makeClients } from '../lib/viem';
import { api, type Address, type GetUserResponse } from '../lib/api';
import { checksumAddress, formatEther } from 'viem';

type Eth = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
};

export const useSession = defineStore('session', {
  persist: { storage: sessionStorage },
  state: () => ({
    address: null as Address | null,
    chainId: null as number | null,
    balanceEth: '0',
    user: null as Pick<GetUserResponse, 'identity'> | null,
    _bound: false as boolean,
    _pollId: null as number | null,
  }),
  actions: {
    async connect() {
      const { address, chainId } = await connectWallet();
      this.address = address as Address;
      this.chainId = chainId;
      await this.refreshBalance();
      await this.fetchUser();
      await this.bindProvider();
    },

    async bindProvider() {
      if (this._bound) return;
      const eth = (window as any).ethereum as Eth | undefined;
      if (!eth?.request) return;

      const onAccountsChanged = (accounts: string[]) => {
        const next = (accounts?.[0] ?? null) as Address | null;
        if (!next || !this.address) return this.disconnect();
        if (checksumAddress(next) !== checksumAddress(this.address)) this.disconnect();
      };

      const onChainChanged = (_hexId: string) => {
        this.disconnect();
      };

      const onDisconnect = () => this.disconnect();

      eth.on('accountsChanged', onAccountsChanged);
      eth.on('chainChanged', onChainChanged);
      eth.on('disconnect', onDisconnect);
      this._bound = true;

      if (this._pollId == null) {
        this._pollId = window.setInterval(async () => {
          try {
            const accounts = (await eth.request({ method: 'eth_accounts' })) as string[];
            const next = (accounts?.[0] ?? null) as Address | null;
            const curr = this.address;
            if ((curr ? curr.toLowerCase() : null) !== (next ? next.toLowerCase() : null)) this.disconnect();
          } catch {}
        }, 2000);
      }
    },

    async refreshBalance() {
      if (!this.address) return;
      const { publicClient } = makeClients();
      const balance = await publicClient.getBalance({ address: this.address });
      this.balanceEth = formatEther(balance);
    },

    async fetchUser() {
      if (!this.address) return;
      const data = await api.getUser(this.address);
      this.user = { identity: data.identity };
    },

    disconnect() {
      this.address = null;
      this.chainId = null;
      this.balanceEth = '0';
      this.user = null;
    },
  },
});
