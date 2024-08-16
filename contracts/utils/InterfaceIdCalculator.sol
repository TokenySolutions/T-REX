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

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../roles/IERC173.sol";
import "../token/IToken.sol";
import "../proxy/interface/IProxy.sol";
import "../proxy/authority/ITREXImplementationAuthority.sol";
import "../proxy/authority/IIAFactory.sol";
import "../factory/ITREXGateway.sol";
import "../DVA/IDVATransferManager.sol";
import "../compliance/modular/modules/IModule.sol";

contract InterfaceIdCalculator {
    /**
     * @dev Returns the interface ID for the IERC20 interface.
     * IERC20 interface ID is 0x36372b07
     */
    function getIERC20InterfaceId() external pure returns (bytes4) {
        return type(IERC20).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IToken interface.
     * IToken interface ID is 0x4768ee17
     */
    function getITokenInterfaceId() external pure returns (bytes4) {
        return type(IToken).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IERC173 interface.
     * IToken interface ID is 0x7f5828d0
     */
    function getIERC173InterfaceId() external pure returns (bytes4) {
        return type(IERC173).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IERC165 interface.
     * IToken interface ID is 0x01ffc9a7
     */
    function getIERC165InterfaceId() external pure returns (bytes4) {
        return type(IERC165).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IClaimTopicsRegistry interface.
     * IToken interface ID is 0x10928b13
     */
    function getIClaimTopicsRegistryInterfaceId() external pure returns (bytes4) {
        return type(IClaimTopicsRegistry).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IIdentityRegistry interface.
     * IToken interface ID is 0x8ff89f73
     */
    function getIIdentityRegistryInterfaceId() external pure returns (bytes4) {
        return type(IIdentityRegistry).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IIdentityRegistryStorage interface.
     * IToken interface ID is 0x57defe0d
     */
    function getIIdentityRegistryStorageInterfaceId() external pure returns (bytes4) {
        return type(IIdentityRegistryStorage).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the ITrustedIssuersRegistry interface.
     * IToken interface ID is 0xb0f773b8
     */
    function getITrustedIssuersRegistryInterfaceId() external pure returns (bytes4) {
        return type(ITrustedIssuersRegistry).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IProxy interface.
     * IToken interface ID is 0xbf828ce2
     */
    function getIProxyInterfaceId() external pure returns (bytes4) {
        return type(IProxy).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the ITREXImplementationAuthority interface.
     * IToken interface ID is 0x62dd69be
     */
    function getITREXImplementationAuthorityInterfaceId() external pure returns (bytes4) {
        return type(ITREXImplementationAuthority).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IIAFactory interface.
     * IToken interface ID is 0x8c76edf0
     */
    function getIIAFactoryInterfaceId() external pure returns (bytes4) {
        return type(IIAFactory).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the ITREXGateway interface.
     * IToken interface ID is 0x80e89461
     */
    function getITREXGatewayInterfaceId() external pure returns (bytes4) {
        return type(ITREXGateway).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IDVATransferManager interface.
     * IToken interface ID is 0xb9eabd9b
     */
    function getIDVATransferManagerInterfaceId() external pure returns (bytes4) {
        return type(IDVATransferManager).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IModularCompliance interface.
     * IToken interface ID is 0xef7cedae
     */
    function getIModularComplianceInterfaceId() external pure returns (bytes4) {
        return type(IModularCompliance).interfaceId;
    }

    /**
     * @dev Returns the interface ID for the IModule interface.
     * IToken interface ID is 0xb795d01e
     */
    function getIModuleInterfaceId() external pure returns (bytes4) {
        return type(IModule).interfaceId;
    }
}
