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

    /// the token that is managed by this OwnerManager Contract
    IToken public token;

    /// the Identity registry linked to `token`
    IIdentityRegistry public identityRegistry;

    /// the trusted issuers registry linked to `identityRegistry`
    ITrustedIssuersRegistry public issuersRegistry;

    /// the claim topics registry linked to `identityRegistry`
    IClaimTopicsRegistry public topicsRegistry;

    /// the compliance contract linked to `token`
    ICompliance public compliance;


   /**
    *  @dev the constructor initiates the OwnerManager contract
    *  and sets msg.sender as owner of the contract
    *  @param _token the token managed by this OwnerManager contract
    */
    constructor (address _token) public {
        token = IToken(_token);
    }

   /**
    *  @dev calls the `setIdentityRegistry` function on the token contract
    *  OwnerManager has to be set as owner on the token smart contract to process this function
    *  See {IToken-setIdentityRegistry}.
    *  Requires that `_onchainID` is set as RegistryAddressSetter on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
    *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callSetIdentityRegistry(address _identityRegistry, IIdentity _onchainID) external {
        require(isRegistryAddressSetter(address(_onchainID)) && _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Registry Address Setter");
        token.setIdentityRegistry(_identityRegistry);
    }

   /**
    *  @dev calls the `setCompliance` function on the token contract
    *  OwnerManager has to be set as owner on the token smart contract to process this function
    *  See {IToken-setCompliance}.
    *  Requires that `_onchainID` is set as ComplianceSetter on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
    *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callSetCompliance(address _compliance, IIdentity _onchainID) external {
        require(isComplianceSetter(address(_onchainID)) && _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Compliance Setter");
        token.setCompliance(_compliance);
    }

   /**
    *  @dev calls the `setName` function on the token contract
    *  OwnerManager has to be set as owner on the token smart contract to process this function
    *  See {IToken-setName}.
    *  Requires that `_onchainID` is set as TokenInfoManager on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
    *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callSetTokenName(string calldata _name, IIdentity _onchainID) external {
        require(isTokenInfoManager(address(_onchainID)) && _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Token Information Manager");
        token.setName(_name);
    }

   /**
    *  @dev calls the `setSymbol` function on the token contract
    *  OwnerManager has to be set as owner on the token smart contract to process this function
    *  See {IToken-setSymbol}.
    *  Requires that `_onchainID` is set as TokenInfoManager on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
    *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callSetTokenSymbol(string calldata _symbol, IIdentity _onchainID) external {
        require(isTokenInfoManager(address(_onchainID)) && _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Token Information Manager");
        token.setSymbol(_symbol);
    }

   /**
    *  @dev calls the `setOnchainID` function on the token contract
    *  OwnerManager has to be set as owner on the token smart contract to process this function
    *  See {IToken-setOnchainID}.
    *  Requires that `_tokenOnchainID` is set as TokenInfoManager on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
    *  @param _onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callSetTokenOnchainID(address _tokenOnchainID, IIdentity _onchainID) external {
        require(isTokenInfoManager(address(_onchainID)) && _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Token Information Manager");
        token.setOnchainID(_tokenOnchainID);
    }

   /**
    *  @dev calls the `setClaimTopicsRegistry` function on the Identity Registry contract
    *  OwnerManager has to be set as owner on the Identity Registry smart contract to process this function
    *  See {IIdentityRegistry-setClaimTopicsRegistry}.
    *  Requires that `_onchainID` is set as RegistryAddressSetter on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
    *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callSetClaimTopicsRegistry(address _claimTopicsRegistry, IIdentity _onchainID) external {
        require(isRegistryAddressSetter(address(_onchainID)) && _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Registry Address Setter");
        identityRegistry = token.identityRegistry();
        identityRegistry.setClaimTopicsRegistry(_claimTopicsRegistry);
    }

   /**
    *  @dev calls the `setTrustedIssuersRegistry` function on the Identity Registry contract
    *  OwnerManager has to be set as owner on the Identity Registry smart contract to process this function
    *  See {IIdentityRegistry-setTrustedIssuersRegistry}.
    *  Requires that `_onchainID` is set as RegistryAddressSetter on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
    *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callSetTrustedIssuersRegistry(address _trustedIssuersRegistry, IIdentity _onchainID) external {
        require(isRegistryAddressSetter(address(_onchainID)) && _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Registry Address Setter");
        identityRegistry = token.identityRegistry();
        identityRegistry.setTrustedIssuersRegistry(_trustedIssuersRegistry);
    }

   /**
    *  @dev calls the `addTrustedIssuer` function on the Trusted Issuers Registry contract
    *  OwnerManager has to be set as owner on the Trusted Issuers Registry smart contract to process this function
    *  See {ITrustedIssuersRegistry-addTrustedIssuer}.
    *  Requires that `_onchainID` is set as IssuersRegistryManager on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
    *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callAddTrustedIssuer(IClaimIssuer _trustedIssuer, uint[] calldata _claimTopics, IIdentity _onchainID) external {
        require(isIssuersRegistryManager(address(_onchainID)) && _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT IssuersRegistryManager");
        identityRegistry = token.identityRegistry();
        issuersRegistry = identityRegistry.issuersRegistry();
        issuersRegistry.addTrustedIssuer(_trustedIssuer, _claimTopics);
    }

   /**
    *  @dev calls the `removeTrustedIssuer` function on the Trusted Issuers Registry contract
    *  OwnerManager has to be set as owner on the Trusted Issuers Registry smart contract to process this function
    *  See {ITrustedIssuersRegistry-removeTrustedIssuer}.
    *  Requires that `_onchainID` is set as IssuersRegistryManager on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
    *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callRemoveTrustedIssuer(IClaimIssuer _trustedIssuer, IIdentity _onchainID) external {
        require(isIssuersRegistryManager(address(_onchainID)) && _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT IssuersRegistryManager");
        identityRegistry = token.identityRegistry();
        issuersRegistry = identityRegistry.issuersRegistry();
        issuersRegistry.removeTrustedIssuer(_trustedIssuer);
    }

   /**
    *  @dev calls the `updateIssuerClaimTopics` function on the Trusted Issuers Registry contract
    *  OwnerManager has to be set as owner on the Trusted Issuers Registry smart contract to process this function
    *  See {ITrustedIssuersRegistry-updateIssuerClaimTopics}.
    *  Requires that `_onchainID` is set as IssuersRegistryManager on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
    *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callUpdateIssuerClaimTopics(IClaimIssuer _trustedIssuer, uint[] calldata _claimTopics, IIdentity _onchainID) external {
        require(isIssuersRegistryManager(address(_onchainID)) && _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT IssuersRegistryManager");
        identityRegistry = token.identityRegistry();
        issuersRegistry = identityRegistry.issuersRegistry();
        issuersRegistry.updateIssuerClaimTopics(_trustedIssuer, _claimTopics);
    }

   /**
    *  @dev calls the `addClaimTopic` function on the Claim Topics Registry contract
    *  OwnerManager has to be set as owner on the Claim Topics Registry smart contract to process this function
    *  See {IClaimTopicsRegistry-addClaimTopic}.
    *  Requires that `_onchainID` is set as ClaimRegistryManager on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
    *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callAddClaimTopic(uint256 _claimTopic, IIdentity _onchainID) external {
        require(isClaimRegistryManager(address(_onchainID)) && _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT ClaimRegistryManager");
        identityRegistry = token.identityRegistry();
        topicsRegistry = identityRegistry.topicsRegistry();
        topicsRegistry.addClaimTopic(_claimTopic);
    }

   /**
    *  @dev calls the `removeClaimTopic` function on the Claim Topics Registry contract
    *  OwnerManager has to be set as owner on the Claim Topics Registry smart contract to process this function
    *  See {IClaimTopicsRegistry-removeClaimTopic}.
    *  Requires that `_onchainID` is set as ClaimRegistryManager on the OwnerManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
    *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callRemoveClaimTopic(uint256 _claimTopic, IIdentity _onchainID) external {
        require(isClaimRegistryManager(address(_onchainID)) && _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT ClaimRegistryManager");
        identityRegistry = token.identityRegistry();
        topicsRegistry = identityRegistry.topicsRegistry();
        topicsRegistry.removeClaimTopic(_claimTopic);
    }

   /**
    *  @dev calls the `transferOwnershipOnTokenContract` function on the token contract
    *  OwnerManager has to be set as owner on the token smart contract to process this function
    *  See {IToken-transferOwnershipOnTokenContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */
    function callTransferOwnershipOnTokenContract(address _newOwner) external onlyAdmin {
        token.transferOwnershipOnTokenContract(_newOwner);
    }

   /**
    *  @dev calls the `transferOwnershipOnIdentityRegistryContract` function on the Identity Registry contract
    *  OwnerManager has to be set as owner on the Identity Registry smart contract to process this function
    *  See {IIdentityRegistry-transferOwnershipOnIdentityRegistryContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */
    function callTransferOwnershipOnIdentityRegistryContract(address _newOwner) external onlyAdmin {
        identityRegistry = token.identityRegistry();
        identityRegistry.transferOwnershipOnIdentityRegistryContract(_newOwner);
    }

   /**
    *  @dev calls the `transferOwnershipOnComplianceContract` function on the Compliance contract
    *  OwnerManager has to be set as owner on the Compliance smart contract to process this function
    *  See {ICompliance-transferOwnershipOnComplianceContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */
    function callTransferOwnershipOnComplianceContract(address _newOwner) external onlyAdmin {
        compliance = token.compliance();
        compliance.transferOwnershipOnComplianceContract(_newOwner);
    }

   /**
    *  @dev calls the `transferOwnershipOnClaimTopicsRegistryContract` function on the Claim Topics Registry contract
    *  OwnerManager has to be set as owner on the Claim Topics registry smart contract to process this function
    *  See {IClaimTopicsRegistry-transferOwnershipOnClaimTopicsRegistryContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */
    function callTransferOwnershipOnClaimTopicsRegistryContract(address _newOwner) external onlyAdmin {
        identityRegistry = token.identityRegistry();
        topicsRegistry = identityRegistry.topicsRegistry();
        topicsRegistry.transferOwnershipOnClaimTopicsRegistryContract(_newOwner);
    }

   /**
    *  @dev calls the `transferOwnershipOnIssuersRegistryContract` function on the Trusted Issuers Registry contract
    *  OwnerManager has to be set as owner on the Trusted Issuers registry smart contract to process this function
    *  See {ITrustedIssuersRegistry-transferOwnershipOnIssuersRegistryContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */
    function callTransferOwnershipOnIssuersRegistryContract(address _newOwner) external onlyAdmin {
        identityRegistry = token.identityRegistry();
        issuersRegistry = identityRegistry.issuersRegistry();
        issuersRegistry.transferOwnershipOnIssuersRegistryContract(_newOwner);
    }

   /**
    *  @dev calls the `addAgentOnTokenContract` function on the token contract
    *  OwnerManager has to be set as owner on the token smart contract to process this function
    *  See {IToken-addAgentOnTokenContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */
    function callAddAgentOnTokenContract(address _agent) external onlyAdmin {
        token.addAgentOnTokenContract(_agent);
    }

   /**
    *  @dev calls the `removeAgentOnTokenContract` function on the token contract
    *  OwnerManager has to be set as owner on the token smart contract to process this function
    *  See {IToken-removeAgentOnTokenContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */
    function callRemoveAgentOnTokenContract(address _agent) external onlyAdmin {
        token.removeAgentOnTokenContract(_agent);
    }

   /**
    *  @dev calls the `addAgentOnIdentityRegistryContract` function on the Identity Registry contract
    *  OwnerManager has to be set as owner on the Identity Registry smart contract to process this function
    *  See {IIdentityRegistry-addAgentOnIdentityRegistryContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */
    function callAddAgentOnIdentityRegistryContract(address _agent) external onlyAdmin {
        identityRegistry = token.identityRegistry();
        identityRegistry.addAgentOnIdentityRegistryContract(_agent);
    }

   /**
    *  @dev calls the `removeAgentOnIdentityRegistryContract` function on the Identity Registry contract
    *  OwnerManager has to be set as owner on the Identity Registry smart contract to process this function
    *  See {IIdentityRegistry-removeAgentOnIdentityRegistryContract}.
    *  Requires that msg.sender is an Admin of the OwnerManager contract
    */
    function callRemoveAgentOnIdentityRegistryContract(address _agent) external onlyAdmin {
        identityRegistry = token.identityRegistry();
        identityRegistry.removeAgentOnIdentityRegistryContract(_agent);
    }
}
