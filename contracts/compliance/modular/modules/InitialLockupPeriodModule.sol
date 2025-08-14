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
import "./AbstractModuleUpgradeable.sol";

/// @dev Error emitted when the user has insufficient balance because of locked tokens.
/// @param user the address of the user.
/// @param value the value of the transfer.
/// @param availableAmount the available amount of unlocked tokens.
error InsufficientBalanceTokensLocked(
  address user,
  uint256 value,
  uint256 availableAmount
);

/// @notice Event emitted when the lockup period is set.
/// @param compliance the address of the compliance contract.
/// @param lockupPeriodInDays the lockup period in days.
event LockupPeriodSet(address indexed compliance, uint256 lockupPeriodInDays);

/// @title InitialLockupPeriodModule
/// @notice Enforces a lockup period for all investors whenever they receive tokens through primary emissions
contract InitialLockupPeriodModule is AbstractModuleUpgradeable {
  struct LockedTokens {
    uint256 amount;
    uint256 releaseTimestamp;
  }

  struct LockedDetails {
    uint256 totalLocked;
    LockedTokens[] lockedTokens;
  }

  mapping(address compliance => uint256 lockupPeriod) private _lockupPeriods;
  mapping(address compliance => mapping(address user => LockedDetails))
    private _lockedDetails;

  /// @dev initializes the contract and sets the initial state.
  function initialize() external initializer {
    __AbstractModule_init();
  }

  /// @dev sets the lockup period for a compliance contract.
  /// @param _lockupPeriodInDays the lockup period in days.
  function setLockupPeriod(
    uint256 _lockupPeriodInDays
  ) external onlyComplianceCall {
    _lockupPeriods[msg.sender] = _lockupPeriodInDays * 1 days;

    emit LockupPeriodSet(msg.sender, _lockupPeriodInDays);
  }

  /// @inheritdoc IModule
  function moduleTransferAction(
    address _from,
    address /*_to*/,
    uint256 _value
  ) external override onlyComplianceCall {
    if (_from == address(0)) {
      return;
    }

    LockedDetails storage lockedDetails = _lockedDetails[msg.sender][_from];
    uint256 freeAmount = IToken(IModularCompliance(msg.sender).getTokenBound())
      .balanceOf(_from) - lockedDetails.totalLocked;
    if (_value > freeAmount) {
      _updateLockedTokens(_from, _value - freeAmount);
    }
  }

  /// @inheritdoc IModule
  function moduleMintAction(
    address _to,
    uint256 _value
  ) external override onlyComplianceCall {
    LockedDetails storage lockedDetails = _lockedDetails[msg.sender][_to];
    lockedDetails.totalLocked += _value;
    lockedDetails.lockedTokens.push(
      LockedTokens({
        amount: _value,
        releaseTimestamp: block.timestamp + _lockupPeriods[msg.sender]
      })
    );
  }

  /// @inheritdoc IModule
  function moduleBurnAction(
    address _from,
    uint256 _value
  ) external override onlyComplianceCall {
    LockedDetails storage lockedDetails = _lockedDetails[msg.sender][_from];
    uint256 previousBalance = IToken(
      IModularCompliance(msg.sender).getTokenBound()
    ).balanceOf(_from) + _value;
    uint256 freeAmount = previousBalance - lockedDetails.totalLocked;

    if (freeAmount < _value) {
      // We need to calculate more accurately the free amount, as totalLocked can include now unlocked tokens.
      freeAmount = freeAmount + _calculateUnlockedAmount(lockedDetails);
    }

    require(
      freeAmount >= _value,
      InsufficientBalanceTokensLocked(_from, _value, freeAmount)
    );

    if (_value > freeAmount) {
      _updateLockedTokens(_from, _value - freeAmount);
    }
  }

  /// @inheritdoc IModule
  function moduleCheck(
    address _from,
    address /*_to*/,
    uint256 _value,
    address _compliance
  ) external view override returns (bool) {
    if (_from == address(0)) {
      return true;
    }

    LockedDetails storage lockedDetails = _lockedDetails[_compliance][_from];
    uint256 balance = IToken(IModularCompliance(_compliance).getTokenBound())
      .balanceOf(_from);

    return
      (balance - lockedDetails.totalLocked) >= _value ||
      (balance -
        lockedDetails.totalLocked +
        _calculateUnlockedAmount(lockedDetails)) >=
        _value;
  }

  /// @inheritdoc IModule
  function canComplianceBind(
    address /*_compliance*/
  ) external pure override returns (bool) {
    return true;
  }

  /// @inheritdoc IModule
  function isPlugAndPlay() external pure override returns (bool) {
    return true;
  }

  /// @inheritdoc IModule
  function name() external pure override returns (string memory _name) {
    return "InitialLockupPeriodModule";
  }

  /// @dev updates the locked tokens for a user.
  /// @param _user the address of the user.
  /// @param _value the amount of tokens to unlock.
  function _updateLockedTokens(address _user, uint256 _value) internal {
    LockedDetails storage lockedDetails = _lockedDetails[msg.sender][_user];
    for (uint256 i; _value > 0 && i < lockedDetails.lockedTokens.length; ) {
      if (lockedDetails.lockedTokens[i].releaseTimestamp <= block.timestamp) {
        if (_value >= lockedDetails.lockedTokens[i].amount) {
          _value -= lockedDetails.lockedTokens[i].amount;

          // Remove entry
          if (i == lockedDetails.lockedTokens.length - 1) {
            lockedDetails.lockedTokens.pop();
            break;
          } else {
            lockedDetails.lockedTokens[i] = lockedDetails.lockedTokens[
              lockedDetails.lockedTokens.length - 1
            ];
            lockedDetails.lockedTokens.pop();
          }
        } else {
          lockedDetails.lockedTokens[i].amount -= _value;
          break;
        }
      } else {
        i++;
      }
    }
  }

  /// @dev calculates the unlocked amount of tokens for a user.
  /// @param _details the locked details of the user.
  /// @return _unlockedAmount the unlocked amount of tokens.
  function _calculateUnlockedAmount(
    LockedDetails storage _details
  ) internal view returns (uint256 _unlockedAmount) {
    for (uint256 i; i < _details.lockedTokens.length; i++) {
      if (_details.lockedTokens[i].releaseTimestamp <= block.timestamp) {
        _unlockedAmount += _details.lockedTokens[i].amount;
      }
    }
  }
}
