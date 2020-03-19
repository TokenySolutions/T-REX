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
    *  TODO: describe this event
    */
    event UpdatedTokenInformation(string newName, string newSymbol, uint8 newDecimals, string newVersion, address newOnchainID);

    /**
    *  TODO: describe this event
    */
    event IdentityRegistryAdded(address indexed _identityRegistry);

    /**
    *  TODO: describe this event
    */
    event ComplianceAdded(address indexed _compliance);

    /**
    *  TODO: describe this event
    */
    event RecoverySuccess(address wallet_lostAddress, address wallet_newAddress, address onchainID);

    /**
    *  TODO: describe this event
    */
    event RecoveryFails(address wallet_lostAddress, address wallet_newAddress, address onchainID);

    /**
     * @dev Emitted when `owner` freeze/unfreeze the wallet `addr`.
     * if `isFrozen` equals `true` the wallet is frozen
     * if `isFrozen` equals `false` the wallet is unfrozen
     */
    event AddressFrozen(address indexed addr, bool indexed isFrozen, address indexed owner);

    /**
     * @dev Emitted when `amount` of tokens are partially frozen on the wallet `addr`.
     */
    event TokensFrozen(address indexed addr, uint256 amount);

    /**
     * @dev Emitted when `amount` of tokens are partially unfrozen on the wallet `addr`.
     */
    event TokensUnfrozen(address indexed addr, uint256 amount);

    /**
     * @dev Emitted when Token Contract is set on Pause.
     */
    event Paused(address account);

    /**
     * @dev Emitted when Token Contract is unpaused.
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
     * @dev Returns the address of the Identity Registry contract.
     */
    function getIdentityRegistry() external view returns (IIdentityRegistry);

    /**
     * @dev Returns the address of the Compliance contract.
     */
    function getCompliance() external view returns (ICompliance);

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() external view returns (bool);

    /**
     * @dev Returns 'true' if the address is frozen, 'false' if not. contract.
     * @param addr The address for which to check frozen status
     */
    function isFrozen(address addr) external view returns (bool);

    /**
     * @dev Returns the amount of frozen(locked) tokens . contract.
     * @param addr The address for which to check frozen tokens.
     */
    function getFrozenTokens(address addr) external view returns (uint256);


    /**
     * @dev Sets the values for `tokenName`, `tokenSymbol`, `tokenDecimals`,
     * `tokenVersion` and `tokenOnchainID`
     */
    function setTokenInformation(string calldata _name, string calldata _symbol, uint8 _decimals, string calldata _version, address _onchainID) external;

    /**
     * @dev Called by an agent to pause, triggers stopped state.
     */
    function pause() external;

    /**
     * @dev Called by an agent to unpause, returns to normal state.
     */
    function unpause() external;

    /**
     *  Sets an address frozen status for this token.
     *  @param addr The address for which to update frozen status
     *  @param freeze Frozen status of the address
     */
    function setAddressFrozen(address addr, bool freeze) external;

    /**
     *  Freezes token amount specified for given address.
     *  @param addr The address for which to update frozen tokens
     *  @param amount Amount of Tokens to be frozen
     */
    function freezePartialTokens(address addr, uint256 amount) external;

   /**
    *  Unfreezes token amount specified for given address
    *  @param addr The address for which to update frozen tokens
    *  @param amount Amount of Tokens to be unfrozen
    */
    function unfreezePartialTokens(address addr, uint256 amount) external;

    /**
    * @notice Replace the current Identity Registry contract with a new one.
    * Only agent can call.
    *
    * @param _identityRegistry The address of the new Identity Registry
    */
    function setIdentityRegistry(address _identityRegistry) external;

   /**
   * @notice Replace the current compliance contract with a new one.
   * Only agent can call.
   *
   * @param _compliance The address of the new Compliance
   */
    function setCompliance(address _compliance) external;

   /**
    *
    *  In case the `from` address has not enough free tokens (unfrozen tokens)
    *  but has a total balance higher or equal to the `value` amount
    *  the amount of frozen tokens is reduced in order to have enough free tokens
    *  to proceed the transfer, in such a case, the remaining balance on the `from`
    *  account is 100% composed of frozen tokens post-transfer.
    *  Require that the `to` address is a verified address,
    *
    * @param _from The address of the sender
    * @param _to The address of the receiver
    * @param _value The number of tokens to transfer
    *
    * @return `true` if successful and revert if unsuccessful
    */
    function forcedTransfer(address _from, address _to, uint256 _value) external returns (bool);

    /**
     * @notice Improved version of default mint method. Tokens can be minted
     * to an address if only it is a verified address as per the security token.
     * Only agent can call.
     *
     * @param _to Address to mint the tokens to.
     * @param _amount Amount of tokens to mint.
     *
     */
    function mint(address _to, uint256 _amount) external;

    /**
     * @notice Burn an amount of Tokens from the account's balance
     * Only agent can call.
     *
     * @param account Address to burn the tokens to.
     * @param value Amount of tokens to burn.
     *
     */
    function burn(address account, uint256 value) external;

    /**
    *  TODO: describe this function
    */
    function recoveryAddress(address lostWallet, address newWallet, address investorOnchainID) external returns (bool);

   /**
    * @notice function allowing to issue transfers in batch
    *  Require that the msg.sender and `to` addresses are not frozen.
    *  Require that the total value should not exceed available balance.
    *  Require that the `to` addresses are all verified addresses,
    *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_toList.length` IS TOO HIGH,
    *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
    *
    * @param _toList The addresses of the receivers
    * @param _values The number of tokens to transfer to the corresponding receiver
    *
    */
    function batchTransfer(address[] calldata _toList, uint256[] calldata _values) external;

   /**
    * @notice function allowing to issue forced transfers in batch
    *  Only Agent can call this function.
    *  Require that `value` should not exceed available balance of `_from`.
    *  Require that the `to` addresses are all verified addresses
    *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_fromList.length` IS TOO HIGH,
    *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
    *
    * @param _fromList The addresses of the senders
    * @param _toList The addresses of the receivers
    * @param _values The number of tokens to transfer to the corresponding receiver
    *
    */
    function batchForcedTransfer(address[] calldata _fromList, address[] calldata _toList, uint256[] calldata _values) external;

    /**
     * @notice function allowing to mint in batch
     *  Only Agent can call this function.
     *  Require that `_toList` should be verified.
     *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_toList.length` IS TOO HIGH,
     *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *
     * @param _toList The addresses of the receivers
     * @param _amounts The number of tokens to mint to the corresponding receiver
     *
     */
    function batchMint(address[] calldata _toList, uint256[] calldata _amounts) external;

    /**
     * @notice function allowing to mint in batch
     *  Only Agent can call this function.
     *  Require `accounts` with a positive balance.
     *  Require `values` inferior or equal to the actual balance.
     *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `accounts.length` IS TOO HIGH,
     *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *
     * @param accounts The addresses with tokens to be burnt
     * @param values The number of tokens to burn
     *
     */
    function batchBurn(address[] calldata accounts, uint256[] calldata values) external;

    /**
     * @notice function allowing to set frozen addresses in batch
     *  Only Agent can call this function.
     *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `addrList.length` IS TOO HIGH,
     *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *
     *  @param addrList The addresses for which to update frozen status
     *  @param freeze Frozen status of the corresponding address
     *
     */
    function batchSetAddressFrozen(address[] calldata addrList, bool[] calldata freeze) external;

   /**
    * @notice function allowing to freeze tokens partially in batch
    *  Only Agent can call this function.
    *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `addrList.length` IS TOO HIGH,
    *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
    *
    *  @param addrList The addresses on which tokens need to be frozen
    *  @param amounts the amount of tokens to freeze on the corresponding address
    *
    */
    function batchFreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts) external;

   /**
    * @notice function allowing to unfreeze tokens partially in batch
    *  Only Agent can call this function.
    *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `addrList.length` IS TOO HIGH,
    *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
    *
    *  @param addrList The addresses on which tokens need to be unfrozen
    *  @param amounts the amount of tokens to unfreeze on the corresponding address
    *
    */
    function batchUnfreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts) external;

    /**
      * @notice Transfers the Ownership of Token Contract to a new Owner.
      * Only owner can call.
      *
      * @param newOwner The new owner of this contract.
      */
    function transferOwnershipOnTokenContract(address newOwner) external;

    /**
   * @notice Adds an address as agent of the Token Contract.
   * Only owner can call.
   *
   * @param agent The agent's address to add.
   */
    function addAgentOnTokenContract(address agent) external;

    /**
     * @notice Removes an address from being agent of the Token Contract.
     * Only owner can call.
     *
     * @param agent The agent's address to remove.
     */
    function removeAgentOnTokenContract(address agent) external;

}
