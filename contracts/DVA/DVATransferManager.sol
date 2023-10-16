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
import "../token/IToken.sol";

contract DVATransferManager {
    enum TransferStatus {
        PENDING,
        COMPLETED,
        CANCELLED,
        REJECTED
    }

    struct ApprovalCriteria {
        address tokenAddress;
        bool includeRecipientApprover;
        bool includeAgentApprover;
        bool sequentialApproval;
        address[] additionalApprovers;
        bytes32 hash;
    }

    struct Transfer {
        address tokenAddress;
        address sender;
        address recipient;
        uint256 amount;
        TransferStatus status;
        Approver[] approvers;
        bytes32 approvalCriteriaHash;
    }

    struct Approver {
        address wallet; // if anyTokenAgent is true, it will be address(0) on initialization
        bool anyTokenAgent;
        bool approved;
    }

    // Mapping for token approval criteria
    mapping(address => ApprovalCriteria) private _approvalCriteria;

    // Mapping for transfer requests
    mapping(bytes32 => Transfer) private _transfers;

    // nonce of the transaction allowing the creation of unique transferID
    uint256 private _txNonce;

    /**
     *  this event is emitted whenever an approval criteria of a token is modified.
     *  the event is emitted by 'modifyApprovalCriteria' function.
     *  `tokenAddress` is the token address.
     *  `includeRecipientApprover` determines whether the recipient is included in the approver list
     *  `includeAgentApprover` determines whether the agent is included in the approver list
     *  `sequentialApproval` determines whether approvals must be sequential
     *  `additionalApprovers` are the addresses of additional approvers to be added to the approver list
     *  `hash` is the approval criteria hash
     */
    event ApprovalCriteriaModified(
        address tokenAddress,
        bool includeRecipientApprover,
        bool includeAgentApprover,
        bool sequentialApproval,
        address[] additionalApprovers,
        bytes32 hash
    );

    /**
     *  this event is emitted whenever a transfer is initiated
     *  the event is emitted by 'initiateTransfer' function.
     *  `transferID` is the unique ID of the transfer
     *  `tokenAddress` is the token address
     *  `sender` is the address of the sender
     *  `recipient` is the address of the recipient
     *  `amount` is the amount of the transfer
     *  `approvers` is the list of approvers
     *  `approvalCriteriaHash` is the approval criteria hash
     */
    event TransferInitiated(
        bytes32 transferID,
        address tokenAddress,
        address sender,
        address recipient,
        uint256 amount,
        Approver[] approvers,
        bytes32 approvalCriteriaHash
    );

    /**
    *  this event is emitted whenever a transfer is approved by an approver
    *  the event is emitted by 'approveTransfer' function.
    *  `transferID` is the unique ID of the transfer
    *  `approver` is the approver address
    */
    event TransferApproved(
        bytes32 transferID,
        address approver
    );

    /**
    *  this event is emitted whenever a transfer is rejected by an approver
    *  the event is emitted by 'rejectTransfer' function.
    *  `transferID` is the unique ID of the transfer
    *  `rejectedBy` is the approver address
    */
    event TransferRejected(
        bytes32 transferID,
        address rejectedBy
    );

    /**
    *  this event is emitted whenever a transfer is cancelled by the sender
    *  the event is emitted by 'cancelTransfer' function.
    *  `transferID` is the unique ID of the transfer
    */
    event TransferCancelled(
        bytes32 transferID
    );

    /**
    *  this event is emitted whenever all approvers approve a transfer
    *  the event is emitted by 'approveTransfer' function.
    *  `transferID` is the unique ID of the transfer
    *  `tokenAddress` is the token address
    *  `sender` is the address of the sender
    *  `recipient` is the address of the recipient
    *  `amount` is the amount of the transfer
    */
    event TransferCompleted(
        bytes32 transferID,
        address tokenAddress,
        address sender,
        address recipient,
        uint256 amount
    );

    /**
     *  this event is emitted whenever a transfer approval criteria are reset
     *  the event is emitted by 'approveTransfer' and 'rejectTransfer' functions.
     *  `transferID` is the unique ID of the transfer
     *  `approvers` is the list of approvers
     *  `approvalCriteriaHash` is the approval criteria hash
     */
    event TransferApprovalStateReset(
        bytes32 transferID,
        Approver[] approvers,
        bytes32 approvalCriteriaHash
    );

    error OnlyTokenAgentCanCall(address _tokenAddress);

    error OnlyTransferSenderCanCall(bytes32 _transferID);

    error TokenIsNotRegistered(address _tokenAddress);

    error RecipientIsNotVerified(address _tokenAddress, address _recipient);

    error DVAManagerIsNotVerifiedForTheToken(address _tokenAddress);

    error TokenTransferFailed(address _tokenAddress, address _from, address _to, uint256 _amount);

    error InvalidTransferID(bytes32 _transferID);

    error TransferIsNotInPendingStatus(bytes32 _transferID);

    error ApprovalsMustBeSequential(bytes32 _transferID);

    error ApproverNotFound(bytes32 _transferID, address _approver);

    constructor(){
        _txNonce = 0;
    }

     /**
     *  @dev modify the approval criteria of a token
     *  @param tokenAddress is the token address.
     *  @param includeRecipientApprover determines whether the recipient is included in the approver list
     *  @param includeAgentApprover determines whether the agent is included in the approver list
     *  @param sequentialApproval determines whether approvals must be sequential
     *  @param additionalApprovers are the addresses of additional approvers to be added to the approver list
     *  Only an agent of a token can call this function
     *  DVATransferManager must be an agent of the given token
     *  emits an `ApprovalCriteriaModified` event
     */
    function modifyApprovalCriteria(
        address tokenAddress,
        bool includeRecipientApprover,
        bool includeAgentApprover,
        bool sequentialApproval,
        address[] memory additionalApprovers
    ) external {
        if (!AgentRole(tokenAddress).isAgent(msg.sender)) {
            revert OnlyTokenAgentCanCall(tokenAddress);
        }

        if (!IToken(tokenAddress).identityRegistry().isVerified(address(this))) {
            revert DVAManagerIsNotVerifiedForTheToken(tokenAddress);
        }

        bytes32 hash = keccak256(
            abi.encode(
                tokenAddress,
                includeRecipientApprover,
                includeAgentApprover,
                additionalApprovers
            )
        );

        _approvalCriteria[tokenAddress] = ApprovalCriteria(
            tokenAddress,
            includeRecipientApprover,
            includeAgentApprover,
            sequentialApproval,
            additionalApprovers,
            hash);

        emit ApprovalCriteriaModified(
            tokenAddress,
            includeRecipientApprover,
            includeAgentApprover,
            sequentialApproval,
            additionalApprovers,
            hash
        );
    }

    /**
     *  @dev initiates a new transfer
     *  @param tokenAddress is the address of the token
     *  @param recipient is the address of the recipient
     *  @param amount is the transfer amount
     *  Approval criteria must be preset for the given token address
     *  Receiver must be verified for the given token address
     *  emits a `TransferInitiated` event
     */
    function initiateTransfer(address tokenAddress, address recipient, uint256 amount) external {
        ApprovalCriteria memory approvalCriteria = _approvalCriteria[tokenAddress];
        if (approvalCriteria.tokenAddress == address(0)) {
            revert TokenIsNotRegistered(tokenAddress);
        }

        IToken token = IToken(tokenAddress);
        if (!token.identityRegistry().isVerified(recipient)) {
            revert RecipientIsNotVerified(tokenAddress, recipient);
        }

        bool transferSent = token.transferFrom(msg.sender, address(this), amount);
        if (!transferSent) {
            revert TokenTransferFailed(tokenAddress, msg.sender, address(this), amount);
        }

        uint256 nonce = _txNonce++;
        bytes32 transferID = calculateTransferID(nonce, msg.sender, recipient, amount);

        Transfer storage transfer = _transfers[transferID];
        transfer.tokenAddress = tokenAddress;
        transfer.sender = msg.sender;
        transfer.recipient = recipient;
        transfer.amount = amount;
        transfer.status = TransferStatus.PENDING;
        transfer.approvalCriteriaHash = approvalCriteria.hash;

        _addApproversToTransfer(transfer, approvalCriteria);
        emit TransferInitiated(
            transferID,
            tokenAddress,
            msg.sender,
            recipient,
            amount,
            transfer.approvers,
            approvalCriteria.hash
        );
    }

    /**
     *  @dev approves a transfer
     *  @param transferID is the unique ID of the transfer
     *  msg.sender must be an approver of the transfer
     *  emits a `TransferApproved` event
     *  emits a `TransferCompleted` event (if all approvers approved the transfer)
     *  emits a `TransferApprovalStateReset` event (if transfer approval criteria have been reset)
     */
    function approveTransfer(bytes32 transferID) external {
        Transfer storage transfer = _getPendingTransfer(transferID);
        if (_approvalCriteriaChanged(transferID, transfer)) {
            return;
        }

        bool allApproved = _approveTransfer(transferID, transfer);
        if (allApproved) {
            _completeTransfer(transferID, transfer);
        }
    }

    /**
     *  @dev cancels a transfer
     *  @param transferID is the unique ID of the transfer
     *  msg.sender must be the sender of the transfer
     *  emits a `TransferCancelled` event
     */
    function cancelTransfer(bytes32 transferID) external {
        Transfer storage transfer = _getPendingTransfer(transferID);
        if (msg.sender != transfer.sender) {
            revert OnlyTransferSenderCanCall(transferID);
        }

        transfer.status = TransferStatus.CANCELLED;
        _transferTokensTo(transfer, transfer.sender);
        emit TransferCancelled(transferID);
    }

    /**
     *  @dev rejects a transfer
     *  @param transferID is the unique ID of the transfer
     *  msg.sender must be an approver of the transfer
     *  emits a `TransferRejected` event
     *  emits a `TransferApprovalStateReset` event (if transfer approval criteria have been reset)
     */
    function rejectTransfer(bytes32 transferID) external {
        Transfer storage transfer = _getPendingTransfer(transferID);
        if (_approvalCriteriaChanged(transferID, transfer)) {
            return;
        }

        bool rejected = false;
        ApprovalCriteria memory approvalCriteria = _approvalCriteria[transfer.tokenAddress];
        for (uint256 i = 0; i < transfer.approvers.length; i++) {
            Approver storage approver = transfer.approvers[i];
            if (approver.approved) {
                continue;
            }

            if (_canApprove(transfer, approver)) {
                rejected = true;
                break;
            }

            if (approvalCriteria.sequentialApproval) {
                revert ApprovalsMustBeSequential(transferID);
            }
        }

        if (!rejected) {
            revert ApproverNotFound(transferID, msg.sender);
        }

        transfer.status = TransferStatus.REJECTED;
        _transferTokensTo(transfer, transfer.sender);
        emit TransferRejected(transferID, msg.sender);
    }

    /**
     *  @dev getter for the approval criteria of tokens
     *  @param tokenAddress is the address of the token
     *  returns approval criteria of the token
     */
    function getApprovalCriteria(address tokenAddress) external view returns (ApprovalCriteria memory) {
        ApprovalCriteria memory approvalCriteria = _approvalCriteria[tokenAddress];
        if (approvalCriteria.tokenAddress == address(0)) {
            revert TokenIsNotRegistered(tokenAddress);
        }

        return approvalCriteria;
    }

    /**
     *  @dev getter for the transfer
     *  @param transferID is the unique ID of the transfer
     *  returns transfer
     */
    function getTransfer(bytes32 transferID) external view returns (Transfer memory) {
        Transfer memory transfer = _transfers[transferID];
        if (transfer.tokenAddress == address(0)) {
            revert InvalidTransferID(transferID);
        }

        return transfer;
    }

    /**
     *  @dev getter for the next approver of a transfer
     *  @param transferID is the unique ID of the transfer
     *  returns address of the next approver
     */
    function getNextApprover(bytes32 transferID) external view returns (address) {
        Transfer storage transfer = _getPendingTransfer(transferID);

        address nextApprover;
        for (uint256 i = 0; i < transfer.approvers.length; i++) {
            if (transfer.approvers[i].approved) {
                continue;
            }

            nextApprover = transfer.approvers[i].wallet;
            break;
        }

        return nextApprover;
    }

    /**
     *  @dev getter for the next unique nonce value
     *  returns nonce
     */
    function getNextTxNonce() external view returns (uint256) {
        return _txNonce;
    }

    /**
     *  @dev calculates unique transfer ID
     *  @param _nonce is the unique nonce value
     *  @param _sender is the sender of the transfer
     *  @param _recipient is the recipient of the transfer
     *  @param _amount is the transfer amount
     *  returns a unique transfer ID
     */
    function calculateTransferID(
        uint256 _nonce,
        address _sender,
        address _recipient,
        uint256 _amount
    ) public pure returns (bytes32){
        bytes32 transferID = keccak256(abi.encode(
            _nonce, _sender, _recipient, _amount
        ));
        return transferID;
    }

    // solhint-disable-next-line code-complexity
    function _approveTransfer(bytes32 transferID, Transfer storage transfer) internal returns (bool allApproved) {
        bool approved = false;
        uint256 pendingApproverCount = 0;
        ApprovalCriteria memory approvalCriteria = _approvalCriteria[transfer.tokenAddress];
        for (uint256 i = 0; i < transfer.approvers.length; i++) {
            Approver storage approver = transfer.approvers[i];
            if (approver.approved) {
                continue;
            }

            if (approved) {
                pendingApproverCount++;
                break;
            }

            if (_canApprove(transfer, approver)) {
                approved = true;
                approver.approved = true;

                if (approver.wallet == address(0)) {
                    approver.wallet = msg.sender;
                }

                emit TransferApproved(transferID, msg.sender);
                continue;
            }

            if (approvalCriteria.sequentialApproval) {
                revert ApprovalsMustBeSequential(transferID);
            }

            pendingApproverCount++;
        }

        if (!approved) {
            revert ApproverNotFound(transferID, msg.sender);
        }

        return pendingApproverCount == 0;
    }

    function _completeTransfer(bytes32 transferID, Transfer storage transfer) internal {
        transfer.status = TransferStatus.COMPLETED;
        _transferTokensTo(transfer, transfer.recipient);
        emit TransferCompleted(
            transferID,
            transfer.tokenAddress,
            transfer.sender,
            transfer.recipient,
            transfer.amount
        );
    }

    function _approvalCriteriaChanged(bytes32 transferID, Transfer storage transfer) internal returns (bool) {
        ApprovalCriteria memory approvalCriteria = _approvalCriteria[transfer.tokenAddress];
        if (transfer.approvalCriteriaHash == approvalCriteria.hash) {
            return false;
        }

        delete transfer.approvers;
        _addApproversToTransfer(transfer, approvalCriteria);
        transfer.approvalCriteriaHash = approvalCriteria.hash;
        emit TransferApprovalStateReset(
            transferID,
            transfer.approvers,
            transfer.approvalCriteriaHash
        );

        return true;
    }

    function _addApproversToTransfer(Transfer storage transfer, ApprovalCriteria memory approvalCriteria) internal {
        if (approvalCriteria.includeRecipientApprover) {
            transfer.approvers.push(Approver(transfer.recipient, false, false));
        }

        if (approvalCriteria.includeAgentApprover) {
            transfer.approvers.push(Approver(address(0), true, false));
        }

        for (uint256 i = 0; i < approvalCriteria.additionalApprovers.length; i++) {
            transfer.approvers.push(Approver(approvalCriteria.additionalApprovers[i], false, false));
        }
    }

    function _transferTokensTo(Transfer memory transfer, address to) internal {
        bool transferSent = IToken(transfer.tokenAddress).transfer(to, transfer.amount);
        if (!transferSent) {
            revert TokenTransferFailed(transfer.tokenAddress, address(this), transfer.sender, transfer.amount);
        }
    }

    function _canApprove(Transfer memory transfer, Approver memory approver) internal view returns (bool) {
        return approver.wallet == msg.sender ||
            (approver.anyTokenAgent && approver.wallet == address(0) && AgentRole(transfer.tokenAddress).isAgent(msg.sender));
    }

    function _getPendingTransfer(bytes32 transferID) internal view returns (Transfer storage) {
        Transfer storage transfer = _transfers[transferID];
        if (transfer.tokenAddress == address(0)) {
            revert InvalidTransferID(transferID);
        }

        if (transfer.status != TransferStatus.PENDING) {
            revert TransferIsNotInPendingStatus(transferID);
        }

        return transfer;
    }
}
