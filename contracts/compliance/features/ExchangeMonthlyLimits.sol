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

abstract contract ExchangeMonthlyLimits is BasicCompliance {

    /**
     *  this event is emitted whenever the Exchange Limit has been updated.
     *  the event is emitted by 'setExchangeMonthlyLimit'
     *  `_newExchangeMonthlyLimit` is the amount Limit of tokens to be transferred monthly to an exchange wallet.
     */
    event ExchangeMonthlyLimitUpdated(uint _newExchangeMonthlyLimit);

    /**
     *  this event is emitted whenever a wallet is tagged as being an exchange wallet.
     *  the event is emitted by 'addExchangeWallet'.
     *  `_newExchangeWallet` is the wallet linked to the identity `_onchainid` and being tagged as an exchange wallet.
     */
    event ExchangeWalletAdded(address _newExchangeWallet, address _onchainid);

    /**
     *  this event is emitted whenever a wallet is untagged as being an exchange wallet.
     *  the event is emitted by 'removeExchangeWallet'.
     *  `_exchangeWallet` is the wallet being untagged as an exchange wallet.
     */
    event ExchangeWalletRemoved(address _exchangeWallet);

    /// Getter for Tokens monthlyLimit
    uint256 public exchangeMonthlyLimit;

    /// Struct of transfer Counters
    struct ExchangeTransferCounter {
        uint256 monthlyCount;
        uint256 monthlyTimer;
    }

    /// Mapping for users Counters
    mapping(address => ExchangeTransferCounter) public exchangeCounters;

    /// Mapping for wallets tagged as exchange wallets
    mapping(address => bool) public exchangeWallets;

    /**
    *  @dev tags the wallet as being an exchange wallet && whitelist the wallet in the identity registry
    *  in the same transaction
    *  requires that the compliance contract is agent of the identity registry contract to work
    *  @param _wallet wallet to be tagged
    *  @param _onchainid the identity linked to the exchange wallet
    */
    function whitelistExchangeWallet(address _wallet, address _onchainid, uint16 _country) external {
        require(msg.sender == owner() || isAgent(msg.sender), 'need to be owner or agent to perform this action');
        IIdentityRegistry identityRegistry = IIdentityRegistry(_tokenBound.identityRegistry());
        identityRegistry.registerIdentity(_wallet, IIdentity(_onchainid), _country);
        addExchangeWallet(_wallet);
    }

    /**
    *  @dev tags the wallet as being an exchange wallet
    *  @param _wallet wallet to be tagged
    */
    function addExchangeWallet(address _wallet) public {
        require(!exchangeWallets[_wallet], 'wallet already tagged as exchange');
        require(msg.sender == owner() || isAgent(msg.sender), 'need to be owner or agent to perform this action');
        exchangeWallets[_wallet] = true;
        address identity = _getIdentity(_wallet);
        emit ExchangeWalletAdded(_wallet, identity);
    }

    /**
    *  @dev untags the wallet as being an exchange wallet
    *  @param _wallet wallet to be untagged
    */
    function removeExchangeWallet(address _wallet) public {
        require(exchangeWallets[_wallet], 'wallet not tagged as exchange');
        require(msg.sender == owner() || isAgent(msg.sender), 'need to be owner or agent to perform this action');
        exchangeWallets[_wallet] = false;
        emit ExchangeWalletRemoved(_wallet);
    }

    /**
    *  @dev checks if the month has finished since the cooldown has been triggered for this identity
    *  @param _identity ONCHAINID to be checked
    */
    function _isExchangeMonthFinished(address _identity) internal view returns (bool) {
        return (exchangeCounters[_identity].monthlyTimer <= block.timestamp);
    }

    /**
    *  @dev resets cooldown for the month if cooldown has reached the time limit of 30days
    *  @param _identity ONCHAINID to be checked
    */
    function _resetExchangeMonthlyCooldown(address _identity) internal {
        if (_isExchangeMonthFinished(_identity)) {
            exchangeCounters[_identity].monthlyTimer = block.timestamp + 30 days;
            exchangeCounters[_identity].monthlyCount = 0;
        }
    }

    /**
    *  @dev Checks if monthly cooldown must be reset, then check if _value sent has been exceeded,
    *  if not increases user's OnchainID counters.
    *  @param _userAddress, address on which counters will be increased
    *  @param _value, value of transaction)to be increased
    */
    function _increaseExchangeCounters(address _userAddress, uint256 _value) internal {
        address identity = _getIdentity(_userAddress);
        _resetExchangeMonthlyCooldown(identity);

        if ((exchangeCounters[identity].monthlyCount + _value) <= exchangeMonthlyLimit && exchangeWallets[_userAddress]) {
            exchangeCounters[identity].monthlyCount += _value;
        }
    }

    /**
     *  @dev Set the limit of tokens allowed to be transferred monthly.
     *  param _newExchangeMonthlyLimit The new monthly limit of tokens
     */
    function setExchangeMonthlyLimit(uint256 _newExchangeMonthlyLimit) external onlyOwner {
        exchangeMonthlyLimit = _newExchangeMonthlyLimit;
        emit ExchangeMonthlyLimitUpdated(_newExchangeMonthlyLimit);
    }

    function transferActionOnExchangeMonthlyLimits(address /*_from*/, address _to, uint256 _value) internal {
        _increaseExchangeCounters(_to, _value);
    }

    function creationActionOnExchangeMonthlyLimits(address _to, uint256 _value) internal {}

    function destructionActionOnExchangeMonthlyLimits(address _from, uint256 _value) internal {}


    function complianceCheckOnExchangeMonthlyLimits(address _from, address _to, uint256 _value) internal view returns (bool) {
        address receiverIdentity = _getIdentity(_to);
        if (!isTokenAgent(_from)) {
            if (_value > exchangeMonthlyLimit && exchangeWallets[_to]) {
                return false;
            }
            if (!_isExchangeMonthFinished(receiverIdentity) && exchangeWallets[_to] &&
            ((exchangeCounters[receiverIdentity].monthlyCount + _value > exchangeMonthlyLimit))) {
                return false;
            }
        }
        return true;
    }

}
