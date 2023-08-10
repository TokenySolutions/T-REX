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

pragma solidity 0.8.17;

import "../IModularCompliance.sol";
import "../../../token/IToken.sol";
import "./AbstractModule.sol";

contract TimeTransfersLimitsModule is AbstractModule {
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
    mapping(address => mapping(uint32 => IndexLimit)) public limitValues;

    /// Mapping for limit time frames
    mapping(address => Limit[]) public transferLimits;

    /// Mapping for users Counters
    mapping(address => mapping(address => mapping(uint32 => TransferCounter))) public usersCounters;

    event TimeTransferLimitUpdated(address indexed compliance, uint32 limitTime, uint256 limitValue);

    error LimitsArraySizeExceeded(address compliance, uint arraySize);

    /**
    *  @dev Set the limit of tokens allowed to be transferred in given time frame.
    *  @param _limit The limit time and value
    *  Only the owner of the Compliance smart contract can call this function
    */
    function setTimeTransferLimit(Limit calldata _limit) external onlyComplianceCall {
        if (!limitValues[msg.sender][_limit.limitTime].attributedLimit && transferLimits[msg.sender].length >= 4) {
            revert LimitsArraySizeExceeded(msg.sender, transferLimits[msg.sender].length);
        }

        if (!limitValues[msg.sender][_limit.limitTime].attributedLimit && transferLimits[msg.sender].length < 4) {
            transferLimits[msg.sender].push(_limit);
            limitValues[msg.sender][_limit.limitTime] = IndexLimit(true, uint8(transferLimits[msg.sender].length) - 1);
        } else {
            transferLimits[msg.sender][limitValues[msg.sender][_limit.limitTime].limitIndex] = _limit;
        }

        emit TimeTransferLimitUpdated(msg.sender, _limit.limitTime, _limit.limitValue);
    }

    /**
     *  @dev See {IModule-moduleTransferAction}.
     */
    function moduleTransferAction(address _from, address /*_to*/, uint256 _value) external override onlyComplianceCall {
        _increaseCounters(msg.sender, _from, _value);
    }

    /**
     *  @dev See {IModule-moduleMintAction}.
     */
    // solhint-disable-next-line no-empty-blocks
    function moduleMintAction(address _to, uint256 _value) external override onlyComplianceCall {}

    /**
     *  @dev See {IModule-moduleBurnAction}.
     */
    // solhint-disable-next-line no-empty-blocks
    function moduleBurnAction(address _from, uint256 _value) external override onlyComplianceCall {}

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
        for (uint256 i = 0; i < transferLimits[_compliance].length; i++) {
            if (_value > transferLimits[_compliance][i].limitValue) {
                return false;
            }

            if (!_isUserCounterFinished(_compliance, senderIdentity, transferLimits[_compliance][i].limitTime)
                && usersCounters[_compliance][senderIdentity][transferLimits[_compliance][i].limitTime].value + _value
                    > transferLimits[_compliance][i].limitValue) {
                return false;
            }
        }

        return true;
    }

    /**
    *  @dev getter for `transferLimits` variable
    *  @param _compliance the Compliance smart contract to be checked
    *  returns array of Limits
    */
    function getTimeTransferLimits(address _compliance) external view returns (Limit[] memory limits) {
        return transferLimits[_compliance];
    }

    /**
    *  @dev Checks if the cooldown must be reset, then increases user's OnchainID counters,
    *  @param _compliance the Compliance smart contract address
    *  @param _userAddress user wallet address
    *  @param _value, value of transaction)to be increased
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _increaseCounters(address _compliance, address _userAddress, uint256 _value) internal {
        address identity = _getIdentity(_compliance, _userAddress);
        for (uint256 i = 0; i < transferLimits[_compliance].length; i++) {
            _resetUserCounter(_compliance, identity, transferLimits[_compliance][i].limitTime);
            usersCounters[_compliance][identity][transferLimits[_compliance][i].limitTime].value += _value;
        }
    }

    /**
    *  @dev resets cooldown for the user if cooldown has reached the time limit
    *  @param _compliance the Compliance smart contract address
    *  @param _identity ONCHAINID of user wallet
    *  @param _limitTime limit time frame
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _resetUserCounter(address _compliance, address _identity, uint32 _limitTime) internal {
        if (_isUserCounterFinished(_compliance, _identity, _limitTime)) {
            usersCounters[_compliance][_identity][_limitTime].timer = block.timestamp + _limitTime;
            usersCounters[_compliance][_identity][_limitTime].value = 0;
        }
    }

    /**
    *  @dev checks if the counter time frame has finished since the cooldown has been triggered for this identity
    *  @param _compliance the Compliance smart contract to be checked
    *  @param _identity ONCHAINID of user wallet
    *  @param _limitTime limit time frame
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _isUserCounterFinished(address _compliance, address _identity, uint32 _limitTime) internal view returns (bool) {
        return usersCounters[_compliance][_identity][_limitTime].timer <= block.timestamp;
    }

}
