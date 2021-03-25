// SPDX-License-Identifier: GPL-3.0
/**
 *     NOTICE
 *
 *     The T-REX software is licensed under a proprietary license or the GPL v.3.
 *     If you choose to receive it under the GPL v.3 license, the following applies:
 *     T-REX is a suite of smart contracts developed by Tokeny to manage and transfer financial assets on the ethereum blockchain
 *
 *     Copyright (C) 2019, Tokeny sàrl.
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
import '../access/Ownable.sol';
import '../token/IToken.sol';


contract DVDTransferManager is Ownable {

    event DVDTransferInitiated(bytes32 indexed transferID, address maker, address indexed trex, uint256 trexAmount, address taker, address indexed erc20, uint256 erc20Amount);
    event DVDTransferExecuted(bytes32 indexed transferID);
    event DVDTransferCancelled(bytes32 indexed transferID);
    event ParityApproved(bytes32 indexed parity, address trex, address erc20);
    event ParityRemoved(bytes32 indexed parity, address trex, address erc20);

    struct Delivery {
        address counterpart;
        address token;
        uint256 amount;
    }

    mapping(bytes32 => bool) public authorizedParity;
    mapping(bytes32 => Delivery) public trexToDeliver;
    mapping(bytes32 => Delivery) public erc20ToDeliver;



    function calculateParity (address _trex, address _erc20) public pure returns (bytes32) {
        bytes32 parity = keccak256(abi.encode(_trex, _erc20));
        return parity;
    }

    function calculateTransferID (
        address _maker,
        address _trex,
        uint256 _trexAmount,
        address _taker,
        address _erc20,
        uint256 _erc20Amount
    ) public pure returns (bytes32){
        bytes32 transferID = keccak256(abi.encode(_maker, _trex, _trexAmount, _taker, _erc20, _erc20Amount));
        return transferID;
    }


    function authorizeParity(address _trex, address _erc20) external onlyOwner {
        bytes32 parity = calculateParity(_trex, _erc20);
        require (!authorizedParity[parity], 'parity already approved');
        authorizedParity[parity] = true;
        emit ParityApproved(parity, _trex, _erc20);
    }

    function unAuthorizeParity(address _trex, address _erc20) external onlyOwner {
        bytes32 parity = calculateParity(_trex, _erc20);
        require (authorizedParity[parity], 'parity does not exist');
        authorizedParity[parity] = false;
        emit ParityRemoved(parity, _trex, _erc20);
    }

    function initiateDVDTransfer(address _trexToken, uint256 _trexAmount, address _counterpart, address _erc20Token, uint256 _erc20amount) external {
        require(IToken(_trexToken).balanceOf(msg.sender) >= _trexAmount, 'Not enough T-REX tokens in balance');
        require(IToken(_trexToken).allowance(msg.sender, address(this)) >= _trexAmount, 'not enough allowance to transfer');
        require (authorizedParity[calculateParity(_trexToken, _erc20Token)], 'parity not approved');
        require (_counterpart != address(0), 'counterpart cannot be null');
        Delivery memory trex;
        trex.counterpart = msg.sender;
        trex.token = _trexToken;
        trex.amount = _trexAmount;
        Delivery memory erc20;
        erc20.counterpart = _counterpart;
        erc20.token = _erc20Token;
        erc20.amount = _erc20amount;
        bytes32 transferID = calculateTransferID(trex.counterpart, trex.token, trex.amount, erc20.counterpart, erc20.token, erc20.amount);
        trexToDeliver[transferID] = trex;
        erc20ToDeliver[transferID] = erc20;
        emit DVDTransferInitiated(transferID,trex.counterpart, trex.token, trex.amount, erc20.counterpart, erc20.token, erc20.amount);
    }

    function takeDVDTransfer(bytes32 _transferID) external {
        Delivery memory trex = trexToDeliver[_transferID];
        Delivery memory erc20 = erc20ToDeliver[_transferID];
        require(trex.counterpart != address(0) && erc20.counterpart != address(0), 'transfer ID does not exist');
        IToken trexToken = IToken(trex.token);
        IERC20 erc20Token = IERC20(erc20.token);
        require (msg.sender == erc20.counterpart, 'transfer has to be made by the counterpart');
        require(erc20Token.balanceOf(msg.sender) >= erc20.amount, 'Not enough tokens in balance');
        require(erc20Token.allowance(msg.sender, address(this)) >= erc20.amount, 'not enough allowance to transfer');
        trexToken.transferFrom(trex.counterpart, erc20.counterpart, trex.amount);
        erc20Token.transferFrom(erc20.counterpart, trex.counterpart, erc20.amount);
        delete trexToDeliver[_transferID];
        delete erc20ToDeliver[_transferID];
        emit DVDTransferExecuted(_transferID);
    }

    function cancelDVDTransfer(bytes32 _transferID) external {
        Delivery memory trex = trexToDeliver[_transferID];
        Delivery memory erc20 = erc20ToDeliver[_transferID];
        require(trex.counterpart != address(0) && erc20.counterpart != address(0), 'transfer ID does not exist');
        require (msg.sender == erc20.counterpart || msg.sender == trex.counterpart || msg.sender == owner() , 'you are not allowed to cancel this transfer');
        delete trexToDeliver[_transferID];
        delete erc20ToDeliver[_transferID];
        emit DVDTransferCancelled(_transferID);
    }

}
