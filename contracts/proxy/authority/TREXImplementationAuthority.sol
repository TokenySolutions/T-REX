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
 *     Copyright (C) 2022, Tokeny sàrl.
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

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ITREXImplementationAuthority.sol";

contract TREXImplementationAuthority is ITREXImplementationAuthority, Ownable {
    address private tokenImplementation;
    address private ctrImplementation;
    address private irImplementation;
    address private irsImplementation;
    address private tirImplementation;
    address private mcImplementation;

    function getTokenImplementation() external view override returns (address) {
        return tokenImplementation;
    }

    function setTokenImplementation(address _tokenImplementation) external override onlyOwner {
        require(_tokenImplementation != address(0), "invalid argument - zero address");
        tokenImplementation = _tokenImplementation;
        emit UpdatedTokenImplementation(_tokenImplementation);
    }

    function getCTRImplementation() external view override returns (address) {
        return ctrImplementation;
    }

    function setCTRImplementation(address _ctrImplementation) external override onlyOwner {
        require(_ctrImplementation != address(0), "invalid argument - zero address");
        ctrImplementation = _ctrImplementation;
        emit UpdatedCTRImplementation(_ctrImplementation);
    }

    function getIRImplementation() external view override returns (address) {
        return irImplementation;
    }

    function setIRImplementation(address _irImplementation) external override onlyOwner {
        require(_irImplementation != address(0), "invalid argument - zero address");
        irImplementation = _irImplementation;
        emit UpdatedIRImplementation(_irImplementation);
    }

    function getIRSImplementation() external view override returns (address) {
        return irsImplementation;
    }

    function setIRSImplementation(address _irsImplementation) external override onlyOwner {
        require(_irsImplementation != address(0), "invalid argument - zero address");
        irsImplementation = _irsImplementation;
        emit UpdatedIRSImplementation(_irsImplementation);
    }

    function getTIRImplementation() external view override returns (address) {
        return tirImplementation;
    }

    function setTIRImplementation(address _tirImplementation) external override onlyOwner {
        require(_tirImplementation != address(0), "invalid argument - zero address");
        tirImplementation = _tirImplementation;
        emit UpdatedTIRImplementation(_tirImplementation);
    }

    function getMCImplementation() external view override returns (address) {
        return mcImplementation;
    }

    function setMCImplementation(address _mcImplementation) external override onlyOwner {
        require(_mcImplementation != address(0), "invalid argument - zero address");
        mcImplementation = _mcImplementation;
        emit UpdatedMCImplementation(_mcImplementation);
    }
}