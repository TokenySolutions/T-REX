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

pragma solidity 0.8.26;

import "../../ERC-3643/IERC3643Compliance.sol";

/// events

/// @dev Event emitted for each executed interaction with a module contract.
/// For gas efficiency, only the interaction calldata selector (first 4 bytes) is included in the event.
/// For interactions without calldata or whose calldata is shorter than 4 bytes, the selector will be `0`.
/// @param _target Address of the module.
/// @param _selector See above comments.
event ModuleInteraction(address indexed _target, bytes4 _selector);


/// @dev This event is emitted when a module has been added to the list of modules bound to the compliance contract.
/// @param _module  The address of the compliance module.
event ModuleAdded(address indexed _module);


/// @dev This event is emitted when a module has been removed from the list of modules bound to the compliance contract.
/// @param _module is the address of the compliance module
event ModuleRemoved(address indexed _module);


interface IModularCompliance is IERC3643Compliance {

    /// functions

    /**
     *  @dev adds a module to the list of compliance modules
     *  @param _module address of the module to add
     *  there cannot be more than 25 modules bound to the modular compliance for gas cost reasons
     *  This function can be called ONLY by the owner of the compliance contract
     *  Emits a ModuleAdded event
     */
    function addModule(address _module) external;

    /**
     *  @dev removes a module from the list of compliance modules
     *  @param _module address of the module to remove
     *  This function can be called ONLY by the owner of the compliance contract
     *  Emits a ModuleRemoved event
     */
    function removeModule(address _module) external;

    /**
     *  @dev calls any function on bound modules
     *  can be called only on bound modules
     *  @param callData the bytecode for interaction with the module, abi encoded
     *  @param _module The address of the module
     *  This function can be called only by the modular compliance owner
     *  emits a `ModuleInteraction` event
     */
    function callModuleFunction(bytes calldata callData, address _module) external;

    /**
     * @dev Adds a module to the modular compliance contract and performs multiple interactions with it in a single transaction.
     *
     * This function allows the contract owner to add a new compliance module and immediately configure it by calling
     * specified functions on the module. This can be useful for setting up the module with initial parameters or configurations
     * right after it is added.
     *
     * @param _module The address of the module to add. The module must either be "plug and play"
     * or be able to bind with the compliance contract.
     * @param _interactions An array of bytecode representing function calls to be made on the module.
     * These interactions are performed after the module is added.
     *
     * Requirements:
     * - The caller must be the owner of the `ModularCompliance` contract.
     * - The `_module` address must not be a zero address.
     * - The `_module` must not already be bound to the contract.
     * - The total number of modules must not exceed 25 after adding the new module.
     * - The `_interactions` array must contain no more than 5 elements to prevent out-of-gas errors.
     *
     * Operations:
     * - The function first adds the module using the `addModule` function.
     * - Then, it iterates over the `_interactions` array, performing each
     *   interaction on the module using the `callModuleFunction`.
     *
     * Emits:
     * - A `ModuleAdded` event upon successful addition of the module.
     * - A `ModuleInteraction` event for each function call made to the module during the interaction phase.
     *
     * Reverts if:
     * - Any of the above requirements are not met.
     * - Any of the module interactions fail during execution.
     */
    function addAndSetModule(address _module, bytes[] calldata _interactions) external;

    /**
     *  @dev getter for the modules bound to the compliance contract
     *  returns address array of module contracts bound to the compliance
     */
    function getModules() external view returns (address[] memory);

    /**
     *  @dev checks if a module is bound to the compliance contract
     *  returns true if module is bound, false otherwise
     */
    function isModuleBound(address _module) external view returns (bool);
}
