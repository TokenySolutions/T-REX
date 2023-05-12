# Change Log

All notable changes to this project will be documented in this file.

## [4.0.1]

### Update

- Compliance module view methods no longer require the modifier `onlyComplianceBound`.

## [4.0.0]

Version 4.0.0 of TREX has been successfully audited by Hacken [more details here](https://tokeny.com/hacken-grants-tokenization-protocol-erc3643-a-10-10-security-audit-score/)

### Breaking changes

- Token Interface :
  - transferOwnershipOnTokenContract() function was removed and cannot be called anymore, call transferOwnership() instead, the function was a duplicate of transferOwnership() and was removed to simplify the interface and increase coherence.
  - addAgentOnTokenContract() function was removed and cannot be called anymore, call addAgent() instead, the function was a duplicate of addAgent() and was removed to simplify the interface and increase coherence.
  - removeAgentOnTokenContract() function was removed and cannot be called anymore, call removeAgent() instead, the function was a duplicate of removeAgent() and was removed to simplify the interface and increase coherence.
- Identity Registry Interface :
  - transferOwnershipOnIdentityRegistryContract() function was removed and cannot be called anymore, call transferOwnership() instead, the function was a duplicate of transferOwnership() and was removed to simplify the interface and increase coherence.
  - addAgentOnIdentityRegistryContract() function was removed and cannot be called anymore, call addAgent() instead, the function was a duplicate of addAgent() and was removed to simplify the interface and increase coherence.
  - removeAgentOnIdentityRegistryContract() function was removed and cannot be called anymore, call removeAgent() instead, the function was a duplicate of removeAgent() and was removed to simplify the interface and increase coherence.
- Identity Registry Storage Interface :
  - transferOwnershipOnIdentityRegistryStorage() function was removed and cannot be called anymore, call transferOwnership() instead, the function was a duplicate of transferOwnership() and was removed to simplify the interface and increase coherence.
- Trusted Issuers Registry Interface :
  - transferOwnershipOnIssuersRegistryContract() function was removed and cannot be called anymore, call transferOwnership() instead, the function was a duplicate of transferOwnership() and was removed to simplify the interface and increase coherence.
- Claim Topics Registry Interface :
  - transferOwnershipOnClaimTopicsRegistryContract() function was removed and cannot be called anymore, call transferOwnership() instead, the function was a duplicate of transferOwnership() and was removed to simplify the interface and increase coherence.
- Compliance Interface :
  - Compliance contract becomes Modular Compliance, the features used by legacy compliance contracts have to be translated under the form of modules.
  - TokenAgentAdded event was removed from the interface, as there is no more need to add the Token agent list on the compliance contract, the new compliance, in v4, is capable to fetch directly the list of Token agents from the Token smart contract, without any need to store that list in its own memory.
  - TokenAgentRemoved event was removed from the interface, for the same reason as TokenAgentAdded.
  - transferOwnershipOnComplianceContract() function was removed and cannot be called anymore, call transferOwnership() instead, the function was a duplicate of transferOwnership() and was removed to simplify the interface and increase coherence.
  - addTokenAgent() function was removed and cannot be called anymore, the new compliance, in v4, is capable of fetching directly the list of Token agents from the Token smart contract, without any need to store that list in its own memory.
  - removeTokenAgent() function was removed and cannot be called anymore, the new compliance, in v4, is capable of fetching directly the list of Token agents from the Token smart contract, without any need to store that list in its own memory.
  - isTokenBound() function was removed from the interface, as there is only one token bound to a compliance contract, the existence of a function such as isTokenBound() was not necessary, the preferred option was to provide a getter, getTokenBound(), for the token address bound to the compliance instead.
  - tokenBound is no longer a public variable and has to be accessed by its getter, getTokenBound()
  -

### Update

- TREXImplementationAuthority has been modified to allow token issuers to change the ImplementationAuthority to
  manage it by themselves, the interfaces and implementation of the contract changed, but the functions used by the
  proxies to fetch the implementation contracts addresses remain the same.
- The change of TREXImplementationAuthority has to follow rules to ensure safety of the migration, these rules are
  enforced by smart contracts directly onchain. Tokeny's IA contract is the reference contract, other IA contracts
  are considered as auxiliary contracts and can only update implementations to the versions of implementation
  contracts listed on the reference IA by Tokeny, this is done to ensure security of the deployed tokens and prevent
  any malicious use of the upgradeability functions.
- a factory contract has been added, to deploy new TREXImplementationAuthority smart contracts, only the IA
  contracts deployed by that factory or the reference IA are allowed to be used by TREX contracts, it is not
  possible to come with your own implementation of the TREXImplementationAuthority contract and use it for contracts
  already deployed by the TREX factory.
- TREX Factory Contract has been added to the repository, this contract allows to deploy and set TREX tokens in 1 single transaction (deploys all contracts, initialize them and complete settings of contracts)
- Trusted Issuers Registry Storage now maintains a mapping of truster issuers addresses allowed for a given claim topic.
  - This means adding/removing/updating a trusted issuer now cost more gas (especially removing and updating when removing topics).
- Trusted Issuers Registry now implements a `getTrustedIssuersForClaimTopic(uint256 claimTopic)` method to query trusted issuers allowed for a given claim topic.
- Identity Registry `isVerified` method now takes advantage of the new `getTrustedIssuersForClaimTopic`.
  - Verifying an identity should now cost less gas, as the registry now only attempts to fetch claims that would be allowed.
  - Identity can therefore no longer be blocked because it contains too many claims of a given topic.
- update solhint and adapt all contracts to the standards
- Modular Compliance, new functions and events :
  - ModuleAdded event was added to the interface, as the compliance contract becomes modular, this event is used to track the list of Modules added to a Modular compliance contract.
  - ModuleRemoved event was added to the interface, as the compliance contract becomes modular, this event is used to track the list of Modules removed from a Modular compliance contract.
  - ModuleInteraction event was added to the interface, this event is used to track all interactions done with bound modules and is emitted by the callModuleFunction() function.
  - getTokenBound() function was added to the interface, to help standardize the contract, the previously public variable tokenBound was set as private and this getter was added to retrieve the bound token address.
  - addModule() function was added to the interface, as part of the modularization of the compliance contract. This function allows you to add/bind a new module to the compliance.
  - removeModule() function was added to the interface, as part of the modularization of the compliance contract. This function allows you to remove/unbind a module previously added to the compliance.
  - callModuleFunction() function was added to the interface, as part of the modularization of the compliance contract. This function allows you to interact with any bound module.
  - getModules() function was added to the interface, as part of the modularization of the compliance contract. This function allows you to fetch the list of Modules currently bound to the Modular Compliance Contract
  - isModuleBound() function was added to the interface, as part of the modularization of the compliance contract. This function allows you to check if a module is bound or not to the Compliance Contract.
- updated licenses from 2021 to 2022
- All contracts proxification
- Lint all contracts following best practices for smart contract development, update of solhint file to automate checks regarding this
- Complete NatSpec for all functions and events

### Fix

- Update storage slot for ImplementationAuthority address on proxy contract to avoid storage collision

## [3.5.1]

### Update

- updated licenses from 2019 to 2021

### Fix

- fix bug on the try/catch of `isVerified` function to return false if the verification of the claim returns an
  error on the last claim checked on the ONCHAINID

## [3.5.0]

### Update

- Updated solidity to version 0.8.0
- Update comments in contracts code
- Update ONCHAINID imports with the proxified version (version 1.4.0)
- Update all dependencies to the latest stable version

### Added

- **DVDTransferManager** contract
- Tests for DVDTransferManager functions (100% test coverage)
- **callComplianceFunction** on OwnerManager to interact with any custom compliance function
- complianceManager role on OwnerManager
- exports for all contracts to be used in SDK
- flat contract for DVDTransferManager
- ONCHAINID proxified contract deployer for tests

### Fix

- flat contracts script : fix typo in token flattener command

### Changed

- Release & pre release flows (yarn -> npm)
- removed useless lines on `removeClaimTopics` function
- add try/catch in `isVerified` function to avoid errors with incompatible claims
- removed useless lines on `removeTrustedIssuer` function
- changed required key for roles on AgentManager contract (MANAGEMENT key -> EXECUTION key)
- changed required key for roles on OwnerManager contract (MANAGEMENT key -> EXECUTION key)
- import interfaces from openzeppelin instead of local copy
- contract name : **Storage** -> **TokenStorage**
