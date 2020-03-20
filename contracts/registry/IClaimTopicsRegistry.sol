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
    * @notice Add a trusted claim topic (For example: KYC=1, AML=2).
    * Only owner can call.
    * emits `ClaimTopicAdded` event
    * @param _claimTopic The claim topic index
    */
    function addClaimTopic(uint256 _claimTopic) external;

    /**
    * @notice Remove a trusted claim topic (For example: KYC=1, AML=2).
    * Only owner can call.
    * emits `ClaimTopicRemoved` event
    * @param _claimTopic The claim topic index
    */
    function removeClaimTopic(uint256 _claimTopic) external;

    /**
    * @notice Get the trusted claim topics for the security token
    *
    * @return Array of trusted claim topics
    */
    function getClaimTopics() external view returns (uint256[] memory);

    /**
    * @notice Transfers the Ownership of ClaimTopics to a new Owner.
    * Only owner can call.
    *
    * @param _newOwner The new owner of this contract.
    */
    function transferOwnershipOnClaimTopicsRegistryContract(address _newOwner) external;
}
