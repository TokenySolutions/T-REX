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

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../registry/IIdentityRegistry.sol";
import "../compliance/ICompliance.sol";

//interface
interface IToken is IERC20 {

   /**
    *  this event is emitted when the token information is updated.
    *  the event is emitted by the token constructor and by the setTokenInformation function
    *  `newName` is the name of the token
    *  `newSymbol` is the symbol of the token
    *  `newDecimals` is the decimals of the token
    *  `newVersion` is the version of the token, current version is 3.0
    *  `newOnchainID` is the address of the onchainID of the token
    */

    event UpdatedTokenInformation(string newName, string newSymbol, uint8 newDecimals, string newVersion, address newOnchainID);

   /**
    *  this event is emitted when the IdentityRegistry has been set for the token
    *  the event is emitted by the token constructor and by the setIdentityRegistry function
    *  `_identityRegistry` is the address of the Identity Registry of the token
    */

    event IdentityRegistryAdded(address indexed _identityRegistry);

   /**
    *  this event is emitted when the Compliance has been set for the token
    *  the event is emitted by the token constructor and by the setCompliance function
    *  `_compliance` is the address of the Compliance contract of the token
    */

    event ComplianceAdded(address indexed _compliance);

   /**
    *  this event is emitted when an investor successfully recovers his tokens
    *  the event is emitted by the recoveryAddress function
    *  `wallet_lostAddress` is the address of the wallet that the investor lost access to
    *  `wallet_newAddress` is the address of the wallet that the investor provided for the recovery
    *  `onchainID` is the address of the onchainID of the investor who asked for a recovery
    */

    event RecoverySuccess(address wallet_lostAddress, address wallet_newAddress, address onchainID);

   /**
    *  this event is emitted when an investor fails to recover his tokens
    *  the event is emitted by the recoveryAddress function
    *  `wallet_lostAddress` is the address of the wallet that the investor lost access to
    *  `wallet_newAddress` is the address of the wallet that the investor provided for the recovery
    *  `onchainID` is the address of the onchainID of the investor who asked for a recovery
    */

    event RecoveryFails(address wallet_lostAddress, address wallet_newAddress, address onchainID);

   /**
    *  this event is emitted when the wallet of an investor is frozen or unfrozen
    *  the event is emitted by setAddressFrozen and batchSetAddressFrozen functions
    *  `addr` is the wallet of the investor that is concerned by the freezing status
    *  `isFrozen` is the freezing status of the wallet
    *  if `isFrozen` equals `true` the wallet is frozen after emission of the event
    *  if `isFrozen` equals `false` the wallet is unfrozen after emission of the event
    *  `owner` is the address of the agent who called the function to freeze the wallet
    */

    event AddressFrozen(address indexed addr, bool indexed isFrozen, address indexed owner);

   /**
    *  this event is emitted when a certain amount of tokens is frozen on a wallet
    *  the event is emitted by freezePartialTokens and batchFreezePartialTokens functions
    *  `addr` is the wallet of the investor that is concerned by the freezing status
    *  `amount` is the amount of tokens that are frozen
    */

    event TokensFrozen(address indexed addr, uint256 amount);

   /**
    *  this event is emitted when a certain amount of tokens is unfrozen on a wallet
    *  the event is emitted by unfreezePartialTokens and batchUnfreezePartialTokens functions
    *  `addr` is the wallet of the investor that is concerned by the freezing status
    *  `amount` is the amount of tokens that are unfrozen
    */

    event TokensUnfrozen(address indexed addr, uint256 amount);

   /**
    *  this event is emitted when the token is paused
    *  the event is emitted by the pause function
    *  `account` is the address of the wallet that called the pause function
    */

    event Paused(address account);

   /**
    *  this event is emitted when the token is unpaused
    *  the event is emitted by the unpause function
    *  `account` is the address of the wallet that called the unpause function
    */

    event UnPaused(address account);


    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * balanceOf() and transfer().
     */

    function decimals() external view returns (uint8);

    /**
     * @dev Returns the name of the token.
     */

    function name() external view returns (string memory);

    /**
     * @dev Returns the address of the onchainID of the token.
     * the onchainID of the token gives all the information available
     * about the token and is managed by the token issuer or his agent.
     */

    function onchainID() external view returns (address);

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */

    function symbol() external view returns (string memory);

    /**
     * @dev Returns the TREX version of the token.
     * current version is 3.0.0
     */

    function version() external view returns (string memory);

   /**
    *  @dev Returns the Identity Registry linked to the token
    */

    function getIdentityRegistry() external view returns (IIdentityRegistry);

   /**
    *  @dev Returns the Compliance contract linked to the token
    */
    function getCompliance() external view returns (ICompliance);

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */

    function paused() external view returns (bool);

   /**
    *  @dev Returns the freezing status of a wallet
    *  if isFrozen returns `true` the wallet is frozen
    *  if isFrozen returns `false` the wallet is not frozen
    *  isFrozen returning `true` doesn't mean that the balance is free, tokens could be blocked by
    *  a partial freeze or the whole token could be blocked by pause
    *  @param addr the address of the wallet on which isFrozen is called
    */

    function isFrozen(address addr) external view returns (bool);

   /**
    *  @dev Returns the amount of tokens that are partially frozen on a wallet
    *  the amount of frozen tokens is always <= to the total balance of the wallet
    *  @param addr the address of the wallet on which getFrozenTokens is called
    */

    function getFrozenTokens(address addr) external view returns (uint256);


    /**
     *  @dev Sets the values for `tokenName`, `tokenSymbol`, `tokenDecimals`,
     *  `tokenVersion` and `tokenOnchainID`
     *  NOTE: decimals should not change once tokens have already been issued and transferred
     *  @param _name the name of the token
     *  @param _symbol the symbol of the token
     *  @param _decimals the decimals of the token
     *  @param _version the version of the token, current version is 3.0
     *  @param _onchainID the address of the onchainID of the token
     *  Only the owner of the token smart contract can call this function
     *  emits an `UpdatedTokenInformation` event
     */

    function setTokenInformation(string calldata _name, string calldata _symbol, uint8 _decimals, string calldata _version, address _onchainID) external;

    /**
     *  @dev pauses the token contract, when contract is paused investors cannot transfer tokens anymore
     *  This function can only be called by a wallet set as agent of the token
     *  emits a `Paused` event
     */

    function pause() external;

    /**
     *  @dev unpauses the token contract, when contract is unpaused investors can transfer tokens
     *  if their wallet is not blocked & if the amount to transfer is <= to the amount of free tokens
     *  This function can only be called by a wallet set as agent of the token
     *  emits an `Unpaused` event
     */

    function unpause() external;

    /**
     *  @dev sets an address frozen status for this token.
     *  @param addr The address for which to update frozen status
     *  @param freeze Frozen status of the address
     *  This function can only be called by a wallet set as agent of the token
     *  emits an `AddressFrozen` event
     */

    function setAddressFrozen(address addr, bool freeze) external;

    /**
     *  @dev freezes token amount specified for given address.
     *  @param addr The address for which to update frozen tokens
     *  @param amount Amount of Tokens to be frozen
     *  This function can only be called by a wallet set as agent of the token
     *  emits a `TokensFrozen` event
     */

    function freezePartialTokens(address addr, uint256 amount) external;

   /**
    *  @dev unfreezes token amount specified for given address
    *  @param addr The address for which to update frozen tokens
    *  @param amount Amount of Tokens to be unfrozen
    *  This function can only be called by a wallet set as agent of the token
    *  emits a `TokensUnfrozen` event
    */

    function unfreezePartialTokens(address addr, uint256 amount) external;

   /**
    *  @dev sets the Identity Registry for the token
    *  @param _identityRegistry the address of the Identity Registry to set
    *  Only the owner of the token smart contract can call this function
    *  emits an `IdentityRegistryAdded` event
    */

    function setIdentityRegistry(address _identityRegistry) external;

   /**
    *  @dev sets the compliance contract of the token
    *  @param _compliance the address of the compliance contract to set
    *  Only the owner of the token smart contract can call this function
    *  emits a `ComplianceAdded` event
    */

    function setCompliance(address _compliance) external;

   /**
    *  @dev force a transfer of tokens between 2 whitelisted wallets
    *  In case the `from` address has not enough free tokens (unfrozen tokens)
    *  but has a total balance higher or equal to the `value` amount
    *  the amount of frozen tokens is reduced in order to have enough free tokens
    *  to proceed the transfer, in such a case, the remaining balance on the `from`
    *  account is 100% composed of frozen tokens post-transfer.
    *  Require that the `to` address is a verified address,
    *  @param _from The address of the sender
    *  @param _to The address of the receiver
    *  @param _value The number of tokens to transfer
    *  @return `true` if successful and revert if unsuccessful
    *  This function can only be called by a wallet set as agent of the token
    *  emits a `TokensUnfrozen` event if `_value` is higher than the free balance of `_from`
    *  emits a `Transfer` event
    */

    function forcedTransfer(address _from, address _to, uint256 _value) external returns (bool);

    /**
     *  @dev mint tokens on a wallet
     *  Improved version of default mint method. Tokens can be minted
     *  to an address if only it is a verified address as per the security token.
     *  @param _to Address to mint the tokens to.
     *  @param _amount Amount of tokens to mint.
     *  This function can only be called by a wallet set as agent of the token
     *  emits a `Transfer` event
     */

    function mint(address _to, uint256 _amount) external;

    /**
     *  @dev burn tokens on a wallet
     *  In case the `account` address has not enough free tokens (unfrozen tokens)
     *  but has a total balance higher or equal to the `value` amount
     *  the amount of frozen tokens is reduced in order to have enough free tokens
     *  to proceed the burn, in such a case, the remaining balance on the `account`
     *  is 100% composed of frozen tokens post-transaction.
     *  @param account Address to burn the tokens from.
     *  @param value Amount of tokens to burn.
     *  This function can only be called by a wallet set as agent of the token
     *  emits a `TokensUnfrozen` event if `value` is higher than the free balance of `account`
     *  emits a `Transfer` event
     */

    function burn(address account, uint256 value) external;

   /**
    *  @dev recovery function used to force transfer tokens from a
    *  lost wallet to a new wallet for an investor.
    *  @param lostWallet the wallet that the investor lost
    *  @param newWallet the newly provided wallet on which tokens have to be transferred
    *  @param investorOnchainID the onchainID of the investor asking for a recovery
    *  This function can only be called by a wallet set as agent of the token
    *  emits a `TokensUnfrozen` event if there is some frozen tokens on the lost wallet if the recovery process is successful
    *  emits a `Transfer` event if the recovery process is successful
    *  emits a `RecoverySuccess` event if the recovery process is successful
    *  emits a `RecoveryFails` event if the recovery process fails
    */

    function recoveryAddress(address lostWallet, address newWallet, address investorOnchainID) external returns (bool);

   /**
    *  @dev function allowing to issue transfers in batch
    *  Require that the msg.sender and `to` addresses are not frozen.
    *  Require that the total value should not exceed available balance.
    *  Require that the `to` addresses are all verified addresses,
    *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_toList.length` IS TOO HIGH,
    *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
    *  @param _toList The addresses of the receivers
    *  @param _values The number of tokens to transfer to the corresponding receiver
    *  emits _toList.length `Transfer` events
    */

    function batchTransfer(address[] calldata _toList, uint256[] calldata _values) external;

   /**
    *  @dev function allowing to issue forced transfers in batch
    *  Require that `_values[i]` should not exceed available balance of `_fromList[i]`.
    *  Require that the `_toList` addresses are all verified addresses
    *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_fromList.length` IS TOO HIGH,
    *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
    *  @param _fromList The addresses of the senders
    *  @param _toList The addresses of the receivers
    *  @param _values The number of tokens to transfer to the corresponding receiver
    *  This function can only be called by a wallet set as agent of the token
    *  emits `TokensUnfrozen` events if `_values[i]` is higher than the free balance of `_fromList[i]`
    *  emits _fromList.length `Transfer` events
    */

    function batchForcedTransfer(address[] calldata _fromList, address[] calldata _toList, uint256[] calldata _values) external;

   /**
    *  @dev function allowing to mint tokens in batch
    *  Require that the `_toList` addresses are all verified addresses
    *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_toList.length` IS TOO HIGH,
    *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
    *  @param _toList The addresses of the receivers
    *  @param _amounts The number of tokens to mint to the corresponding receiver
    *  This function can only be called by a wallet set as agent of the token
    *  emits _toList.length `Transfer` events
    */

    function batchMint(address[] calldata _toList, uint256[] calldata _amounts) external;

   /**
    *  @dev function allowing to burn tokens in batch
    *  Require that the `accounts` addresses are all verified addresses
    *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `accounts.length` IS TOO HIGH,
    *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
    *  @param accounts The addresses of the wallets concerned by the burn
    *  @param values The number of tokens to burn from the corresponding wallets
    *  This function can only be called by a wallet set as agent of the token
    *  emits accounts.length `Transfer` events
    */

    function batchBurn(address[] calldata accounts, uint256[] calldata values) external;

    /**
     *  @dev function allowing to set frozen addresses in batch
     *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `addrList.length` IS TOO HIGH,
     *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *  @param addrList The addresses for which to update frozen status
     *  @param freeze Frozen status of the corresponding address
     *  This function can only be called by a wallet set as agent of the token
     *  emits addrList.length `AddressFrozen` events
     */

    function batchSetAddressFrozen(address[] calldata addrList, bool[] calldata freeze) external;

   /**
    *  @dev function allowing to freeze tokens partially in batch
    *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `addrList.length` IS TOO HIGH,
    *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
    *  @param addrList The addresses on which tokens need to be frozen
    *  @param amounts the amount of tokens to freeze on the corresponding address
    *  This function can only be called by a wallet set as agent of the token
    *  emits addrList.length `TokensFrozen` events
    */

    function batchFreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts) external;

    /**
     *  @dev function allowing to unfreeze tokens partially in batch
     *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `addrList.length` IS TOO HIGH,
     *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *  @param addrList The addresses on which tokens need to be unfrozen
     *  @param amounts the amount of tokens to unfreeze on the corresponding address
     *  This function can only be called by a wallet set as agent of the token
     *  emits addrList.length `TokensUnfrozen` events
     */

    function batchUnfreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts) external;

   /**
    *  @dev transfers the ownership of the token smart contract
    *  @param newOwner the address of the new token smart contract owner
    *  This function can only be called by the owner of the token
    */

    function transferOwnershipOnTokenContract(address newOwner) external;

   /**
    *  @dev adds an agent to the token smart contract
    *  @param agent the address of the new agent of the token smart contract
    *  This function can only be called by the owner of the token
    */

    function addAgentOnTokenContract(address agent) external;

   /**
    *  @dev remove an agent from the token smart contract
    *  @param agent the address of the agent to remove
    *  This function can only be called by the owner of the token
    */

    function removeAgentOnTokenContract(address agent) external;

}
