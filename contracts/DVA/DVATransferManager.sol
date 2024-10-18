// SPDX-License-Identifier: GPL-3.0
// This contract is also licensed under the Creative Commons Attribution-NonCommercial 4.0 International License.
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
 *     Copyright (C) 2024, Tokeny sàrl.
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
 *
 *     This specific smart contract is also licensed under the Creative Commons
 *     Attribution-NonCommercial 4.0 International License (CC-BY-NC-4.0),
 *     which prohibits commercial use. For commercial inquiries, please contact
 *     Tokeny sàrl for licensing options.
 */

pragma solidity 0.8.27;

import "../roles/AgentRole.sol";
import "../token/IToken.sol";
import "./IDVATransferManager.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../utils/OwnableOnceNext2StepUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "../roles/IERC173.sol";

contract DVATransferManager is IDVATransferManager, Initializable, OwnableOnceNext2StepUpgradeable, UUPSUpgradeable, IERC165 {

    // Mapping for token approval criteria
    mapping(address => ApprovalCriteria) private _approvalCriteria;

    // Mapping for transfer requests
    mapping(bytes32 => Transfer) private _transfers;

    // nonce of the transaction allowing the creation of unique transferID
    uint256 private _txNonce;

    function initialize() external initializer {
        __Ownable_init();
        _txNonce = 0;
    }

    /**
     *  @dev See {IDVATransferManager-setApprovalCriteria}
     */
    function setApprovalCriteria(
        address tokenAddress,
        bool includeRecipientApprover,
        bool includeAgentApprover,
        bool sequentialApproval,
        address[] memory additionalApprovers
    ) external {
        require(AgentRole(tokenAddress).owner() == msg.sender, OnlyTokenOwnerCanCall(tokenAddress));
        require(AgentRole(tokenAddress).isAgent(address(this)), DVAManagerIsNotAnAgentOfTheToken(tokenAddress));

        bytes32 hash = keccak256(
            abi.encode(
                tokenAddress,
                includeRecipientApprover,
                includeAgentApprover,
                additionalApprovers
            )
        );

        _approvalCriteria[tokenAddress] = ApprovalCriteria(
            includeRecipientApprover,
            includeAgentApprover,
            sequentialApproval,
            additionalApprovers,
            hash);

        emit ApprovalCriteriaSet(
            tokenAddress,
            includeRecipientApprover,
            includeAgentApprover,
            sequentialApproval,
            additionalApprovers,
            hash
        );
    }

    /**
     *  @dev See {IDVATransferManager-initiateTransfer}
     */
    function initiateTransfer(address tokenAddress, address recipient, uint256 amount) external {
        ApprovalCriteria memory approvalCriteria = _approvalCriteria[tokenAddress];
        require(approvalCriteria.hash != bytes32(0), TokenIsNotRegistered(tokenAddress));

        IToken token = IToken(tokenAddress);
        require(token.identityRegistry().isVerified(recipient), RecipientIsNotVerified(tokenAddress, recipient));

        token.freezePartialTokens(msg.sender, amount);

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
            approvalCriteria.hash
        );
    }

    /**
     *  @dev See {IDVATransferManager-approveTransfer}
     */
    function approveTransfer(bytes32 transferID) external {
        Transfer storage transfer = _getPendingTransfer(transferID);
        if (_approvalCriteriaChanged(transferID, transfer)) {
            return;
        }

        bool allApproved = _approveTransfer(transferID, transfer, msg.sender);
        if (allApproved) {
            _completeTransfer(transferID, transfer);
        }
    }

    /**
     *  @dev See {IDVATransferManager-delegateApproveTransfer}
     */
    function delegateApproveTransfer(bytes32 transferID, Signature[] memory signatures) external {
        require(signatures.length > 0, SignaturesCanNotBeEmpty(transferID));

        Transfer storage transfer = _getPendingTransfer(transferID);
        if (_approvalCriteriaChanged(transferID, transfer)) {
            return;
        }

        bytes32 transferHash = _generateTransferSignatureHash(transferID);
        for (uint256 i = 0; i < signatures.length; i++) {
            Signature memory signature = signatures[i];
            address signer = ecrecover(transferHash, signature.v, signature.r, signature.s);

            bool allApproved = _approveTransfer(transferID, transfer, signer);
            if (allApproved) {
                _completeTransfer(transferID, transfer);
                return;
            }
        }
    }

    /**
     *  @dev See {IDVATransferManager-cancelTransfer}
     */
    function cancelTransfer(bytes32 transferID) external {
        Transfer storage transfer = _getPendingTransfer(transferID);
        require(msg.sender == transfer.sender, OnlyTransferSenderCanCall(transferID));

        transfer.status = TransferStatus.CANCELLED;
        IToken(transfer.tokenAddress).unfreezePartialTokens(transfer.sender, transfer.amount);
        emit TransferCancelled(transferID);
    }

    /**
     *  @dev See {IDVATransferManager-rejectTransfer}
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

            if (_canApprove(transfer, approver, msg.sender)) {
                rejected = true;
                break;
            }

            require(!approvalCriteria.sequentialApproval, ApprovalsMustBeSequential(transferID));
        }

        require(rejected, ApproverNotFound(transferID, msg.sender));

        transfer.status = TransferStatus.REJECTED;
        IToken(transfer.tokenAddress).unfreezePartialTokens(transfer.sender, transfer.amount);
        emit TransferRejected(transferID, msg.sender);
    }

    /**
     *  @dev See {IDVATransferManager-getApprovalCriteria}
     */
    function getApprovalCriteria(address tokenAddress) external view returns (ApprovalCriteria memory) {
        ApprovalCriteria memory approvalCriteria = _approvalCriteria[tokenAddress];
        require(approvalCriteria.hash != bytes32(0), TokenIsNotRegistered(tokenAddress));

        return approvalCriteria;
    }

    /**
     *  @dev getter for the transfer
     *  @param transferID is the unique ID of the transfer
     *  returns transfer
     */
    function getTransfer(bytes32 transferID) external view returns (Transfer memory) {
        Transfer memory transfer = _transfers[transferID];
        require(transfer.tokenAddress != address(0), InvalidTransferID(transferID));

        return transfer;
    }

    /**
     *  @dev See {IDVATransferManager-getNextApprover}
     */
    function getNextApprover(bytes32 transferID) external view returns (address nextApprover, bool anyTokenAgent) {
        Transfer storage transfer = _getPendingTransfer(transferID);
        for (uint256 i = 0; i < transfer.approvers.length; i++) {
            if (transfer.approvers[i].approved) {
                continue;
            }

            nextApprover = transfer.approvers[i].wallet;
            anyTokenAgent = transfer.approvers[i].anyTokenAgent;
            break;
        }

        return (nextApprover, anyTokenAgent);
    }

    /**
     *  @dev See {IDVATransferManager-getNextTxNonce}
     */
    function getNextTxNonce() external view returns (uint256) {
        return _txNonce;
    }

    /**
     *  @dev See {IDVATransferManager-name}
     */
    function name() external pure returns (string memory _name) {
        return "DVATransferManager";
    }

    /**
     *  @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public pure virtual override returns (bool) {
        return
            interfaceId == type(IDVATransferManager).interfaceId ||
            interfaceId == type(IERC173).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }

    /**
     *  @dev See {IDVATransferManager-calculateTransferID}
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
    function _approveTransfer(bytes32 transferID, Transfer storage transfer, address caller) internal returns (bool allApproved) {
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

            if (_canApprove(transfer, approver, caller)) {
                approved = true;
                approver.approved = true;

                if (approver.wallet == address(0)) {
                    approver.wallet = caller;
                }

                emit TransferApproved(transferID, caller);
                continue;
            }

            require(!approvalCriteria.sequentialApproval, ApprovalsMustBeSequential(transferID));

            pendingApproverCount++;
        }

        require(approved, ApproverNotFound(transferID, caller));

        return pendingApproverCount == 0;
    }

    function _completeTransfer(bytes32 transferID, Transfer storage transfer) internal {
        transfer.status = TransferStatus.COMPLETED;
        IToken token = IToken(transfer.tokenAddress);
        token.unfreezePartialTokens(transfer.sender, transfer.amount);
        token.transferFrom(transfer.sender, address(this), transfer.amount);
        token.transfer(transfer.recipient, transfer.amount);
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

    function _canApprove(Transfer memory transfer, Approver memory approver, address caller) internal view returns (bool) {
        return approver.wallet == caller ||
            (approver.anyTokenAgent && approver.wallet == address(0) && AgentRole(transfer.tokenAddress).isAgent(caller));
    }

    function _getPendingTransfer(bytes32 transferID) internal view returns (Transfer storage) {
        Transfer storage transfer = _transfers[transferID];
        require(transfer.tokenAddress != address(0), InvalidTransferID(transferID));
        require(transfer.status == TransferStatus.PENDING, TransferIsNotInPendingStatus(transferID));

        return transfer;
    }

    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address /*newImplementation*/) internal view override virtual onlyOwner { }

    function _generateTransferSignatureHash(bytes32 transferID) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", transferID));
    }
}
