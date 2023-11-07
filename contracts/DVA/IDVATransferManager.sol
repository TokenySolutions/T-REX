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

interface IDVATransferManager {
    enum TransferStatus {
        PENDING,
        COMPLETED,
        CANCELLED,
        REJECTED
    }

    struct ApprovalCriteria {
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

    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    /**
     *  this event is emitted whenever an approval criteria of a token is modified.
     *  the event is emitted by 'setApprovalCriteria' function.
     *  `tokenAddress` is the token address.
     *  `includeRecipientApprover` determines whether the recipient is included in the approver list
     *  `includeAgentApprover` determines whether the agent is included in the approver list
     *  `sequentialApproval` determines whether approvals must be sequential
     *  `additionalApprovers` are the addresses of additional approvers to be added to the approver list
     *  `hash` is the approval criteria hash
     */
    event ApprovalCriteriaSet(
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
        bytes32 approvalCriteriaHash
    );

    error OnlyTokenAgentCanCall(address _tokenAddress);

    error OnlyTransferSenderCanCall(bytes32 _transferID);

    error TokenIsNotRegistered(address _tokenAddress);

    error RecipientIsNotVerified(address _tokenAddress, address _recipient);

    error DVAManagerIsNotVerifiedForTheToken(address _tokenAddress);

    error InvalidTransferID(bytes32 _transferID);

    error TransferIsNotInPendingStatus(bytes32 _transferID);

    error ApprovalsMustBeSequential(bytes32 _transferID);

    error ApproverNotFound(bytes32 _transferID, address _approver);

    error SignaturesCanNotBeEmpty(bytes32 _transferID);

    /**
    *  @dev modify the approval criteria of a token
     *  @param tokenAddress is the token address.
     *  @param includeRecipientApprover determines whether the recipient is included in the approver list
     *  @param includeAgentApprover determines whether the agent is included in the approver list
     *  @param sequentialApproval determines whether approvals must be sequential
     *  @param additionalApprovers are the addresses of additional approvers to be added to the approver list
     *  Only token owner can call this function
     *  DVATransferManager must be an agent of the given token
     *  emits an `ApprovalCriteriaSet` event
     */
    function setApprovalCriteria(
        address tokenAddress,
        bool includeRecipientApprover,
        bool includeAgentApprover,
        bool sequentialApproval,
        address[] memory additionalApprovers
    ) external;

    /**
     *  @dev initiates a new transfer
     *  @param tokenAddress is the address of the token
     *  @param recipient is the address of the recipient
     *  @param amount is the transfer amount
     *  Approval criteria must be preset for the given token address
     *  Sender must give DvA an allowance of at least the specified amount
     *  Receiver must be verified for the given token address
     *  emits a `TransferInitiated` event
     */
    function initiateTransfer(address tokenAddress, address recipient, uint256 amount) external;

    /**
     *  @dev approves a transfer
     *  @param transferID is the unique ID of the transfer
     *  msg.sender must be an approver of the transfer
     *  emits a `TransferApproved` event
     *  emits a `TransferCompleted` event (if all approvers approved the transfer)
     *  emits a `TransferApprovalStateReset` event (if transfer approval criteria have been reset)
     */
    function approveTransfer(bytes32 transferID) external;

    /**
     *  @dev approves a transfer with delegated signatures
     *  @param transferID is the unique ID of the transfer
     *  @param signatures is the array of signatures of the approvers
     *  emits a `TransferApproved` event
     *  emits a `TransferCompleted` event (if all approvers approved the transfer)
     *  emits a `TransferApprovalStateReset` event (if transfer approval criteria have been reset)
     */
    function delegateApproveTransfer(bytes32 transferID, Signature[] memory signatures) external;

    /**
     *  @dev cancels a transfer
     *  @param transferID is the unique ID of the transfer
     *  msg.sender must be the sender of the transfer
     *  emits a `TransferCancelled` event
     */
    function cancelTransfer(bytes32 transferID) external;

    /**
     *  @dev rejects a transfer
     *  @param transferID is the unique ID of the transfer
     *  msg.sender must be an approver of the transfer
     *  emits a `TransferRejected` event
     *  emits a `TransferApprovalStateReset` event (if transfer approval criteria have been reset)
     */
    function rejectTransfer(bytes32 transferID) external;

    /**
     *  @dev getter for the approval criteria of tokens
     *  @param tokenAddress is the address of the token
     *  returns approval criteria of the token
     */
    function getApprovalCriteria(address tokenAddress) external view returns (ApprovalCriteria memory);

    /**
     *  @dev getter for the transfer
     *  @param transferID is the unique ID of the transfer
     *  returns transfer
     */
    function getTransfer(bytes32 transferID) external view returns (Transfer memory);

    /**
     *  @dev getter for the next approver of a transfer
     *  @param transferID is the unique ID of the transfer
     *  returns address of the next approver and any token agent flag
     */
    function getNextApprover(bytes32 transferID) external view returns (address nextApprover, bool anyTokenAgent) ;

    /**
     *  @dev getter for the next unique nonce value
     *  returns nonce
     */
    function getNextTxNonce() external view returns (uint256);

    /**
     *  @dev getter for the name of the manager
     *  @return _name the name of the manager
     */
    function name() external pure returns (string memory _name);

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
    ) external pure returns (bytes32);
}

