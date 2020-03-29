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
import "./AgentRoles.sol";
import "@onchain-id/solidity/contracts/IIdentity.sol";

contract AgentManager is AgentRoles {

    /// the token managed by this AgentManager contract
    IToken public token;

    /// the Identity Registry linked to `token`
    IIdentityRegistry public identityRegistry;

    constructor (address _token) public {
        token = IToken(_token);
    }

   /**
    *  @dev calls the `forcedTransfer` function on the Token contract
    *  AgentManager has to be set as agent on the token smart contract to process this function
    *  See {IToken-forcedTransfer}.
    *  Requires that `onchainID` is set as TransferManager on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callForcedTransfer(address _from, address _to, uint256 _value, IIdentity onchainID) external {
        require(isTransferManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Transfer Manager");
        token.forcedTransfer(_from, _to, _value);
    }

   /**
    *  @dev calls the `batchForcedTransfer` function on the Token contract
    *  AgentManager has to be set as agent on the token smart contract to process this function
    *  See {IToken-batchForcedTransfer}.
    *  Requires that `onchainID` is set as TransferManager on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callBatchForcedTransfer(address[] calldata _fromList, address[] calldata _toList, uint256[] calldata _values, IIdentity onchainID) external {
        require(isTransferManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Transfer Manager");
        token.batchForcedTransfer(_fromList, _toList, _values);
    }

   /**
    *  @dev calls the `pause` function on the Token contract
    *  AgentManager has to be set as agent on the token smart contract to process this function
    *  See {IToken-pause}.
    *  Requires that `onchainID` is set as Freezer on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callPause(IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.pause();
    }

   /**
    *  @dev calls the `unpause` function on the Token contract
    *  AgentManager has to be set as agent on the token smart contract to process this function
    *  See {IToken-unpause}.
    *  Requires that `onchainID` is set as Freezer on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callUnpause(IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.unpause();
    }

   /**
    *  @dev calls the `mint` function on the Token contract
    *  AgentManager has to be set as agent on the token smart contract to process this function
    *  See {IToken-mint}.
    *  Requires that `onchainID` is set as SupplyModifier on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callMint(address _to, uint256 _amount, IIdentity onchainID) external {
        require(isSupplyModifier(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Supply Modifier");
        token.mint(_to, _amount);
    }

   /**
    *  @dev calls the `batchMint` function on the Token contract
    *  AgentManager has to be set as agent on the token smart contract to process this function
    *  See {IToken-batchMint}.
    *  Requires that `onchainID` is set as SupplyModifier on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callBatchMint(address[] calldata _toList, uint256[] calldata _amounts, IIdentity onchainID) external {
        require(isSupplyModifier(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Supply Modifier");
        token.batchMint(_toList, _amounts);
    }

   /**
    *  @dev calls the `burn` function on the Token contract
    *  AgentManager has to be set as agent on the token smart contract to process this function
    *  See {IToken-burn}.
    *  Requires that `onchainID` is set as SupplyModifier on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callBurn(address account, uint256 value, IIdentity onchainID) external {
        require(isSupplyModifier(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Supply Modifier");
        token.burn(account, value);
    }

   /**
    *  @dev calls the `batchBurn` function on the Token contract
    *  AgentManager has to be set as agent on the token smart contract to process this function
    *  See {IToken-batchBurn}.
    *  Requires that `onchainID` is set as SupplyModifier on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callBatchBurn(address[] calldata accounts, uint256[] calldata values, IIdentity onchainID) external {
        require(isSupplyModifier(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Supply Modifier");
        token.batchBurn(accounts, values);
    }

   /**
    *  @dev calls the `setAddressFrozen` function on the Token contract
    *  AgentManager has to be set as agent on the token smart contract to process this function
    *  See {IToken-setAddressFrozen}.
    *  Requires that `onchainID` is set as Freezer on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callSetAddressFrozen(address addr, bool freeze, IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.setAddressFrozen(addr, freeze);
    }

   /**
    *  @dev calls the `batchSetAddressFrozen` function on the Token contract
    *  AgentManager has to be set as agent on the token smart contract to process this function
    *  See {IToken-batchSetAddressFrozen}.
    *  Requires that `onchainID` is set as Freezer on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callBatchSetAddressFrozen(address[] calldata addrList, bool[] calldata freeze, IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.batchSetAddressFrozen(addrList, freeze);
    }

   /**
    *  @dev calls the `freezePartialTokens` function on the Token contract
    *  AgentManager has to be set as agent on the token smart contract to process this function
    *  See {IToken-freezePartialTokens}.
    *  Requires that `onchainID` is set as Freezer on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callFreezePartialTokens(address addr, uint256 amount, IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.freezePartialTokens(addr, amount);
    }

   /**
    *  @dev calls the `batchFreezePartialTokens` function on the Token contract
    *  AgentManager has to be set as agent on the token smart contract to process this function
    *  See {IToken-batchFreezePartialTokens}.
    *  Requires that `onchainID` is set as Freezer on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callBatchFreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts, IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.batchFreezePartialTokens(addrList, amounts);
    }

   /**
    *  @dev calls the `unfreezePartialTokens` function on the Token contract
    *  AgentManager has to be set as agent on the token smart contract to process this function
    *  See {IToken-unfreezePartialTokens}.
    *  Requires that `onchainID` is set as Freezer on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callUnfreezePartialTokens(address addr, uint256 amount, IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.unfreezePartialTokens(addr, amount);
    }

   /**
    *  @dev calls the `batchUnfreezePartialTokens` function on the Token contract
    *  AgentManager has to be set as agent on the token smart contract to process this function
    *  See {IToken-batchUnfreezePartialTokens}.
    *  Requires that `onchainID` is set as Freezer on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callBatchUnfreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts, IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.batchUnfreezePartialTokens(addrList, amounts);
    }

   /**
    *  @dev calls the `recoveryAddress` function on the Token contract
    *  AgentManager has to be set as agent on the token smart contract to process this function
    *  See {IToken-recoveryAddress}.
    *  Requires that `onchainID` is set as RecoveryAgent on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callRecoveryAddress(address wallet_lostAddress, address wallet_newAddress, address investorOnchainID, IIdentity onchainID) external {
        require(isRecoveryAgent(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Recovery Agent");
        token.recoveryAddress(wallet_lostAddress, wallet_newAddress, investorOnchainID);
    }

   /**
    *  @dev calls the `registerIdentity` function on the Identity Registry contract
    *  AgentManager has to be set as agent on the Identity Registry smart contract to process this function
    *  See {IIdentityRegistry-registerIdentity}.
    *  Requires that `onchainID` is set as WhiteListManager on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callRegisterIdentity(address _user, IIdentity _identity, uint16 _country, IIdentity onchainID) external {
        require(isWhiteListManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT WhiteList Manager");
        identityRegistry = token.identityRegistry();
        identityRegistry.registerIdentity(_user, _identity, _country);
    }

   /**
    *  @dev calls the `updateIdentity` function on the Identity Registry contract
    *  AgentManager has to be set as agent on the Identity Registry smart contract to process this function
    *  See {IIdentityRegistry-updateIdentity}.
    *  Requires that `onchainID` is set as WhiteListManager on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callUpdateIdentity(address _user, IIdentity _identity, IIdentity onchainID) external {
        require(isWhiteListManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT WhiteList Manager");
        identityRegistry = token.identityRegistry();
        identityRegistry.updateIdentity(_user, _identity);
    }

   /**
    *  @dev calls the `updateCountry` function on the Identity Registry contract
    *  AgentManager has to be set as agent on the Identity Registry smart contract to process this function
    *  See {IIdentityRegistry-updateCountry}.
    *  Requires that `onchainID` is set as WhiteListManager on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callUpdateCountry(address _user, uint16 _country, IIdentity onchainID) external {
        require(isWhiteListManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT WhiteList Manager");
        identityRegistry = token.identityRegistry();
        identityRegistry.updateCountry(_user, _country);
    }

   /**
    *  @dev calls the `deleteIdentity` function on the Identity Registry contract
    *  AgentManager has to be set as agent on the Identity Registry smart contract to process this function
    *  See {IIdentityRegistry-deleteIdentity}.
    *  Requires that `onchainID` is set as WhiteListManager on the AgentManager contract
    *  Requires that msg.sender is a MANAGEMENT KEY on `onchainID`
    *  @param onchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
    */
    function callDeleteIdentity(address _user, IIdentity onchainID) external {
        require(isWhiteListManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT WhiteList Manager");
        identityRegistry = token.identityRegistry();
        identityRegistry.deleteIdentity(_user);
    }
}
