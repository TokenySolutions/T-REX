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

import "../token/IToken.sol";
import "../registry/IIdentityRegistry.sol";
import "../registry/ITrustedIssuersRegistry.sol";
import "../registry/IClaimTopicsRegistry.sol";
import "../compliance/ICompliance.sol";
import "./OwnerRoles.sol";
import "@onchain-id/solidity/contracts/IIdentity.sol";
import "@onchain-id/solidity/contracts/IClaimIssuer.sol";

contract OwnerManager is OwnerRoles {

    IToken public token;
    IIdentityRegistry public identityRegistry;
    ITrustedIssuersRegistry public issuersRegistry;
    IClaimTopicsRegistry public topicsRegistry;
    ICompliance public compliance;


    constructor (address _token) public {
        token = IToken(_token);
    }

    function callSetIdentityRegistry(address _identityRegistry, IIdentity onchainID) external {
        require(isRegistryAddressSetter(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Registry Address Setter");
        token.setIdentityRegistry(_identityRegistry);
    }

    function callSetCompliance(address _compliance, IIdentity onchainID) external {
        require(isComplianceSetter(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Compliance Setter");
        token.setCompliance(_compliance);
    }

    function callSetTokenInformation(string calldata _name, string calldata _symbol, uint8 _decimals, string calldata _version, address _onchainID, IIdentity onchainID) external {
        require(isTokenInfoManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Token Information Manager");
        token.setTokenInformation(_name, _symbol, _decimals, _version, _onchainID);
    }

    function callSetClaimTopicsRegistry(address _claimTopicsRegistry, IIdentity onchainID) external {
        require(isRegistryAddressSetter(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Registry Address Setter");
        identityRegistry = token.getIdentityRegistry();
        identityRegistry.setClaimTopicsRegistry(_claimTopicsRegistry);
    }

    function callSetTrustedIssuersRegistry(address _trustedIssuersRegistry, IIdentity onchainID) external {
        require(isRegistryAddressSetter(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Registry Address Setter");
        identityRegistry = token.getIdentityRegistry();
        identityRegistry.setTrustedIssuersRegistry(_trustedIssuersRegistry);
    }

    function callAddTrustedIssuer(IClaimIssuer _trustedIssuer, uint index, uint[] calldata claimTopics, IIdentity onchainID) external {
        require(isIssuersRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT IssuersRegistryManager");
        identityRegistry = token.getIdentityRegistry();
        issuersRegistry = identityRegistry.getIssuersRegistry();
        issuersRegistry.addTrustedIssuer(_trustedIssuer, index, claimTopics);
    }

    function callRemoveTrustedIssuer(uint index, IIdentity onchainID) external {
        require(isIssuersRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT IssuersRegistryManager");
        identityRegistry = token.getIdentityRegistry();
        issuersRegistry = identityRegistry.getIssuersRegistry();
        issuersRegistry.removeTrustedIssuer(index);
    }

    function callUpdateIssuerContract(uint index, IClaimIssuer _newTrustedIssuer, uint[] calldata claimTopics, IIdentity onchainID) external {
        require(isIssuersRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT IssuersRegistryManager");
        identityRegistry = token.getIdentityRegistry();
        issuersRegistry = identityRegistry.getIssuersRegistry();
        issuersRegistry.updateIssuerContract(index, _newTrustedIssuer, claimTopics);
    }

    function callUpdateIssuerClaimTopics(uint index, uint[] calldata claimTopics, IIdentity onchainID) external {
        require(isIssuersRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT IssuersRegistryManager");
        identityRegistry = token.getIdentityRegistry();
        issuersRegistry = identityRegistry.getIssuersRegistry();
        issuersRegistry.updateIssuerClaimTopics(index, claimTopics);
    }

    function callAddClaimTopic(uint256 claimTopic, IIdentity onchainID) external {
        require(isClaimRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT ClaimRegistryManager");
        identityRegistry = token.getIdentityRegistry();
        topicsRegistry = identityRegistry.getTopicsRegistry();
        topicsRegistry.addClaimTopic(claimTopic);
    }

    function callRemoveClaimTopic(uint256 claimTopic, IIdentity onchainID) external {
        require(isClaimRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT ClaimRegistryManager");
        identityRegistry = token.getIdentityRegistry();
        topicsRegistry = identityRegistry.getTopicsRegistry();
        topicsRegistry.removeClaimTopic(claimTopic);
    }

    function callTransferOwnershipOnTokenContract(address newOwner) external onlyAdmin {
        token.transferOwnershipOnTokenContract(newOwner);
    }

    function callTransferOwnershipOnIdentityRegistryContract(address newOwner) external onlyAdmin {
        identityRegistry = token.getIdentityRegistry();
        identityRegistry.transferOwnershipOnIdentityRegistryContract(newOwner);
    }

    function callTransferOwnershipOnComplianceContract(address newOwner) external onlyAdmin {
        compliance = token.getCompliance();
        compliance.transferOwnershipOnComplianceContract(newOwner);
    }

    function callTransferOwnershipOnClaimTopicsRegistryContract(address newOwner) external onlyAdmin {
        identityRegistry = token.getIdentityRegistry();
        topicsRegistry = identityRegistry.getTopicsRegistry();
        topicsRegistry.transferOwnershipOnClaimTopicsRegistryContract(newOwner);
    }

    function callTransferOwnershipOnIssuersRegistryContract(address newOwner) external onlyAdmin {
        identityRegistry = token.getIdentityRegistry();
        issuersRegistry = identityRegistry.getIssuersRegistry();
        issuersRegistry.transferOwnershipOnIssuersRegistryContract(newOwner);
    }

    function callAddAgentOnTokenContract(address agent) external onlyAdmin {
        token.addAgentOnTokenContract(agent);
    }

    function callRemoveAgentOnTokenContract(address agent) external onlyAdmin {
        token.removeAgentOnTokenContract(agent);
    }

    function callAddAgentOnIdentityRegistryContract(address agent) external onlyAdmin {
        identityRegistry = token.getIdentityRegistry();
        identityRegistry.addAgentOnIdentityRegistryContract(agent);
    }

    function callRemoveAgentOnIdentityRegistryContract(address agent) external onlyAdmin {
        identityRegistry = token.getIdentityRegistry();
        identityRegistry.removeAgentOnIdentityRegistryContract(agent);
    }
}
