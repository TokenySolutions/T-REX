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
error InsufficientBalanceTokensLocked(address user, uint256 value, uint256 availableAmount);

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

    mapping(address compliance => uint256 lockupPeriod) private _lockupPeriods;
    mapping(address compliance => mapping(address user => LockedTokens[])) private _lockedTokens;

    /// @dev initializes the contract and sets the initial state.
    function initialize() external initializer {
        __AbstractModule_init();
    }

    /// @dev sets the lockup period for a compliance contract.
    /// @param _lockupPeriodInDays the lockup period in days.
    function setLockupPeriod(uint256 _lockupPeriodInDays) external onlyComplianceCall {
        _lockupPeriods[msg.sender] = _lockupPeriodInDays * 1 days;

        emit LockupPeriodSet(msg.sender, _lockupPeriodInDays);
    }

    /// @inheritdoc IModule
    function moduleTransferAction(address _from, address /*_to*/, uint256 _value) external override onlyComplianceCall {
        if (_from == address(0)) {
            return;
        }

        (uint256 lockedAmount, uint256 unlockedAmount) = _calculateLockedAmount(msg.sender, _from);
        uint256 freeAmount = 
            IToken(IModularCompliance(msg.sender).getTokenBound()).balanceOf(_from) - lockedAmount - unlockedAmount;
        if (_value > freeAmount) {
            _updateLockedTokens(_from, _value - freeAmount);
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
    function moduleBurnAction(address _from, uint256 _value) external override onlyComplianceCall {
        (uint256 lockedAmount, uint256 unlockedAmount) = _calculateLockedAmount(msg.sender, _from);
        uint256 previousBalance = IToken(IModularCompliance(msg.sender).getTokenBound()).balanceOf(_from) + _value;

        require(
            (previousBalance - lockedAmount) >= _value, 
            InsufficientBalanceTokensLocked(_from, _value, previousBalance - lockedAmount)
        );

        uint256 freeAmount = previousBalance - lockedAmount - unlockedAmount;
        if (_value > freeAmount) {
            _updateLockedTokens(_from, _value - freeAmount);
        }
    }

    /// @inheritdoc IModule
    function moduleCheck(address _from, address /*_to*/, uint256 _value, address _compliance) external 
        view override returns (bool) {
        (uint256 lockedAmount, ) = _calculateLockedAmount(_compliance, _from);

        return _from == address(0) 
            || IToken(IModularCompliance(_compliance).getTokenBound()).balanceOf(_from) - lockedAmount >= _value;
    }

    /// @inheritdoc IModule
    function canComplianceBind(address /*_compliance*/) external pure override returns (bool) {
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
        LockedTokens[] storage lockedTokens = _lockedTokens[msg.sender][_user];
        for (uint256 i; _value > 0 && i < lockedTokens.length; ) {
            if (lockedTokens[i].releaseTimestamp <= block.timestamp) {
                if (_value >= lockedTokens[i].amount) {
                    _value -= lockedTokens[i].amount;
                    
                    // Remove entry
                    if (i == lockedTokens.length - 1) {
                        lockedTokens.pop();
                        break;
                    } else {
                        lockedTokens[i] = lockedTokens[lockedTokens.length - 1];
                        lockedTokens.pop();
                    }
                } else {
                    lockedTokens[i].amount -= _value;
                    break;
                }
            }
            else {
                i++;
            }
        }
    }

    /// @dev calculates the locked amount of tokens for a user.
    /// @param _compliance the address of the compliance contract.
    /// @param _user the address of the user.
    /// @return _lockedAmount the locked amount of tokens.
    /// @return _unlockedAmount the unlocked amount of tokens.
    function _calculateLockedAmount(address _compliance, address _user) internal view 
        returns (uint256 _lockedAmount, uint256 _unlockedAmount) {
        uint256 periodsLength = _lockedTokens[_compliance][_user].length;
        for (uint256 i; i < periodsLength; i++) {
            if (_lockedTokens[_compliance][_user][i].releaseTimestamp > block.timestamp) {
                _lockedAmount += _lockedTokens[_compliance][_user][i].amount;
            }
            else {
                _unlockedAmount += _lockedTokens[_compliance][_user][i].amount;
            }
        }
    }

}