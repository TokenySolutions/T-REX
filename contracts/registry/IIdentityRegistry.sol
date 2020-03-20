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

import "../registry/ITrustedIssuersRegistry.sol";
import "../registry/IClaimTopicsRegistry.sol";

import "@onchain-id/solidity/contracts/IClaimIssuer.sol";
import "@onchain-id/solidity/contracts/IIdentity.sol";

interface IIdentityRegistry {



    /**
     *  this event is emitted when the ClaimTopicsRegistry has been set for the IdentityRegistry
     *  the event is emitted by the IdentityRegistry constructor
     *  `_claimTopicsRegistry` is the address of the Claim Topics Registry contract
     */
    event ClaimTopicsRegistrySet(address indexed _claimTopicsRegistry);

    /**
     *  this event is emitted when the ClaimTopicsRegistry has been set for the IdentityRegistry
     *  the event is emitted by the IdentityRegistry constructor
     *  `_claimTopicsRegistry` is the address of the Claim Topics Registry contract
     */
    event TrustedIssuersRegistrySet(address indexed _trustedIssuersRegistry);

    /**
    *  this event is emitted when an Identity's country has been updated
    *  the event is emitted by the 'updateCountry' function
    *  `investorAddress` is the address on which the country has been updated
    *  `country` is the numeric code (ISO 3166-1) of the new country
    */
    event CountryUpdated(address indexed investorAddress, uint16 indexed country);

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
    *  `old_identity` is the old Identity contract's address to update
    *  `new_identity` is the new Identity contract's
    */
    event IdentityUpdated(IIdentity indexed old_identity, IIdentity indexed new_identity);

    /**
    *  @notice Removes an user from the identity registry.
    *  Requires that the user have an identity contract already deployed that will be deleted.
    *  Only Agent can call.
    *  emits `IdentityRemoved` event
    *  @param _user The address of the user to be removed
    */
    function deleteIdentity(address _user) external;

    /**
    *  @notice Register an identity contract corresponding to a user address.
    *  Requires that the user doesn't have an identity contract already registered.
    *  Only agent can call.
    *  emits `IdentityRegistered` event
    *  @param _user The address of the user
    *  @param _identity The address of the user's identity contract
    *  @param _country The country of the investor
    */
    function registerIdentity(address _user, IIdentity _identity, uint16 _country) external;

    /**
    *  @notice Replace the actual claimTopicsRegistry contract with a new one.
    *  Only owner can call.
    *  emits `ClaimTopicsRegistrySet` event
    *  @param _claimTopicsRegistry The address of the new claim Topics Registry
    */
    function setClaimTopicsRegistry(address _claimTopicsRegistry) external;

    /**
    *  @notice Replace the actual trustedIssuersRegistry contract with a new one.
    *  Only owner can call.
    *  emits `TrustedIssuersRegistrySet` event
    *  @param _trustedIssuersRegistry The address of the new Trusted Issuers Registry
    */
    function setTrustedIssuersRegistry(address _trustedIssuersRegistry) external;

    /**
    *  @notice Updates the country corresponding to a user address.
    *  Requires that the user should have an identity contract already deployed that will be replaced.
    *  Only agent can call.
    *  emits `CountryUpdated` event
    *  @param _user The address of the user
    *  @param _country The new country of the user
    */
    function updateCountry(address _user, uint16 _country) external;

    /**
    *  @notice Updates an identity contract corresponding to a user address.
    *  Requires that the user address should be the owner of the identity contract.
    *  Requires that the user should have an identity contract already deployed that will be replaced.
    *  Only agent can call.
    *  emits `IdentityUpdated` event
    *  @param _user The address of the user
    *  @param _identity The address of the user's new identity contract
    */
    function updateIdentity(address _user, IIdentity _identity) external;

    /**
     *  @notice function allowing to register identities in batch
     *  Only Agent can call this function.
     *  Requires that none of the users has an identity contract already registered.
     *
     *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_users.length` IS TOO HIGH,
     *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *
     *  @param _users The addresses of the users
     *  @param _identities The addresses of the corresponding identity contracts
     *  @param _countries The countries of the corresponding investors
     *
     */
    function batchRegisterIdentity(address[] calldata _users, IIdentity[] calldata _identities, uint16[] calldata _countries) external;

    /**
    *  @notice This functions checks whether a wallet has its Identity registered or not
    *  in the Identity Registry.
    *
    *  @param _wallet The address of the user to be checked.
    *
    *  @return 'True' if the address is contained in the Identity Registry, 'false' if not.
    */
    function contains(address _wallet) external view returns (bool);

    /**
    *  @notice This functions checks whether an identity contract
    *  corresponding to the provided user address has the required claims or not based
    *  on the security token.
    *
    *  @param _userAddress The address of the user to be verified.
    *
    *  @return 'True' if the address is verified, 'false' if not.
    */
    function isVerified(address _userAddress) external view returns (bool);

    /**
     *  @dev Returns the onchainID of an investor.
     *  @param _wallet The wallet of the investor
     */
    function getIdentityOfWallet(address _wallet) external view returns (IIdentity);

    /**
     *  @dev Returns the country code of an investor.
     *  @param _wallet The wallet of the investor
     */
    function getInvestorCountryOfWallet(address _wallet) external view returns (uint16);


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
    *  Only owner can call.
    *
    *  @param newOwner The new owner of this contract.
    */
    function transferOwnershipOnIdentityRegistryContract(address newOwner) external;

    /**
    *  @notice Adds an address as agent of the Identity Registry Contract.
    *  Only owner can call.
    *
    *  @param agent The agent's address to add.
    */
    function addAgentOnIdentityRegistryContract(address agent) external;

    /**
     *  @notice Removes an address from being agent of the Identity Registry Contract.
     *  Only owner can call.
     *
     *  @param agent The agent's address to remove.
     */
    function removeAgentOnIdentityRegistryContract(address agent) external;
}
