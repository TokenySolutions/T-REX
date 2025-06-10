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

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "../roles/IERC173.sol";
import "../token/IToken.sol";
import "../proxy/authority/ITREXImplementationAuthority.sol";
import "../proxy/authority/IIAFactory.sol";
import "../factory/ITREXGateway.sol";
import "../compliance/modular/modules/IModule.sol";
import "../compliance/modular/IModularCompliance.sol";
import "../registry/interface/IClaimTopicsRegistry.sol";
import "../registry/interface/IIdentityRegistry.sol";
import "../registry/interface/IIdentityRegistryStorage.sol";
import "../registry/interface/ITrustedIssuersRegistry.sol";


contract InterfaceIdCalculator {
    /**
     * @dev Returns the interface ID for the IERC20 interface.
     * IERC20 interface ID is 0x36372b07
     */
    function getIERC20InterfaceId() external pure returns (bytes4) {
        return type(IERC20).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IERC20Permit interface.
     * IERC20Permit interface ID is 0x0b4c7e4d
     */
    function getIERC20PermitInterfaceId() external pure returns (bytes4) {
        return type(IERC20Permit).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IERC3643 interface.
     * IERC3643 interface ID is 0xb97d944c
     */
    function getIERC3643InterfaceId() external pure returns (bytes4) {
        return type(IERC3643).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IToken interface.
     * IToken interface ID is 0x5c0cda7e
     */
    function getITokenInterfaceId() external pure returns (bytes4) {
        return type(IToken).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IERC173 interface.
     * IERC173 interface ID is 0x7f5828d0
     */
    function getIERC173InterfaceId() external pure returns (bytes4) {
        return type(IERC173).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IERC165 interface.
     * IERC165 interface ID is 0x01ffc9a7
     */
    function getIERC165InterfaceId() external pure returns (bytes4) {
        return type(IERC165).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IERC3643ClaimTopicsRegistry interface.
     * IERC3643ClaimTopicsRegistry interface ID is 0x10928b13
     */
    function getIERC3643ClaimTopicsRegistryInterfaceId() external pure returns (bytes4) {
        return type(IERC3643ClaimTopicsRegistry).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IIdentityRegistry interface.
     * IIdentityRegistry interface ID is 0xacb7b4db
     */
    function getIIdentityRegistryInterfaceId() external pure returns (bytes4) {
        return type(IIdentityRegistry).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IERC3643IdentityRegistry interface.
     * IERC3643IdentityRegistry interface ID is 0x8ff89f73
     */
    function getIERC3643IdentityRegistryInterfaceId() external pure returns (bytes4) {
        return type(IERC3643IdentityRegistry).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IERC3643IdentityRegistryStorage interface.
     * IERC3643IdentityRegistryStorage interface ID is 0x57defe0d
     */
    function getIERC3643IdentityRegistryStorageInterfaceId() external pure returns (bytes4) {
        return type(IERC3643IdentityRegistryStorage).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IERC3643TrustedIssuersRegistry interface.
     * IERC3643TrustedIssuersRegistry interface ID is 0xb0f773b8
     */
    function getIERC3643TrustedIssuersRegistryInterfaceId() external pure returns (bytes4) {
        return type(IERC3643TrustedIssuersRegistry).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the ITREXImplementationAuthority interface.
     * ITREXImplementationAuthority interface ID is 0x62dd69be
     */
    function getITREXImplementationAuthorityInterfaceId() external pure returns (bytes4) {
        return type(ITREXImplementationAuthority).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IIAFactory interface.
     * IIAFactory interface ID is 0x8c76edf0
     */
    function getIIAFactoryInterfaceId() external pure returns (bytes4) {
        return type(IIAFactory).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the ITREXGateway interface.
     * ITREXGateway interface ID is 0x80e89461
     */
    function getITREXGatewayInterfaceId() external pure returns (bytes4) {
        return type(ITREXGateway).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IModularCompliance interface.
     * IModularCompliance interface ID is 0x4d6b83d6
     */
    function getIModularComplianceInterfaceId() external pure returns (bytes4) {
        return type(IModularCompliance).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IERC3643Compliance interface.
     * IERC3643Compliance interface ID is 0x3144991c
     */
    function getIERC3643ComplianceInterfaceId() external pure returns (bytes4) {
        return type(IERC3643Compliance).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IModule interface.
     * IModule interface ID is 0xb795d01e
     */
    function getIModuleInterfaceId() external pure returns (bytes4) {
        return type(IModule).interfaceId;
    }
}
