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

    // READ OPERATIONS
    function getTrustedIssuer(uint index) external view returns (IClaimIssuer);
    function getTrustedIssuerClaimTopics(uint index) external view returns(uint[] memory);
    function getTrustedIssuers() external view returns (uint[] memory);
    function hasClaimTopic(address issuer, uint claimTopic) external view returns(bool);
    function isTrustedIssuer(address issuer) external view returns(bool);

    // WRITE OPERATIONS
    function addTrustedIssuer(IClaimIssuer _trustedIssuer, uint index, uint[] calldata claimTopics) external;
    function removeTrustedIssuer(uint index) external;
    function updateIssuerContract(uint index, IClaimIssuer _newTrustedIssuer, uint[] calldata claimTopics) external;
    function updateIssuerClaimTopics(uint index, uint[] calldata claimTopics) external;

    // transfer contract ownership
    function transferOwnershipOnIssuersRegistryContract(address newOwner) external;
}
