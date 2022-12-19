# Change Log
All notable changes to this project will be documented in this file.

## [4.0.0]

### Breaking changes

### Update
- Trusted Issuers Registry Storage now maintains a mapping of truster issuers addresses allowed for a given claim topic.
  - This means adding/removing/updating a trusted issuer now cost more gas (especially removing and updating when removing topics).
- Trusted Issuers Registry now implements a `getTrustedIssuersForClaimTopic(uint256 claimTopic)` method to query trusted issuers allowed for a given claim topic.
- Identity Registry `isVerified` method now takes advantage of the new `getTrustedIssuersForClaimTopic`.
  - Verifying an identity should now cost less gas, as the registry now only attempts to fetch claims that would be allowed.
  - Identity can therefore no longer be blocked because it contains too many claims of a given topic.

### Fix

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
