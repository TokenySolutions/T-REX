const BASE = import.meta.env.VITE_API_BASE as string;

async function sendAndWait<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error((err as any)?.error || res.statusText), {
      status: res.status,
      data: err,
    });
  }
  return res.json();
}

export type Hex = `0x${string}`;
export type Address = Hex;

export type UserIdentity = {
  verified: boolean;
  identityAddress?: Address;
};

export type UserAssetSummary = {
  token: Address;
  symbol: string;
  supply: number;
  name: string;
  totalSupply: string;
  paused: boolean;
  balance: string;
};

export type GetUserResponse = {
  address: Address;
  identity: UserIdentity;
  assets: UserAssetSummary[];
};

export type TokeniseRequest = {
  ownerAddress: Address;
  name: string;
  symbol: string;
  supply: number;
  description?: string;
};

export type AssetSuite = {
  status: boolean;
  message: string;
  error: string;
  id: string;
  token: Address;
  identityRegistry: Address;
  compliance: Address;
  agentManager: Address;
  tokenOID: Address;
  userIdentity: Address;
  totalSupply: string;
  name: string;
};

export type TokeniseResponse = {
  asset: AssetSuite;
};

export type GetAssetResponse = {
  asset: Record<string, unknown>;
};

export type TransferRequest = {
  from: Address;
  to: Address;
  amount: string;
  token: Address;
};

export type TxResult = {
  txHash: Hex;
  status: string;
  block: number;
};

export type TxResultRaw = {
  transactionHash: Hex;
  status: string;
  blockNumber: number;
};

const normalizeTx = (r: TxResultRaw): TxResult => ({
  txHash: r.transactionHash,
  status: r.status,
  block: r.blockNumber,
});

export type MintRequest = {
  owner: Address;
  amount: string;
  token: Address;
};

export type RegisterIdentityRequest = {
  owner: Address;
  country: string;
};

export type RegisterIdentityResponse = {
  status: boolean;
  message: string;
  error: string;
  owner: Address;
  userIdentity: Address;
  issuer: Address;
  identityRegistry: Address;
  claimTopicsRegistry: Address;
  trustedIssuersRegistry: Address;
  isVerified: boolean;
};

export const api = {
  async getUser(addr: Address) {
    return sendAndWait<GetUserResponse>(await fetch(`${BASE}/v1/users/${addr}`));
  },
  async createAsset(body: TokeniseRequest) {
    return sendAndWait<TokeniseResponse>(
      await fetch(`${BASE}/v1/assets/tokenise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
  },
  async getAsset(id: string) {
    return sendAndWait<GetAssetResponse>(await fetch(`${BASE}/v1/assets/${id}`));
  },
  async transfer(body: TransferRequest) {
    return sendAndWait<TxResultRaw>(
      await fetch(`${BASE}/v1/assets/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    ).then(normalizeTx);
  },
  async mint(body: MintRequest) {
    return sendAndWait<TxResultRaw>(
      await fetch(`${BASE}/v1/assets/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    ).then(normalizeTx);
  },
  async registerIdentity(body: RegisterIdentityRequest) {
    return sendAndWait<RegisterIdentityResponse>(
      await fetch(`${BASE}/v1/assets/registerIdentity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
  },
};
