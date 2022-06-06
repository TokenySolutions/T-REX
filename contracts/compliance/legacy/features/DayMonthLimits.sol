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
 *     T-REX is a suite of smart contracts developed by Tokeny to manage and transfer financial assets on the ethereum blockchain
 *
 *     Copyright (C) 2021, Tokeny sàrl.
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

pragma solidity ^0.8.0;

import '../BasicCompliance.sol';

abstract contract DayMonthLimits is BasicCompliance {

    /**
     *  this event is emitted whenever a DailyLimit has been updated.
     *  the event is emitted by 'setDailyLimit' and by Compliance's constructor.
     *  `_newDailyLimit` is the amount Limit of tokens to be transferred daily.
     */
    event DailyLimitUpdated(uint _newDailyLimit);

    /**
     *  this event is emitted whenever a MonthlyLimit has been updated.
     *  the event is emitted by 'setMonthlyLimit' and by Compliance's constructor.
     *  `_newMonthlyLimit` is the amount Limit of tokens to be transferred monthly.
     */
    event MonthlyLimitUpdated(uint _newMonthlyLimit);

    /// Getter for Tokens dailyLimit
    uint256 public dailyLimit;

    /// Getter for Tokens monthlyLimit
    uint256 public monthlyLimit;

    /// Struct of transfer Counters
    struct TransferCounter {
        uint256 dailyCount;
        uint256 monthlyCount;
        uint256 dailyTimer;
        uint256 monthlyTimer;
    }

    /// Mapping for users Counters
    mapping(address => TransferCounter) public usersCounters;

    /**
    *  @dev checks if the day has finished since the cooldown has been triggered for this identity
    *  @param _identity ONCHAINID to be checked
    */
    function _isDayFinished(address _identity) internal view returns (bool) {
        return (usersCounters[_identity].dailyTimer <= block.timestamp);
    }

    /**
    *  @dev checks if the month has finished since the cooldown has been triggered for this identity
    *  @param _identity ONCHAINID to be checked
    */
    function _isMonthFinished(address _identity) internal view returns (bool) {
        return (usersCounters[_identity].monthlyTimer <= block.timestamp);
    }

    /**
    *  @dev resets cooldown for the day if cooldown has reached time limit of 1 day
    *  @param _identity ONCHAINID to be checked
    */
    function _resetDailyCooldown(address _identity) internal {
        if (_isDayFinished(_identity)) {
            usersCounters[_identity].dailyTimer = block.timestamp + 1 days;
            usersCounters[_identity].dailyCount = 0;
        }
    }

    /**
    *  @dev resets cooldown for the month if cooldown has reached the time limit of 30days
    *  @param _identity ONCHAINID to be checked
    */
    function _resetMonthlyCooldown(address _identity) internal {
        if (_isMonthFinished(_identity)) {
            usersCounters[_identity].monthlyTimer = block.timestamp + 30 days;
            usersCounters[_identity].monthlyCount = 0;
        }
    }

    /**
    *  @dev Checks if daily and/or monthly cooldown must be reset, then check if _value sent has been exceeded,
    *  if not increases user's OnchainID counters.
    *  @param _userAddress, address on which counters will be increased
    *  @param _value, value of transaction)to be increased
    */
    function _increaseCounters(address _userAddress, uint256 _value) internal {
        address identity = _getIdentity(_userAddress);
        _resetDailyCooldown(identity);
        _resetMonthlyCooldown(identity);
        if ((usersCounters[identity].dailyCount + _value) <= dailyLimit) {
            usersCounters[identity].dailyCount += _value;
        }
        if ((usersCounters[identity].monthlyCount + _value) <= monthlyLimit) {
            usersCounters[identity].monthlyCount += _value;
        }
    }

    /**
    *  @dev Set the limit of tokens allowed to be transferred daily.
    *  @param _newDailyLimit The new daily limit of tokens
    */
    function setDailyLimit(uint256 _newDailyLimit) external onlyOwner {
        dailyLimit = _newDailyLimit;
        emit DailyLimitUpdated(_newDailyLimit);
    }

    /**
     *  @dev Set the limit of tokens allowed to be transferred monthly.
     *  param _newMonthlyLimit The new monthly limit of tokens
     */
    function setMonthlyLimit(uint256 _newMonthlyLimit) external onlyOwner {
        monthlyLimit = _newMonthlyLimit;
        emit MonthlyLimitUpdated(_newMonthlyLimit);
    }

    function transferActionOnDayMonthLimits(address _from, address /*_to*/, uint256 _value) internal {
        _increaseCounters(_from, _value);
    }

    function creationActionOnDayMonthLimits(address _to, uint256 _value) internal {}

    function destructionActionOnDayMonthLimits(address _from, uint256 _value) internal {}


    function complianceCheckOnDayMonthLimits(address _from, address /*_to*/, uint256 _value) internal view returns (bool) {
        address senderIdentity = _getIdentity(_from);
        if (!isTokenAgent(_from)) {
            if (_value > dailyLimit) {
                return false;
            }
            if (!_isDayFinished(senderIdentity) &&
            ((usersCounters[senderIdentity].dailyCount + _value > dailyLimit)
            || (usersCounters[senderIdentity].monthlyCount + _value > monthlyLimit))) {
                return false;
            }
            if (_isDayFinished(senderIdentity) && _value + usersCounters[senderIdentity].monthlyCount > monthlyLimit) {
                return(_isMonthFinished(senderIdentity));
            }
        }
        return true;
    }

}
