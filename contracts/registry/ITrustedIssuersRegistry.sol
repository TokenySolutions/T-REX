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
    // EVENTS
    event TrustedIssuerAdded(uint indexed index, IClaimIssuer indexed trustedIssuer, uint[] claimTopics);
    event TrustedIssuerRemoved(uint indexed index, IClaimIssuer indexed trustedIssuer);
    event TrustedIssuerUpdated(uint indexed index, IClaimIssuer indexed oldTrustedIssuer, IClaimIssuer indexed newTrustedIssuer, uint[] claimTopics);
    event ClaimTopicsUpdated(uint indexed index, IClaimIssuer indexed trustedIssuer, uint[] claimTopics);

    /**
     * @notice Function for getting the trusted claim issuer's
     * identity contract address corresponding to the index provided.
     * Requires the provided index to have an identity contract stored.
     * Only owner can call.
     *
     * @param index The index corresponding to which identity contract address is required.
     *
     * @return Address of the identity contract address of the trusted claim issuer.
     */
    function getTrustedIssuer(uint index) external view returns (IClaimIssuer);

    /**
    * @notice Function for getting all the claim topic of trusted claim issuer
    * Requires the provided index to have an identity contract stored and claim topic.
    * Only owner can call.
    *
    * @param index The index corresponding to which identity contract address is required.
    *
    * @return The claim topics corresponding to the trusted issuers.
    */
    function getTrustedIssuerClaimTopics(uint index) external view returns(uint[] memory);

    /**
     * @notice Function for getting all the trusted claim issuer indexes stored.
     *
     * @return array of indexes of all the trusted claim issuer indexes stored.
     */
    function getTrustedIssuers() external view returns (uint[] memory);

    /**
    * @notice Function for checking the trusted claim issuer's
    * has corresponding claim topic
    *
    * @return true if the issuer is trusted for this claim topic.
    */
    function hasClaimTopic(address issuer, uint claimTopic) external view returns(bool);
    function isTrustedIssuer(address issuer) external view returns(bool);

    /**
     * @notice Adds the identity contract of a trusted claim issuer corresponding
     * to the index provided.
     * Requires the index to be greater than zero.
     * Requires that an identity contract doesnt already exist corresponding to the index.
     * Only owner can
     *
     * @param _trustedIssuer The identity contract address of the trusted claim issuer.
     * @param index The desired index of the claim issuer
     * @param claimTopics list of authorized claim topics for each trusted claim issuer
     */
    function addTrustedIssuer(IClaimIssuer _trustedIssuer, uint index, uint[] calldata claimTopics) external;

    /**
    * @notice Removes the identity contract of a trusted claim issuer corresponding
    * to the index provided.
    * Requires the index to be greater than zero.
    * Requires that an identity contract exists corresponding to the index.
    * Only owner can call.
    *
    * @param index The desired index of the claim issuer to be removed.
    */
    function removeTrustedIssuer(uint index) external;

    /**
     * @notice Updates the identity contract of a trusted claim issuer corresponding
     * to the index provided.
     * Requires the index to be greater than zero.
     * Requires that an identity contract already exists corresponding to the provided index.
     * Only owner can call.
     *
     * @param index The desired index of the claim issuer to be updated.
     * @param _newTrustedIssuer The new identity contract address of the trusted claim issuer.
     * @param claimTopics list of authorized claim topics for each trusted claim issuer
     */
    function updateIssuerContract(uint index, IClaimIssuer _newTrustedIssuer, uint[] calldata claimTopics) external;
    function updateIssuerClaimTopics(uint index, uint[] calldata claimTopics) external;

    // transfer contract ownership
    function transferOwnershipOnIssuersRegistryContract(address newOwner) external;
}
