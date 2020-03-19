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

   /**
    *  @dev calls the `setIdentityRegistry` function on the token contract
    *  OwnerManager has to be set as owner on the token smart contract to process this function
    *  See {IToken-setIdentityRegistry}.
    *  Requires that `onchainID` is set as RegistryAddressSetter on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    */

    function callSetIdentityRegistry(address _identityRegistry, IIdentity onchainID) external {
        require(isRegistryAddressSetter(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Registry Address Setter");
        token.setIdentityRegistry(_identityRegistry);
    }

   /**
    *  @dev calls the `setCompliance` function on the token contract
    *  OwnerManager has to be set as owner on the token smart contract to process this function
    *  See {IToken-setCompliance}.
    *  Requires that `onchainID` is set as ComplianceSetter on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    */

    function callSetCompliance(address _compliance, IIdentity onchainID) external {
        require(isComplianceSetter(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Compliance Setter");
        token.setCompliance(_compliance);
    }

   /**
    *  @dev calls the `setTokenInformation` function on the token contract
    *  OwnerManager has to be set as owner on the token smart contract to process this function
    *  See {IToken-setTokenInformation}.
    *  Requires that `onchainID` is set as TokenInfoManager on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    */

    function callSetTokenInformation(string calldata _name, string calldata _symbol, uint8 _decimals, string calldata _version, address _onchainID, IIdentity onchainID) external {
        require(isTokenInfoManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Token Information Manager");
        token.setTokenInformation(_name, _symbol, _decimals, _version, _onchainID);
    }

   /**
    *  @dev calls the `setClaimTopicsRegistry` function on the Identity Registry contract
    *  OwnerManager has to be set as owner on the Identity Registry smart contract to process this function
    *  See {IIdentityRegistry-setClaimTopicsRegistry}.
    *  Requires that `onchainID` is set as RegistryAddressSetter on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    */

    function callSetClaimTopicsRegistry(address _claimTopicsRegistry, IIdentity onchainID) external {
        require(isRegistryAddressSetter(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Registry Address Setter");
        identityRegistry = token.identityRegistry();
        identityRegistry.setClaimTopicsRegistry(_claimTopicsRegistry);
    }

   /**
    *  @dev calls the `setTrustedIssuersRegistry` function on the Identity Registry contract
    *  OwnerManager has to be set as owner on the Identity Registry smart contract to process this function
    *  See {IIdentityRegistry-setTrustedIssuersRegistry}.
    *  Requires that `onchainID` is set as RegistryAddressSetter on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    */

    function callSetTrustedIssuersRegistry(address _trustedIssuersRegistry, IIdentity onchainID) external {
        require(isRegistryAddressSetter(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Registry Address Setter");
        identityRegistry = token.identityRegistry();
        identityRegistry.setTrustedIssuersRegistry(_trustedIssuersRegistry);
    }

   /**
    *  @dev calls the `addTrustedIssuer` function on the Trusted Issuers Registry contract
    *  OwnerManager has to be set as owner on the Trusted Issuers Registry smart contract to process this function
    *  See {ITrustedIssuersRegistry-addTrustedIssuer}.
    *  Requires that `onchainID` is set as IssuersRegistryManager on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    */

    function callAddTrustedIssuer(IClaimIssuer _trustedIssuer, uint index, uint[] calldata claimTopics, IIdentity onchainID) external {
        require(isIssuersRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT IssuersRegistryManager");
        identityRegistry = token.identityRegistry();
        issuersRegistry = identityRegistry.issuersRegistry();
        issuersRegistry.addTrustedIssuer(_trustedIssuer, index, claimTopics);
    }

   /**
    *  @dev calls the `removeTrustedIssuer` function on the Trusted Issuers Registry contract
    *  OwnerManager has to be set as owner on the Trusted Issuers Registry smart contract to process this function
    *  See {ITrustedIssuersRegistry-removeTrustedIssuer}.
    *  Requires that `onchainID` is set as IssuersRegistryManager on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    */

    function callRemoveTrustedIssuer(uint index, IIdentity onchainID) external {
        require(isIssuersRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT IssuersRegistryManager");
        identityRegistry = token.identityRegistry();
        issuersRegistry = identityRegistry.issuersRegistry();
        issuersRegistry.removeTrustedIssuer(index);
    }

   /**
    *  @dev calls the `updateIssuerContract` function on the Trusted Issuers Registry contract
    *  OwnerManager has to be set as owner on the Trusted Issuers Registry smart contract to process this function
    *  See {ITrustedIssuersRegistry-updateIssuerContract}.
    *  Requires that `onchainID` is set as IssuersRegistryManager on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    */

    function callUpdateIssuerContract(uint index, IClaimIssuer _newTrustedIssuer, uint[] calldata claimTopics, IIdentity onchainID) external {
        require(isIssuersRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT IssuersRegistryManager");
        identityRegistry = token.identityRegistry();
        issuersRegistry = identityRegistry.issuersRegistry();
        issuersRegistry.updateIssuerContract(index, _newTrustedIssuer, claimTopics);
    }

   /**
    *  @dev calls the `updateIssuerClaimTopics` function on the Trusted Issuers Registry contract
    *  OwnerManager has to be set as owner on the Trusted Issuers Registry smart contract to process this function
    *  See {ITrustedIssuersRegistry-updateIssuerClaimTopics}.
    *  Requires that `onchainID` is set as IssuersRegistryManager on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    */

    function callUpdateIssuerClaimTopics(uint index, uint[] calldata claimTopics, IIdentity onchainID) external {
        require(isIssuersRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT IssuersRegistryManager");
        identityRegistry = token.identityRegistry();
        issuersRegistry = identityRegistry.issuersRegistry();
        issuersRegistry.updateIssuerClaimTopics(index, claimTopics);
    }

   /**
    *  @dev calls the `addClaimTopic` function on the Claim Topics Registry contract
    *  OwnerManager has to be set as owner on the Claim Topics Registry smart contract to process this function
    *  See {IClaimTopicsRegistry-addClaimTopic}.
    *  Requires that `onchainID` is set as ClaimRegistryManager on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    */

    function callAddClaimTopic(uint256 claimTopic, IIdentity onchainID) external {
        require(isClaimRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT ClaimRegistryManager");
        identityRegistry = token.identityRegistry();
        topicsRegistry = identityRegistry.topicsRegistry();
        topicsRegistry.addClaimTopic(claimTopic);
    }

   /**
    *  @dev calls the `removeClaimTopic` function on the Claim Topics Registry contract
    *  OwnerManager has to be set as owner on the Claim Topics Registry smart contract to process this function
    *  See {IClaimTopicsRegistry-removeClaimTopic}.
    *  Requires that `onchainID` is set as ClaimRegistryManager on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    */

    function callRemoveClaimTopic(uint256 claimTopic, IIdentity onchainID) external {
        require(isClaimRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT ClaimRegistryManager");
        identityRegistry = token.identityRegistry();
        topicsRegistry = identityRegistry.topicsRegistry();
        topicsRegistry.removeClaimTopic(claimTopic);
    }

   /**
    *  @dev calls the `transferOwnershipOnTokenContract` function on the token contract
    *  OwnerManager has to be set as owner on the token smart contract to process this function
    *  See {IToken-transferOwnershipOnTokenContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */

    function callTransferOwnershipOnTokenContract(address newOwner) external onlyAdmin {
        token.transferOwnershipOnTokenContract(newOwner);
    }

   /**
    *  @dev calls the `transferOwnershipOnIdentityRegistryContract` function on the Identity Registry contract
    *  OwnerManager has to be set as owner on the Identity Registry smart contract to process this function
    *  See {IIdentityRegistry-transferOwnershipOnIdentityRegistryContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */

    function callTransferOwnershipOnIdentityRegistryContract(address newOwner) external onlyAdmin {
        identityRegistry = token.identityRegistry();
        identityRegistry.transferOwnershipOnIdentityRegistryContract(newOwner);
    }

   /**
    *  @dev calls the `transferOwnershipOnComplianceContract` function on the Compliance contract
    *  OwnerManager has to be set as owner on the Compliance smart contract to process this function
    *  See {ICompliance-transferOwnershipOnComplianceContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */

    function callTransferOwnershipOnComplianceContract(address newOwner) external onlyAdmin {
        compliance = token.compliance();
        compliance.transferOwnershipOnComplianceContract(newOwner);
    }

   /**
    *  @dev calls the `transferOwnershipOnClaimTopicsRegistryContract` function on the Claim Topics Registry contract
    *  OwnerManager has to be set as owner on the Claim Topics registry smart contract to process this function
    *  See {IClaimTopicsRegistry-transferOwnershipOnClaimTopicsRegistryContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */

    function callTransferOwnershipOnClaimTopicsRegistryContract(address newOwner) external onlyAdmin {
        identityRegistry = token.identityRegistry();
        topicsRegistry = identityRegistry.topicsRegistry();
        topicsRegistry.transferOwnershipOnClaimTopicsRegistryContract(newOwner);
    }

   /**
    *  @dev calls the `transferOwnershipOnIssuersRegistryContract` function on the Trusted Issuers Registry contract
    *  OwnerManager has to be set as owner on the Trusted Issuers registry smart contract to process this function
    *  See {ITrustedIssuersRegistry-transferOwnershipOnIssuersRegistryContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */

    function callTransferOwnershipOnIssuersRegistryContract(address newOwner) external onlyAdmin {
        identityRegistry = token.identityRegistry();
        issuersRegistry = identityRegistry.issuersRegistry();
        issuersRegistry.transferOwnershipOnIssuersRegistryContract(newOwner);
    }

   /**
    *  @dev calls the `addAgentOnTokenContract` function on the token contract
    *  OwnerManager has to be set as owner on the token smart contract to process this function
    *  See {IToken-addAgentOnTokenContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */

    function callAddAgentOnTokenContract(address agent) external onlyAdmin {
        token.addAgentOnTokenContract(agent);
    }

   /**
    *  @dev calls the `removeAgentOnTokenContract` function on the token contract
    *  OwnerManager has to be set as owner on the token smart contract to process this function
    *  See {IToken-removeAgentOnTokenContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */

    function callRemoveAgentOnTokenContract(address agent) external onlyAdmin {
        token.removeAgentOnTokenContract(agent);
    }

   /**
    *  @dev calls the `addAgentOnIdentityRegistryContract` function on the Identity Registry contract
    *  OwnerManager has to be set as owner on the Identity Registry smart contract to process this function
    *  See {IIdentityRegistry-addAgentOnIdentityRegistryContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */

    function callAddAgentOnIdentityRegistryContract(address agent) external onlyAdmin {
        identityRegistry = token.identityRegistry();
        identityRegistry.addAgentOnIdentityRegistryContract(agent);
    }

   /**
    *  @dev calls the `removeAgentOnIdentityRegistryContract` function on the Identity Registry contract
    *  OwnerManager has to be set as owner on the Identity Registry smart contract to process this function
    *  See {IIdentityRegistry-removeAgentOnIdentityRegistryContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */

    function callRemoveAgentOnIdentityRegistryContract(address agent) external onlyAdmin {
        identityRegistry = token.identityRegistry();
        identityRegistry.removeAgentOnIdentityRegistryContract(agent);
    }
}
