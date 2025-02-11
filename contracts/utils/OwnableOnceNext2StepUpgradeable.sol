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

pragma solidity 0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import { OwnableUnauthorizedAccount} from "../errors/CommonErrors.sol";

/// @dev Emitted when a new owner is set.
/// @param previousOwner The address of the previous owner.
/// @param newOwner The address of the new owner.
event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);


contract OwnableOnceNext2StepUpgradeable is Initializable, ContextUpgradeable {

    /// @custom:storage-location erc7201:tokeny.storage.OwnableOnceNext2StepUpgradeable
    struct Ownable2StepsStorage {
        address pendingOwner;
        bool firstCall;
    }
    
    bytes32 private constant _STORAGE_SLOT = keccak256("tokeny.storage.OwnableOnceNext2StepUpgradeable");

    /// @dev Preserve the owner address before an upgrade.
    address private _owner;
 
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /// @dev Transfers ownership of the contract to a new address.
    /// On a first call, the ownership is transferred to the new owner.
    /// On subsequents calls, the ownership is transferred in 2 steps.
    /// @param newOwner The address of the new owner.
    function transferOwnership(address newOwner) public onlyOwner {
        Ownable2StepsStorage storage s = _getStorage();
        if (s.firstCall) {
            s.firstCall = false;
            _transferOwnership(newOwner);
        }
        else {
            _getStorage().pendingOwner = newOwner;

            emit OwnershipTransferStarted(_owner, newOwner);
        }
    }

    /// * @dev The new owner accepts the ownership transfer.
    function acceptOwnership() public virtual {
        if (_getStorage().pendingOwner != msg.sender) {
            revert OwnableUnauthorizedAccount(msg.sender);
        }
        _transferOwnership(msg.sender);
    }

    /// @dev Returns the address of the owner.
    /// @return The address of the owner.
    function owner() public view virtual returns (address) {
        return _owner;
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Ownable_init() internal onlyInitializing {
        _transferOwnership(msg.sender);
    }

    /// @dev Transfers ownership of the contract to a new address.
    /// @param newOwner The address of the new owner.
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;

        emit Ownable.OwnershipTransferred(oldOwner, newOwner);
    }

    /// @dev Checks if the caller is the owner.
    function _checkOwner() internal view virtual {
        require(_owner == msg.sender, OwnableUnauthorizedAccount(msg.sender));
    }


    function _getStorage() internal pure returns (Ownable2StepsStorage storage s) {
        bytes32 position = _STORAGE_SLOT;
        assembly {
            s.slot := position
        }
    }

}