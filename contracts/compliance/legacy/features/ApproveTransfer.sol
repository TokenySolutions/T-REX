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

import "../BasicCompliance.sol";

/**
 *  this feature allows to require the pre-validation of a transfer before allowing it to be executed
 *  This feature is also known as "conditional transfers" feature
 */
abstract contract ApproveTransfer is BasicCompliance {

    /// Mapping of transfersApproved
    mapping(bytes32 => bool) private _transfersApproved;

    /**
     *  this event is emitted when a transfer is approved
     *  the event is emitted by the `approveTransfer` and `approveAndTransfer` functions
     *  `_from` is the address of the transfer sender
     *  `_to` is the address of the transfer receiver
     *  `_amount` is the amount of tokens that `_from` is allowed to send to `_to`
     *  note that the approved transfer has to be exactly of the approved amount `_amount`
     *  `_token` is the address of the token that is allowed to be transferred
     */
    event TransferApproved(address _from, address _to, uint _amount, address _token);

    /**
     *  this event is emitted when a transfer approval is removed
     *  the event is emitted by the `removeApproval` function
     *  `_from` is the address of the transfer sender
     *  `_to` is the address of the transfer receiver
     *  `_amount` is the amount of tokens that `_from` was allowed to send to `_to`
     *  `_token` is the address of the token that was allowed to be transferred
     */
    event ApprovalRemoved(address _from, address _to, uint _amount, address _token);

    /**
    *  @dev removes approval on a transfer previously approved
    *  requires the transfer to be previously approved
    *  once a transfer approval is removed, the sender is not allowed to execute it anymore
    *  @param _from the address of the transfer sender
    *  @param _to the address of the transfer receiver
    *  @param _amount the amount of tokens that `_from` was allowed to send to `_to`
    *  Only Admin can call this function, i.e. owner of compliance contract OR token agent
    *  emits an `ApprovalRemoved` event
    */
    function removeApproval(address _from, address _to, uint _amount) external onlyAdmin {
        bytes32 transferId = _calculateTransferID (_from, _to, _amount, address(tokenBound));
        require(_transfersApproved[transferId], "transfer not approved yet");
        _transfersApproved[transferId] = false;
        emit ApprovalRemoved(_from, _to, _amount, address(tokenBound));
    }

    /**
    *  @dev Approves a transfer and execute it immediately
    *  As the function calls `transferFrom` on the token contract, the compliance contract, which is de facto sender of
    *  that function call has to be allowed to make such a call, i.e. the allowance should be >= `_amount` with
    *  Compliance contract address being the spender address
    *  @param _from the address of the transfer sender
    *  @param _to the address of the transfer receiver
    *  @param _amount the amount of tokens that `_from` would send to `_to`
    *  Only Admin can call this function, i.e. owner of compliance contract OR token agent
    *  emits a `TransferApproved` event, an `ApprovalRemoved` event and a `Transfer` event
    */
    function approveAndTransfer(address _from, address _to, uint _amount) external {
        approveTransfer(_from, _to, _amount);
        tokenBound.transferFrom(_from, _to, _amount);
    }

    /**
    *  @dev Approves a transfer
    *  once a transfer is approved, the sender is allowed to execute it
    *  @param _from the address of the transfer sender
    *  @param _to the address of the transfer receiver
    *  @param _amount the amount of tokens that `_from` would send to `_to`
    *  Only Admin can call this function, i.e. owner of compliance contract OR token agent
    *  emits a `TransferApproved` event
    */
    function approveTransfer(address _from, address _to, uint _amount) public onlyAdmin {
        bytes32 transferId = _calculateTransferID (_from, _to, _amount, address(tokenBound));
        require(!_transfersApproved[transferId], "transfer already approved");
        _transfersApproved[transferId] = true;
        emit TransferApproved(_from, _to, _amount, address(tokenBound));
    }

    /**
    *  @dev check on the compliance status of a transaction.
    *  If the check returns TRUE, the transfer is allowed to be executed, if the check returns FALSE, the compliance
    *  feature will block the transfer execution
    *  The check will verify if the transferID corresponding to the parameters of the transfer corresponds to a
    *  pre-approved transfer or not, and will return TRUE or FALSE according to the approval status of the said transfer
    *  If `_from` is a token agent, the transfer will pass whatever the approval status may be as agents bypass this
    *  compliance feature.
    *  @param _from the address of the transfer sender
    *  @param _to the address of the transfer receiver
    *  @param _value the amount of tokens that `_from` would send to `_to`
    */
    function complianceCheckOnApproveTransfer(address _from, address _to, uint256 _value) public view returns (bool) {
        if (!isTokenAgent(_from)) {
            bytes32 transferId = _calculateTransferID (_from, _to, _value, address(tokenBound));
            if (!_transfersApproved[transferId]){
                return false;
            }
        }
        return true;
    }

    /**
    *  @dev state update of the compliance feature post-transfer.
    *  calls the `_transferProcessed` function to update approval status post-transfer
    *  @param _from the address of the transfer sender
    *  @param _to the address of the transfer receiver
    *  @param _value the amount of tokens that `_from` sent to `_to`
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _transferActionOnApproveTransfer(address _from, address _to, uint256 _value) internal {
        _transferProcessed(_from, _to, _value);
    }

    /**
    *  @dev state update of the compliance feature post-minting.
    *  this compliance feature doesn't require state update post-minting
    *  @param _to the address of the minting beneficiary
    *  @param _value the amount of tokens minted on `_to` wallet
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    // solhint-disable-next-line no-empty-blocks
    function _creationActionOnApproveTransfer(address _to, uint256 _value) internal {}

    /**
    *  @dev state update of the compliance feature post-burning.
    *  this compliance feature doesn't require state update post-burning
    *  @param _from the wallet address on which tokens burnt
    *  @param _value the amount of tokens burnt from `_from` wallet
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    // solhint-disable-next-line no-empty-blocks
    function _destructionActionOnApproveTransfer(address _from, uint256 _value) internal {}

    /**
    *  @dev updates the approval status of a transfer post-execution
    *  once an approved transfer is executed, the sender is not allowed to execute it anymore
    *  @param _from the address of the transfer sender
    *  @param _to the address of the transfer receiver
    *  @param _amount the amount of tokens that `_from` was allowed to send to `_to`
    *  internal function, can be called only from the functions of the Compliance smart contract
    *  emits an `ApprovalRemoved` event if transfer was pre-approved, i.e. if function call was done by a regular
    *  token holder, token agents bypassing the approval requirements
    */
    function _transferProcessed(address _from, address _to, uint _amount) internal {
        bytes32 transferId = _calculateTransferID (_from, _to, _amount, address(tokenBound));
        if (_transfersApproved[transferId]) {
            _transfersApproved[transferId] = false;
            emit ApprovalRemoved(_from, _to, _amount, address(tokenBound));
        }
    }

    /**
    *  @dev Calculates the ID of a transfer
    *  transfer IDs are used to identify which transfer is approved and which is not at compliance contract level
    *  @param _from the address of the transfer sender
    *  @param _to the address of the transfer receiver
    *  @param _amount the amount of tokens that `_from` would send to `_to`
    *  @param _token the address of the token that would be transferred
    *  returns the transferId of the transfer
    */
    function _calculateTransferID (
        address _from,
        address _to,
        uint _amount,
        address _token
    ) internal pure returns (bytes32){
        bytes32 transferId = keccak256(abi.encode(_from, _to, _amount, _token));
        return transferId;
    }
}

