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
import "../../../errors/InvalidArgumentErrors.sol";

/// Events

/// @dev This event is emitted whenever a transfer limit is updated for the given compliance address and limit time.
/// @param _compliance is the compliance contract address.
/// @param _limitTime is the period of time of the limit.
/// @param _limitValue is the new limit value for the given limit time.
event TimeTransferLimitUpdated(
  address indexed _compliance,
  uint32 _limitTime,
  uint256 _limitValue
);

contract TimeTransfersLimitsModule is AbstractModuleUpgradeable {
  /// Struct of transfer Counters
  struct TransferCounter {
    uint256 value;
    uint256 timer;
  }

  struct Limit {
    uint32 limitTime;
    uint256 limitValue;
  }

  struct IndexLimit {
    bool attributedLimit;
    uint8 limitIndex;
  }

  // Mapping for limit time indexes
  mapping(address compliance => mapping(uint256 nonce => mapping(uint32 limitTime => IndexLimit)))
    public limitValues;

  /// Mapping for limit time frames
  mapping(address compliance => mapping(uint256 nonce => Limit[]))
    public transferLimits;

  /// Mapping for users Counters
  mapping(address compliance => mapping(uint256 nonce => mapping(address identity => mapping(uint32 limitTime => TransferCounter))))
    internal _usersCounters;

  /**
   * @dev initializes the contract and sets the initial state.
   * @notice This function should only be called once during the contract deployment.
   */
  function initialize() external initializer {
    __AbstractModule_init();
  }

  /**
   *  @dev Sets the limit of tokens allowed to be transferred in the given time frame.
   *  @param _limit The limit time and value
   *  Only the owner of the Compliance smart contract can call this function
   */
  function setTimeTransferLimit(
    Limit calldata _limit
  ) external onlyComplianceCall {
    uint256 nonce = getNonce(msg.sender);
    bool limitIsAttributed = limitValues[msg.sender][nonce][_limit.limitTime]
      .attributedLimit;
    uint8 limitCount = uint8(transferLimits[msg.sender][nonce].length);
    require(
      limitIsAttributed || limitCount < 4,
      LimitsArraySizeExceeded(msg.sender, limitCount)
    );

    if (!limitIsAttributed) {
      transferLimits[msg.sender][nonce].push(_limit);
      limitValues[msg.sender][nonce][_limit.limitTime] = IndexLimit(
        true,
        limitCount
      );
    } else {
      transferLimits[msg.sender][nonce][
        limitValues[msg.sender][nonce][_limit.limitTime].limitIndex
      ] = _limit;
    }

    emit TimeTransferLimitUpdated(
      msg.sender,
      _limit.limitTime,
      _limit.limitValue
    );
  }

  /**
   *  @dev See {IModule-moduleTransferAction}.
   */
  function moduleTransferAction(
    address _from,
    address /*_to*/,
    uint256 _value
  ) external override onlyComplianceCall {
    _increaseCounters(msg.sender, _from, _value);
  }

  /**
   *  @dev See {IModule-moduleMintAction}.
   */
  // solhint-disable-next-line no-empty-blocks
  function moduleMintAction(
    address _to,
    uint256 _value
  ) external override onlyComplianceCall {}

  /**
   *  @dev See {IModule-moduleBurnAction}.
   */
  // solhint-disable-next-line no-empty-blocks
  function moduleBurnAction(
    address _from,
    uint256 _value
  ) external override onlyComplianceCall {}

  /**
   *  @dev See {IModule-moduleCheck}.
   */
  function moduleCheck(
    address _from,
    address /*_to*/,
    uint256 _value,
    address _compliance
  ) external view override returns (bool) {
    if (_from == address(0)) {
      return true;
    }

    if (_isTokenAgent(_compliance, _from)) {
      return true;
    }

    address senderIdentity = _getIdentity(_compliance, _from);
    uint256 nonce = getNonce(_compliance);
    for (uint256 i = 0; i < transferLimits[_compliance][nonce].length; i++) {
      if (_value > transferLimits[_compliance][nonce][i].limitValue) {
        return false;
      }

      if (
        !_isUserCounterFinished(
          _compliance,
          senderIdentity,
          transferLimits[_compliance][nonce][i].limitTime
        ) &&
        _usersCounters[_compliance][nonce][senderIdentity][
          transferLimits[_compliance][nonce][i].limitTime
        ].value +
          _value >
          transferLimits[_compliance][nonce][i].limitValue
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * @dev Getter for the users counters
   * @param _compliance The compliance contract address
   * @param _identity The identity of the user
   * @param _limitTime The limit time frame
   * @return The counter for the given user and limit time frame
   */
  function getUsersCounters(
    address _compliance,
    address _identity,
    uint32 _limitTime
  ) external view returns (TransferCounter memory) {
    uint256 nonce = getNonce(_compliance);
    return _usersCounters[_compliance][nonce][_identity][_limitTime];
  }

  /**
   *  @dev getter for `transferLimits` variable
   *  @param _compliance the Compliance smart contract to be checked
   *  returns array of Limits
   */
  function getTimeTransferLimits(
    address _compliance
  ) external view returns (Limit[] memory limits) {
    uint256 nonce = getNonce(_compliance);
    return transferLimits[_compliance][nonce];
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
   *  @dev See {IModule-name}.
   */
  function name() public pure returns (string memory _name) {
    return "TimeTransfersLimitsModule";
  }

  /**
   *  @dev Checks if the cooldown must be reset, then increases user's OnchainID counters,
   *  @param _compliance the Compliance smart contract address
   *  @param _userAddress user wallet address
   *  @param _value, value of transaction)to be increased
   *  internal function, can be called only from the functions of the Compliance smart contract
   */
  function _increaseCounters(
    address _compliance,
    address _userAddress,
    uint256 _value
  ) internal {
    address identity = _getIdentity(_compliance, _userAddress);
    uint256 nonce = getNonce(_compliance);
    for (uint256 i = 0; i < transferLimits[_compliance][nonce].length; i++) {
      _resetUserCounter(
        _compliance,
        identity,
        transferLimits[_compliance][nonce][i].limitTime
      );
      _usersCounters[_compliance][nonce][identity][
        transferLimits[_compliance][nonce][i].limitTime
      ].value += _value;
    }
  }

  /**
   *  @dev resets cooldown for the user if cooldown has reached the time limit
   *  @param _compliance the Compliance smart contract address
   *  @param _identity ONCHAINID of user wallet
   *  @param _limitTime limit time frame
   *  internal function, can be called only from the functions of the Compliance smart contract
   */
  function _resetUserCounter(
    address _compliance,
    address _identity,
    uint32 _limitTime
  ) internal {
    if (_isUserCounterFinished(_compliance, _identity, _limitTime)) {
      uint256 nonce = getNonce(_compliance);
      TransferCounter storage counter = _usersCounters[_compliance][nonce][
        _identity
      ][_limitTime];
      counter.timer = block.timestamp + _limitTime;
      counter.value = 0;
    }
  }

  /**
   *  @dev checks if the counter time frame has finished since the cooldown has been triggered for this identity
   *  @param _compliance the Compliance smart contract to be checked
   *  @param _identity ONCHAINID of user wallet
   *  @param _limitTime limit time frame
   *  internal function, can be called only from the functions of the Compliance smart contract
   */
  function _isUserCounterFinished(
    address _compliance,
    address _identity,
    uint32 _limitTime
  ) internal view returns (bool) {
    uint256 nonce = getNonce(_compliance);
    return
      _usersCounters[_compliance][nonce][_identity][_limitTime].timer <=
      block.timestamp;
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
}
