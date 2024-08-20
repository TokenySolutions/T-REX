// SPDX-License-Identifier: GPL-3.0
//
//                                             :+#####%%%%%%%%%%%%%%+
//                                         .-*@@@%+.:+%@@@@@%%#***%@@%=
//                                     :=*%@@@#=.      :#@@%       *@@@%=
//                       .-+*%@%*-.:+%@@@@@@+.     -*+:  .=#.       :%@@@%-
//                   :=*@@@@%%@@@@@@@@@%@@@-   .=#@@@%@%=             =@@@@#.
//             -=+#%@@%#*=:.  :%@@@@%.   -*@@#*@@@@@@@#=:-              *@@@@+
//            =@@%=:.     :=:   *@@@@@%#-   =%*%@@@@#+-.        =+       :%@@@%-
//           -@@%.     .+@@@     =+=-.         @@#-           +@@@%-       =@@@@%:
//          :@@@.    .+@@#%:                   :    .=*=-::.-%@@@+*@@=       +@@@@#.
//          %@@:    +@%%*                         =%@@@@@@@@@@@#.  .*@%-       +@@@@*.
//         #@@=                                .+@@@@%:=*@@@@@-      :%@%:      .*@@@@+
//        *@@*                                +@@@#-@@%-:%@@*          +@@#.      :%@@@@-
//       -@@%           .:-=++*##%%%@@@@@@@@@@@@*. :@+.@@@%:            .#@@+       =@@@@#:
//      .@@@*-+*#%%%@@@@@@@@@@@@@@@@%%#**@@%@@@.   *@=*@@#                :#@%=      .#@@@@#-
//      -%@@@@@@@@@@@@@@@*+==-:-@@@=    *@# .#@*-=*@@@@%=                 -%@@@*       =@@@@@%-
//         -+%@@@#.   %@%%=   -@@:+@: -@@*    *@@*-::                   -%@@%=.         .*@@@@@#
//            *@@@*  +@* *@@##@@-  #@*@@+    -@@=          .         :+@@@#:           .-+@@@%+-
//             +@@@%*@@:..=@@@@*   .@@@*   .#@#.       .=+-       .=%@@@*.         :+#@@@@*=:
//              =@@@@%@@@@@@@@@@@@@@@@@@@@@@%-      :+#*.       :*@@@%=.       .=#@@@@%+:
//               .%@@=                 .....    .=#@@+.       .#@@@*:       -*%@@@@%+.
//                 +@@#+===---:::...         .=%@@*-         +@@@+.      -*@@@@@%+.
//                  -@@@@@@@@@@@@@@@@@@@@@@%@@@@=          -@@@+      -#@@@@@#=.
//                    ..:::---===+++***###%%%@@@#-       .#@@+     -*@@@@@#=.
//                                           @@@@@@+.   +@@*.   .+@@@@@%=.
//                                          -@@@@@=   =@@%:   -#@@@@%+.
//                                          +@@@@@. =@@@=  .+@@@@@*:
//                                          #@@@@#:%@@#. :*@@@@#-
//                                          @@@@@%@@@= :#@@@@+.
//                                         :@@@@@@@#.:#@@@%-
//                                         +@@@@@@-.*@@@*:
//                                         #@@@@#.=@@@+.
//                                         @@@@+-%@%=
//                                        :@@@#%@%=
//                                        +@@@@%-
//                                        :#%%=
//

/**
 *     NOTICE
 *
 *     The T-REX software is licensed under a proprietary license or the GPL v.3.
 *     If you choose to receive it under the GPL v.3 license, the following applies:
 *     T-REX is a suite of smart contracts implementing the ERC-3643 standard and
 *     developed by Tokeny to manage and transfer financial assets on EVM blockchains
 *
 *     Copyright (C) 2023, Tokeny sàrl.
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

pragma solidity 0.8.26;

import "../registry/interface/IIdentityRegistry.sol";
import "../compliance/modular/IModularCompliance.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TokenStructs.sol";

/// events

/// @dev This event is emitted when the token information is updated.
/// @param _newName is the name of the token.
/// @param _newSymbol is the symbol of the token.
/// @param _newDecimals is the decimals of the token.
/// @param _newVersion is the version of the token.
/// @param _newOnchainID is the address of the onchainID of the token.
event UpdatedTokenInformation(string indexed _newName, string indexed _newSymbol, uint8 _newDecimals, 
    string _newVersion, address indexed _newOnchainID);

/// @dev This event is emitted when the IdentityRegistry has been set for the token.
/// @param _identityRegistry is the address of the Identity Registry of the token.
event IdentityRegistryAdded(address indexed _identityRegistry);

/// @dev This event is emitted when the Compliance has been set for the token.
/// @param _compliance is the address of the Compliance contract of the token.
event ComplianceAdded(address indexed _compliance);

/// @dev This event is emitted when an investor successfully recovers his tokens.
/// @param _lostWallet is the address of the wallet that the investor lost access to.
/// @param _newWallet is the address of the wallet that the investor provided for the recovery.
/// @param _investorOnchainID is the address of the onchainID of the investor who asked for a recovery.
event RecoverySuccess(address indexed _lostWallet, address indexed _newWallet, address indexed _investorOnchainID);

/// @dev This event is emitted when the wallet of an investor is frozen or unfrozen.
/// @param _userAddress is the wallet of the investor that is concerned by the freezing status.
/// @param _isFrozen is the freezing status of the wallet.
/// @param _isFrozen equals `true` the wallet is frozen after emission of the event.
/// @param _isFrozen equals `false` the wallet is unfrozen after emission of the event.
/// @param _owner is the address of the agent who called the function to freeze the wallet.
event AddressFrozen(address indexed _userAddress, bool indexed _isFrozen, address indexed _owner);

/// @dev This event is emitted when a certain amount of tokens is frozen on a wallet.
/// @param _userAddress is the wallet of the investor that is concerned by the freezing status.
/// @param _amount is the amount of tokens that are frozen.
event TokensFrozen(address indexed _userAddress, uint256 _amount);

/// @dev This event is emitted when a certain amount of tokens is unfrozen on a wallet.
/// @param _userAddress is the wallet of the investor that is concerned by the freezing status.
/// @param _amount is the amount of tokens that are unfrozen.
event TokensUnfrozen(address indexed _userAddress, uint256 _amount);

/// @dev This event is emitted when the token is paused.
/// @param _userAddress is the address of the wallet that called the pause function
event Paused(address _userAddress);

/// @dev This event is emitted when the token is unpaused.
/// @param _userAddress is the address of the wallet that called the unpause function.
event Unpaused(address _userAddress);

/// @dev This event is emitted when restrictions on an agent's roles are updated.
/// @param _agent is the address of the agent whose roles are being restricted.
/// @param _disableMint indicates whether the agent is restricted from minting tokens.
/// @param _disableBurn indicates whether the agent is restricted from burning tokens.
/// @param _disableAddressFreeze indicates whether the agent is restricted from freezing addresses.
/// @param _disableForceTransfer indicates whether the agent is restricted from forcing transfers.
/// @param _disablePartialFreeze indicates whether the agent is restricted from partially freezing tokens.
/// @param _disablePause indicates whether the agent is restricted from pausing the token contract.
/// @param _disableRecovery indicates whether the agent is restricted from performing recovery operations.
event AgentRestrictionsSet(
    address indexed _agent,
    bool _disableMint,
    bool _disableBurn,
    bool _disableAddressFreeze,
    bool _disableForceTransfer,
    bool _disablePartialFreeze,
    bool _disablePause,
    bool _disableRecovery);

/// @dev This event is emitted when the owner gives or cancels a default allowance.
/// @param _to Address of target.
/// @param _allowance Allowance or disallowance.
event DefaultAllowance(address _to, bool _allowance);

/// @dev This event is emitted when a user remove the default allowance.
/// @param _user Address of user.
event DefaultAllowanceDisabled(address _user);

/// @dev This event is emitted when a user adds the default allowance back after disabling.
/// @param _user Address of user.
event DefaultAllowanceEnabled(address _user);

/// @dev interface
interface IToken is IERC20 {

    /// functions

    /**
     *  @dev sets the token name
     *  @param _name the name of token to set
     *  Only the owner of the token smart contract can call this function
     *  emits a `UpdatedTokenInformation` event
     */
    function setName(string calldata _name) external;

    /**
     *  @dev sets the token symbol
     *  @param _symbol the token symbol to set
     *  Only the owner of the token smart contract can call this function
     *  emits a `UpdatedTokenInformation` event
     */
    function setSymbol(string calldata _symbol) external;

    /**
     *  @dev sets the onchain ID of the token
     *  @param _onchainID the address of the onchain ID to set
     *  Only the owner of the token smart contract can call this function
     *  emits a `UpdatedTokenInformation` event
     */
    function setOnchainID(address _onchainID) external;

    /**
    * @dev Pauses the token contract. When the contract is paused, investors cannot transfer tokens anymore.
    * This function can only be called by an agent of the token, provided the agent is not restricted from pausing the token.
    * emits a `Paused` event upon successful execution.
    * To pause token transfers, the calling agent must have pausing capabilities enabled.
    * If the agent is disabled from pausing, the function call will fail.
    * The function can be called only when the contract is not already paused.
    * error AgentNotAuthorized - Thrown if the agent is disabled from pausing the token,
    * indicating they do not have the necessary permissions to execute this function.
    */
    function pause() external;

    /**
    * @dev Unpauses the token contract, allowing investors to resume token transfers under normal conditions
    * This function can only be called by an agent of the token, provided the agent is not restricted from pausing the token.
    * emits an `Unpaused` event upon successful execution.
    * To unpause token transfers, the calling agent must have pausing capabilities enabled.
    * If the agent is disabled from pausing, the function call will fail.
    * The function can be called only when the contract is currently paused.
    * error AgentNotAuthorized - Thrown if the agent is disabled from pausing the token,
    * indicating they do not have the necessary permissions to execute this function.
    */
    function unpause() external;

    /**
    * @dev Sets an address's frozen status for this token,
    * either freezing or unfreezing the address based on the provided boolean value.
    * This function can be called by an agent of the token, assuming the agent is not restricted from freezing addresses.
    * emits an `AddressFrozen` event upon successful execution.
    * @param _userAddress The address for which to update the frozen status.
    * @param _freeze The frozen status to be applied: `true` to freeze, `false` to unfreeze.
    * @notice To change an address's frozen status, the calling agent must have the capability to freeze addresses enabled.
    * If the agent is disabled from freezing addresses, the function call will fail.
    * error AgentNotAuthorized - Thrown if the agent is disabled from freezing addresses,
    * indicating they do not have the necessary permissions to execute this function.
    */
    function setAddressFrozen(address _userAddress, bool _freeze) external;

    /**
    * @dev Freezes a specified token amount for a given address, preventing those tokens from being transferred.
    * This function can be called by an agent of the token, provided the agent is not restricted from freezing tokens.
    * emits a `TokensFrozen` event upon successful execution.
    * @param _userAddress The address for which to freeze tokens.
    * @param _amount The amount of tokens to be frozen.
    * @notice To freeze tokens for an address, the calling agent must have the capability to freeze tokens enabled.
    * If the agent is disabled from freezing tokens, the function call will fail.
    * error AgentNotAuthorized - Thrown if the agent is disabled from freezing tokens,
    * indicating they do not have the necessary permissions to execute this function.
    */
    function freezePartialTokens(address _userAddress, uint256 _amount) external;

    /**
    * @dev Unfreezes a specified token amount for a given address, allowing those tokens to be transferred again.
    * This function can be called by an agent of the token, assuming the agent is not restricted from unfreezing tokens.
    * emits a `TokensUnfrozen` event upon successful execution.
    * @param _userAddress The address for which to unfreeze tokens.
    * @param _amount The amount of tokens to be unfrozen.
    * @notice To unfreeze tokens for an address, the calling agent must have the capability to unfreeze tokens enabled.
    * If the agent is disabled from unfreezing tokens, the function call will fail.
    * error AgentNotAuthorized - Thrown if the agent is disabled from unfreezing tokens,
    * indicating they do not have the necessary permissions to execute this function.
    */
    function unfreezePartialTokens(address _userAddress, uint256 _amount) external;

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
     *  calls bindToken on the compliance contract
     *  emits a `ComplianceAdded` event
     */
    function setCompliance(address _compliance) external;

    /**
     *  @dev Initiates a forced transfer of tokens between two whitelisted wallets.
     *  If the `from` address does not have sufficient free tokens (unfrozen tokens)
     *  but possesses a total balance equal to or greater than the specified `amount`,
     *  the frozen token amount is reduced to ensure enough free tokens for the transfer.
     *  In such cases, the remaining balance in the `from` account consists entirely of frozen tokens post-transfer.
     *  It is imperative that the `to` address is a verified and whitelisted address.
     *  @param _from The address of the sender.
     *  @param _to The address of the receiver.
     *  @param _amount The number of tokens to be transferred.
     *  This function can only be invoked by a wallet designated as an agent of the token,
     *  provided the agent is not restricted from initiating forced transfers of the token.
     *  Emits a `TokensUnfrozen` event if `_amount` is higher than the free balance of `_from`.
     *  Also emits a `Transfer` event.
     *  To execute this function, the calling agent must not be restricted from initiating forced transfers of the token.
     *  If the agent is restricted from this capability, the function call will fail.
     *  The function can only be called when the contract is not already paused.
     *  error `AgentNotAuthorized` - Thrown if the agent is restricted from initiating forced transfers of the token,
     *  indicating they do not have the necessary permissions to execute this function.
    */
    function forcedTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external returns (bool);

    /**
     *  @dev Mints tokens to a specified address.
     *  This enhanced version of the default mint method allows tokens to be minted
     *  to an address only if it is a verified and whitelisted address according to the security token.
     *  @param _to Address to mint the tokens to.
     *  @param _amount Amount of tokens to mint.
     *  This function can only be called by a wallet designated as an agent of the token,
     *  provided the agent is not restricted from minting tokens.
     *  Emits a `Transfer` event upon successful minting.
     *  To execute this function, the calling agent must not be restricted from minting tokens.
     *  If the agent is restricted from this capability, the function call will fail.
    */
    function mint(address _to, uint256 _amount) external;

    /**
     *  @dev Burns tokens from a specified address.
     *  If the account address does not have sufficient free tokens (unfrozen tokens)
     *  but possesses a total balance equal to or greater than the specified value,
     *  the frozen token amount is reduced to ensure enough free tokens for the burn.
     *  In such cases, the remaining balance in the account consists entirely of frozen tokens post-transaction.
     *  @param _userAddress Address to burn the tokens from.
     *  @param _amount Amount of tokens to burn.
     *  This function can only be called by a wallet designated as an agent of the token,
     *  provided the agent is not restricted from burning tokens.
     *  Emits a `TokensUnfrozen` event if `_amount` exceeds the free balance of `_userAddress`.
     *  Also emits a `Transfer` event.
     *  To execute this function, the calling agent must not be restricted from burning tokens.
     *  If the agent is restricted from this capability, the function call will fail.
    */
    function burn(address _userAddress, uint256 _amount) external;

    /**
     * @dev Initiates a recovery process to transfer tokens and associated states
     * from a lost wallet to a new wallet for an investor.
     *
     * This function allows an authorized agent to recover tokens from a lost wallet,
     * transferring them to a new wallet while preserving the investor's
     * identity and status within the token ecosystem. The function ensures that all relevant data,
     * including frozen tokens and address freezing status, is accurately transferred to the new wallet.
     *
     * @param _lostWallet The wallet that the investor lost, containing the tokens to be recovered.
     * @param _newWallet The newly provided wallet to which tokens and associated statuses must be transferred.
     * @param _investorOnchainID The ONCHAINID of the investor whose tokens are being recovered.
     *
     * Requirements:
     * - The caller must be an agent authorized to perform recovery operations, with no restrictions on this capability.
     * - The `_lostWallet` must have a non-zero token balance; otherwise, the recovery is unnecessary and will revert.
     * - Either the `_lostWallet` or the `_newWallet` must be present in the identity registry;
     *   if neither is present, the function will revert.
     *
     * Operations:
     * - Transfers the entire token balance from `_lostWallet` to `_newWallet`.
     * - Transfers any frozen tokens from `_lostWallet` to `_newWallet`, updating the frozen token count accordingly.
     * - Transfers the address freeze status from `_lostWallet` to `_newWallet`,
     *   ensuring the new wallet retains any restrictions if applicable.
     * - Updates the identity registry:
     *   - If `_lostWallet` is listed in the identity registry, it will be removed,
     *     and `_newWallet` will be registered unless already present.
     *
     * Emits the following events:
     * - `TokensUnfrozen` if there are frozen tokens on `_lostWallet` that are transferred.
     * - `TokensFrozen` if frozen tokens are added to `_newWallet`.
     * - `AddressFrozen` if the freeze status of either wallet changes.
     * - `Transfer` to reflect the movement of tokens from `_lostWallet` to `_newWallet`.
     * - `RecoverySuccess` upon successful completion of the recovery process.
     *
     * Reverts if:
     * - The agent calling the function does not have the necessary permissions to perform recovery (`AgentNotAuthorized`).
     * - The `_lostWallet` has no tokens to recover (`NoTokenToRecover`).
     * - Neither `_lostWallet` nor `_newWallet` is present in the identity registry (`RecoveryNotPossible`).
     *
     * @return A boolean value indicating whether the recovery process was successful.
     */
    function recoveryAddress(
        address _lostWallet,
        address _newWallet,
        address _investorOnchainID
    ) external returns (bool);

    /**
     * @dev The owner of this address can allow or disallow spending without allowance.
     * Any `TransferFrom` from these targets won't need allowance (allow = true) or will need allowance (allow = false).
     * @param _allow Allow or disallow spending without allowance.
     * @param _targets Addresses without allowance needed.
    */
    function setAllowanceForAll(bool _allow, address[] calldata _targets) external;

    /**
     * @dev The caller can remove default allowance globally.
    */
    function disableDefaultAllowance() external;

    /**
     * @dev The caller can get default allowance back globally.
    */
    function enableDefaultAllowance() external;

    /**
     *  @dev function allowing to issue transfers in batch
     *  Require that the msg.sender and `to` addresses are not frozen.
     *  Require that the total value should not exceed available balance.
     *  Require that the `to` addresses are all verified addresses,
     *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_toList.length` IS TOO HIGH,
     *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *  @param _toList The addresses of the receivers
     *  @param _amounts The number of tokens to transfer to the corresponding receiver
     *  emits _toList.length `Transfer` events
     */
    function batchTransfer(address[] calldata _toList, uint256[] calldata _amounts) external;

    /**
     *  @dev Initiates forced transfers in batch.
     *  Requires that each _amounts[i] does not exceed the available balance of _fromList[i].
     *  Requires that the _toList addresses are all verified and whitelisted addresses.
     *  IMPORTANT: THIS TRANSACTION COULD EXCEED GAS LIMIT IF _fromList.length IS TOO HIGH.
     *  USE WITH CARE TO AVOID "OUT OF GAS" TRANSACTIONS AND POTENTIAL LOSS OF TX FEES.
     *  @param _fromList The addresses of the senders.
     *  @param _toList The addresses of the receivers.
     *  @param _amounts The number of tokens to transfer to the corresponding receiver.
     *  This function can only be called by a wallet designated as an agent of the token,
     *  provided the agent is not restricted from initiating forced transfers in batch.
     *  Emits `TokensUnfrozen` events for each `_amounts[i]` that exceeds the free balance of `_fromList[i]`.
     *  Also emits _fromList.length `Transfer` events upon successful batch transfer.
     *  To execute this function, the calling agent must not be restricted from initiating forced transfer.
     *  If the agent is restricted from this capability, the function call will fail.
    */
    function batchForcedTransfer(
        address[] calldata _fromList,
        address[] calldata _toList,
        uint256[] calldata _amounts
    ) external;

    /**
     *  @dev Initiates minting of tokens in batch.
     *  Requires that the `_toList` addresses are all verified and whitelisted addresses.
     *  IMPORTANT: THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_toList.length` IS TOO HIGH.
     *  USE WITH CARE TO AVOID "OUT OF GAS" TRANSACTIONS AND POTENTIAL LOSS OF TX FEES.
     *  @param _toList The addresses of the receivers.
     *  @param _amounts The number of tokens to mint to the corresponding receiver.
     *  This function can only be called by a wallet designated as an agent of the token,
     *  provided the agent is not restricted from minting tokens.
     *  Emits _toList.length `Transfer` events upon successful batch minting.
     *  To execute this function, the calling agent must not be restricted from minting tokens.
     *  If the agent is restricted from this capability, the function call will fail.
    */
    function batchMint(address[] calldata _toList, uint256[] calldata _amounts) external;

    /**
     *  @dev Initiates burning of tokens in batch.
     *  Requires that the `_userAddresses` addresses are all verified and whitelisted addresses.
     *  IMPORTANT: THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_userAddresses.length` IS TOO HIGH.
     *  USE WITH CARE TO AVOID "OUT OF GAS" TRANSACTIONS AND POTENTIAL LOSS OF TX FEES.
     *  @param _userAddresses The addresses of the wallets concerned by the burn.
     *  @param _amounts The number of tokens to burn from the corresponding wallets.
     *  This function can only be called by a wallet designated as an agent of the token,
     *  provided the agent is not restricted from burning tokens.
     *  Emits _userAddresses.length `Transfer` events upon successful batch burn.
     *  To execute this function, the calling agent must not be restricted from burning tokens.
     *  If the agent is restricted from this capability, the function call will fail.
    */
    function batchBurn(address[] calldata _userAddresses, uint256[] calldata _amounts) external;

    /**
     *  @dev Initiates setting of frozen status for addresses in batch.
     *  IMPORTANT: THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_userAddresses.length` IS TOO HIGH.
     *  USE WITH CARE TO AVOID "OUT OF GAS" TRANSACTIONS AND POTENTIAL LOSS OF TX FEES.
     *  @param _userAddresses The addresses for which to update frozen status.
     *  @param _freeze Frozen status of the corresponding address.
     *  This function can only be called by a wallet designated as an agent of the token,
     *  provided the agent is not restricted from setting frozen addresses.
     *  Emits _userAddresses.length `AddressFrozen` events upon successful batch update of frozen status.
     *  To execute this function, the calling agent must not be restricted from setting frozen addresses.
     *  If the agent is restricted from this capability, the function call will fail.
    */
    function batchSetAddressFrozen(address[] calldata _userAddresses, bool[] calldata _freeze) external;

    /**
     *  @dev Initiates partial freezing of tokens in batch.
     *  IMPORTANT: THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_userAddresses.length` IS TOO HIGH.
     *  USE WITH CARE TO AVOID "OUT OF GAS" TRANSACTIONS AND POTENTIAL LOSS OF TX FEES.
     *  @param _userAddresses The addresses on which tokens need to be partially frozen.
     *  @param _amounts The amount of tokens to freeze on the corresponding address.
     *  This function can only be called by a wallet designated as an agent of the token,
     *  provided the agent is not restricted from partially freezing tokens.
     *  Emits _userAddresses.length `TokensFrozen` events upon successful batch partial freezing.
     *  To execute this function, the calling agent must not be restricted from partially freezing tokens.
     *  If the agent is restricted from this capability, the function call will fail.
    */
    function batchFreezePartialTokens(address[] calldata _userAddresses, uint256[] calldata _amounts) external;

    /**
     *  @dev Initiates partial unfreezing of tokens in batch.
     *  IMPORTANT: THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_userAddresses.length` IS TOO HIGH.
     *  USE WITH CARE TO AVOID "OUT OF GAS" TRANSACTIONS AND POTENTIAL LOSS OF TX FEES.
     *  @param _userAddresses The addresses on which tokens need to be partially unfrozen.
     *  @param _amounts The amount of tokens to unfreeze on the corresponding address.
     *  This function can only be called by a wallet designated as an agent of the token,
     *  provided the agent is not restricted from partially freezing tokens.
     *  Emits _userAddresses.length `TokensUnfrozen` events upon successful batch partial unfreezing.
     *  To execute this function, the calling agent must not be restricted from partially freezing tokens.
     *  If the agent is restricted from this capability, the function call will fail.
    */
    function batchUnfreezePartialTokens(address[] calldata _userAddresses, uint256[] calldata _amounts) external;

    /**
     *  @dev Set restrictions on agent's roles.
     *  This function can only be called by the contract owner, as enforced by the `onlyOwner` modifier.
     *  emits an `AgentRestrictionsSet` event upon successfully updating an agent's restrictions.
     *  @param agent The address of the agent whose permissions are being modified.
     *  @param restrictions A `TokenRoles` struct containing boolean flags for each role to be restricted.
     *  Each flag set to `true` disables the corresponding capability for the agent.
     *  throws AddressNotAgent error if the specified address is not an agent.
     */
    function setAgentRestrictions(address agent, TokenRoles memory restrictions) external;

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 1 ** 2`).
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
    function identityRegistry() external view returns (IIdentityRegistry);

    /**
     *  @dev Returns the Compliance contract linked to the token
     */
    function compliance() external view returns (IModularCompliance);

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
     *  @param _userAddress the address of the wallet on which isFrozen is called
     */
    function isFrozen(address _userAddress) external view returns (bool);

    /**
     *  @dev Returns the amount of tokens that are partially frozen on a wallet
     *  the amount of frozen tokens is always <= to the total balance of the wallet
     *  @param _userAddress the address of the wallet on which getFrozenTokens is called
     */
    function getFrozenTokens(address _userAddress) external view returns (uint256);

    /**
     *  @dev Returns A `TokenRoles` struct containing boolean flags for each restricted role.
     *  Each flag set to `true` disables the corresponding capability for the agent.
     */
    function getAgentRestrictions(address agent) external view returns (TokenRoles memory);

}
