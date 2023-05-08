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

import "../BasicCompliance.sol";

/**
 *  this feature allows to put a maximum balance for an investor
 */
abstract contract MaxBalance is BasicCompliance {

    /// maximum balance per investor ONCHAINID
    uint256 public maxBalance;

    /// mapping of balances per ONCHAINID
    // solhint-disable-next-line var-name-mixedcase
    mapping (address => uint256) public IDBalance;

    /**
     *  this event is emitted when the max balance has been set.
     *  `_maxBalance` is the max amount of tokens that a user can hold .
     */
    event MaxBalanceSet(uint256 _maxBalance);

    /**
     *  @dev sets max balance limit
     *  @param _max max amount of tokens owned by an individual
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `MaxBalanceSet` event
     */
    function setMaxBalance(uint256 _max) external onlyOwner {
        maxBalance = _max;
        emit MaxBalanceSet(_max);
    }

    /**
    *  @dev check on the compliance status of a transaction.
    *  If the check returns TRUE, the transfer is allowed to be executed, if the check returns FALSE, the compliance
    *  feature will block the transfer execution
    *  The check will verify if the transfer doesn't push the ONCHAINID-based balance of `_to` above
    *  the authorized threshold fixed by maxBalance
    *  @param _to the address of the transfer receiver
    *  @param _value the amount of tokens that `_from` would send to `_to`
    */
    function complianceCheckOnMaxBalance (address /*_from*/, address _to, uint256 _value) public view returns (bool) {
        if (_value > maxBalance) {
            return false;
        }
        address _id = _getIdentity(_to);
        if ((IDBalance[_id] + _value) > maxBalance) {
            return false;
        }
        return true;
    }

    /**
    *  @dev state update of the compliance feature post-transfer.
    *  updates the ONCHAINID-based balance of `_to` and `_from` post-transfer
    *  revert if post-transfer balance of `_to` is higher than max balance
    *  @param _from the address of the transfer sender
    *  @param _to the address of the transfer receiver
    *  @param _value the amount of tokens that `_from` sent to `_to`
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _transferActionOnMaxBalance(address _from, address _to, uint256 _value) internal {
        address _idFrom = _getIdentity(_from);
        address _idTo = _getIdentity(_to);
        IDBalance[_idTo] += _value;
        IDBalance[_idFrom] -= _value;
        require (IDBalance[_idTo] <= maxBalance, "post-transfer balance too high");
    }

    /**
    *  @dev state update of the compliance feature post-minting.
    *  updates the ONCHAINID-based balance of `_to` post-minting
    *  revert if post-minting balance of `_to` is higher than max balance
    *  @param _to the address of the minting beneficiary
    *  @param _value the amount of tokens minted on `_to` wallet
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _creationActionOnMaxBalance(address _to, uint256 _value) internal {
        address _idTo = _getIdentity(_to);
        IDBalance[_idTo] += _value;
        require (IDBalance[_idTo] <= maxBalance, "post-minting balance too high");
    }

    /**
    *  @dev state update of the compliance feature post-burning.
    *  updates the ONCHAINID-based balance of `_from` post-burning
    *  @param _from the wallet address on which tokens burnt
    *  @param _value the amount of tokens burnt from `_from` wallet
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _destructionActionOnMaxBalance(address _from, uint256 _value) internal {
        address _idFrom = _getIdentity(_from);
        IDBalance[_idFrom] -= _value;
    }
}
