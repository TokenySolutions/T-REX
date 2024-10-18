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

pragma solidity ^0.8.17;

import "./AbstractModuleUpgradeable.sol";

contract TransferRestrictModule is AbstractModuleUpgradeable {
    /// allowed user addresses mapping
    mapping(address => mapping(address => bool)) private _allowedUserAddresses;

    /**
     *  this event is emitted when a user is allowed for transfer
     *  `_compliance` is the compliance address.
     *  `_userAddress` is the allowed user address
     */
    event UserAllowed(address _compliance, address _userAddress);

    /**
     *  this event is emitted when a user is disallowed for transfer
     *  `_compliance` is the compliance address.
     *  `_userAddress` is the disallowed user address
     */
    event UserDisallowed(address _compliance, address _userAddress);

    /**
     * @dev initializes the contract and sets the initial state.
     * @notice This function should only be called once during the contract deployment.
     */
    function initialize() external initializer {
        __AbstractModule_init();
    }
    
    /**
     *  @dev allows a user address for transfer.
     *  @param _userAddress is the address of the user
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `UserAllowed` event
     */
    function allowUser(address _userAddress) external onlyComplianceCall {
        _allowedUserAddresses[msg.sender][_userAddress] = true;
        emit UserAllowed(msg.sender, _userAddress);
    }

    /**
     *  @dev allows multiple user addresses for transfer.
     *  @param _userAddresses is the array of user addresses
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `UserAllowed` event
     */
    function batchAllowUsers(address[] memory _userAddresses) external onlyComplianceCall {
        uint256 length = _userAddresses.length;
        for (uint256 i = 0; i < length; i++) {
            address _userAddress = _userAddresses[i];
            _allowedUserAddresses[msg.sender][_userAddress] = true;
            emit UserAllowed(msg.sender, _userAddress);
        }
    }

    /**
     *  @dev disallows a user address for transfer.
     *  @param _userAddress is the address of the user
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `UserDisallowed` event
     */
    function disallowUser(address _userAddress) external onlyComplianceCall {
        _allowedUserAddresses[msg.sender][_userAddress] = false;
        emit UserDisallowed(msg.sender, _userAddress);
    }

    /**
    *  @dev disallows multiple user addresses for transfer.
     *  @param _userAddresses is the array of user addresses
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `UserDisallowed` event
     */
    function batchDisallowUsers(address[] memory _userAddresses) external onlyComplianceCall {
        uint256 length = _userAddresses.length;
        for (uint256 i = 0; i < length; i++) {
            address _userAddress = _userAddresses[i];
            _allowedUserAddresses[msg.sender][_userAddress] = false;
            emit UserDisallowed(msg.sender, _userAddress);
        }
    }

    /**
     *  @dev See {IModule-moduleTransferAction}.
     *  no transfer action required in this module
     */
    // solhint-disable-next-line no-empty-blocks
    function moduleTransferAction(address _from, address _to, uint256 _value) external onlyComplianceCall {}

    /**
     *  @dev See {IModule-moduleMintAction}.
     *  no mint action required in this module
     */
    // solhint-disable-next-line no-empty-blocks
    function moduleMintAction(address _to, uint256 _value) external onlyComplianceCall {}

    /**
     *  @dev See {IModule-moduleBurnAction}.
     *  no burn action required in this module
     */
    // solhint-disable-next-line no-empty-blocks
    function moduleBurnAction(address _from, uint256 _value) external onlyComplianceCall {}

    /**
     *  @dev See {IModule-moduleCheck}.
     */
    function moduleCheck(
        address _from,
        address _to,
        uint256 /*_value*/,
        address _compliance
    ) external view override returns (bool) {
        if (_from == address(0) || _to == address(0)) {
            return true;
        }

        if(_allowedUserAddresses[_compliance][_from]) {
            return true;
        }

        return _allowedUserAddresses[_compliance][_to];
    }

    /**
    *  @dev getter for `_allowedUserAddresses` mapping
    *  @param _compliance the Compliance smart contract to be checked
    *  @param _userAddress the user address to be checked
    *  returns the true if user is allowed to transfer
    */
    function isUserAllowed(address _compliance, address _userAddress) external view returns (bool) {
        return _allowedUserAddresses[_compliance][_userAddress];
    }

    /**
     *  @dev See {IModule-canComplianceBind}.
     */
    function canComplianceBind(address /*_compliance*/) external view override returns (bool) {
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
        return "TransferRestrictModule";
    }
}