# Change Log
All notable changes to this project will be documented in this file.

## [4.2.0]

### Added

- Introduced **Token Listing Restrictions Module**: Investors can determine which tokens they can receive by whitelisting or blacklisting them
  Token issuers can choose the listing type they prefer for their tokens:
  WHITELISTING: investors must whitelist/allow the token address in order to receive it.
  BLACKLISTING: investors can receive the token by default. If they do not want to receive it, they need to blacklist/disallow it.

- **Default Allowance Mechanism**:
  - Introduced a new feature allowing the contract owner to set certain addresses as trusted external smart contracts, enabling them to use `transferFrom` without requiring an explicit allowance from users. By default, users are opted in, allowing these contracts to have an "infinite allowance". Users can opt-out if they prefer to control allowances manually.
  - Added custom errors and events to provide better feedback and traceability:
    - Custom errors: `DefaultAllowanceAlreadyEnabled`, `DefaultAllowanceAlreadyDisabled`, `DefaultAllowanceAlreadySet`.
    - Events: `DefaultAllowance`, `DefaultAllowanceDisabled`, `DefaultAllowanceEnabled`.
  - Enhanced the `allowance` function to return `type(uint256).max` for addresses with default allowance enabled, unless the user has opted out.

- **Eligibility Checks Toggle**:
  - Added the ability for the token owner to enable or disable eligibility checks on the `IdentityRegistry` contract.
  - **`disableEligibilityChecks`**: Allows the token owner to disable eligibility checks, making all addresses automatically verified by the `isVerified` function.
  - **`enableEligibilityChecks`**: Allows the token owner to re-enable eligibility checks, restoring the full verification process.
  - Introduced custom errors and events:
    - Custom errors: `EligibilityChecksDisabledAlready`, `EligibilityChecksEnabledAlready`.
    - Events: `EligibilityChecksDisabled`, `EligibilityChecksEnabled`.
  - This feature provides flexibility for issuers to launch tokens with or without eligibility checks, based on their needs.

- **ERC-165 Interface Implementation**:
  - Implemented ERC-165 support across all major contracts in the suite, allowing them to explicitly declare the interfaces they support. This enhancement improves interoperability and makes it easier for external contracts and tools to interact with T-REX contracts.
  - Each contract now implements the `supportsInterface` function to identify the supported interfaces, ensuring compliance with ERC-165 standards.
  - In addition to implementing ERC-165, the ERC-3643 interfaces were organized into a new directory, with each interface inheriting from the original ERC-3643 standard interface. This setup allows for future expansion and maintains uniformity across the suite:
    - `IERC3643`, `IERC3643IdentityRegistry`, `IERC3643Compliance`, `IERC3643ClaimTopicsRegistry`, `IERC3643TrustedIssuersRegistry`, `IERC3643IdentityRegistryStorage`
  - For contracts that extend the ERC-3643 standard with new functions, `supportsInterface` now checks for both the new interface ID and the original ERC-3643 interface ID.
  - For interfaces that did not change, `supportsInterface` checks for the ERC-3643 interface ID directly, omitting the empty version-specific interface to avoid redundancy.

- **Add and Set Module in a Single Transaction**:
  - Introduced the `addAndSetModule` function in the `ModularCompliance` contract, allowing the contract owner to add a new compliance module and interact with it in a single transaction.
  - This function supports adding a module and performing up to 5 interactions with the module in one call, streamlining the setup process for compliance modules.

- **Granular Agent Permissioning**:
  - Introduced a new system to provide more granular control over agent roles on the token contract.
  - **Default Behavior**: By default, agents can perform all actions (mint, burn, freeze tokens, freeze wallets, recover tokens, pause, unpause).
  - **Restricting Permissions**: Token owners can now restrict specific roles for agents using the `setAgentRestrictions` function.
    - Permissions can be restricted on actions like minting, burning, freezing, recovering, etc.
    - Custom restrictions are stored in the `TokenRoles` struct.
    - The `AgentRestrictionsSet` event is emitted whenever restrictions are updated for an agent.
  - All agent-scoped functions (e.g., mint, burn) now check the agent’s permissions before executing the transaction, ensuring proper enforcement of these restrictions.

- **Ethers.js Version Upgrade**:
  - The project was upgraded from **Ethers v5** to **Ethers v6**, introducing several changes to the API and syntax.
  - **Key Changes**:
    - Adjusted syntax for contract deployments, interactions, and function calls to comply with Ethers v6.
    - Replaced deprecated features from v5 with the new Ethers v6 equivalents, ensuring compatibility and future-proofing the project.
    - Updated test suites and helper functions to use the Ethers v6 `Interface` and `Contract` classes, ensuring smooth testing of the updated code.
  - This upgrade ensures better performance, enhanced security, and improved developer experience moving forward.

- **Solidity Version Upgrade to 0.8.27**:
  - Upgraded Solidity version from **0.8.17** to **0.8.27** across all contracts, bringing in multiple new features and improvements:
    - **File-Level Event Declaration**: Events are now declared at the file level, simplifying code structure and improving readability.
    - **Custom Errors for Require Statements**: All `require` clauses that previously returned a string reason for failure have been updated to use **custom errors**, making debugging easier and more efficient.
  - This upgrade provides a cleaner, more efficient error handling process and improves overall code structure without affecting backward compatibility.

### Updated

- **Token Recovery Function**:
  - The `recoveryAddress` function was significantly improved to handle more complex scenarios and prevent potential bugs:
    - Removed the requirement for the `newWallet` to be a key on the `onchainID`, simplifying the process and reducing potential errors.
    - Enhanced compatibility with shared identity registry storage, ensuring the function works correctly even when multiple tokens share the same identity registry storage.
    - Added logic to handle recovery to an existing wallet that is already linked to the investor's identity, addressing scenarios where the `newWallet` is an existing wallet.
    - The function now accurately updates the identity registry, preventing errors related to attempting to add or remove identities that are already present or absent.
    - Improved overall logic to ensure smooth and error-free recovery operations, with events (`RecoverySuccess`, `TokensFrozen`, `TokensUnfrozen`, etc.) emitted to provide detailed feedback.

- **Ownership Transfer**:
  - Implemented a two-step ownership transfer process across all relevant contracts in the suite, using OpenZeppelin's implementation `Ownable2StepUpgradeable`.
  - This change enhances security by requiring the new owner to accept ownership explicitly, preventing accidental transfers to incorrect or inaccessible addresses.
  - Added new functions:
    - `transferOwnership(address newOwner)`: Initiates the ownership transfer process.
    - `acceptOwnership()`: Allows the pending owner to accept and finalize the ownership transfer.
  - Introduced a `_pendingOwner` state variable to track the address of the pending new owner.
  - Updated relevant events to reflect the two-step process:
    - `OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner)`
    - `OwnershipTransferred(address indexed previousOwner, address indexed newOwner)`
  - This change affects all contracts that previously used a single-step ownership transfer, ensuring consistent and secure ownership management across the entire suite.

## [4.1.5]

### Update
- DvA Transfer Manager contract proxified
- The DvA manager contract freezes the tokens to be transferred instead of being a vault (so it must be a token agent)
- Only the token owner (rather than agents) can call setApprovalCriteria, as it is part of the main token settings.

## [4.2.0]

### Added

- Introduced **Token Listing Restrictions Module**: Investors can determine which tokens they can receive by whitelisting or blacklisting them
  Token issuers can choose the listing type they prefer for their tokens:
  WHITELISTING: investors must whitelist/allow the token address in order to receive it.
  BLACKLISTING: investors can receive the token by default. If they do not want to receive it, they need to blacklist/disallow it.

- **Default Allowance Mechanism**:
  - Introduced a new feature allowing the contract owner to set certain addresses as trusted external smart contracts, enabling them to use `transferFrom` without requiring an explicit allowance from users. By default, users are opted in, allowing these contracts to have an "infinite allowance". Users can opt-out if they prefer to control allowances manually.
  - Added custom errors and events to provide better feedback and traceability:
    - Custom errors: `DefaultAllowanceAlreadyEnabled`, `DefaultAllowanceAlreadyDisabled`, `DefaultAllowanceAlreadySet`.
    - Events: `DefaultAllowance`, `DefaultAllowanceDisabled`, `DefaultAllowanceEnabled`.
  - Enhanced the `allowance` function to return `type(uint256).max` for addresses with default allowance enabled, unless the user has opted out.

- **Eligibility Checks Toggle**:
  - Added the ability for the token owner to enable or disable eligibility checks on the `IdentityRegistry` contract.
  - **`disableEligibilityChecks`**: Allows the token owner to disable eligibility checks, making all addresses automatically verified by the `isVerified` function.
  - **`enableEligibilityChecks`**: Allows the token owner to re-enable eligibility checks, restoring the full verification process.
  - Introduced custom errors and events:
    - Custom errors: `EligibilityChecksDisabledAlready`, `EligibilityChecksEnabledAlready`.
    - Events: `EligibilityChecksDisabled`, `EligibilityChecksEnabled`.
  - This feature provides flexibility for issuers to launch tokens with or without eligibility checks, based on their needs.

- **ERC-165 Interface Implementation**:
  - Implemented ERC-165 support across all major contracts in the suite, allowing them to explicitly declare the interfaces they support. This enhancement improves interoperability and makes it easier for external contracts and tools to interact with T-REX contracts.
  - Each contract now implements the `supportsInterface` function to identify the supported interfaces, ensuring compliance with ERC-165 standards.
  - In addition to implementing ERC-165, the ERC-3643 interfaces were organized into a new directory, with each interface inheriting from the original ERC-3643 standard interface. This setup allows for future expansion and maintains uniformity across the suite:
    - `IERC3643`, `IERC3643IdentityRegistry`, `IERC3643Compliance`, `IERC3643ClaimTopicsRegistry`, `IERC3643TrustedIssuersRegistry`, `IERC3643IdentityRegistryStorage`
  - For contracts that extend the ERC-3643 standard with new functions, `supportsInterface` now checks for both the new interface ID and the original ERC-3643 interface ID.
  - For interfaces that did not change, `supportsInterface` checks for the ERC-3643 interface ID directly, omitting the empty version-specific interface to avoid redundancy.

- **Add and Set Module in a Single Transaction**:
  - Introduced the `addAndSetModule` function in the `ModularCompliance` contract, allowing the contract owner to add a new compliance module and interact with it in a single transaction.
  - This function supports adding a module and performing up to 5 interactions with the module in one call, streamlining the setup process for compliance modules.

- **Granular Agent Permissioning**:
  - Introduced a new system to provide more granular control over agent roles on the token contract.
  - **Default Behavior**: By default, agents can perform all actions (mint, burn, freeze tokens, freeze wallets, recover tokens, pause, unpause).
  - **Restricting Permissions**: Token owners can now restrict specific roles for agents using the `setAgentRestrictions` function.
    - Permissions can be restricted on actions like minting, burning, freezing, recovering, etc.
    - Custom restrictions are stored in the `TokenRoles` struct.
    - The `AgentRestrictionsSet` event is emitted whenever restrictions are updated for an agent.
  - All agent-scoped functions (e.g., mint, burn) now check the agent’s permissions before executing the transaction, ensuring proper enforcement of these restrictions.

- **Ethers.js Version Upgrade**:
  - The project was upgraded from **Ethers v5** to **Ethers v6**, introducing several changes to the API and syntax.
  - **Key Changes**:
    - Adjusted syntax for contract deployments, interactions, and function calls to comply with Ethers v6.
    - Replaced deprecated features from v5 with the new Ethers v6 equivalents, ensuring compatibility and future-proofing the project.
    - Updated test suites and helper functions to use the Ethers v6 `Interface` and `Contract` classes, ensuring smooth testing of the updated code.
  - This upgrade ensures better performance, enhanced security, and improved developer experience moving forward.

- **Solidity Version Upgrade to 0.8.27**:
  - Upgraded Solidity version from **0.8.17** to **0.8.27** across all contracts, bringing in multiple new features and improvements:
    - **File-Level Event Declaration**: Events are now declared at the file level, simplifying code structure and improving readability.
    - **Custom Errors for Require Statements**: All `require` clauses that previously returned a string reason for failure have been updated to use **custom errors**, making debugging easier and more efficient.
  - This upgrade provides a cleaner, more efficient error handling process and improves overall code structure without affecting backward compatibility.

### Updated

- **Token Recovery Function**:
  - The `recoveryAddress` function was significantly improved to handle more complex scenarios and prevent potential bugs:
    - Removed the requirement for the `newWallet` to be a key on the `onchainID`, simplifying the process and reducing potential errors.
    - Enhanced compatibility with shared identity registry storage, ensuring the function works correctly even when multiple tokens share the same identity registry storage.
    - Added logic to handle recovery to an existing wallet that is already linked to the investor's identity, addressing scenarios where the `newWallet` is an existing wallet.
    - The function now accurately updates the identity registry, preventing errors related to attempting to add or remove identities that are already present or absent.
    - Improved overall logic to ensure smooth and error-free recovery operations, with events (`RecoverySuccess`, `TokensFrozen`, `TokensUnfrozen`, etc.) emitted to provide detailed feedback.

- **Ownership Transfer**:
  - Implemented a two-step ownership transfer process across all relevant contracts in the suite, using OpenZeppelin's implementation `Ownable2StepUpgradeable`.
  - This change enhances security by requiring the new owner to accept ownership explicitly, preventing accidental transfers to incorrect or inaccessible addresses.
  - Added new functions:
    - `transferOwnership(address newOwner)`: Initiates the ownership transfer process.
    - `acceptOwnership()`: Allows the pending owner to accept and finalize the ownership transfer.
  - Introduced a `_pendingOwner` state variable to track the address of the pending new owner.
  - Updated relevant events to reflect the two-step process:
    - `OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner)`
    - `OwnershipTransferred(address indexed previousOwner, address indexed newOwner)`
  - This change affects all contracts that previously used a single-step ownership transfer, ensuring consistent and secure ownership management across the entire suite.

## [4.1.5]

### Update
- DvA Transfer Manager contract proxified
- The DvA manager contract freezes the tokens to be transferred instead of being a vault (so it must be a token agent)
- Only the token owner (rather than agents) can call setApprovalCriteria, as it is part of the main token settings.

## [4.1.5]

### Added
- Introduced **Token Listing Restrictions Module**: Investors can determine which tokens they can receive by whitelisting or blacklisting them
  Token issuers can choose the listing type they prefer for their tokens:
  WHITELISTING: investors must whitelist/allow the token address in order to receive it.
  BLACKLISTING: investors can receive the token by default. If they do not want to receive it, they need to blacklist/disallow it.

## [4.1.4]

### Added

- Introduced **AbstractModuleUpgradeable**: Enables compliance modules to be compatible with ERC-1967 and ERC-1822 standards.
- Introduced **ModuleProxy**: ERC-1967 compliant proxy contract for Upgradeable compliance modules.

### Update
- Upgraded all compliance modules to inherit from `AbstractModuleUpgradeable` and made them Upgradeable.

## [4.1.3]

### Update

- **AbstractProxy**: updated the storage slot for `TREXImplementationAuthority` from 
  `0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7` to 
  `0x821f3e4d3d679f19eacc940c87acf846ea6eae24a63058ea750304437a62aafc` to avoid issues with blockchain explorers 
  confusing the proxy pattern of T-REX for an ERC-1822 proxy (old storage slot was the slot used by ERC-1822) which 
  caused errors in displaying the right ABIs for proxies using this implementation.  

## [4.1.2]
- **Compliance Modules**:
  - Removed `_compliance` parameter from `setSupplyLimit` function of the `SupplyLimitModule`

## [4.1.1]

No changes, republishing package.

## [4.1.0]

### Breaking Changes

- **TREXFactory Constructor**: Now requires the address of the Identity Factory.
  - Reason: The Identity Factory is used to deploy ONCHAINIDs for tokens.

### Added

- **Compliance Modules**:
  - Introduced `Supply Limit Module`: Restricts minting tokens beyond a specified limit.
  - Introduced `Time Transfers Limits`: Prevents holders from transferring tokens beyond a set limit within a specified timeframe.
  - Introduced `Max Balance Module`: Ensures an individual holder doesn't exceed a certain percentage of the total supply.
  - Added two exchange-specific modules:
    - `Time Exchange Limits`: Limits token transfers on trusted exchanges within a set timeframe.
    - `Monthly Exchange Limits`: Restricts the amount of tokens that can be transferred on trusted exchanges each month.
  - Introduced `Transfer Fees` : Collects fees from transfers (issuers determine fee rates).

- **IModule Enhancement**:
  - Added a new function: `function name() external pure returns (string memory _name);`. This mandates all compliance modules to declare a constant variable, e.g., `function name() public pure returns (string memory _name) { return "CountryRestrictModule"; }`.
  - New function `isPlugAndPlay`: Added to the `IModule` interface. This function, `function isPlugAndPlay() external pure returns (bool)`, indicates whether a compliance module can be bound without presetting. It is now mandatory for all compliance modules to declare this function.
  - New function `canComplianceBind`: Also added to the `IModule` interface. Compliance modules must implement `function canComplianceBind(address _compliance) external view returns (bool)`, which checks if presetting is required before binding a compliance module.

- **TREXFactory Enhancements**:
  - New function `setIdFactory`: Sets the Identity Factory responsible for deploying token ONCHAINIDs.
  - New function `getIdFactory`: Retrieves the address of the associated Identity Factory.

- **TREXGateway Contract**:
  - Deployed as a central interface for the TREX ecosystem, facilitating various crucial operations:
    - **Factory Management**: Manages the Factory contract address, enabling updates and ownership transfers.
    - **Public Deployment Control**: Toggles the ability for public entities to deploy TREX contracts, enhancing security and flexibility.
    - **Fee Management**: Sets and adjusts deployment fee details, including amount, token type, and collector address, and enables or disables fee requirements.
    - **Deployer Management**: Adds or removes approved deployers and applies fee discounts, including batch operations for efficiency. Ensures streamlined deployment processes for TREX contracts.
    - **Suite Deployment**: Directly deploys TREX suites of contracts using provided token and claim details, with support for batch deployments. Incorporates fee collection and deployment status checks for each deployment, emphasizing security and compliance.
    - **Status and Fee Queries**: Provides functions to retrieve current public deployment status, Factory contract address, deployment fee details, and deployment fee status.
    - **Fee Calculation**: Dynamically calculates deployment fees for deployers, considering applicable discounts.

- **DvATransferManager Contract**:
  - Introduced the `DvATransferManager` contract to streamline the process of internal fund transfers needing multi-party intermediate approvals.
    - Token owners define the transfer authorization criteria, including recipient approval, agent approval, and potential additional approvers.
    - Investors submit transfer requests.
    - Approvers are empowered to either sanction or reject these requests.
    - Transfers are executed only upon receiving unanimous approval from all designated approvers.

### Updates

#### Smart Contract Enhancements
- **TREXFactory**:
  - Modified the `deployTREXSuite` function to now auto-deploy a Token ONCHAINID if it's not already available (i.e., if the onchainid address in _tokenDetails is the zero address).

- **ModularCompliance**:
  - Updated the `addModule` function to invoke the new `isPlugAndPlay` and `canComplianceBind` functions, ensuring compatibility checks before binding any compliance module.

#### Code Quality Improvements
- Enhanced the GitHub Actions workflow by adding TypeScript linting (`lint:ts`) for test files, ensuring higher code quality and adherence to coding standards.
- Executed a comprehensive linting pass on all test files, addressing and resolving any linting issues. This ensures a consistent code style and improved readability across the test suite.
- Updated the `push_checking.yml` GitHub Actions workflow to include automatic TypeScript linting checks on pull requests. This addition enforces coding standards and helps maintain high-quality code submissions from all contributors.

## [4.0.1]

### Update

- Compliance module view methods no longer require the modifier `onlyComplianceBound`.

### Added

- script for flattening contracts with hardhat 

## [4.0.0]

Version 4.0.0 of TREX has been successfully audited by Hacken [more details here](https://tokeny.com/hacken-grants-tokenization-protocol-erc3643-a-10-10-security-audit-score/)

### Breaking changes
 
- Token Interface :
  - transferOwnershipOnTokenContract() function was removed and cannot be called anymore, call transferOwnership() instead, the function was a duplicate of transferOwnership() and was removed to simplify the interface and increase coherence.
  - addAgentOnTokenContract() function was removed and cannot be called anymore, call addAgent() instead, the function was a duplicate of addAgent() and was removed to simplify the interface and increase coherence.
  - removeAgentOnTokenContract()  function was removed and cannot be called anymore, call removeAgent() instead, the function was a duplicate of removeAgent() and was removed to simplify the interface and increase coherence.
- Identity Registry Interface :
  - transferOwnershipOnIdentityRegistryContract() function was removed and cannot be called anymore, call transferOwnership() instead, the function was a duplicate of transferOwnership() and was removed to simplify the interface and increase coherence.
  - addAgentOnIdentityRegistryContract() function was removed and cannot be called anymore, call addAgent() instead, the function was a duplicate of addAgent() and was removed to simplify the interface and increase coherence.
  - removeAgentOnIdentityRegistryContract()  function was removed and cannot be called anymore, call removeAgent() instead, the function was a duplicate of removeAgent() and was removed to simplify the interface and increase coherence.
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
  - addTokenAgent()  function was removed and cannot be called anymore, the new compliance, in v4, is capable of fetching directly the list of Token agents from the Token smart contract, without any need to store that list in its own memory.
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
