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

abstract contract ApproveTransfer is BasicCompliance {

    event TransferApproved(address _from, address _to, uint _amount, address _token);

    event ApprovalRemoved(address _from, address _to, uint _amount, address _token);

    /// Mapping of transfersApproved
    mapping(bytes32 => bool) private _transfersApproved;

    function calculateTransferID (
        address _from,
        address _to,
        uint _amount,
        address _token
    ) internal pure returns (bytes32){
        bytes32 transferId = keccak256(abi.encode(_from, _to, _amount, _token));
        return transferId;
    }

    function approveTransfer(address _from, address _to, uint _amount) public {
        require(isTokenAgent(msg.sender), 'only token agent can call');
        bytes32 transferId = calculateTransferID (_from, _to, _amount, address(_tokenBound));
        require(_transfersApproved[transferId] == false, 'transfer already approved');
        _transfersApproved[transferId] = true;
        emit TransferApproved(_from, _to, _amount, address(_tokenBound));
    }

    function removeApproval(address _from, address _to, uint _amount) external {
        require(isTokenAgent(msg.sender), 'only token agent can call');
        bytes32 transferId = calculateTransferID (_from, _to, _amount, address(_tokenBound));
        _transfersApproved[transferId] = false;
        emit ApprovalRemoved(_from, _to, _amount, address(_tokenBound));
    }

    function transferProcessed(address _from, address _to, uint _amount) internal {
        bytes32 transferId = calculateTransferID (_from, _to, _amount, address(_tokenBound));
        if (_transfersApproved[transferId]) {
            _transfersApproved[transferId] = false;
            emit ApprovalRemoved(_from, _to, _amount, address(_tokenBound));
        }
    }

    function approveAndTransfer(address _from, address _to, uint _amount) external {
        approveTransfer(_from, _to, _amount);
        _tokenBound.transferFrom(_from, _to, _amount);
    }

    function transferActionOnApproveTransfer(address _from, address _to, uint256 _value) internal {
        transferProcessed(_from, _to, _value);
    }

    function creationActionOnApproveTransfer(address _to, uint256 _value) internal {}

    function destructionActionOnApproveTransfer(address _from, uint256 _value) internal {}

    function complianceCheckOnApproveTransfer(address _from, address _to, uint256 _value) internal view returns (bool) {
        if (!isTokenAgent(_from)) {
            bytes32 transferId = calculateTransferID (_from, _to, _value, address(_tokenBound));
            if (!_transfersApproved[transferId]){
                return false;
            }
        }
        return true;
    }
}

