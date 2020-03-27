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
import "@onchain-id/solidity/contracts/IIdentity.sol";
import "../registry/IClaimTopicsRegistry.sol";
import "../registry/ITrustedIssuersRegistry.sol";
import "../registry/IIdentityRegistry.sol";
import "../roles/AgentRole.sol";

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract IdentityRegistry is IIdentityRegistry, AgentRole {
    /// mapping between a user address and the corresponding identity contract
    mapping(address => IIdentity) private identity;

    /// mapping between a user address and its corresponding country
    mapping(address => uint16) private investorCountry;

    /// Address of the ClaimTopicsRegistry Contract
    IClaimTopicsRegistry private tokenTopicsRegistry;

    /// Address of the TrustedIssuersRegistry Contract
    ITrustedIssuersRegistry private tokenIssuersRegistry;

    constructor (
        address _trustedIssuersRegistry,
        address _claimTopicsRegistry
    ) public {
        tokenTopicsRegistry = IClaimTopicsRegistry(_claimTopicsRegistry);
        tokenIssuersRegistry = ITrustedIssuersRegistry(_trustedIssuersRegistry);

        emit ClaimTopicsRegistrySet(_claimTopicsRegistry);
        emit TrustedIssuersRegistrySet(_trustedIssuersRegistry);
    }

    /**
    *  @dev See {IIdentityRegistry-getIdentityOfWallet}.
    */
    function getIdentityOfWallet(address _userAddress) public override view returns (IIdentity){
        return identity[_userAddress];
    }

    /**
    *  @dev See {IIdentityRegistry-getInvestorCountryOfWallet}.
    */
    function getInvestorCountryOfWallet(address _userAddress) public override view returns (uint16){
        return investorCountry[_userAddress];
    }

    /**
     *  @dev Returns the TrustedIssuersRegistry linked to the current IdentityRegistry.
     */
    function issuersRegistry() public override view returns (ITrustedIssuersRegistry){
        return tokenIssuersRegistry;
    }

    /**
     *  @dev Returns the ClaimTopicsRegistry linked to the current IdentityRegistry.
     */
    function topicsRegistry() public override view returns (IClaimTopicsRegistry){
        return tokenTopicsRegistry;
    }

    /**
    *  @dev See {IIdentityRegistry-registerIdentity}.
    */
    function registerIdentity(address _userAddress, IIdentity _identity, uint16 _country) public override onlyAgent {
        require(address(_identity) != address(0), "contract address can't be a zero address");
        require(address(identity[_userAddress]) == address(0), "identity contract already exists, please use update");
        identity[_userAddress] = _identity;
        investorCountry[_userAddress] = _country;

        emit IdentityRegistered(_userAddress, _identity);
    }

    /**
    *  @dev See {IIdentityRegistry-batchRegisterIdentity}.
    */
    function batchRegisterIdentity(address[] calldata __userAddresses, IIdentity[] calldata _identities, uint16[] calldata _countries) external override {
        for (uint256 i = 0; i < __userAddresses.length; i++) {
            registerIdentity(__userAddresses[i], _identities[i], _countries[i]);
        }
    }

    /**
    *  @dev See {IIdentityRegistry-updateIdentity}.
    */
    function updateIdentity(address _userAddress, IIdentity _identity) public override onlyAgent {
        require(address(identity[_userAddress]) != address(0));
        require(address(_identity) != address(0), "contract address can't be a zero address");
        identity[_userAddress] = _identity;

        emit IdentityUpdated(identity[_userAddress], _identity);
    }


    /**
    *  @dev See {IIdentityRegistry-updateCountry}.
    */
    function updateCountry(address _userAddress, uint16 _country) public override onlyAgent {
        require(address(identity[_userAddress]) != address(0));
        investorCountry[_userAddress] = _country;

        emit CountryUpdated(_userAddress, _country);
    }

    /**
    *  @dev See {IIdentityRegistry-deleteIdentity}.
    */
    function deleteIdentity(address _userAddress) public override onlyAgent {
        require(address(identity[_userAddress]) != address(0), "you haven't registered an identity yet");
        delete identity[_userAddress];

        emit IdentityRemoved(_userAddress, identity[_userAddress]);
    }

    /**
    *  @dev See {IIdentityRegistry-isVerified}.
    */
    function isVerified(address _userAddress) public override view returns (bool) {
        if (address(identity[_userAddress]) == address(0)) {
            return false;
        }

        uint256[] memory claimTopics = tokenTopicsRegistry.getClaimTopics();
        uint length = claimTopics.length;
        if (length == 0) {
            return true;
        }

        uint256 foundClaimTopic;
        uint256 scheme;
        address issuer;
        bytes memory sig;
        bytes memory data;
        uint256 claimTopic;
        for (claimTopic = 0; claimTopic < length; claimTopic++) {
            bytes32[] memory claimIds = identity[_userAddress].getClaimIdsByTopic(claimTopics[claimTopic]);
            if (claimIds.length == 0) {
                return false;
            }
            for (uint j = 0; j < claimIds.length; j++) {
                (foundClaimTopic, scheme, issuer, sig, data,) = identity[_userAddress].getClaim(claimIds[j]);
                if (!tokenIssuersRegistry.isTrustedIssuer(issuer)) {
                    return false;
                }
                if (!tokenIssuersRegistry.hasClaimTopic(issuer, claimTopics[claimTopic])) {
                    return false;
                }
                if (!IClaimIssuer(issuer).isClaimValid(identity[_userAddress], claimTopics[claimTopic], sig, data)) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
    *  @dev See {IIdentityRegistry-setClaimTopicsRegistry}.
    */
    function setClaimTopicsRegistry(address _claimTopicsRegistry) public override onlyOwner {
        tokenTopicsRegistry = IClaimTopicsRegistry(_claimTopicsRegistry);

        emit ClaimTopicsRegistrySet(_claimTopicsRegistry);
    }

    /**
    *  @dev See {IIdentityRegistry-setTrustedIssuersRegistry}.
    */
    function setTrustedIssuersRegistry(address _trustedIssuersRegistry) public override onlyOwner {
        tokenIssuersRegistry = ITrustedIssuersRegistry(_trustedIssuersRegistry);

        emit TrustedIssuersRegistrySet(_trustedIssuersRegistry);
    }

    /**
    *  @dev See {IIdentityRegistry-contains}.
    */
    function contains(address _userAddress) public override view returns (bool){
        if (address(identity[_userAddress]) == address(0)) {
            return false;
        }

        return true;
    }

    /**
    *  @dev See {IIdentityRegistry-transferOwnershipOnIdentityRegistryContract}.
    */
    function transferOwnershipOnIdentityRegistryContract(address _newOwner) external override onlyOwner {
        transferOwnership(_newOwner);
    }

    /**
    *  @dev See {IIdentityRegistry-addAgentOnIdentityRegistryContract}.
    */
    function addAgentOnIdentityRegistryContract(address _agent) external override {
        addAgent(_agent);
    }

    /**
    *  @dev See {IIdentityRegistry-removeAgentOnIdentityRegistryContract}.
    */
    function removeAgentOnIdentityRegistryContract(address _agent) external override {
        removeAgent(_agent);
    }
}
