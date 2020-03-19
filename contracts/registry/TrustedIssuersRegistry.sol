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
import "@onchain-id/solidity/contracts/IClaimIssuer.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract TrustedIssuersRegistry is ITrustedIssuersRegistry, Ownable {

    /// Mapping between a trusted issuer index and its corresponding identity contract address.

    mapping(uint => IClaimIssuer) public trustedIssuers;

    /// Mapping between a trusted issuer index and its corresponding claimTopics.

    mapping(uint => mapping(uint => uint)) public trustedIssuerClaimTopics;

    /// Mapping between a trusted issuer index and its amount of claimTopics.

    mapping(uint => uint) public trustedIssuerClaimCount;

    /// Mapping to know either an address corresponds to a trusted issuer or not.

    mapping(address => bool) public trustedIssuer;

    // Array stores the trusted issuer indexes

    uint[] public indexes;

   /**
    * @dev See {ITrustedIssuersRegistry-addTrustedIssuer}.
    */

    function addTrustedIssuer(IClaimIssuer _trustedIssuer, uint index, uint[] memory claimTopics) public override onlyOwner {
        require(index > 0);
        uint claimTopicsLength = claimTopics.length;
        require(claimTopicsLength > 0);
        require(address(trustedIssuers[index]) == address(0), "A trustedIssuer already exists by this name");
        require(address(_trustedIssuer) != address(0));
        uint length = indexes.length;
        for (uint i = 0; i < length; i++) {
            require(_trustedIssuer != trustedIssuers[indexes[i]], "Issuer address already exists in another index");
        }
        trustedIssuers[index] = _trustedIssuer;
        indexes.push(index);
        uint i;
        for (i = 0; i < claimTopicsLength; i++) {
            trustedIssuerClaimTopics[index][i] = claimTopics[i];
        }
        trustedIssuerClaimCount[index] = i;
        trustedIssuer[address(trustedIssuers[index])] = true;
        emit TrustedIssuerAdded(index, _trustedIssuer, claimTopics);
    }

   /**
    * @dev See {ITrustedIssuersRegistry-removeTrustedIssuer}.
    */

    function removeTrustedIssuer(uint index) public override onlyOwner {
        require(index > 0);
        require(address(trustedIssuers[index]) != address(0), "No such issuer exists");
        delete trustedIssuer[address(trustedIssuers[index])];
        delete trustedIssuers[index];
        uint length = indexes.length;
        for (uint i = 0; i < length; i++) {
            if (indexes[i] == index) {
                delete indexes[i];
                indexes[i] = indexes[length - 1];
                delete indexes[length - 1];
                indexes.pop();
                break;
            }
        }
        uint claimTopicCount = trustedIssuerClaimCount[index];
        for (uint i = 0; i < claimTopicCount; i++) {
            if (trustedIssuerClaimTopics[index][i] != 0) {
                delete trustedIssuerClaimTopics[index][i];
            }
        }
        delete trustedIssuerClaimCount[index];
        emit TrustedIssuerRemoved(index, trustedIssuers[index]);
    }

   /**
    * @dev See {ITrustedIssuersRegistry-getTrustedIssuers}.
    */

    function getTrustedIssuers() public override view returns (uint[] memory) {
        return indexes;
    }

   /**
    * @dev See {ITrustedIssuersRegistry-isTrustedIssuer}.
    */

    function isTrustedIssuer(address issuer) public override view returns (bool) {
        return trustedIssuer[issuer];
    }

   /**
    * @dev See {ITrustedIssuersRegistry-getTrustedIssuer}.
    */

    function getTrustedIssuer(uint index) public override view returns (IClaimIssuer) {
        require(index > 0);
        require(address(trustedIssuers[index]) != address(0), "No such issuer exists");
        return trustedIssuers[index];
    }

   /**
    * @dev See {ITrustedIssuersRegistry-getTrustedIssuerClaimTopics}.
    */

    function getTrustedIssuerClaimTopics(uint index) public override view returns (uint[] memory) {
        require(index > 0);
        require(address(trustedIssuers[index]) != address(0), "No such issuer exists");
        uint length = trustedIssuerClaimCount[index];
        uint[] memory claimTopics = new uint[](length);
        for (uint i = 0; i < length; i++) {
            claimTopics[i] = trustedIssuerClaimTopics[index][i];
        }
        return claimTopics;
    }

   /**
    * @dev See {ITrustedIssuersRegistry-hasClaimTopic}.
    */

    function hasClaimTopic(address issuer, uint claimTopic) public override view returns (bool) {
        require(claimTopic > 0);
        for (uint i = 0; i < indexes.length; i++) {
            if (address(trustedIssuers[indexes[i]]) == issuer) {
                uint claimTopicCount = trustedIssuerClaimCount[indexes[i]];
                for (uint j = 0; j < claimTopicCount; j++) {
                    if (trustedIssuerClaimTopics[indexes[i]][j] == claimTopic) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

   /**
    * @dev See {ITrustedIssuersRegistry-updateIssuerContract}.
    */

    function updateIssuerContract(uint index, IClaimIssuer _newTrustedIssuer, uint[] memory claimTopics) public override onlyOwner {
        require(index > 0);
        require(address(trustedIssuers[index]) != address(0), "No such issuer exists");
        uint length = indexes.length;
        uint claimTopicsLength = claimTopics.length;
        require(claimTopicsLength > 0);
        for (uint i = 0; i < length; i++) {
            require(trustedIssuers[indexes[i]] != _newTrustedIssuer, "Address already exists");
        }
        uint i;
        for (i = 0; i < claimTopicsLength; i++) {
            trustedIssuerClaimTopics[index][i] = claimTopics[i];
        }
        delete trustedIssuer[address(trustedIssuers[index])];
        trustedIssuer[address(_newTrustedIssuer)] = true;
        trustedIssuerClaimCount[index] = i;
        trustedIssuers[index] = _newTrustedIssuer;
        emit TrustedIssuerUpdated(index, trustedIssuers[index], _newTrustedIssuer, claimTopics);
    }

   /**
    * @dev See {ITrustedIssuersRegistry-updateIssuerClaimTopics}.
    */

    function updateIssuerClaimTopics(uint index, uint[] memory claimTopics) public override onlyOwner {
        require(index > 0 && index <= indexes.length);
        uint claimTopicsLength = claimTopics.length;
        require(claimTopicsLength > 0);
        uint i;
        for (i = 0; i < claimTopicsLength; i++) {
            trustedIssuerClaimTopics[index][i] = claimTopics[i];
        }
        trustedIssuerClaimCount[index] = i;
        emit ClaimTopicsUpdated(index, trustedIssuers[index], claimTopics);
    }

   /**
    * @dev See {ITrustedIssuersRegistry-transferOwnershipOnIssuersRegistryContract}.
    */

    function transferOwnershipOnIssuersRegistryContract(address newOwner) external override onlyOwner {
        transferOwnership(newOwner);
    }
}
