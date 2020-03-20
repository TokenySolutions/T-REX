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

import "@onchain-id/solidity/contracts/IClaimIssuer.sol";

interface ITrustedIssuersRegistry {

   /**
    *  this event is emitted when a trusted issuer is added in the registry.
    *  the event is emitted by the addTrustedIssuer function
    *  `index` is the index of the trusted issuer
    *  `trustedIssuer` is the address of the trusted issuer's ClaimIssuer contract
    *  `claimTopics` is the set of claims that the trusted issuer is allowed to emit
    */
    event TrustedIssuerAdded(uint indexed index, IClaimIssuer indexed trustedIssuer, uint[] claimTopics);

   /**
    *  this event is emitted when a trusted issuer is removed from the registry.
    *  the event is emitted by the removeTrustedIssuer function
    *  `index` is the index of the trusted issuer
    *  `trustedIssuer` is the address of the trusted issuer's ClaimIssuer contract
    */
    event TrustedIssuerRemoved(uint indexed index, IClaimIssuer indexed trustedIssuer);

   /**
    *  this event is emitted when the ClaimIssuer contract is changed for a given trusted issuer index.
    *  the event is emitted by the updateIssuerContract function
    *  `index` is the index of the trusted issuer
    *  `oldTrustedIssuer` is the address of the trusted issuer's ClaimIssuer contract before update
    *  `newTrustedIssuer` is the address of the trusted issuer's ClaimIssuer contract after update
    *  `claimTopics` is the set of claims that the trusted issuer is allowed to emit
    */
    event TrustedIssuerUpdated(uint indexed index, IClaimIssuer indexed oldTrustedIssuer, IClaimIssuer indexed newTrustedIssuer, uint[] claimTopics);

   /**
    *  this event is emitted when the set of claim topics is changed for a given trusted issuer.
    *  the event is emitted by the updateIssuerClaimTopics function
    *  `index` is the index of the trusted issuer
    *  `trustedIssuer` is the address of the trusted issuer's ClaimIssuer contract
    *  `claimTopics` is the set of claims that the trusted issuer is allowed to emit
    */
    event ClaimTopicsUpdated(uint indexed index, IClaimIssuer indexed trustedIssuer, uint[] claimTopics);

    /**
     *  @dev registers a ClaimIssuer contract as trusted claim issuer corresponding to a specific index.
     *  Requires the index to be greater than zero.
     *  Requires that a ClaimIssuer contract doesn't already exist corresponding to the index.
     *  @param _trustedIssuer The ClaimIssuer contract address of the trusted claim issuer.
     *  @param _index The desired index of the claim issuer
     *  @param _claimTopics the set of claim topics that the trusted issuer is allowed to emit
     *  This function can only be called by the owner of the Trusted Issuers Registry contract
     *  emits a `TrustedIssuerAdded` event
     */
    function addTrustedIssuer(IClaimIssuer _trustedIssuer, uint _index, uint[] calldata _claimTopics) external;

   /**
    *  @dev Removes the ClaimIssuer contract of a trusted claim issuer corresponding to the index provided.
    *  Requires the index to be greater than zero.
    *  Requires that an identity contract exists corresponding to the index.
    *  @param _index the index of the claim issuer to remove.
    *  This function can only be called by the owner of the Trusted Issuers Registry contract
    *  emits a `TrustedIssuerRemoved` event
    */
    function removeTrustedIssuer(uint _index) external;

    /**
     *  @dev Updates the identity contract of a trusted claim issuer corresponding to the index provided.
     *  Requires the index to be greater than zero.
     *  Requires that an identity contract already exists corresponding to the provided index.
     *  Requires that the ClaimIssuer contract address does not exist in the registry yet
     *  @param _index the index of the claim issuer to update.
     *  @param _newTrustedIssuer The new identity contract address of the trusted claim issuer.
     *  @param _claimTopics the set of claim topics that the trusted issuer is allowed to emit
     *  This function can only be called by the owner of the Trusted Issuers Registry contract
     *  emits a `TrustedIssuerUpdated` event
     */
    function updateIssuerContract(uint _index, IClaimIssuer _newTrustedIssuer, uint[] calldata _claimTopics) external;

    /**
     *  @dev Updates the set of claim topics that a trusted issuer is allowed to emit.
     *  Requires that a ClaimIssuer contract already exists corresponding to the provided index.
     *  @param _index the index of the claim issuer to update.
     *  @param _claimTopics the set of claim topics that the trusted issuer is allowed to emit
     *  This function can only be called by the owner of the Trusted Issuers Registry contract
     *  emits a `ClaimTopicsUpdated` event
     */
    function updateIssuerClaimTopics(uint _index, uint[] calldata _claimTopics) external;

    /**
     *  @dev Function for getting all the trusted claim issuer indexes stored.
     *  @return array of indexes of all the trusted claim issuers registered.
     */
    function getTrustedIssuers() external view returns (uint[] memory);

    /**
     *  @dev Checks if the ClaimIssuer contract is trusted
     *  @param _issuer the address of the ClaimIssuer contract
     *  @return true if the issuer is trusted, false otherwise.
     */
    function isTrustedIssuer(address _issuer) external view returns(bool);

    /**
     *  @dev Function for getting the trusted claim issuer's
     *  ClaimIssuer contract address corresponding to the index provided.
     *  Requires the provided index to have an identity contract stored.
     *  @param _index The index corresponding to the trusted issuer concerned.
     *  @return Address of the ClaimIssuer contract of the trusted claim issuer.
     */
    function getTrustedIssuer(uint _index) external view returns (IClaimIssuer);

    /**
     *  @dev Function for getting all the claim topic of trusted claim issuer
     *  Requires the provided index to have an ClaimIssuer contract registered in the trusted issuers registry.
     *  @param _index The index corresponding to the trusted issuer concerned.
     *  @return The set of claim topics that the trusted issuer is allowed to emit
     */
    function getTrustedIssuerClaimTopics(uint _index) external view returns(uint[] memory);

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
