import { defineStore } from 'pinia';
import { api, type Address, type GetUserResponse } from '../lib/api';
import { useSession } from './session';

export type AssetRow = { id: string; name: string; symbol: string; token: Address; supply: string };
export type TxKind = 'Deploy' | 'Transfer';
export type Tx = {
  kind: TxKind;
  assetId: string;
  txHash: string;
  at: number;
  meta?: { symbol: string } | { to: Address; amount: string | number } | { amount: string | number } | Record<string, unknown>;
};

export const useAssets = defineStore('assets', {
  persist: { storage: sessionStorage },
  state: () => ({
    items: [] as AssetRow[],
    txs: [] as Tx[],
  }),
  getters: {
    byId: (state) => (token: Address | string) => state.items.find((x) => x.token === token),
  },
  actions: {
    async loadForUser() {
      const s = useSession();
      if (!s.address) return;
      const data: GetUserResponse = await api.getUser(s.address);
      const list = data.assets ?? [];
      this.items = list.map((a) => ({
        id: a.token,
        name: (a as any).name ?? '',
        symbol: a.symbol ?? '',
        token: a.token as Address,
        supply: (a.totalSupply ?? a.supply ?? 0).toString(),
        balance: a.balance,
      }));
    },
    pushTx(t: Omit<Tx, 'at'>) {
      this.txs.unshift({ ...t, at: Date.now() });
      this.txs = this.txs.slice(0, 50);
    },
  },
});
