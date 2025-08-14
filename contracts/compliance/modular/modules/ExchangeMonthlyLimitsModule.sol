// SPDX-License-Identifier: GPL-3.0
// This contract is also licensed under the Creative Commons Attribution-NonCommercial 4.0 International License.
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
 *     Copyright (C) 2024, Tokeny sàrl.
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
 *
 *     This specific smart contract is also licensed under the Creative Commons
 *     Attribution-NonCommercial 4.0 International License (CC-BY-NC-4.0),
 *     which prohibits commercial use. For commercial inquiries, please contact
 *     Tokeny sàrl for licensing options.
 */

pragma solidity 0.8.27;

import "../IModularCompliance.sol";
import "../../../token/IToken.sol";
import "../../../roles/AgentRole.sol";
import "./AbstractModuleUpgradeable.sol";

/// Events

/// @dev This event is emitted whenever the Exchange Limit has been updated.
/// @param compliance is the address of the caller Compliance contract.
/// @param _exchangeID is the amount ONCHAINID address of the exchange.
/// @param _newExchangeMonthlyLimit is the amount Limit of tokens to be transferred monthly to an exchange wallet.
event ExchangeMonthlyLimitUpdated(
  address indexed compliance,
  address _exchangeID,
  uint256 _newExchangeMonthlyLimit
);

/// @dev This event is emitted whenever an ONCHAINID is tagged as being an exchange ID.
/// @param _newExchangeID is the ONCHAINID address of the exchange to add.
event ExchangeIDAdded(address _newExchangeID);

/// @dev This event is emitted whenever an ONCHAINID is untagged as belonging to an exchange.
/// @param _exchangeID is the ONCHAINID being untagged as an exchange ID.
event ExchangeIDRemoved(address _exchangeID);

contract ExchangeMonthlyLimitsModule is AbstractModuleUpgradeable {
  /// Struct of transfer Counters
  struct ExchangeTransferCounter {
    uint256 monthlyCount;
    uint256 monthlyTimer;
  }

  /// Getter for Tokens monthlyLimit
  mapping(address compliance => mapping(uint256 nonce => mapping(address exchangeID => uint256)))
    private _exchangeMonthlyLimit;

  /// Mapping for users Counters
  mapping(address compliance => mapping(uint256 nonce => mapping(address exchangeID => mapping(address investorID => ExchangeTransferCounter))))
    private _exchangeCounters;

  /// Mapping for wallets tagged as exchange wallets
  mapping(address exchangeID => bool) private _exchangeIDs;

  /**
   * @dev initializes the contract and sets the initial state.
   * @notice This function should only be called once during the contract deployment.
   */
  function initialize() external initializer {
    __AbstractModule_init();
  }

  /**
   *  @dev Set the limit of tokens allowed to be transferred monthly.
   *  @param _exchangeID ONCHAINID of the exchange
   *  @param _newExchangeMonthlyLimit The new monthly limit of the exchange
   *  Only the Compliance smart contract can call this function
   */
  function setExchangeMonthlyLimit(
    address _exchangeID,
    uint256 _newExchangeMonthlyLimit
  ) external onlyComplianceCall {
    uint256 nonce = getNonce(msg.sender);
    _exchangeMonthlyLimit[msg.sender][nonce][
      _exchangeID
    ] = _newExchangeMonthlyLimit;
    emit ExchangeMonthlyLimitUpdated(
      msg.sender,
      _exchangeID,
      _newExchangeMonthlyLimit
    );
  }

  /**
   *  @dev tags the ONCHAINID as being an exchange ID
   *  @param _exchangeID ONCHAINID to be tagged
   *  Function can be called only by the owner of this module
   *  Cannot be called on an address already tagged as being an exchange
   *  emits an `ExchangeIDAdded` event
   */
  function addExchangeID(address _exchangeID) external onlyOwner {
    require(
      !isExchangeID(_exchangeID),
      ONCHAINIDAlreadyTaggedAsExchange(_exchangeID)
    );

    _exchangeIDs[_exchangeID] = true;
    emit ExchangeIDAdded(_exchangeID);
  }

  /**
   *  @dev untags the ONCHAINID as being an exchange ID
   *  @param _exchangeID ONCHAINID to be untagged
   *  Function can be called only by the owner of this module
   *  Cannot be called on an address not tagged as being an exchange
   *  emits an `ExchangeIDRemoved` event
   */
  function removeExchangeID(address _exchangeID) external onlyOwner {
    require(
      isExchangeID(_exchangeID),
      ONCHAINIDNotTaggedAsExchange(_exchangeID)
    );

    _exchangeIDs[_exchangeID] = false;
    emit ExchangeIDRemoved(_exchangeID);
  }

  /**
   *  @dev See {IModule-moduleTransferAction}.
   */
  function moduleTransferAction(
    address _from,
    address _to,
    uint256 _value
  ) external override onlyComplianceCall {
    address senderIdentity = _getIdentity(msg.sender, _from);
    address receiverIdentity = _getIdentity(msg.sender, _to);

    if (isExchangeID(receiverIdentity) && !_isTokenAgent(msg.sender, _from)) {
      _increaseExchangeCounters(
        msg.sender,
        getNonce(msg.sender),
        receiverIdentity,
        senderIdentity,
        _value
      );
    }
  }

  /**
   *  @dev See {IModule-moduleMintAction}.
   */
  // solhint-disable-next-line no-empty-blocks
  function moduleMintAction(
    address /*_to*/,
    uint256 /*_value*/
  ) external override onlyComplianceCall {}

  /**
   *  @dev See {IModule-moduleBurnAction}.
   */
  // solhint-disable-next-line no-empty-blocks
  function moduleBurnAction(
    address /*_from*/,
    uint256 /*_value*/
  ) external override onlyComplianceCall {}

  /**
   *  @dev See {IModule-moduleCheck}.
   */
  function moduleCheck(
    address _from,
    address _to,
    uint256 _value,
    address _compliance
  ) external view override returns (bool) {
    if (_from == address(0) || _isTokenAgent(_compliance, _from)) {
      return true;
    }

    address senderIdentity = _getIdentity(_compliance, _from);
    if (isExchangeID(senderIdentity)) {
      return true;
    }

    address receiverIdentity = _getIdentity(_compliance, _to);
    if (!isExchangeID(receiverIdentity)) {
      return true;
    }

    uint256 nonce = getNonce(_compliance);
    if (_value > _exchangeMonthlyLimit[_compliance][nonce][receiverIdentity]) {
      return false;
    }

    if (
      _isExchangeMonthFinished(_compliance, receiverIdentity, senderIdentity)
    ) {
      return true;
    }

    if (
      getMonthlyCounter(_compliance, receiverIdentity, senderIdentity) +
        _value >
      _exchangeMonthlyLimit[_compliance][nonce][receiverIdentity]
    ) {
      return false;
    }

    return true;
  }

  /**
   *  @dev See {IModule-canComplianceBind}.
   */
  function canComplianceBind(
    address /*_compliance*/
  ) external pure override returns (bool) {
    return true;
  }

  /**
   *  @dev See {IModule-isPlugAndPlay}.
   */
  function isPlugAndPlay() external pure override returns (bool) {
    return true;
  }

  /**
   *  @dev getter for `_exchangeIDs` variable
   *  tells to the caller if an ONCHAINID belongs to an exchange or not
   *  @param _exchangeID ONCHAINID to be checked
   *  returns TRUE if the address corresponds to an exchange, FALSE otherwise
   */
  function isExchangeID(address _exchangeID) public view returns (bool) {
    return _exchangeIDs[_exchangeID];
  }

  /**
   *  @dev getter for `exchangeCounters` variable on the counter parameter of the ExchangeTransferCounter struct
   *  @param _compliance the Compliance smart contract to be checked
   *  @param _exchangeID exchange ONCHAINID
   *  @param _investorID ONCHAINID to be checked
   *  returns current monthly counter of `_investorID` on `exchangeID` exchange
   */
  function getMonthlyCounter(
    address _compliance,
    address _exchangeID,
    address _investorID
  ) public view returns (uint256) {
    uint256 nonce = getNonce(_compliance);
    return
      (_exchangeCounters[_compliance][nonce][_exchangeID][_investorID])
        .monthlyCount;
  }

  /**
   *  @dev getter for `exchangeCounters` variable on the timer parameter of the ExchangeTransferCounter struct
   *  @param _compliance the Compliance smart contract to be checked
   *  @param _exchangeID exchange ONCHAINID
   *  @param _investorID ONCHAINID to be checked
   *  returns current timer of `_investorID` on `exchangeID` exchange
   */
  function getMonthlyTimer(
    address _compliance,
    address _exchangeID,
    address _investorID
  ) public view returns (uint256) {
    uint256 nonce = getNonce(_compliance);
    return
      (_exchangeCounters[_compliance][nonce][_exchangeID][_investorID])
        .monthlyTimer;
  }

  /**
   *  @dev getter for `exchangeMonthlyLimit` variable
   *  @param _compliance the Compliance smart contract to be checked
   *  @param _exchangeID exchange ONCHAINID
   *  returns the monthly limit set for that exchange
   */
  function getExchangeMonthlyLimit(
    address _compliance,
    address _exchangeID
  ) public view returns (uint256) {
    uint256 nonce = getNonce(_compliance);
    return _exchangeMonthlyLimit[_compliance][nonce][_exchangeID];
  }

  /**
   *  @dev See {IModule-name}.
   */
  function name() public pure returns (string memory _name) {
    return "ExchangeMonthlyLimitsModule";
  }

  /**
   *  @dev Checks if monthly cooldown must be reset, then check if _value sent has been exceeded,
   *  if not increases user's OnchainID counters.
   *  @param _compliance the Compliance smart contract address
   *  @param _nonce nonce of the module
   *  @param _exchangeID ONCHAINID of the exchange
   *  @param _investorID address on which counters will be increased
   *  @param _value, value of transaction)to be increased
   *  internal function, can be called only from the functions of the Compliance smart contract
   */
  function _increaseExchangeCounters(
    address _compliance,
    uint256 _nonce,
    address _exchangeID,
    address _investorID,
    uint256 _value
  ) internal {
    _resetExchangeMonthlyCooldown(
      _compliance,
      _nonce,
      _exchangeID,
      _investorID
    );
    _exchangeCounters[_compliance][_nonce][_exchangeID][_investorID]
      .monthlyCount += _value;
  }

  /**
   *  @dev resets cooldown for the month if cooldown has reached the time limit of 30days
   *  @param _compliance the Compliance smart contract address
   *  @param _nonce nonce of the module
   *  @param _exchangeID ONCHAINID of the exchange
   *  @param _investorID ONCHAINID to reset
   *  internal function, can be called only from the functions of the Compliance smart contract
   */
  function _resetExchangeMonthlyCooldown(
    address _compliance,
    uint256 _nonce,
    address _exchangeID,
    address _investorID
  ) internal {
    if (_isExchangeMonthFinished(_compliance, _exchangeID, _investorID)) {
      ExchangeTransferCounter storage counter = _exchangeCounters[_compliance][
        _nonce
      ][_exchangeID][_investorID];
      counter.monthlyTimer = block.timestamp + 30 days;
      counter.monthlyCount = 0;
    }
  }

  /**
   *  @dev checks if the month has finished since the cooldown has been triggered for this identity
   *  @param _compliance the Compliance smart contract to be checked
   *  @param _exchangeID ONCHAINID of the exchange
   *  @param _investorID ONCHAINID to be checked
   *  internal function, can be called only from the functions of the Compliance smart contract
   */
  function _isExchangeMonthFinished(
    address _compliance,
    address _exchangeID,
    address _investorID
  ) internal view returns (bool) {
    return
      getMonthlyTimer(_compliance, _exchangeID, _investorID) <= block.timestamp;
  }

  /**
   *  @dev checks if the given user address is an agent of token
   *  @param compliance the Compliance smart contract to be checked
   *  @param _userAddress ONCHAIN identity of the user
   *  internal function, can be called only from the functions of the Compliance smart contract
   */
  function _isTokenAgent(
    address compliance,
    address _userAddress
  ) internal view returns (bool) {
    return
      AgentRole(IModularCompliance(compliance).getTokenBound()).isAgent(
        _userAddress
      );
  }

  /**
   *  @dev Returns the ONCHAINID (Identity) of the _userAddress
   *  @param _userAddress Address of the wallet
   *  internal function, can be called only from the functions of the Compliance smart contract
   */
  function _getIdentity(
    address _compliance,
    address _userAddress
  ) internal view returns (address) {
    return
      address(
        IToken(IModularCompliance(_compliance).getTokenBound())
          .identityRegistry()
          .identity(_userAddress)
      );
  }
}
