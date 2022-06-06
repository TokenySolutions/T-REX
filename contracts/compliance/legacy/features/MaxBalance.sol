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

/**
 *  this feature allows to put a maximum percentage of the total supply
 *  that can be held by a single individual
 */
abstract contract MaxBalance is BasicCompliance {

    /**
     *  this event is emitted when the max balance percentage has been set.
     *  `_percentage` is the max percentage of tokens that a user can .
     */
    event MaxBalancePercentSet(uint256 _percentage);
    event MaxSupplySet(uint256 _maxSupply);

    uint256 public maxSupply;
    uint256 public maxBalancePercent;
    mapping (address => uint256) private IDBalance;

    /**
     *  @dev sets max balance limit (in percent)
     *  Max balance percent has to be between 1 and 100
     *  @param _max max percentage of tokens owned by an individual
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `MaxBalanceSet` event
     */
    function setMaxBalance(uint256 _max) external onlyOwner {
        require(0< _max && _max <= 100, 'max percentage has to be between 1 and 100' );
        maxBalancePercent = _max;
        emit MaxBalancePercentSet(_max);
    }

    function setMaxSupply(uint256 _maxSupply) external onlyOwner {
        maxSupply = _maxSupply;
        emit MaxSupplySet(_maxSupply);
}

    function isBalanceTooMuch(address _wallet, uint256 _amount) public view returns (bool){
        uint256 maxUserBalance = (maxSupply * maxBalancePercent) / 100;
        address _id = _getIdentity(_wallet);
        if (_amount > maxUserBalance) {
            return true;
        }
        if ((IDBalance[_id] + _amount) > maxUserBalance) {
            return true;
        }
        return false;
}


    function transferActionOnMaxBalance(address _from, address _to, uint256 _value) internal {
        uint256 maxUserBalance = (maxSupply * maxBalancePercent) / 100;
        address _idFrom = _getIdentity(_from);
        address _idTo = _getIdentity(_to);
        IDBalance[_idTo] += _value;
        IDBalance[_idFrom] -= _value;
        require (IDBalance[_idTo] <= maxUserBalance, 'post-transfer balance too high');

    }

    function creationActionOnMaxBalance(address _to, uint256 _value) internal {
        uint256 maxUserBalance = (maxSupply * maxBalancePercent) / 100;
        address _idTo = _getIdentity(_to);
        IDBalance[_idTo] += _value;
        require (IDBalance[_idTo] <= maxUserBalance, 'post-transfer balance too high');
    }

    function destructionActionOnMaxBalance(address _from, uint256 _value) internal {
        address _idFrom = _getIdentity(_from);
        IDBalance[_idFrom] -= _value;
    }


    function complianceCheckOnMaxBalance (address /*_from*/, address _to, uint256 _value)
    internal view returns (bool) {
        if (isBalanceTooMuch(_to, _value)) {
            return false;
        }
        return true;
    }
}
