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

    /// Array stores the trusted issuer indexes
    uint[] public indexes;

   /**
    *  @dev See {ITrustedIssuersRegistry-addTrustedIssuer}.
    */
    function addTrustedIssuer(IClaimIssuer _trustedIssuer, uint _index, uint[] memory _claimTopics) public override onlyOwner {
        require(_index > 0);
        uint claimTopicsLength = _claimTopics.length;
        require(claimTopicsLength > 0);
        require(address(trustedIssuers[_index]) == address(0), "A trustedIssuer already exists by this name");
        require(address(_trustedIssuer) != address(0));
        uint length = indexes.length;
        for (uint i = 0; i < length; i++) {
            require(_trustedIssuer != trustedIssuers[indexes[i]], "Issuer address already exists in another index");
        }
        trustedIssuers[_index] = _trustedIssuer;
        indexes.push(_index);
        uint i;
        for (i = 0; i < claimTopicsLength; i++) {
            trustedIssuerClaimTopics[_index][i] = _claimTopics[i];
        }
        trustedIssuerClaimCount[_index] = i;
        trustedIssuer[address(trustedIssuers[_index])] = true;
        emit TrustedIssuerAdded(_index, _trustedIssuer, _claimTopics);
    }

   /**
    *  @dev See {ITrustedIssuersRegistry-removeTrustedIssuer}.
    */
    function removeTrustedIssuer(uint _index) public override onlyOwner {
        require(_index > 0);
        require(address(trustedIssuers[_index]) != address(0), "No such issuer exists");
        delete trustedIssuer[address(trustedIssuers[_index])];
        delete trustedIssuers[_index];
        uint length = indexes.length;
        for (uint i = 0; i < length; i++) {
            if (indexes[i] == _index) {
                delete indexes[i];
                indexes[i] = indexes[length - 1];
                delete indexes[length - 1];
                indexes.pop();
                break;
            }
        }
        uint claimTopicCount = trustedIssuerClaimCount[_index];
        for (uint i = 0; i < claimTopicCount; i++) {
            if (trustedIssuerClaimTopics[_index][i] != 0) {
                delete trustedIssuerClaimTopics[_index][i];
            }
        }
        delete trustedIssuerClaimCount[_index];
        emit TrustedIssuerRemoved(_index, trustedIssuers[_index]);
    }

   /**
    *  @dev See {ITrustedIssuersRegistry-updateIssuerContract}.
    */
    function updateIssuerContract(uint _index, IClaimIssuer _newTrustedIssuer, uint[] memory _claimTopics) public override onlyOwner {
        require(_index > 0);
        require(address(trustedIssuers[_index]) != address(0), "No such issuer exists");
        uint length = indexes.length;
        uint claimTopicsLength = _claimTopics.length;
        require(claimTopicsLength > 0);
        for (uint i = 0; i < length; i++) {
            require(trustedIssuers[indexes[i]] != _newTrustedIssuer, "Address already exists");
        }
        uint i;
        for (i = 0; i < claimTopicsLength; i++) {
            trustedIssuerClaimTopics[_index][i] = _claimTopics[i];
        }
        delete trustedIssuer[address(trustedIssuers[_index])];
        trustedIssuer[address(_newTrustedIssuer)] = true;
        trustedIssuerClaimCount[_index] = i;
        trustedIssuers[_index] = _newTrustedIssuer;
        emit TrustedIssuerUpdated(_index, trustedIssuers[_index], _newTrustedIssuer, _claimTopics);
    }

   /**
    *  @dev See {ITrustedIssuersRegistry-updateIssuerClaimTopics}.
    */
    function updateIssuerClaimTopics(uint _index, uint[] memory _claimTopics) public override onlyOwner {
        require(_index > 0 && _index <= indexes.length);
        uint claimTopicsLength = _claimTopics.length;
        require(claimTopicsLength > 0);
        uint i;
        for (i = 0; i < claimTopicsLength; i++) {
            trustedIssuerClaimTopics[_index][i] = _claimTopics[i];
        }
        trustedIssuerClaimCount[_index] = i;
        emit ClaimTopicsUpdated(_index, trustedIssuers[_index], _claimTopics);
    }

    /**
     *  @dev See {ITrustedIssuersRegistry-getTrustedIssuers}.
     */
    function getTrustedIssuers() public override view returns (uint[] memory) {
        return indexes;
    }

   /**
    *  @dev See {ITrustedIssuersRegistry-isTrustedIssuer}.
    */
    function isTrustedIssuer(address _issuer) public override view returns (bool) {
        return trustedIssuer[_issuer];
    }

   /**
    *  @dev See {ITrustedIssuersRegistry-getTrustedIssuer}.
    */
    function getTrustedIssuer(uint _index) public override view returns (IClaimIssuer) {
        require(_index > 0);
        require(address(trustedIssuers[_index]) != address(0), "No such issuer exists");
        return trustedIssuers[_index];
    }

   /**
    *  @dev See {ITrustedIssuersRegistry-getTrustedIssuerClaimTopics}.
    */
    function getTrustedIssuerClaimTopics(uint _index) public override view returns (uint[] memory) {
        require(_index > 0);
        require(address(trustedIssuers[_index]) != address(0), "No such issuer exists");
        uint length = trustedIssuerClaimCount[_index];
        uint[] memory claimTopics = new uint[](length);
        for (uint i = 0; i < length; i++) {
            claimTopics[i] = trustedIssuerClaimTopics[_index][i];
        }
        return claimTopics;
    }

   /**
    *  @dev See {ITrustedIssuersRegistry-hasClaimTopic}.
    */
    function hasClaimTopic(address _issuer, uint _claimTopic) public override view returns (bool) {
        require(_claimTopic > 0);
        for (uint i = 0; i < indexes.length; i++) {
            if (address(trustedIssuers[indexes[i]]) == _issuer) {
                uint claimTopicCount = trustedIssuerClaimCount[indexes[i]];
                for (uint j = 0; j < claimTopicCount; j++) {
                    if (trustedIssuerClaimTopics[indexes[i]][j] == _claimTopic) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

   /**
    *  @dev See {ITrustedIssuersRegistry-transferOwnershipOnIssuersRegistryContract}.
    */
    function transferOwnershipOnIssuersRegistryContract(address _newOwner) external override onlyOwner {
        transferOwnership(_newOwner);
    }
}
