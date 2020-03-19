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
    // EVENTS
    event ClaimTopicsRegistrySet(address indexed _claimTopicsRegistry);
    event CountryUpdated(address indexed investorAddress, uint16 indexed country);
    event IdentityRegistered(address indexed investorAddress, IIdentity indexed identity);
    event IdentityRemoved(address indexed investorAddress, IIdentity indexed identity);
    event IdentityUpdated(IIdentity indexed old_identity, IIdentity indexed new_identity);
    event TrustedIssuersRegistrySet(address indexed _trustedIssuersRegistry);

    // WRITE OPERATIONS
    function deleteIdentity(address _user) external;
    function registerIdentity(address _user, IIdentity _identity, uint16 _country) external;
    function setClaimTopicsRegistry(address _claimTopicsRegistry) external;
    function setTrustedIssuersRegistry(address _trustedIssuersRegistry) external;
    function updateCountry(address _user, uint16 _country) external;
    function updateIdentity(address _user, IIdentity _identity) external;
    function batchRegisterIdentity(address[] calldata _users, IIdentity[] calldata _identities, uint16[] calldata _countries) external;

    // READ OPERATIONS
    function contains(address _wallet) external view returns (bool);
    function isVerified(address _userAddress) external view returns (bool);

    // GETTERS
    function getIdentityOfWallet(address _wallet) external view returns (IIdentity);
    function getInvestorCountryOfWallet(address _wallet) external view returns (uint16);
    function issuersRegistry() external view returns (ITrustedIssuersRegistry);
    function topicsRegistry() external view returns (IClaimTopicsRegistry);

    // transfer contract ownership
    function transferOwnershipOnIdentityRegistryContract(address newOwner) external;

    // manage Agent Role (onlyOwner functions)
    function addAgentOnIdentityRegistryContract(address agent) external;
    function removeAgentOnIdentityRegistryContract(address agent) external;
}
