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

import '@openzeppelin/contracts/access/Ownable.sol';
import './ITREXImplementationAuthority.sol';

contract TREXImplementationAuthority is ITREXImplementationAuthority, Ownable {
    event UpdatedTokenImplementation(address tokenImplem);
    event UpdatedCTRImplementation(address ctrImplem);
    event UpdatedIRImplementation(address irImplem);
    event UpdatedIRSImplementation(address irsImplem);
    event UpdatedTIRImplementation(address tirImplem);
    event UpdatedMCImplementation(address mcImplem);
    address private tokenImplementation;
    address private ctrImplementation;
    address private irImplementation;
    address private irsImplementation;
    address private tirImplementation;
    address private mcImplementation;

    function getTokenImplementation() public isNotNull(tokenImplementation) view override returns (address) {
        return tokenImplementation;
    }

    function setTokenImplementation(address _tokenImplementation) public override onlyOwner {
        tokenImplementation = _tokenImplementation;
        emit UpdatedTokenImplementation(_tokenImplementation);
    }

    function getCTRImplementation() public isNotNull(ctrImplementation) view override returns (address) {
        return ctrImplementation;
    }

    function setCTRImplementation(address _ctrImplementation) public override onlyOwner {
        ctrImplementation = _ctrImplementation;
        emit UpdatedCTRImplementation(_ctrImplementation);
    }

    function getIRImplementation() public isNotNull(irImplementation) view override returns (address) {
        return irImplementation;
    }

    function setIRImplementation(address _irImplementation) public override onlyOwner {
        irImplementation = _irImplementation;
        emit UpdatedIRImplementation(_irImplementation);
    }

    function getIRSImplementation() public isNotNull(irsImplementation) view override returns (address) {
        return irsImplementation;
    }

    function setIRSImplementation(address _irsImplementation) public override onlyOwner {
        irsImplementation = _irsImplementation;
        emit UpdatedIRSImplementation(_irsImplementation);
    }

    function getTIRImplementation() public isNotNull(tirImplementation) view override returns (address) {
        return tirImplementation;
    }

    function setTIRImplementation(address _tirImplementation) public override onlyOwner {
        tirImplementation = _tirImplementation;
        emit UpdatedTIRImplementation(_tirImplementation);
    }

    function getMCImplementation() public isNotNull(mcImplementation) view override returns (address) {
        return mcImplementation;
    }

    function setMCImplementation(address _mcImplementation) public override onlyOwner {
        mcImplementation = _mcImplementation;
        emit UpdatedMCImplementation(_mcImplementation);
    }

    modifier isNotNull(address implementation) {
        require(implementation != address(0x0), 'Implementation isn\'t yet defined, please set this implementation before');
        _;
    }
}