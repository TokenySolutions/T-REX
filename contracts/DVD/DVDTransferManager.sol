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


contract DVDTransferManager is Ownable {

    /// Types

    struct Delivery {
        address counterpart;
        address token;
        uint256 amount;
    }

    struct Fee {
        uint token1Fee;
        uint token2Fee;
        uint feeBase;
        address fee1Wallet;
        address fee2Wallet;
    }

    struct TxFees {
        uint txFee1;
        uint txFee2;
        address fee1Wallet;
        address fee2Wallet;
    }

    /// variables

    // fee details linked to a parity of tokens
    mapping(bytes32 => Fee) public fee;

    // tokens to deliver by DVD transfer maker
    mapping(bytes32 => Delivery) public token1ToDeliver;

    // tokens to deliver by DVD transfer taker
    mapping(bytes32 => Delivery) public token2ToDeliver;

    // nonce of the transaction allowing the creation of unique transferID
    uint256 public txNonce;

    /// events

    /**
     * @dev Emitted when a DVD transfer is initiated by `maker` to swap `token1Amount` tokens `token1` (TREX or not)
     * for `token2Amount` tokens `token2` with `taker`
     * this event is emitted by the `initiateDVDTransfer` function
     */
    event DVDTransferInitiated(
        bytes32 indexed transferID,
        address maker,
        address indexed token1,
        uint256 token1Amount,
        address taker,
        address indexed token2,
        uint256 token2Amount);

    /**
     * @dev Emitted when a DVD transfer is validated by `taker` and
     * executed either by `taker` either by the agent of the TREX token
     * if the TREX token is subject to conditional transfers
     * this event is emitted by the `takeDVDTransfer` function
     */
    event DVDTransferExecuted(bytes32 indexed transferID);

    /**
     * @dev Emitted when a DVD transfer is cancelled
     * this event is emitted by the `cancelDVDTransfer` function
     */
    event DVDTransferCancelled(bytes32 indexed transferID);

    /**
     * @dev Emitted when a DVD transfer is cancelled
     * this event is emitted by the `cancelDVDTransfer` function
     */
    event FeeModified(
        bytes32 indexed parity,
        address token1,
        address token2,
        uint fee1,
        uint fee2,
        uint feeBase,
        address fee1Wallet,
        address fee2Wallet);

    /// functions

    // initiates the nonce at 0
    constructor(){
        txNonce = 0;
    }

    /**
     *  @dev modify the fees applied to a parity of tokens (tokens can be TREX or ERC20)
     *  @param _token1 the address of the base token for the parity `_token1`/`_token2`
     *  @param _token2 the address of the counterpart token for the parity `_token1`/`_token2`
     *  @param _fee1 the fee to apply on `_token1` leg of the DVD transfer per 10^`_feeBase`
     *  @param _fee2 the fee to apply on `_token2` leg of the DVD transfer per 10^`_feeBase`
     *  @param _feeBase the precision of the fee setting, e.g.
     *  if `_feeBase` == 2 then `_fee1` and `_fee2` are in % (fee/10^`_feeBase`)
     *  @param _fee1Wallet the wallet address receiving fees applied on `_token1`
     *  @param _fee2Wallet the wallet address receiving fees applied on `_token2`
     *  `_token1` and `_token2` need to be ERC20 or TREX tokens addresses, otherwise the transaction will fail
     *  `msg.sender` has to be owner of the DVD contract or the owner of the TREX token involved in the parity (if any)
     *  requires fees to be lower than 100%
     *  requires `_feeBase` to be higher or equal to 2 (precision 10^2)
     *  requires `_feeBase` to be lower or equal to 5 (precision 10^5) to avoid overflows
     *  requires `_fee1Wallet` & `_fee2Wallet` to be non empty addresses if `_fee1` & `_fee2` are respectively set
     *  note that if fees are not set for a parity the default fee is basically 0%
     *  emits a `FeeModified` event
     */
    function modifyFee(
        address _token1,
        address _token2,
        uint _fee1,
        uint _fee2,
        uint _feeBase,
        address _fee1Wallet,
        address _fee2Wallet) external {
        require(
            msg.sender == owner() ||
            isTREXOwner(_token1, msg.sender) ||
            isTREXOwner(_token2, msg.sender)
            , "Ownable: only owner can call");
        require(
            IERC20(_token1).totalSupply() != 0 &&
            IERC20(_token2).totalSupply() != 0
            , "invalid address : address is not an ERC20");
        require(
            _fee1 <= 10**_feeBase && _fee1 >= 0 &&
            _fee2 <= 10**_feeBase && _fee2 >= 0 &&
            _feeBase <= 5 &&
            _feeBase >= 2
            , "invalid fee settings");
        if (_fee1 > 0) {
            require(_fee1Wallet != address(0), "fee wallet 1 cannot be zero address");
        }
        if (_fee2 > 0) {
            require(_fee2Wallet != address(0), "fee wallet 2 cannot be zero address");
        }
        bytes32 _parity = calculateParity(_token1, _token2);
        Fee memory parityFee;
        parityFee.token1Fee = _fee1;
        parityFee.token2Fee = _fee2;
        parityFee.feeBase = _feeBase;
        parityFee.fee1Wallet = _fee1Wallet;
        parityFee.fee2Wallet = _fee2Wallet;
        fee[_parity] = parityFee;
        emit FeeModified(_parity, _token1, _token2, _fee1, _fee2, _feeBase, _fee1Wallet, _fee2Wallet);
        bytes32 _reflectParity = calculateParity(_token2, _token1);
        Fee memory reflectParityFee;
        reflectParityFee.token1Fee = _fee2;
        reflectParityFee.token2Fee = _fee1;
        reflectParityFee.feeBase = _feeBase;
        reflectParityFee.fee1Wallet = _fee2Wallet;
        reflectParityFee.fee2Wallet = _fee1Wallet;
        fee[_reflectParity] = reflectParityFee;
        emit FeeModified(_reflectParity, _token2, _token1, _fee2, _fee1, _feeBase, _fee2Wallet, _fee1Wallet);
    }

    /**
     *  @dev initiates a DVD transfer between `msg.sender` & `_counterpart`
     *  @param _token1 the address of the token (ERC20 or TREX) provided by `msg.sender`
     *  @param _token1Amount the amount of `_token1` that `msg.sender` will send to `_counterpart` at DVD execution time
     *  @param _counterpart the address of the counterpart, which will receive `_token1Amount` of `_token1` in exchange for
     *  `_token2Amount` of `_token2`
     *  @param _token2 the address of the token (ERC20 or TREX) provided by `_counterpart`
     *  @param _token2Amount the amount of `_token2` that `_counterpart` will send to `msg.sender` at DVD execution time
     *  requires `msg.sender` to have enough `_token1` tokens to process the DVD transfer
     *  requires `DVDTransferManager` contract to have the necessary allowance to process the DVD transfer on `msg.sender`
     *  requires `_counterpart` to not be the 0 address
     *  requires `_token1` & `_token2` to be valid token addresses
     *  emits a `DVDTransferInitiated` event
     */
    function initiateDVDTransfer(
        address _token1,
        uint256 _token1Amount,
        address _counterpart,
        address _token2,
        uint256 _token2Amount) external {
        require(IERC20(_token1).balanceOf(msg.sender) >= _token1Amount, "Not enough tokens in balance");
        require(
            IERC20(_token1).allowance(msg.sender, address(this)) >= _token1Amount
            , "not enough allowance to initiate transfer");
        require (_counterpart != address(0), "counterpart cannot be null");
        require(IERC20(_token2).totalSupply() != 0, "invalid address : address is not an ERC20");
        Delivery memory token1;
        token1.counterpart = msg.sender;
        token1.token = _token1;
        token1.amount = _token1Amount;
        Delivery memory token2;
        token2.counterpart = _counterpart;
        token2.token = _token2;
        token2.amount = _token2Amount;
        bytes32 transferID =
        calculateTransferID(
                txNonce,
                token1.counterpart,
                token1.token,
                token1.amount,
                token2.counterpart,
                token2.token,
                token2.amount);
        token1ToDeliver[transferID] = token1;
        token2ToDeliver[transferID] = token2;
        emit DVDTransferInitiated(
                transferID,
                token1.counterpart,
                token1.token,
                token1.amount,
                token2.counterpart,
                token2.token,
                token2.amount);
        txNonce++;
    }

    /**
     *  @dev execute a DVD transfer that was previously initiated through the `initiateDVDTransfer` function
     *  @param _transferID the DVD transfer identifier as calculated through
     *  the `calculateTransferID` function for the initiated DVD transfer to execute
     *  requires `_transferID` to exist (DVD transfer has to be initiated)
     *  requires that taker (counterpart sending token2) has enough tokens in balance to process the DVD transfer
     *  requires that `DVDTransferManager` contract has enough allowance to process the `token2` leg of the DVD transfer
     *  requires that `msg.sender` is the taker OR the TREX agent in case a
     *  TREX token is involved in the transfer (in case of conditional transfer
     *  the agent can call the function when the transfer has been approved)
     *  if fees apply on one side or both sides of the transfer the fees will be sent,
     *  at transaction time, to the fees wallet previously set
     *  in case fees apply the counterparts will receive less than the amounts
     *  included in the DVD transfer as part of the transfer is redirected to the
     *  fee wallet at transfer execution time
     *  if one or both legs of the transfer are TREX, then all the relevant
     *  checks apply on the transaction (compliance + identity checks)
     *  and the transaction WILL FAIL if the TREX conditions of transfer are
     *  not respected, please refer to {Token-transfer} and {Token-transferFrom} to
     *  know more about TREX conditions for transfers
     *  once the DVD transfer is executed the `_transferID` is removed from the pending `_transferID` pool
     *  emits a `DVDTransferExecuted` event
     */
    function takeDVDTransfer(bytes32 _transferID) external {
        Delivery memory token1 = token1ToDeliver[_transferID];
        Delivery memory token2 = token2ToDeliver[_transferID];
        require(
            token1.counterpart != address(0) && token2.counterpart != address(0)
            , "transfer ID does not exist");
        IERC20 token1Contract = IERC20(token1.token);
        IERC20 token2Contract = IERC20(token2.token);
        require (
            msg.sender == token2.counterpart ||
            isTREXAgent(token1.token, msg.sender) ||
            isTREXAgent(token2.token, msg.sender)
            , "transfer has to be done by the counterpart or by owner");
        require(
            token2Contract.balanceOf(token2.counterpart) >= token2.amount
            , "Not enough tokens in balance");
        require(
            token2Contract.allowance(token2.counterpart, address(this)) >= token2.amount
            , "not enough allowance to transfer");
        TxFees memory fees = calculateFee(_transferID);
        if (fees.txFee1 != 0) {
            token1Contract.transferFrom(token1.counterpart, token2.counterpart, (token1.amount - fees.txFee1));
            token1Contract.transferFrom(token1.counterpart, fees.fee1Wallet, fees.txFee1);
        }
        if (fees.txFee1 == 0) {
            token1Contract.transferFrom(token1.counterpart, token2.counterpart, token1.amount);
        }
        if (fees.txFee2 != 0) {
            token2Contract.transferFrom(token2.counterpart, token1.counterpart, (token2.amount - fees.txFee2));
            token2Contract.transferFrom(token2.counterpart, fees.fee2Wallet, fees.txFee2);
        }
        if (fees.txFee2 == 0) {
            token2Contract.transferFrom(token2.counterpart, token1.counterpart, token2.amount);
        }
        delete token1ToDeliver[_transferID];
        delete token2ToDeliver[_transferID];
        emit DVDTransferExecuted(_transferID);
    }

    /**
     *  @dev delete a pending DVD transfer that was previously initiated
     *  through the `initiateDVDTransfer` function from the pool
     *  @param _transferID the DVD transfer identifier as calculated through
     *  the `calculateTransferID` function for the initiated DVD transfer to delete
     *  requires `_transferID` to exist (DVD transfer has to be initiated)
     *  requires that `msg.sender` is the taker or the maker or the `DVDTransferManager` contract
     *  owner or the TREX agent in case a TREX token is involved in the transfer
     *  once the `cancelDVDTransfer` is executed the `_transferID` is removed from the pending `_transferID` pool
     *  emits a `DVDTransferCancelled` event
     */
    function cancelDVDTransfer(bytes32 _transferID) external {
        Delivery memory token1 = token1ToDeliver[_transferID];
        Delivery memory token2 = token2ToDeliver[_transferID];
        require(token1.counterpart != address(0) && token2.counterpart != address(0), "transfer ID does not exist");
        require (
            msg.sender == token2.counterpart ||
            msg.sender == token1.counterpart ||
            msg.sender == owner() ||
            isTREXAgent(token1.token, msg.sender) ||
            isTREXAgent(token2.token, msg.sender)
            , "you are not allowed to cancel this transfer");
        delete token1ToDeliver[_transferID];
        delete token2ToDeliver[_transferID];
        emit DVDTransferCancelled(_transferID);
    }

    /**
     *  @dev check if `_token` corresponds to a functional TREX token (with identity registry initiated)
     *  @param _token the address token to check
     *  the function will try to call `identityRegistry()` on
     *  the address, which is a getter specific to TREX tokens
     *  if the call pass and returns an address it means that
     *  the token is a TREX, otherwise it's not a TREX
     *  return `true` if the token is a TREX, `false` otherwise
     */
    function isTREX(address _token) public view returns (bool) {
        try IToken(_token).identityRegistry() returns (IIdentityRegistry _ir) {
            if (address(_ir) != address(0)) {
                return true;
            }
        return false;
        }
        catch {
            return false;
        }
    }

    /**
     *  @dev check if `_user` is a TREX agent of `_token`
     *  @param _token the address token to check
     *  @param _user the wallet address
     *  if `_token` is a TREX token this function will check if `_user` is registered as an agent on it
     *  return `true` if `_user` is agent of `_token`, return `false` otherwise
     */
    function isTREXAgent(address _token, address _user) public view returns (bool) {
        if (isTREX(_token)){
            return AgentRole(_token).isAgent(_user);
        }
        return false;
    }

    /**
     *  @dev check if `_user` is a TREX owner of `_token`
     *  @param _token the address token to check
     *  @param _user the wallet address
     *  if `_token` is a TREX token this function will check if `_user` is registered as an owner on it
     *  return `true` if `_user` is owner of `_token`, return `false` otherwise
     */
    function isTREXOwner(address _token, address _user) public view returns (bool) {
        if (isTREX(_token)){
            return Ownable(_token).owner() == _user;
        }
        return false;
    }

    /**
     *  @dev calculates the fees to apply to a specific transfer depending
     *  on the fees applied to the parity used in the transfer
     *  @param _transferID the DVD transfer identifier as calculated through the
     *  `calculateTransferID` function for the transfer to calculate fees on
     *  requires `_transferID` to exist (DVD transfer has to be initiated)
     *  returns the fees to apply on each leg of the transfer in the form of a `TxFees` struct
     */
    function calculateFee(bytes32 _transferID) public view returns(TxFees memory) {
        TxFees memory fees;
        Delivery memory token1 = token1ToDeliver[_transferID];
        Delivery memory token2 = token2ToDeliver[_transferID];
        require(
            token1.counterpart != address(0) && token2.counterpart != address(0)
        , "transfer ID does not exist");
        bytes32 parity = calculateParity(token1.token, token2.token);
        Fee memory feeDetails = fee[parity];
        if (feeDetails.token1Fee != 0 || feeDetails.token2Fee != 0 ){
            uint _txFee1 =
            (token1.amount * feeDetails.token1Fee * 10**(feeDetails.feeBase - 2)) / (10**feeDetails.feeBase);
            uint _txFee2 =
            (token2.amount * feeDetails.token2Fee * 10**(feeDetails.feeBase - 2)) / (10**feeDetails.feeBase);
            fees.txFee1 = _txFee1;
            fees.txFee2 = _txFee2;
            fees.fee1Wallet = feeDetails.fee1Wallet;
            fees.fee2Wallet = feeDetails.fee2Wallet;
            return fees;
        }
        else {
            fees.txFee1 = 0;
            fees.txFee2 = 0;
            fees.fee1Wallet = address(0);
            fees.fee2Wallet = address(0);
            return fees;
        }
    }

    /**
     *  @dev calculates the parity byte signature
     *  @param _token1 the address of the base token
     *  @param _token2 the address of the counterpart token
     *  return the byte signature of the parity
     */
    function calculateParity (address _token1, address _token2) public pure returns (bytes32) {
        bytes32 parity = keccak256(abi.encode(_token1, _token2));
        return parity;
    }

    /**
     *  @dev calculates the transferID depending on DVD transfer parameters
     *  @param _nonce the nonce of the transfer on the smart contract
     *  @param _maker the address of the DVD transfer maker (initiator of the transfer)
     *  @param _token1 the address of the token that the maker is providing
     *  @param _token1Amount the amount of tokens `_token1` provided by the maker
     *  @param _taker the address of the DVD transfer taker (executor of the transfer)
     *  @param _token2 the address of the token that the taker is providing
     *  @param _token2Amount the amount of tokens `_token2` provided by the taker
     *  return the identifier of the DVD transfer as a byte signature
     */
    function calculateTransferID (
        uint256 _nonce,
        address _maker,
        address _token1,
        uint256 _token1Amount,
        address _taker,
        address _token2,
        uint256 _token2Amount
    ) public pure returns (bytes32){
        bytes32 transferID = keccak256(abi.encode(
                _nonce, _maker, _token1, _token1Amount, _taker, _token2, _token2Amount
            ));
        return transferID;
    }
}
