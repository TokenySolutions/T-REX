
// File: @onchain-id/solidity/contracts/IERC734.sol

pragma solidity ^0.6.2;

/**
 * @dev Interface of the ERC734 (Key Holder) standard as defined in the EIP.
 */
interface IERC734 {
    /**
     * @dev Definition of the structure of a Key.
     *
     * Specification: Keys are cryptographic public keys, or contract addresses associated with this identity.
     * The structure should be as follows:
     *   - key: A public key owned by this identity
     *      - purposes: uint256[] Array of the key purposes, like 1 = MANAGEMENT, 2 = EXECUTION
     *      - keyType: The type of key used, which would be a uint256 for different key types. e.g. 1 = ECDSA, 2 = RSA, etc.
     *      - key: bytes32 The public key. // Its the Keccak256 hash of the key
     */
    struct Key {
        uint256[] purposes;
        uint256 keyType;
        bytes32 key;
    }

    /**
     * @dev Emitted when an execution request was approved.
     *
     * Specification: MUST be triggered when approve was successfully called.
     */
    event Approved(uint256 indexed executionId, bool approved);

    /**
     * @dev Emitted when an execute operation was approved and successfully performed.
     *
     * Specification: MUST be triggered when approve was called and the execution was successfully approved.
     */
    event Executed(uint256 indexed executionId, address indexed to, uint256 indexed value, bytes data);

    /**
     * @dev Emitted when an execution request was performed via `execute`.
     *
     * Specification: MUST be triggered when execute was successfully called.
     */
    event ExecutionRequested(uint256 indexed executionId, address indexed to, uint256 indexed value, bytes data);

    /**
     * @dev Emitted when a key was added to the Identity.
     *
     * Specification: MUST be triggered when addKey was successfully called.
     */
    event KeyAdded(bytes32 indexed key, uint256 indexed purpose, uint256 indexed keyType);

    /**
     * @dev Emitted when a key was removed from the Identity.
     *
     * Specification: MUST be triggered when removeKey was successfully called.
     */
    event KeyRemoved(bytes32 indexed key, uint256 indexed purpose, uint256 indexed keyType);

    /**
     * @dev Emitted when the list of required keys to perform an action was updated.
     *
     * Specification: MUST be triggered when changeKeysRequired was successfully called.
     */
    event KeysRequiredChanged(uint256 purpose, uint256 number);


    /**
     * @dev Adds a _key to the identity. The _purpose specifies the purpose of the key.
     *
     * Triggers Event: `KeyAdded`
     *
     * Specification: MUST only be done by keys of purpose 1, or the identity itself. If it's the identity itself, the approval process will determine its approval.
     */
    function addKey(bytes32 _key, uint256 _purpose, uint256 _keyType) external returns (bool success);

    /**
    * @dev Approves an execution or claim addition.
    *
    * Triggers Event: `Approved`, `Executed`
    *
    * Specification:
    * This SHOULD require n of m approvals of keys purpose 1, if the _to of the execution is the identity contract itself, to successfully approve an execution.
    * And COULD require n of m approvals of keys purpose 2, if the _to of the execution is another contract, to successfully approve an execution.
    */
    function approve(uint256 _id, bool _approve) external returns (bool success);

    /**
     * @dev Passes an execution instruction to an ERC725 identity.
     *
     * Triggers Event: `ExecutionRequested`, `Executed`
     *
     * Specification:
     * SHOULD require approve to be called with one or more keys of purpose 1 or 2 to approve this execution.
     * Execute COULD be used as the only accessor for `addKey` and `removeKey`.
     */
    function execute(address _to, uint256 _value, bytes calldata _data) external payable returns (uint256 executionId);

    /**
     * @dev Returns the full key data, if present in the identity.
     */
    function getKey(bytes32 _key) external view returns (uint256[] memory purposes, uint256 keyType, bytes32 key);

    /**
     * @dev Returns the list of purposes associated with a key.
     */
    function getKeyPurposes(bytes32 _key) external view returns(uint256[] memory _purposes);

    /**
     * @dev Returns an array of public key bytes32 held by this identity.
     */
    function getKeysByPurpose(uint256 _purpose) external view returns (bytes32[] memory keys);

    /**
     * @dev Returns TRUE if a key is present and has the given purpose. If the key is not present it returns FALSE.
     */
    function keyHasPurpose(bytes32 _key, uint256 _purpose) external view returns (bool exists);

    /**
     * @dev Removes _purpose for _key from the identity.
     *
     * Triggers Event: `KeyRemoved`
     *
     * Specification: MUST only be done by keys of purpose 1, or the identity itself. If it's the identity itself, the approval process will determine its approval.
     */
    function removeKey(bytes32 _key, uint256 _purpose) external returns (bool success);
}

// File: @onchain-id/solidity/contracts/IERC735.sol

pragma solidity ^0.6.2;

/**
 * @dev Interface of the ERC735 (Claim Holder) standard as defined in the EIP.
 */
interface IERC735 {

    /**
     * @dev Emitted when a claim request was performed.
     *
     * Specification: Is not clear
     */
    event ClaimRequested(uint256 indexed claimRequestId, uint256 indexed topic, uint256 scheme, address indexed issuer, bytes signature, bytes data, string uri);

    /**
     * @dev Emitted when a claim was added.
     *
     * Specification: MUST be triggered when a claim was successfully added.
     */
    event ClaimAdded(bytes32 indexed claimId, uint256 indexed topic, uint256 scheme, address indexed issuer, bytes signature, bytes data, string uri);

    /**
     * @dev Emitted when a claim was removed.
     *
     * Specification: MUST be triggered when removeClaim was successfully called.
     */
    event ClaimRemoved(bytes32 indexed claimId, uint256 indexed topic, uint256 scheme, address indexed issuer, bytes signature, bytes data, string uri);

    /**
     * @dev Emitted when a claim was changed.
     *
     * Specification: MUST be triggered when changeClaim was successfully called.
     */
    event ClaimChanged(bytes32 indexed claimId, uint256 indexed topic, uint256 scheme, address indexed issuer, bytes signature, bytes data, string uri);

    /**
     * @dev Definition of the structure of a Claim.
     *
     * Specification: Claims are information an issuer has about the identity holder.
     * The structure should be as follows:
     *   - claim: A claim published for the Identity.
     *      - topic: A uint256 number which represents the topic of the claim. (e.g. 1 biometric, 2 residence (ToBeDefined: number schemes, sub topics based on number ranges??))
     *      - scheme : The scheme with which this claim SHOULD be verified or how it should be processed. Its a uint256 for different schemes. E.g. could 3 mean contract verification, where the data will be call data, and the issuer a contract address to call (ToBeDefined). Those can also mean different key types e.g. 1 = ECDSA, 2 = RSA, etc. (ToBeDefined)
     *      - issuer: The issuers identity contract address, or the address used to sign the above signature. If an identity contract, it should hold the key with which the above message was signed, if the key is not present anymore, the claim SHOULD be treated as invalid. The issuer can also be a contract address itself, at which the claim can be verified using the call data.
     *      - signature: Signature which is the proof that the claim issuer issued a claim of topic for this identity. it MUST be a signed message of the following structure: `keccak256(abi.encode(identityHolder_address, topic, data))`
     *      - data: The hash of the claim data, sitting in another location, a bit-mask, call data, or actual data based on the claim scheme.
     *      - uri: The location of the claim, this can be HTTP links, swarm hashes, IPFS hashes, and such.
     */
    struct Claim {
        uint256 topic;
        uint256 scheme;
        address issuer;
        bytes signature;
        bytes data;
        string uri;
    }

    /**
     * @dev Get a claim by its ID.
     *
     * Claim IDs are generated using `keccak256(abi.encode(address issuer_address, uint256 topic))`.
     */
    function getClaim(bytes32 _claimId) external view returns(uint256 topic, uint256 scheme, address issuer, bytes memory signature, bytes memory data, string memory uri);

    /**
     * @dev Returns an array of claim IDs by topic.
     */
    function getClaimIdsByTopic(uint256 _topic) external view returns(bytes32[] memory claimIds);

    /**
     * @dev Add or update a claim.
     *
     * Triggers Event: `ClaimRequested`, `ClaimAdded`, `ClaimChanged`
     *
     * Specification: Requests the ADDITION or the CHANGE of a claim from an issuer.
     * Claims can requested to be added by anybody, including the claim holder itself (self issued).
     *
     * _signature is a signed message of the following structure: `keccak256(abi.encode(address identityHolder_address, uint256 topic, bytes data))`.
     * Claim IDs are generated using `keccak256(abi.encode(address issuer_address + uint256 topic))`.
     *
     * This COULD implement an approval process for pending claims, or add them right away.
     * MUST return a claimRequestId (use claim ID) that COULD be sent to the approve function.
     */
    function addClaim(uint256 _topic, uint256 _scheme, address issuer, bytes calldata _signature, bytes calldata _data, string calldata _uri) external returns (bytes32 claimRequestId);

    /**
     * @dev Removes a claim.
     *
     * Triggers Event: `ClaimRemoved`
     *
     * Claim IDs are generated using `keccak256(abi.encode(address issuer_address, uint256 topic))`.
     */
    function removeClaim(bytes32 _claimId) external returns (bool success);
}

// File: @onchain-id/solidity/contracts/IIdentity.sol

pragma solidity ^0.6.2;



interface IIdentity is IERC734, IERC735 {}

// File: @onchain-id/solidity/contracts/IClaimIssuer.sol

pragma solidity ^0.6.2;


interface IClaimIssuer is IIdentity {
    function revokeClaim(bytes32 _claimId, address _identity) external returns(bool);
    function getRecoveredAddress(bytes calldata sig, bytes32 dataHash) external pure returns (address);
    function isClaimRevoked(bytes calldata _sig) external view returns (bool);
    function isClaimValid(IIdentity _identity, uint256 claimTopic, bytes calldata sig, bytes calldata data) external view returns (bool);
}

// File: contracts/registry/IClaimTopicsRegistry.sol

/**
 *     NOTICE
 *
 *     The T-REX software is licensed under a proprietary license or the GPL v.3.
 *     If you choose to receive it under the GPL v.3 license, the following applies:
 *     T-REX is a suite of smart contracts developed by Tokeny to manage and transfer financial assets on the ethereum blockchain
 *
 *     Copyright (C) 2019, Tokeny sàrl.
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

pragma solidity ^0.6.0;

interface IClaimTopicsRegistry {

   /**
    *  this event is emitted when a claim topic has been added to the ClaimTopicsRegistry
    *  the event is emitted by the 'addClaimTopic' function
    *  `claimTopic` is the required claim added to the Claim Topics Registry
    */
    event ClaimTopicAdded(uint256 indexed claimTopic);

   /**
    *  this event is emitted when a claim topic has been removed from the ClaimTopicsRegistry
    *  the event is emitted by the 'removeClaimTopic' function
    *  `claimTopic` is the required claim removed from the Claim Topics Registry
    */
    event ClaimTopicRemoved(uint256 indexed claimTopic);

   /**
    * @dev Add a trusted claim topic (For example: KYC=1, AML=2).
    * Only owner can call.
    * emits `ClaimTopicAdded` event
    * @param _claimTopic The claim topic index
    */
    function addClaimTopic(uint256 _claimTopic) external;

   /**
    *  @dev Remove a trusted claim topic (For example: KYC=1, AML=2).
    *  Only owner can call.
    *  emits `ClaimTopicRemoved` event
    *  @param _claimTopic The claim topic index
    */
    function removeClaimTopic(uint256 _claimTopic) external;

   /**
    *  @dev Get the trusted claim topics for the security token
    *  @return Array of trusted claim topics
    */
    function getClaimTopics() external view returns (uint256[] memory);

   /**
    *  @dev Transfers the Ownership of ClaimTopics to a new Owner.
    *  Only owner can call.
    *  @param _newOwner The new owner of this contract.
    */
    function transferOwnershipOnClaimTopicsRegistryContract(address _newOwner) external;
}

// File: contracts/registry/ITrustedIssuersRegistry.sol

/**
 *     NOTICE
 *
 *     The T-REX software is licensed under a proprietary license or the GPL v.3.
 *     If you choose to receive it under the GPL v.3 license, the following applies:
 *     T-REX is a suite of smart contracts developed by Tokeny to manage and transfer financial assets on the ethereum blockchain
 *
 *     Copyright (C) 2019, Tokeny sàrl.
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

pragma solidity ^0.6.0;


interface ITrustedIssuersRegistry {

   /**
    *  this event is emitted when a trusted issuer is added in the registry.
    *  the event is emitted by the addTrustedIssuer function
    *  `trustedIssuer` is the address of the trusted issuer's ClaimIssuer contract
    *  `claimTopics` is the set of claims that the trusted issuer is allowed to emit
    */
    event TrustedIssuerAdded(IClaimIssuer indexed trustedIssuer, uint[] claimTopics);

   /**
    *  this event is emitted when a trusted issuer is removed from the registry.
    *  the event is emitted by the removeTrustedIssuer function
    *  `trustedIssuer` is the address of the trusted issuer's ClaimIssuer contract
    */
    event TrustedIssuerRemoved(IClaimIssuer indexed trustedIssuer);

   /**
    *  this event is emitted when the set of claim topics is changed for a given trusted issuer.
    *  the event is emitted by the updateIssuerClaimTopics function
    *  `trustedIssuer` is the address of the trusted issuer's ClaimIssuer contract
    *  `claimTopics` is the set of claims that the trusted issuer is allowed to emit
    */
    event ClaimTopicsUpdated(IClaimIssuer indexed trustedIssuer, uint[] claimTopics);

   /**
    *  @dev registers a ClaimIssuer contract as trusted claim issuer.
    *  Requires that a ClaimIssuer contract doesn't already exist
    *  Requires that the claimTopics set is not empty
    *  @param _trustedIssuer The ClaimIssuer contract address of the trusted claim issuer.
    *  @param _claimTopics the set of claim topics that the trusted issuer is allowed to emit
    *  This function can only be called by the owner of the Trusted Issuers Registry contract
    *  emits a `TrustedIssuerAdded` event
    */
    function addTrustedIssuer(IClaimIssuer _trustedIssuer, uint[] calldata _claimTopics) external;

   /**
    *  @dev Removes the ClaimIssuer contract of a trusted claim issuer.
    *  Requires that the claim issuer contract to be registered first
    *  @param _trustedIssuer the claim issuer to remove.
    *  This function can only be called by the owner of the Trusted Issuers Registry contract
    *  emits a `TrustedIssuerRemoved` event
    */
    function removeTrustedIssuer(IClaimIssuer _trustedIssuer) external;

   /**
    *  @dev Updates the set of claim topics that a trusted issuer is allowed to emit.
    *  Requires that this ClaimIssuer contract already exists in the registry
    *  Requires that the provided claimTopics set is not empty
    *  @param _trustedIssuer the claim issuer to update.
    *  @param _claimTopics the set of claim topics that the trusted issuer is allowed to emit
    *  This function can only be called by the owner of the Trusted Issuers Registry contract
    *  emits a `ClaimTopicsUpdated` event
    */
    function updateIssuerClaimTopics(IClaimIssuer _trustedIssuer, uint[] calldata _claimTopics) external;

   /**
    *  @dev Function for getting all the trusted claim issuers stored.
    *  @return array of all claim issuers registered.
    */
    function getTrustedIssuers() external view returns (IClaimIssuer[] memory);

   /**
    *  @dev Checks if the ClaimIssuer contract is trusted
    *  @param _issuer the address of the ClaimIssuer contract
    *  @return true if the issuer is trusted, false otherwise.
    */
    function isTrustedIssuer(address _issuer) external view returns(bool);

   /**
    *  @dev Function for getting all the claim topic of trusted claim issuer
    *  Requires the provided ClaimIssuer contract to be registered in the trusted issuers registry.
    *  @param _trustedIssuer the trusted issuer concerned.
    *  @return The set of claim topics that the trusted issuer is allowed to emit
    */
    function getTrustedIssuerClaimTopics(IClaimIssuer _trustedIssuer) external view returns(uint[] memory);

   /**
    *  @dev Function for checking if the trusted claim issuer is allowed
    *  to emit a certain claim topic
    *  @param _issuer the address of the trusted issuer's ClaimIssuer contract
    *  @param _claimTopic the Claim Topic that has to be checked to know if the `issuer` is allowed to emit it
    *  @return true if the issuer is trusted for this claim topic.
    */
    function hasClaimTopic(address _issuer, uint _claimTopic) external view returns(bool);

   /**
    *  @dev Transfers the Ownership of TrustedIssuersRegistry to a new Owner.
    *  @param _newOwner The new owner of this contract.
    *  This function can only be called by the owner of the Trusted Issuers Registry contract
    *  emits an `OwnershipTransferred` event
    */
    function transferOwnershipOnIssuersRegistryContract(address _newOwner) external;
}

// File: contracts/registry/IIdentityRegistryStorage.sol

pragma solidity ^0.6.0;


interface IIdentityRegistryStorage {

   /**
    *  this event is emitted when an Identity is registered into the storage contract.
    *  the event is emitted by the 'registerIdentity' function
    *  `investorAddress` is the address of the investor's wallet
    *  `identity` is the address of the Identity smart contract (onchainID)
    */
    event IdentityStored(address indexed investorAddress, IIdentity indexed identity);

   /**
    *  this event is emitted when an Identity is removed from the storage contract.
    *  the event is emitted by the 'deleteIdentity' function
    *  `investorAddress` is the address of the investor's wallet
    *  `identity` is the address of the Identity smart contract (onchainID)
    */
    event IdentityUnstored(address indexed investorAddress, IIdentity indexed identity);

   /**
    *  this event is emitted when an Identity has been updated
    *  the event is emitted by the 'updateIdentity' function
    *  `oldIdentity` is the old Identity contract's address to update
    *  `newIdentity` is the new Identity contract's
    */
    event IdentityModified(IIdentity indexed oldIdentity, IIdentity indexed newIdentity);

   /**
    *  this event is emitted when an Identity's country has been updated
    *  the event is emitted by the 'updateCountry' function
    *  `investorAddress` is the address on which the country has been updated
    *  `country` is the numeric code (ISO 3166-1) of the new country
    */
    event CountryModified(address indexed investorAddress, uint16 indexed country);

   /**
    *  this event is emitted when an Identity Registry is bound to the storage contract
    *  the event is emitted by the 'addIdentityRegistry' function
    *  `identityRegistry` is the address of the identity registry added
    */
    event IdentityRegistryBound(address indexed identityRegistry);

   /**
    *  this event is emitted when an Identity Registry is unbound from the storage contract
    *  the event is emitted by the 'removeIdentityRegistry' function
    *  `identityRegistry` is the address of the identity registry removed
    */
    event IdentityRegistryUnbound(address indexed identityRegistry);

   /**
    *  @dev Returns the identity registries linked to the storage contract
    */
    function linkedIdentityRegistries() external view returns (address[] memory);

   /**
    *  @dev Returns the onchainID of an investor.
    *  @param _userAddress The wallet of the investor
    */
    function storedIdentity(address _userAddress) external view returns (IIdentity);

   /**
    *  @dev Returns the country code of an investor.
    *  @param _userAddress The wallet of the investor
    */
    function storedInvestorCountry(address _userAddress) external view returns (uint16);

   /**
    *  @dev adds an identity contract corresponding to a user address in the storage.
    *  Requires that the user doesn't have an identity contract already registered.
    *  This function can only be called by an address set as agent of the smart contract
    *  @param _userAddress The address of the user
    *  @param _identity The address of the user's identity contract
    *  @param _country The country of the investor
    *  emits `IdentityStored` event
    */
    function addIdentityToStorage(address _userAddress, IIdentity _identity, uint16 _country) external;

   /**
    *  @dev Removes an user from the storage.
    *  Requires that the user have an identity contract already deployed that will be deleted.
    *  This function can only be called by an address set as agent of the smart contract
    *  @param _userAddress The address of the user to be removed
    *  emits `IdentityUnstored` event
    */
    function removeIdentityFromStorage(address _userAddress) external;

   /**
    *  @dev Updates the country corresponding to a user address.
    *  Requires that the user should have an identity contract already deployed that will be replaced.
    *  This function can only be called by an address set as agent of the smart contract
    *  @param _userAddress The address of the user
    *  @param _country The new country of the user
    *  emits `CountryModified` event
    */
    function modifyStoredInvestorCountry(address _userAddress, uint16 _country) external;

   /**
    *  @dev Updates an identity contract corresponding to a user address.
    *  Requires that the user address should be the owner of the identity contract.
    *  Requires that the user should have an identity contract already deployed that will be replaced.
    *  This function can only be called by an address set as agent of the smart contract
    *  @param _userAddress The address of the user
    *  @param _identity The address of the user's new identity contract
    *  emits `IdentityModified` event
    */
    function modifyStoredIdentity(address _userAddress, IIdentity _identity) external;

   /**
    *  @notice Transfers the Ownership of the Identity Registry Storage to a new Owner.
    *  This function can only be called by the wallet set as owner of the smart contract
    *  @param _newOwner The new owner of this contract.
    */
    function transferOwnershipOnIdentityRegistryStorage(address _newOwner) external;

   /**
    *  @notice Adds an identity registry as agent of the Identity Registry Storage Contract.
    *  This function can only be called by the wallet set as owner of the smart contract
    *  This function adds the identity registry to the list of identityRegistries linked to the storage contract
    *  @param _identityRegistry The identity registry address to add.
    */
    function bindIdentityRegistry(address _identityRegistry) external;

   /**
    *  @notice Removes an identity registry from being agent of the Identity Registry Storage Contract.
    *  This function can only be called by the wallet set as owner of the smart contract
    *  This function removes the identity registry from the list of identityRegistries linked to the storage contract
    *  @param _identityRegistry The identity registry address to remove.
    */
    function unbindIdentityRegistry(address _identityRegistry) external;
}

// File: contracts/registry/IIdentityRegistry.sol

/**
 *     NOTICE
 *
 *     The T-REX software is licensed under a proprietary license or the GPL v.3.
 *     If you choose to receive it under the GPL v.3 license, the following applies:
 *     T-REX is a suite of smart contracts developed by Tokeny to manage and transfer financial assets on the ethereum blockchain
 *
 *     Copyright (C) 2019, Tokeny sàrl.
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

pragma solidity ^0.6.0;






interface IIdentityRegistry {

   /**
    *  this event is emitted when the ClaimTopicsRegistry has been set for the IdentityRegistry
    *  the event is emitted by the IdentityRegistry constructor
    *  `claimTopicsRegistry` is the address of the Claim Topics Registry contract
    */
    event ClaimTopicsRegistrySet(address indexed claimTopicsRegistry);

   /**
    *  this event is emitted when the IdentityRegistryStorage has been set for the IdentityRegistry
    *  the event is emitted by the IdentityRegistry constructor
    *  `identityStorage` is the address of the Identity Registry Storage contract
    */
    event IdentityStorageSet(address indexed identityStorage);

   /**
    *  this event is emitted when the ClaimTopicsRegistry has been set for the IdentityRegistry
    *  the event is emitted by the IdentityRegistry constructor
    *  `trustedIssuersRegistry` is the address of the Trusted Issuers Registry contract
    */
    event TrustedIssuersRegistrySet(address indexed trustedIssuersRegistry);

   /**
    *  this event is emitted when an Identity is registered into the Identity Registry.
    *  the event is emitted by the 'registerIdentity' function
    *  `investorAddress` is the address of the investor's wallet
    *  `identity` is the address of the Identity smart contract (onchainID)
    */
    event IdentityRegistered(address indexed investorAddress, IIdentity indexed identity);

   /**
    *  this event is emitted when an Identity is removed from the Identity Registry.
    *  the event is emitted by the 'deleteIdentity' function
    *  `investorAddress` is the address of the investor's wallet
    *  `identity` is the address of the Identity smart contract (onchainID)
    */
    event IdentityRemoved(address indexed investorAddress, IIdentity indexed identity);

   /**
    *  this event is emitted when an Identity has been updated
    *  the event is emitted by the 'updateIdentity' function
    *  `oldIdentity` is the old Identity contract's address to update
    *  `newIdentity` is the new Identity contract's
    */
    event IdentityUpdated(IIdentity indexed oldIdentity, IIdentity indexed newIdentity);

   /**
    *  this event is emitted when an Identity's country has been updated
    *  the event is emitted by the 'updateCountry' function
    *  `investorAddress` is the address on which the country has been updated
    *  `country` is the numeric code (ISO 3166-1) of the new country
    */
    event CountryUpdated(address indexed investorAddress, uint16 indexed country);

   /**
    *  @dev Register an identity contract corresponding to a user address.
    *  Requires that the user doesn't have an identity contract already registered.
    *  This function can only be called by a wallet set as agent of the smart contract
    *  @param _userAddress The address of the user
    *  @param _identity The address of the user's identity contract
    *  @param _country The country of the investor
    *  emits `IdentityRegistered` event
    */
    function registerIdentity(address _userAddress, IIdentity _identity, uint16 _country) external;

   /**
    *  @dev Removes an user from the identity registry.
    *  Requires that the user have an identity contract already deployed that will be deleted.
    *  This function can only be called by a wallet set as agent of the smart contract
    *  @param _userAddress The address of the user to be removed
    *  emits `IdentityRemoved` event
    */
    function deleteIdentity(address _userAddress) external;

   /**
    *  @dev Replace the actual claimTopicsRegistry contract with a new one.
    *  This function can only be called by the wallet set as owner of the smart contract
    *  @param _claimTopicsRegistry The address of the new claim Topics Registry
    *  emits `ClaimTopicsRegistrySet` event
    */
    function setClaimTopicsRegistry(address _claimTopicsRegistry) external;

   /**
    *  @dev Replace the actual trustedIssuersRegistry contract with a new one.
    *  This function can only be called by the wallet set as owner of the smart contract
    *  @param _trustedIssuersRegistry The address of the new Trusted Issuers Registry
    *  emits `TrustedIssuersRegistrySet` event
    */
    function setTrustedIssuersRegistry(address _trustedIssuersRegistry) external;

   /**
    *  @dev Updates the country corresponding to a user address.
    *  Requires that the user should have an identity contract already deployed that will be replaced.
    *  This function can only be called by a wallet set as agent of the smart contract
    *  @param _userAddress The address of the user
    *  @param _country The new country of the user
    *  emits `CountryUpdated` event
    */
    function updateCountry(address _userAddress, uint16 _country) external;

   /**
    *  @dev Updates an identity contract corresponding to a user address.
    *  Requires that the user address should be the owner of the identity contract.
    *  Requires that the user should have an identity contract already deployed that will be replaced.
    *  This function can only be called by a wallet set as agent of the smart contract
    *  @param _userAddress The address of the user
    *  @param _identity The address of the user's new identity contract
    *  emits `IdentityUpdated` event
    */
    function updateIdentity(address _userAddress, IIdentity _identity) external;

   /**
    *  @dev function allowing to register identities in batch
    *  This function can only be called by a wallet set as agent of the smart contract
    *  Requires that none of the users has an identity contract already registered.
    *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_userAddresses.length` IS TOO HIGH,
    *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
    *  @param _userAddresses The addresses of the users
    *  @param _identities The addresses of the corresponding identity contracts
    *  @param _countries The countries of the corresponding investors
    *  emits _userAddresses.length `IdentityRegistered` events
    */
    function batchRegisterIdentity(address[] calldata _userAddresses, IIdentity[] calldata _identities, uint16[] calldata _countries) external;

   /**
    *  @dev This functions checks whether a wallet has its Identity registered or not
    *  in the Identity Registry.
    *  @param _userAddress The address of the user to be checked.
    *  @return 'True' if the address is contained in the Identity Registry, 'false' if not.
    */
    function contains(address _userAddress) external view returns (bool);

   /**
    *  @dev This functions checks whether an identity contract
    *  corresponding to the provided user address has the required claims or not based
    *  on the data fetched from trusted issuers registry and from the claim topics registry
    *  @param _userAddress The address of the user to be verified.
    *  @return 'True' if the address is verified, 'false' if not.
    */
    function isVerified(address _userAddress) external view returns (bool);

   /**
    *  @dev Returns the onchainID of an investor.
    *  @param _userAddress The wallet of the investor
    */
    function identity(address _userAddress) external view returns (IIdentity);

   /**
    *  @dev Returns the country code of an investor.
    *  @param _userAddress The wallet of the investor
    */
    function investorCountry(address _userAddress) external view returns (uint16);

   /**
    *  @dev Returns the TrustedIssuersRegistry linked to the current IdentityRegistry.
    */
    function identityStorage() external view returns (IIdentityRegistryStorage);

   /**
    *  @dev Returns the TrustedIssuersRegistry linked to the current IdentityRegistry.
    */
    function issuersRegistry() external view returns (ITrustedIssuersRegistry);

   /**
    *  @dev Returns the ClaimTopicsRegistry linked to the current IdentityRegistry.
    */
    function topicsRegistry() external view returns (IClaimTopicsRegistry);

   /**
    *  @notice Transfers the Ownership of the Identity Registry to a new Owner.
    *  This function can only be called by the wallet set as owner of the smart contract
    *  @param _newOwner The new owner of this contract.
    */
    function transferOwnershipOnIdentityRegistryContract(address _newOwner) external;

   /**
    *  @notice Adds an address as _agent of the Identity Registry Contract.
    *  This function can only be called by the wallet set as owner of the smart contract
    *  @param _agent The _agent's address to add.
    */
    function addAgentOnIdentityRegistryContract(address _agent) external;

   /**
    *  @notice Removes an address from being _agent of the Identity Registry Contract.
    *  This function can only be called by the wallet set as owner of the smart contract
    *  @param _agent The _agent's address to remove.
    */
    function removeAgentOnIdentityRegistryContract(address _agent) external;
}

// File: contracts/roles/Roles.sol

pragma solidity ^0.6.0;

/**
 * @title Roles
 * @dev Library for managing addresses assigned to a Role.
 */
library Roles {
    struct Role {
        mapping (address => bool) bearer;
    }

    /**
     * @dev Give an account access to this role.
     */
    function add(Role storage role, address account) internal {
        require(!has(role, account), "Roles: account already has role");
        role.bearer[account] = true;
    }

    /**
     * @dev Remove an account's access to this role.
     */
    function remove(Role storage role, address account) internal {
        require(has(role, account), "Roles: account does not have role");
        role.bearer[account] = false;
    }

    /**
     * @dev Check if an account has this role.
     * @return bool
     */
    function has(Role storage role, address account) internal view returns (bool) {
        require(account != address(0), "Roles: account is the zero address");
        return role.bearer[account];
    }
}

// File: openzeppelin-solidity/contracts/GSN/Context.sol

pragma solidity ^0.6.0;

/*
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with GSN meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
contract Context {
    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal { }

    function _msgSender() internal view virtual returns (address payable) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return msg.data;
    }
}

// File: contracts/roles/Ownable.sol

pragma solidity ^0.6.0;


/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor () internal {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Returns true if the caller is the current owner.
     */
    function isOwner() public view returns (bool) {
        return _msgSender() == _owner;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     */
    function _transferOwnership(address newOwner) internal virtual {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

// File: contracts/roles/AgentRole.sol

/**
 *     NOTICE
 *
 *     The T-REX software is licensed under a proprietary license or the GPL v.3.
 *     If you choose to receive it under the GPL v.3 license, the following applies:
 *     T-REX is a suite of smart contracts developed by Tokeny to manage and transfer financial assets on the ethereum blockchain
 *
 *     Copyright (C) 2019, Tokeny sàrl.
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

pragma solidity ^0.6.0;



contract AgentRole is Ownable {
    using Roles for Roles.Role;

    event AgentAdded(address indexed _agent);
    event AgentRemoved(address indexed _agent);

    Roles.Role private _agents;

    modifier onlyAgent() {
        require(isAgent(msg.sender), "AgentRole: caller does not have the Agent role");
        _;
    }

    function isAgent(address _agent) public view returns (bool) {
        return _agents.has(_agent);
    }

    function addAgent(address _agent) public onlyOwner {
        _agents.add(_agent);
        emit AgentAdded(_agent);
    }

    function removeAgent(address _agent) public onlyOwner {
        _agents.remove(_agent);
        emit AgentRemoved(_agent);
    }
}

// File: contracts/registry/IdentityRegistry.sol

/**
 *     NOTICE
 *
 *     The T-REX software is licensed under a proprietary license or the GPL v.3.
 *     If you choose to receive it under the GPL v.3 license, the following applies:
 *     T-REX is a suite of smart contracts developed by Tokeny to manage and transfer financial assets on the ethereum blockchain
 *
 *     Copyright (C) 2019, Tokeny sàrl.
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

pragma solidity ^0.6.0;









contract IdentityRegistry is IIdentityRegistry, AgentRole {


    /// Address of the ClaimTopicsRegistry Contract
    IClaimTopicsRegistry private tokenTopicsRegistry;

    /// Address of the TrustedIssuersRegistry Contract
    ITrustedIssuersRegistry private tokenIssuersRegistry;

    /// Address of the IdentityRegistryStorage Contract
    IIdentityRegistryStorage private tokenIdentityStorage;

   /**
    *  @dev the constructor initiates the Identity Registry smart contract
    *  @param _trustedIssuersRegistry the trusted issuers registry linked to the Identity Registry
    *  @param _claimTopicsRegistry the claim topics registry linked to the Identity Registry
    *  emits a `ClaimTopicsRegistrySet` event
    *  emits a `TrustedIssuersRegistrySet` event
    */
    constructor (
        address _trustedIssuersRegistry,
        address _claimTopicsRegistry,
        address _identityStorage
    ) public {
        tokenTopicsRegistry = IClaimTopicsRegistry(_claimTopicsRegistry);
        tokenIssuersRegistry = ITrustedIssuersRegistry(_trustedIssuersRegistry);
        tokenIdentityStorage = IIdentityRegistryStorage(_identityStorage);
        emit ClaimTopicsRegistrySet(_claimTopicsRegistry);
        emit TrustedIssuersRegistrySet(_trustedIssuersRegistry);
        emit IdentityStorageSet(_identityStorage);
    }

   /**
    *  @dev See {IIdentityRegistry-identity}.
    */
    function identity(address _userAddress) public override view returns (IIdentity){
        return tokenIdentityStorage.storedIdentity(_userAddress);
    }

   /**
    *  @dev See {IIdentityRegistry-investorCountry}.
    */
    function investorCountry(address _userAddress) public override view returns (uint16){
        return tokenIdentityStorage.storedInvestorCountry(_userAddress);
    }

   /**
    *  @dev Returns the TrustedIssuersRegistry linked to the current IdentityRegistry.
    */
    function issuersRegistry() public override view returns (ITrustedIssuersRegistry){
        return tokenIssuersRegistry;
    }

   /**
    *  @dev Returns the ClaimTopicsRegistry linked to the current IdentityRegistry.
    */
    function topicsRegistry() public override view returns (IClaimTopicsRegistry){
        return tokenTopicsRegistry;
    }

    /**
    *  @dev Returns the ClaimTopicsRegistry linked to the current IdentityRegistry.
    */
    function identityStorage() public override view returns (IIdentityRegistryStorage){
        return tokenIdentityStorage;
    }

   /**
    *  @dev See {IIdentityRegistry-registerIdentity}.
    */
    function registerIdentity(address _userAddress, IIdentity _identity, uint16 _country) public override onlyAgent {
        tokenIdentityStorage.addIdentityToStorage(_userAddress, _identity, _country);
        emit IdentityRegistered(_userAddress, _identity);
    }

   /**
    *  @dev See {IIdentityRegistry-batchRegisterIdentity}.
    */
    function batchRegisterIdentity(address[] calldata _userAddresses, IIdentity[] calldata _identities, uint16[] calldata _countries) external override {
        for (uint256 i = 0; i < _userAddresses.length; i++) {
            registerIdentity(_userAddresses[i], _identities[i], _countries[i]);
        }
    }

   /**
    *  @dev See {IIdentityRegistry-updateIdentity}.
    */
    function updateIdentity(address _userAddress, IIdentity _identity) public override onlyAgent {
        tokenIdentityStorage.modifyStoredIdentity(_userAddress, _identity);
        emit IdentityUpdated(identity(_userAddress), _identity);
    }


   /**
    *  @dev See {IIdentityRegistry-updateCountry}.
    */
    function updateCountry(address _userAddress, uint16 _country) public override onlyAgent {
        tokenIdentityStorage.modifyStoredInvestorCountry(_userAddress, _country);
        emit CountryUpdated(_userAddress, _country);
    }

   /**
    *  @dev See {IIdentityRegistry-deleteIdentity}.
    */
    function deleteIdentity(address _userAddress) public override onlyAgent {
        tokenIdentityStorage.removeIdentityFromStorage(_userAddress);
        emit IdentityRemoved(_userAddress, identity(_userAddress));
    }

   /**
    *  @dev See {IIdentityRegistry-isVerified}.
    */
    function isVerified(address _userAddress) public override view returns (bool) {
        if (address(identity(_userAddress)) == address(0)) {
            return false;
        }
        uint256[] memory claimTopics = tokenTopicsRegistry.getClaimTopics();
        uint length = claimTopics.length;
        if (length == 0) {
            return true;
        }
        uint256 foundClaimTopic;
        uint256 scheme;
        address issuer;
        bytes memory sig;
        bytes memory data;
        uint256 claimTopic;
        for (claimTopic = 0; claimTopic < length; claimTopic++) {
            bytes32[] memory claimIds = identity(_userAddress).getClaimIdsByTopic(claimTopics[claimTopic]);
            if (claimIds.length == 0) {
                return false;
            }
            for (uint j = 0; j < claimIds.length; j++) {
                (foundClaimTopic, scheme, issuer, sig, data,) = identity(_userAddress).getClaim(claimIds[j]);
                if (!tokenIssuersRegistry.isTrustedIssuer(issuer)) {
                    return false;
                }
                if (!tokenIssuersRegistry.hasClaimTopic(issuer, claimTopics[claimTopic])) {
                    return false;
                }
                if (!IClaimIssuer(issuer).isClaimValid(identity(_userAddress), claimTopics[claimTopic], sig, data)) {
                    return false;
                }
            }
        }
        return true;
    }

   /**
    *  @dev See {IIdentityRegistry-setClaimTopicsRegistry}.
    */
    function setClaimTopicsRegistry(address _claimTopicsRegistry) public override onlyOwner {
        tokenTopicsRegistry = IClaimTopicsRegistry(_claimTopicsRegistry);
        emit ClaimTopicsRegistrySet(_claimTopicsRegistry);
    }

   /**
    *  @dev See {IIdentityRegistry-setTrustedIssuersRegistry}.
    */
    function setTrustedIssuersRegistry(address _trustedIssuersRegistry) public override onlyOwner {
        tokenIssuersRegistry = ITrustedIssuersRegistry(_trustedIssuersRegistry);
        emit TrustedIssuersRegistrySet(_trustedIssuersRegistry);
    }

   /**
    *  @dev See {IIdentityRegistry-contains}.
    */
    function contains(address _userAddress) public override view returns (bool){
        if (address(identity(_userAddress)) == address(0)) {
            return false;
        }
        return true;
    }

   /**
    *  @dev See {IIdentityRegistry-transferOwnershipOnIdentityRegistryContract}.
    */
    function transferOwnershipOnIdentityRegistryContract(address _newOwner) external override onlyOwner {
        transferOwnership(_newOwner);
    }

   /**
    *  @dev See {IIdentityRegistry-addAgentOnIdentityRegistryContract}.
    */
    function addAgentOnIdentityRegistryContract(address _agent) external override {
        addAgent(_agent);
    }

   /**
    *  @dev See {IIdentityRegistry-removeAgentOnIdentityRegistryContract}.
    */
    function removeAgentOnIdentityRegistryContract(address _agent) external override {
        removeAgent(_agent);
    }
}
