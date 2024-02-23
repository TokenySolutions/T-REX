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

import "../roles/AgentRole.sol";

/// @notice Error thrown when a contract with the same name has already been deployed.
/// @param addr The address of the previously deployed contract.
error ContractDeployedAlready(address addr);

/// @notice Error thrown when a contract has not been deployed properly by the assembly call
error ContractNotDeployed();

contract ContractsDeployer is AgentRole {

    /// @notice Maps a human-readable name to the address of a deployed contract.
    /// @dev Used to retrieve contract addresses deployed by this deployer.
    mapping(string => address) private _deployedContracts;

    /// @notice Emitted when a contract is deployed.
    /// @param name The human-readable name of the deployed contract.
    /// @param contractAddress The address of the deployed contract.
    event ContractDeployed(string name, address contractAddress);


    /**
     * @dev Deploys a contract using the create2 opcode, ensuring deterministic address generation.
     * @param name A human-readable name for the contract, used for referencing in the deployedContracts mapping.
     * @param bytecode The bytecode of the contract to be deployed.
     * @return addr The address of the deployed contract.
     * @notice The function will revert with `ContractDeployedAlready` if a contract with the same name has been deployed.
     */
    function deployContract(string memory name, bytes memory bytecode) external onlyAgent returns (address) {
        bytes32 salt = keccak256(bytecode);
        if (_deployedContracts[name] != address(0)) {
            revert ContractDeployedAlready(_deployedContracts[name]);
        }

        address addr;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let encoded_data := add(0x20, bytecode) // Load initialization code.
            let encoded_size := mload(bytecode)     // Load init code's length.
            addr := create2(0, encoded_data, encoded_size, salt)
            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }
        if (addr == address(0)) {
            revert ContractNotDeployed();
        }
        _deployedContracts[name] = addr;
        emit ContractDeployed(name, addr);
        return addr;
    }

    /**
     * @dev Transfers the ownership of a contract to a new owner.
     * @param _contract The address of the contract whose ownership is to be transferred.
     * @param _owner The address of the new owner.
     * @notice This function can only be called by an agent.
     */
    function recoverContractOwnership(address _contract, address _owner) external onlyAgent {
        Ownable(_contract).transferOwnership(_owner);
    }

    /**
     * @dev Retrieves the address of a deployed contract by its name.
     * @param name The name of the contract.
     * @return The address of the deployed contract.
     */
    function getContract(string calldata name) external view returns (address) {
        return _deployedContracts[name];
    }
}
