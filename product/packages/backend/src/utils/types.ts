import { Address, Hex, createWalletClient, http, checksumAddress, isAddressEqual } from 'viem';

export type DeployInput = {
  owner: Address;
  name: string;
  symbol: string;
  supply: bigint;
  country?: number;
  description?: string;
};

export type DeployResponse = {
  status: boolean;
  message: string;
  error: string;
  token: string;
  identityRegistry: string;
  compliance: string;
  agentManager: string;
  tokenOID: string;
  userIdentity: string;
  totalSupply: string;
};

export type CustodyKey = { pubAddress: Address; privateKey: `0x${string}` };
export type SetupIdentityInput = { owner: Address; country?: string };
export type SetupIdentityResponse = {
  status: boolean;
  message: string;
  error: string;
  owner: string;
  userIdentity: string;
  issuer: string;
  identityRegistry: string;
  claimTopicsRegistry: string;
  trustedIssuersRegistry: string;
  isVerified: boolean;
};

export type PreflightResult = {
  allowed: boolean;
  checks: ValidationCheck[];
  wiring: {
    token: Address;
    identityRegistry: Address;
    compliance: Address;
    decimals: number;
    paused: boolean;
  };
};

export type PreflightParams = {
  tokenAddress: Address;
  identityRegistryAddress?: Address;
  fromAddress: Address;
  toAddress: Address;
  amount: string;
};

export type ComplianceCheckResults = { canTransfer: boolean; errorMessage?: string };

export type ValidationCheck = { name: string; passed: boolean; details?: string };

export type Asset = {
  id: string;
  token: string;
  identityRegistry: string;
  compliance: string;
  agentManager: string;
  tokenOID: string;
  userIdentity: string;
  totalSupply: string;
};
