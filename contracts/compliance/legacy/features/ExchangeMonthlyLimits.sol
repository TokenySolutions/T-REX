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
 *  this feature allows to put a limit on the monthly deposits one can make on a given exchange
 *  It won't be possible for an investor to send more than the monthly limit of tokens on a given exchange
 */
abstract contract ExchangeMonthlyLimits is BasicCompliance {

    /// Struct of transfer Counters
    struct ExchangeTransferCounter {
        uint256 monthlyCount;
        uint256 monthlyTimer;
    }

    /// Getter for Tokens monthlyLimit
    mapping(address => uint256) private _exchangeMonthlyLimit;

    /// Mapping for users Counters
    mapping(address => mapping(address => ExchangeTransferCounter)) private _exchangeCounters;

    /// Mapping for wallets tagged as exchange wallets
    mapping(address => bool) private _exchangeIDs;

    /**
     *  this event is emitted whenever the Exchange Limit has been updated.
     *  the event is emitted by 'setExchangeMonthlyLimit'
     *  `_exchangeID` is the amount ONCHAINID address of the exchange.
     *  `_newExchangeMonthlyLimit` is the amount Limit of tokens to be transferred monthly to an exchange wallet.
     */
    event ExchangeMonthlyLimitUpdated(address _exchangeID, uint _newExchangeMonthlyLimit);

    /**
     *  this event is emitted whenever an ONCHAINID is tagged as being an exchange ID.
     *  the event is emitted by 'addExchangeID'.
     *  `_newExchangeID` is the ONCHAINID address of the exchange to add.
     */
    event ExchangeIDAdded(address _newExchangeID);

    /**
     *  this event is emitted whenever an ONCHAINID is untagged as belonging to an exchange.
     *  the event is emitted by 'removeExchangeID'.
     *  `_exchangeID` is the ONCHAINID being untagged as an exchange ID.
     */
    event ExchangeIDRemoved(address _exchangeID);

    /**
     *  @dev Set the limit of tokens allowed to be transferred monthly.
     *  @param _exchangeID ONCHAINID of the exchange
     *  @param _newExchangeMonthlyLimit The new monthly limit of tokens
     *  Only the owner of the Compliance smart contract can call this function
     */
    function setExchangeMonthlyLimit(address _exchangeID, uint256 _newExchangeMonthlyLimit) external onlyOwner {
        _exchangeMonthlyLimit[_exchangeID] = _newExchangeMonthlyLimit;
        emit ExchangeMonthlyLimitUpdated(_exchangeID, _newExchangeMonthlyLimit);
    }

    /**
    *  @dev tags the ONCHAINID as being an exchange ID
    *  @param _exchangeID ONCHAINID to be tagged
    *  Function can be called only by owner of the compliance contract
    *  Cannot be called on an address already tagged as being an exchange
    *  emits an `ExchangeIDAdded` event
    */
    function addExchangeID(address _exchangeID) public onlyOwner {
        require(!isExchangeID(_exchangeID), "ONCHAINID already tagged as exchange");
        _exchangeIDs[_exchangeID] = true;
        emit ExchangeIDAdded(_exchangeID);
    }

    /**
    *  @dev untags the ONCHAINID as being an exchange ID
    *  @param _exchangeID ONCHAINID to be untagged
    *  Function can be called only by owner of the compliance contract
    *  Cannot be called on an address not tagged as being an exchange
    *  emits an `ExchangeIDRemoved` event
    */
    function removeExchangeID(address _exchangeID) public onlyOwner {
        require(isExchangeID(_exchangeID), "ONCHAINID not tagged as exchange");
        _exchangeIDs[_exchangeID] = false;
        emit ExchangeIDRemoved(_exchangeID);
    }

    /**
    *  @dev getter for `_exchangeIDs` variable
    *  tells to the caller if an ONCHAINID belongs to an exchange or not
    *  @param _exchangeID ONCHAINID to be checked
    *  returns TRUE if the address corresponds to an exchange, FALSE otherwise
    */
    function isExchangeID(address _exchangeID) public view returns (bool){
        return _exchangeIDs[_exchangeID];
    }

    /**
    *  @dev getter for `exchangeCounters` variable on the counter parameter of the ExchangeTransferCounter struct
    *  @param _exchangeID exchange ONCHAINID
    *  @param _investorID ONCHAINID to be checked
    *  returns current monthly counter of `_investorID` on `exchangeID` exchange
    */
    function getMonthlyCounter(address _exchangeID, address _investorID) public view returns (uint256) {
        return (_exchangeCounters[_exchangeID][_investorID]).monthlyCount;
    }

    /**
    *  @dev getter for `exchangeCounters` variable on the timer parameter of the ExchangeTransferCounter struct
    *  @param _exchangeID exchange ONCHAINID
    *  @param _investorID ONCHAINID to be checked
    *  returns current timer of `_investorID` on `exchangeID` exchange
    */
    function getMonthlyTimer(address _exchangeID, address _investorID) public view returns (uint256) {
        return (_exchangeCounters[_exchangeID][_investorID]).monthlyTimer;
    }

    /**
    *  @dev getter for `exchangeMonthlyLimit` variable
    *  @param _exchangeID exchange ONCHAINID
    *  returns the monthly limit set for that exchange
    */
    function getExchangeMonthlyLimit(address _exchangeID) public view returns (uint256) {
        return _exchangeMonthlyLimit[_exchangeID];
    }

    /**
    *  @dev check on the compliance status of a transaction.
    *  If the check returns TRUE, the transfer is allowed to be executed, if the check returns FALSE, the compliance
    *  feature will block the transfer execution
    *  The check will verify if the transfer is done to an exchange wallet, if it is the case it will check if the
    *  transfer respects the limitations in terms of authorized monthly deposit volume, if it does the check
    *  will return true, if the transfer doesn't respect the limitations it will return false and block the transfer
    *  Agents are allowed to bypass this check
    *  @param _from the address of the transfer sender
    *  @param _to the address of the transfer receiver
    *  @param _value the amount of tokens that `_from` would send to `_to`
    */
    function complianceCheckOnExchangeMonthlyLimits(address _from, address _to, uint256 _value) public view returns
    (bool) {
        address senderIdentity = _getIdentity(_from);
        address receiverIdentity = _getIdentity(_to);
        if (!isTokenAgent(_from) && _from != address(0)) {
            if (isExchangeID(receiverIdentity)) {
                if(_value > _exchangeMonthlyLimit[receiverIdentity]) {
                    return false;
                }
                if (!_isExchangeMonthFinished(receiverIdentity, senderIdentity)
                && ((getMonthlyCounter(receiverIdentity, senderIdentity) + _value > _exchangeMonthlyLimit[receiverIdentity]))) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
    *  @dev state update of the compliance feature post-transfer.
    *  updates counters if the receiver address is linked to an exchange ONCHAINID and sender is not an agent
    *  @param _from the address of the transfer sender
    *  @param _to the address of the transfer receiver
    *  @param _value the amount of tokens that `_from` sent to `_to`
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _transferActionOnExchangeMonthlyLimits(address _from, address _to, uint256 _value) internal {
        address senderIdentity = _getIdentity(_from);
        address receiverIdentity = _getIdentity(_to);
        if(isExchangeID(receiverIdentity) && !isTokenAgent(_from)) {
            _increaseExchangeCounters(senderIdentity, receiverIdentity, _value);
        }
    }

    /**
    *  @dev state update of the compliance feature post-minting.
    *  this compliance feature doesn't require state update post-minting
    *  @param _to the address of the minting beneficiary
    *  @param _value the amount of tokens minted on `_to` wallet
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    // solhint-disable-next-line no-empty-blocks
    function _creationActionOnExchangeMonthlyLimits(address _to, uint256 _value) internal {}

    /**
    *  @dev state update of the compliance feature post-burning.
    *  this compliance feature doesn't require state update post-burning
    *  @param _from the wallet address on which tokens burnt
    *  @param _value the amount of tokens burnt from `_from` wallet
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    // solhint-disable-next-line no-empty-blocks
    function _destructionActionOnExchangeMonthlyLimits(address _from, uint256 _value) internal {}

    /**
    *  @dev Checks if monthly cooldown must be reset, then check if _value sent has been exceeded,
    *  if not increases user's OnchainID counters.
    *  @param _exchangeID ONCHAINID of the exchange
    *  @param _investorID address on which counters will be increased
    *  @param _value, value of transaction)to be increased
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _increaseExchangeCounters(address _exchangeID, address _investorID, uint256 _value) internal {
        _resetExchangeMonthlyCooldown(_exchangeID, _investorID);

        if ((getMonthlyCounter(_exchangeID, _investorID) + _value) <= _exchangeMonthlyLimit[_exchangeID]) {
            (_exchangeCounters[_exchangeID][_investorID]).monthlyCount += _value;
        }
    }

    /**
    *  @dev resets cooldown for the month if cooldown has reached the time limit of 30days
    *  @param _exchangeID ONCHAINID of the exchange
    *  @param _investorID ONCHAINID to reset
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _resetExchangeMonthlyCooldown(address _exchangeID, address _investorID) internal {
        if (_isExchangeMonthFinished(_exchangeID, _investorID)) {
            (_exchangeCounters[_exchangeID][_investorID]).monthlyTimer = block.timestamp + 30 days;
            (_exchangeCounters[_exchangeID][_investorID]).monthlyCount = 0;
        }
    }

    /**
    *  @dev checks if the month has finished since the cooldown has been triggered for this identity
    *  @param _exchangeID ONCHAINID of the exchange
    *  @param _investorID ONCHAINID to be checked
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _isExchangeMonthFinished(address _exchangeID, address _investorID) internal view returns (bool) {
        return (getMonthlyTimer(_exchangeID, _investorID) <= block.timestamp);
    }
}
