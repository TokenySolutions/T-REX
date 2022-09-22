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

import '../IModularCompliance.sol';
import '../../../token/IToken.sol';
import './AbstractModule.sol';
import '../../../roles/AgentRole.sol';

contract ConditionalTransferModule is AbstractModule {
    /**
     *  this event is emitted whenever a transfer is approved.
     *  the event is emitted by 'approveTransfer' function.
     *  `_from` is the address of transfer sender.
     *  `_to` is the address of transfer recipient
     *  `_amount` is the token amount to be sent (take care of decimals)
     *  `_token` is the token address of the token concerned by the approval
     */
    event TransferApproved(address _from, address _to, uint _amount, address _token);

    /**
     *  this event is emitted whenever a transfer approval is removed.
     *  the event is emitted by 'unApproveTransfer' function.
     *  `_from` is the address of transfer sender.
     *  `_to` is the address of transfer recipient
     *  `_amount` is the token amount to be sent (take care of decimals)
     *  `_token` is the token address of the token concerned by the approval
     */
    event ApprovalRemoved(address _from, address _to, uint _amount, address _token);

    /// Mapping between transfer details and their approval status (amount of transfers approved) per compliance
    mapping(address => mapping(bytes32 => uint)) private _transfersApproved;

    /**
     *  @dev Returns true if transfer is approved
     *  @param _transferHash, bytes corresponding to the transfer details, hashed
     */
    function isTransferApproved(address _compliance, bytes32 _transferHash) public view onlyBoundCompliance(_compliance)
    returns (bool) {
        if (((_transfersApproved[_compliance])[_transferHash]) > 0) {
            return true;
        }
        return false;
    }

    /**
     *  @dev Returns the amount of identical transfers approved
     *  @param _transferHash, bytes corresponding to the transfer details, hashed
     */
    function getTransferApprovals(address _compliance, bytes32 _transferHash) public view
    onlyBoundCompliance(_compliance) returns (uint) {
        return (_transfersApproved[_compliance])[_transferHash];
    }

    function calculateTransferHash (
        address _from,
        address _to,
        uint _amount,
        address _token
    ) public pure returns (bytes32){
        bytes32 transferHash = keccak256(abi.encode(_from, _to, _amount, _token));
        return transferHash;
    }


    function approveTransfer(address _from, address _to, uint _amount) public onlyComplianceCall {
        bytes32 transferHash = calculateTransferHash(_from, _to, _amount, IModularCompliance(msg.sender).getTokenBound());
        _transfersApproved[msg.sender][transferHash]++;
        emit TransferApproved(_from, _to, _amount, IModularCompliance(msg.sender).getTokenBound());
    }


    function unApproveTransfer(address _from, address _to, uint _amount) public onlyComplianceCall {
        bytes32 transferHash = calculateTransferHash(_from, _to, _amount, IModularCompliance(msg.sender).getTokenBound());
        require(_transfersApproved[msg.sender][transferHash] > 0, 'not approved');
        _transfersApproved[msg.sender][transferHash]--;
        emit ApprovalRemoved(_from, _to, _amount, IModularCompliance(msg.sender).getTokenBound());

    }

    function batchApproveTransfers(address[] calldata _from, address[] calldata _to, uint[] calldata _amount)
    external onlyComplianceCall {
        for (uint256 i = 0; i < _from.length; i++){
            approveTransfer(_from[i], _to[i], _amount[i]);
        }
    }

    function batchUnApproveTransfers(address[] calldata _from, address[] calldata _to, uint[] calldata _amount)
    external onlyComplianceCall {
        for (uint256 i = 0; i < _from.length; i++){
            unApproveTransfer(_from[i], _to[i], _amount[i]);
        }
    }

    /**
     *  @dev See {IModule-moduleTransferAction}.
     *  transfer approval is removed post-transfer
     */
    function moduleTransferAction(
        address _from,
        address _to,
        uint256 _value)
    external override onlyComplianceCall {
            unApproveTransfer(_from, _to, _value);
    }

    /**
     *  @dev See {IModule-moduleMintAction}.
     *  no mint action required in this module
     */
    function moduleMintAction(
        address _to,
        uint256 _value
    ) external override onlyComplianceCall {}

    /**
     *  @dev See {IModule-moduleBurnAction}.
     *  no burn action required in this module
     */
    function moduleBurnAction(
        address _from,
        uint256 _value
    ) external override onlyComplianceCall {}

    /**
     *  @dev See {IModule-moduleCheck}.
     *  checks if the transfer is approved or not
     */
    function moduleCheck(
        address _from,
        address _to,
        uint256 _value,
        address _compliance
    ) external view override onlyBoundCompliance(_compliance) returns (bool) {
        bytes32 transferHash = calculateTransferHash(_from, _to, _value, IModularCompliance(_compliance).getTokenBound());
        return isTransferApproved(_compliance, transferHash);
    }

}
