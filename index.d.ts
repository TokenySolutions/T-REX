type ContractJSON = {
  _format: string;
  contractName: string;
  sourcename: string;
  abi: any[];
  bytecode: string;
  deployedBytecode: string;
  linkReferences: any;
}

export namespace contracts {
  // Token
  export const Token: ContractJSON;
  export const TokenStorage: ContractJSON;
  // Roles
  export const AgentRole: ContractJSON;
  export const AgentRoleUpgradeable: ContractJSON;
  export const Roles: ContractJSON;
  // Roles/permissioning/agent
  export const AgentManager: ContractJSON;
  export const AgentRoles: ContractJSON;
  export const AgentRolesUpgradeable: ContractJSON;
  // Roles/permissioning/owner
  export const OwnerManager: ContractJSON;
  export const OwnerRoles: ContractJSON;
  export const OwnerRolesUpgradeable: ContractJSON;
  // registry
  export const ClaimTopicsRegistry: ContractJSON;
  export const IdentityRegistry: ContractJSON;
  export const IdentityRegistryStorage: ContractJSON;
  export const TrustedIssuersRegistry: ContractJSON;
  // registry/Storage
  export const CTRStorage: ContractJSON;
  export const IRSStorage: ContractJSON;
  export const IRStorage: ContractJSON;
  export const TIRStorage: ContractJSON;
  // proxy
  export const AbstractProxy: ContractJSON;
  export const ClaimTopicsRegistryProxy: ContractJSON;
  export const IdentityRegistryProxy: ContractJSON;
  export const IdentityRegistryStorageProxy: ContractJSON;
  export const ModularComplianceProxy: ContractJSON;
  export const TokenProxy: ContractJSON;
  export const TrustedIssuersRegistryProxy: ContractJSON;
  // proxy/authority
  export const TREXImplementationAuthority: ContractJSON;
  // factory
  export const TREXFactory: ContractJSON;
  // gateway
  export const TREXGateway: ContractJSON;
  // DVD
  export const DVDTransferManager: ContractJSON;
  // DVA
  export const DVATransferManager: ContractJSON;
  // compliance
  export const MCStorage: ContractJSON;
  export const ModularCompliance: ContractJSON;
  // compliance/modular/modules
  export const AbstractModule: ContractJSON;
  export const ConditionalTransferModule: ContractJSON;
  export const CountryAllowModule: ContractJSON;
  export const CountryRestrictModule: ContractJSON;
  export const MaxBalanceModule: ContractJSON;
  export const ExchangeMonthlyLimitsModule: ContractJSON;
  export const TimeExchangeLimitsModule: ContractJSON;
  export const TimeTransfersLimitsModule: ContractJSON;
  export const SupplyLimitModule: ContractJSON;
  export const TransferFeesModule: ContractJSON;
  export const TransferRestrictModule: ContractJSON;
}

export namespace interfaces {
  export const IToken: ContractJSON;
  export const IClaimTopicsRegistry: ContractJSON;
  export const IIdentityRegistry: ContractJSON;
  export const IIdentityRegistryStorage: ContractJSON;
  export const ITrustedIssuersRegistry: ContractJSON;
  export const IProxy: ContractJSON;
  export const IAFactory: ContractJSON;
  export const IIAFactory: ContractJSON;
  export const ITREXImplementationAuthority: ContractJSON;
  export const ITREXFactory: ContractJSON;
  export const ITREXGateway: ContractJSON;
  export const IModularCompliance: ContractJSON;
  export const IModule: ContractJSON;

  export const IDVATransferManager: ContractJSON;
}
