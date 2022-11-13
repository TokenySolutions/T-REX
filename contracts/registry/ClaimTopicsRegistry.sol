// SPDX-License-Identifier: GPL-3.0
/**
 *     NOTICE
 *
 *     The T-REX software is licensed under a proprietary license or the GPL v.3.
 *     If you choose to receive it under the GPL v.3 license, the following applies:
 *     T-REX is a suite of smart contracts developed by Tokeny to manage and transfer financial assets on the ethereum blockchain
 *
 *     Copyright (C) 2021, Tokeny sàrl.
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

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';

import '../registry/IClaimTopicsRegistry.sol';

contract ClaimTopicsRegistry is IClaimTopicsRegistry, Ownable {
    /// @dev All required Claim Topics
    uint256[] private claimTopics;

    /**
     *  @dev See {IClaimTopicsRegistry-addClaimTopic}.
     */
    function addClaimTopic(uint256 _claimTopic) external override onlyOwner {
        uint256 length = claimTopics.length;
        for (uint256 i = 0; i < length; i++) {
            require(claimTopics[i] != _claimTopic, 'claimTopic already exists');
        }
        claimTopics.push(_claimTopic);
        emit ClaimTopicAdded(_claimTopic);
    }

    /**
     *  @dev See {IClaimTopicsRegistry-removeClaimTopic}.
     */
    function removeClaimTopic(uint256 _claimTopic) external override onlyOwner {
        uint256 length = claimTopics.length;
        for (uint256 i = 0; i < length; i++) {
            if (claimTopics[i] == _claimTopic) {
                claimTopics[i] = claimTopics[length - 1];
                claimTopics.pop();
                emit ClaimTopicRemoved(_claimTopic);
                break;
            }
        }
    }

    /**
     *  @dev See {IClaimTopicsRegistry-getClaimTopics}.
     */
    function getClaimTopics() external view override returns (uint256[] memory) {
        return claimTopics;
    }

    /**
     *  @dev See {IClaimTopicsRegistry-transferOwnershipOnClaimTopicsRegistryContract}.
     */
    function transferOwnershipOnClaimTopicsRegistryContract(address _newOwner) external override onlyOwner {
        transferOwnership(_newOwner);
    }
}
