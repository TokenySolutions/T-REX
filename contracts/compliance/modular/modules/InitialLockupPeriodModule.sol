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

import "./AbstractModuleUpgradeable.sol";

error InsufficientBalanceTokensLocked(address user, uint256 value, uint256 availableAmount);

event LockupPeriodSet(address indexed compliance, uint256 lockupPeriod);


contract InitialLockupPeriodModule is AbstractModuleUpgradeable {

    struct LockedTokens {
        uint256 amount;
        uint256 releaseTimestamp;
    }

    mapping(address compliance => uint256 lockupPeriod) private _lockupPeriods;
    mapping(address compliance => mapping(address user => LockedTokens[] lockedTokens)) private _lockedTokens;

    /// @dev initializes the contract and sets the initial state.
    function initialize() external initializer {
        __AbstractModule_init();
    }

    /// @dev sets the lockup period for a compliance contract.
    /// @param _lockupPeriod the lockup period in seconds.
    function setLockupPeriod(uint256 _lockupPeriod) external onlyComplianceCall {
        _lockupPeriods[msg.sender] = _lockupPeriod;

        emit LockupPeriodSet(msg.sender, _lockupPeriod);
    }

    /// @inheritdoc IModule
    function moduleTransferAction(address _from, address /*_to*/, uint256 _value) external override onlyComplianceCall { 
        if (_from != address(0)) {
            // Check if the user has enough unlocked tokens to transfer
            uint256 availableAmount = _calculateAvailableAmount(msg.sender, _from);
            if (_value > availableAmount) {
                revert InsufficientBalanceTokensLocked(_from, _value, availableAmount);
            }
        }
    }

    /// @inheritdoc IModule
    function moduleMintAction(address _to, uint256 _value) external override onlyComplianceCall {
        _lockedTokens[msg.sender][_to].push(
            LockedTokens({
                amount: _value,
                releaseTimestamp: block.timestamp + _lockupPeriods[msg.sender]
            })
        );
    }

    /// @inheritdoc IModule
    // solhint-disable-next-line no-empty-blocks
    function moduleBurnAction(address _from, uint256 _value) external override onlyComplianceCall { }

    /// @inheritdoc IModule
    function moduleCheck(address _from, address /*_to*/, uint256 _value, address _compliance) external 
        view override returns (bool) {
        return _from == address(0) || _calculateAvailableAmount(_compliance, _from) >= _value;
    }

    /// @inheritdoc IModule
    function canComplianceBind(address /*_compliance*/) external view override returns (bool) {
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

    /// @dev calculates the available amount of unlocked tokens for a user.
    /// @param _compliance the address of the compliance contract.
    /// @param _user the address of the user.
    /// @return _availableAmount the available amount of unlocked tokens.
    function _calculateAvailableAmount(address _compliance, address _user) internal view returns (uint256 _availableAmount) {
        uint256 periodsLength = _lockedTokens[_compliance][_user].length;
        for (uint256 i; i < periodsLength; i++) {
            if (_lockedTokens[_compliance][_user][i].releaseTimestamp <= block.timestamp) {
                _availableAmount += _lockedTokens[_compliance][_user][i].amount;
            }
        }
    }

}