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

import "../registry/IClaimTopicsRegistry.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract ClaimTopicsRegistry is IClaimTopicsRegistry, Ownable {

    /// List of all required Claim Topics
    uint256[] public claimTopics;

    /**
    * @dev See {IClaimTopicsRegistry-addClaimTopic}.
    */
    function addClaimTopic(uint256 claimTopic) public override onlyOwner {
        uint length = claimTopics.length;
        for (uint i = 0; i < length; i++) {
            require(claimTopics[i] != claimTopic, "claimTopic already exists");
        }
        claimTopics.push(claimTopic);
        emit ClaimTopicAdded(claimTopic);
    }

    /**
    * @dev See {IClaimTopicsRegistry-removeClaimTopic}.
    */
    function removeClaimTopic(uint256 claimTopic) public override onlyOwner {
        uint length = claimTopics.length;
        for (uint i = 0; i < length; i++) {
            if (claimTopics[i] == claimTopic) {
                delete claimTopics[i];
                claimTopics[i] = claimTopics[length - 1];
                delete claimTopics[length - 1];
                claimTopics.pop();
                emit ClaimTopicRemoved(claimTopic);
                return;
            }
        }
    }

    /**
    * @dev See {IClaimTopicsRegistry-getClaimTopics}.
    */
    function getClaimTopics() public override view returns (uint256[] memory) {
        return claimTopics;
    }

    /**
    * @dev See {IClaimTopicsRegistry-transferOwnershipOnClaimTopicsRegistryContract}.
    */
    function transferOwnershipOnClaimTopicsRegistryContract(address newOwner) external override onlyOwner {
        transferOwnership(newOwner);
    }
}
