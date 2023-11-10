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

import "../IModularCompliance.sol";
import "../../../token/IToken.sol";
import "../../../roles/AgentRole.sol";
import "./AbstractModule.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract TimeExchangeLimitsModule is AbstractModule, Ownable {
    /// Struct of transfer Counters
    struct ExchangeTransferCounter {
        uint256 value;
        uint256 timer;
    }

    struct Limit {
        uint32 limitTime;
        uint256 limitValue;
    }

    struct IndexLimit {
        bool attributedLimit;
        uint8 limitIndex;
    }

    // Mapping for limit time indexes
    mapping(address => mapping (address => mapping(uint32 => IndexLimit))) private _limitValues;

    /// Getter for Tokens Exchange Limits
    mapping(address => mapping(address => Limit[])) private _exchangeLimits;

    /// Mapping for users Counters
    mapping(address => mapping(address =>
        mapping(address => mapping(uint32 => ExchangeTransferCounter)))) private _exchangeCounters;

    /// Mapping for wallets tagged as exchange wallets
    mapping(address => bool) private _exchangeIDs;

    /**
    *  this event is emitted whenever an exchange limit is updated for the given compliance address
    *  the event is emitted by 'setExchangeLimit'.
    *  compliance`is the compliance contract address
    *  _exchangeID is the ONCHAINID of the exchange
    *  _limitValue is the new limit value for the given limit time
    *  _limitTime is the period of time of the limit
    */
    event ExchangeLimitUpdated(address indexed compliance, address _exchangeID, uint _limitValue, uint32 _limitTime);

    /**
    *  this event is emitted whenever an ONCHAINID is tagged as an exchange ID.
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

    error ONCHAINIDAlreadyTaggedAsExchange(address _exchangeID);

    error ONCHAINIDNotTaggedAsExchange(address _exchangeID);

    error LimitsArraySizeExceeded(address compliance, uint arraySize);

    /**
     *  @dev Sets the limit of tokens allowed to be transferred to the given exchangeID in a given period of time
     *  @param _exchangeID ONCHAINID of the exchange
     *  @param _limit The limit time and value
     *  Only the Compliance smart contract can call this function
     *  emits an `ExchangeLimitUpdated` event
     */
    function setExchangeLimit(address _exchangeID, Limit memory _limit) external onlyComplianceCall {
        bool limitIsAttributed = _limitValues[msg.sender][_exchangeID][_limit.limitTime].attributedLimit;
        uint8 limitCount = uint8(_exchangeLimits[msg.sender][_exchangeID].length);
        if (!limitIsAttributed && limitCount >= 4) {
            revert LimitsArraySizeExceeded(msg.sender, limitCount);
        }

        if (!limitIsAttributed && limitCount < 4) {
            _exchangeLimits[msg.sender][_exchangeID].push(_limit);
            _limitValues[msg.sender][_exchangeID][_limit.limitTime] = IndexLimit(true, limitCount);
        } else {
            _exchangeLimits[msg.sender][_exchangeID][_limitValues[msg.sender][_exchangeID][_limit.limitTime].limitIndex] = _limit;
        }

        emit ExchangeLimitUpdated(msg.sender, _exchangeID, _limit.limitValue, _limit.limitTime);
    }

    /**
    *  @dev tags the ONCHAINID as being an exchange ID
    *  @param _exchangeID ONCHAINID to be tagged
    *  Function can be called only by the owner of this module
    *  Cannot be called on an address already tagged as being an exchange
    *  emits an `ExchangeIDAdded` event
    */
    function addExchangeID(address _exchangeID) external onlyOwner {
        if (isExchangeID(_exchangeID)) {
            revert ONCHAINIDAlreadyTaggedAsExchange(_exchangeID);
        }

        _exchangeIDs[_exchangeID] = true;
        emit ExchangeIDAdded(_exchangeID);
    }

    /**
    *  @dev untags the ONCHAINID as being an exchange ID
    *  @param _exchangeID ONCHAINID to be untagged
    *  Function can be called only by the owner of this module
    *  Cannot be called on an address not tagged as being an exchange
    *  emits an `ExchangeIDRemoved` event
    */
    function removeExchangeID(address _exchangeID) external onlyOwner {
        if (!isExchangeID(_exchangeID)) {
            revert ONCHAINIDNotTaggedAsExchange(_exchangeID);
        }
        _exchangeIDs[_exchangeID] = false;
        emit ExchangeIDRemoved(_exchangeID);
    }

    /**
     *  @dev See {IModule-moduleTransferAction}.
     */
    function moduleTransferAction(address _from, address _to, uint256 _value) external override onlyComplianceCall {
        address senderIdentity = _getIdentity(msg.sender, _from);
        address receiverIdentity = _getIdentity(msg.sender, _to);

        if (isExchangeID(receiverIdentity) && !_isTokenAgent(msg.sender, _from)) {
            _increaseExchangeCounters(msg.sender, receiverIdentity, senderIdentity, _value);
        }
    }

    /**
     *  @dev See {IModule-moduleMintAction}.
     */
    // solhint-disable-next-line no-empty-blocks
    function moduleMintAction(address /*_to*/, uint256 /*_value*/) external override onlyComplianceCall { }

    /**
     *  @dev See {IModule-moduleBurnAction}.
     */
    // solhint-disable-next-line no-empty-blocks
    function moduleBurnAction(address /*_from*/, uint256 /*_value*/) external override onlyComplianceCall { }

    /**
     *  @dev See {IModule-moduleCheck}.
     */
    function moduleCheck(
        address _from,
        address _to,
        uint256 _value,
        address _compliance
    ) external view override returns (bool) {
        if (_from == address(0) || _isTokenAgent(_compliance, _from)) {
            return true;
        }

        address senderIdentity = _getIdentity(_compliance, _from);
        if (isExchangeID(senderIdentity)) {
            return true;
        }

        address receiverIdentity = _getIdentity(_compliance, _to);
        if (!isExchangeID(receiverIdentity)) {
            return true;
        }

        for (uint256 i = 0; i < _exchangeLimits[_compliance][receiverIdentity].length; i++) {
            if (_value > _exchangeLimits[_compliance][receiverIdentity][i].limitValue) {
                return false;
            }

            uint32 limitTime = _exchangeLimits[_compliance][receiverIdentity][i].limitTime;
            if (!_isExchangeCounterFinished(_compliance, receiverIdentity, senderIdentity, limitTime)
                && _exchangeCounters[_compliance][receiverIdentity][senderIdentity][limitTime].value + _value
                > _exchangeLimits[_compliance][receiverIdentity][i].limitValue) {
                return false;
            }
        }

        return true;
    }

    /**
    *  @dev getter for `exchangeCounters` variable on the timer parameter of the ExchangeTransferCounter struct
    *  @param compliance the compliance smart contract address to be checked
    *  @param _exchangeID the ONCHAINID of the exchange
    *  @param _investorID the ONCHAINID of the investor to be checked
    *  @param _limitTime limit time frame
    *  returns the counter of the given `_limitTime`, `_investorID`, and `exchangeID`
    */
    function getExchangeCounter(address compliance, address _exchangeID, address _investorID, uint32 _limitTime)
        external view returns (ExchangeTransferCounter memory) {
        return _exchangeCounters[compliance][_exchangeID][_investorID][_limitTime];
    }

    /**
    *  @dev getter for `exchangeLimit` variable
    *  @param compliance the Compliance smart contract to be checked
    *  @param _exchangeID exchange ONCHAINID
    *  returns the array of limits set for that exchange
    */
    function getExchangeLimits(address compliance, address _exchangeID) external view returns (Limit[] memory) {
        return _exchangeLimits[compliance][_exchangeID];
    }

    /**
     *  @dev See {IModule-canComplianceBind}.
     */
    function canComplianceBind(address /*_compliance*/) external view override returns (bool) {
        return true;
    }

    /**
     *  @dev See {IModule-isPlugAndPlay}.
     */
    function isPlugAndPlay() external pure override returns (bool) {
        return true;
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
     *  @dev See {IModule-name}.
     */
    function name() public pure returns (string memory _name) {
        return "TimeExchangeLimitsModule";
    }

    /**
    *  @dev Checks if cooldown must be reset, then check if _value sent has been exceeded,
    *  if not increases user's OnchainID counters.
    *  @param compliance the Compliance smart contract address
    *  @param _exchangeID ONCHAINID of the exchange
    *  @param _investorID address on which counters will be increased
    *  @param _value, value of transaction)to be increased
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _increaseExchangeCounters(address compliance, address _exchangeID, address _investorID, uint256 _value) internal {
        for (uint256 i = 0; i < _exchangeLimits[compliance][_exchangeID].length; i++) {
            uint32 limitTime = _exchangeLimits[compliance][_exchangeID][i].limitTime;
            _resetExchangeLimitCooldown(compliance, _exchangeID, _investorID, limitTime);
            _exchangeCounters[compliance][_exchangeID][_investorID][limitTime].value += _value;
        }
    }

    /**
    *  @dev resets cooldown for the month if cooldown has reached the time limit of 30days
    *  @param compliance the Compliance smart contract address
    *  @param _exchangeID ONCHAINID of the exchange
    *  @param _investorID ONCHAINID to reset
    *  @param _limitTime limit time frame
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _resetExchangeLimitCooldown(address compliance, address _exchangeID, address _investorID, uint32 _limitTime)
        internal {
        if (_isExchangeCounterFinished(compliance, _exchangeID, _investorID, _limitTime)) {
            ExchangeTransferCounter storage counter =
                _exchangeCounters[compliance][_exchangeID][_investorID][_limitTime];

            counter.timer = block.timestamp + _limitTime;
            counter.value = 0;
        }
    }

    /**
    *  @dev checks if the counter time frame has finished since the cooldown has been triggered for this exchange and identity
    *  @param _compliance the Compliance smart contract to be checked
    *  @param _exchangeID ONCHAINID of the exchange
    *  @param _identity ONCHAINID of user wallet
    *  @param _limitTime limit time frame
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _isExchangeCounterFinished(address _compliance, address _exchangeID, address _identity, uint32 _limitTime)
    internal view returns (bool) {
        return _exchangeCounters[_compliance][_exchangeID][_identity][_limitTime].timer <= block.timestamp;
    }

    /**
    *  @dev checks if the given user address is an agent of token
    *  @param compliance the Compliance smart contract to be checked
    *  @param _userAddress ONCHAIN identity of the user
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _isTokenAgent(address compliance, address _userAddress) internal view returns (bool) {
        return AgentRole(IModularCompliance(compliance).getTokenBound()).isAgent(_userAddress);
    }

    /**
   *  @dev Returns the ONCHAINID (Identity) of the _userAddress
    *  @param _userAddress Address of the wallet
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _getIdentity(address _compliance, address _userAddress) internal view returns (address) {
        return address(IToken(IModularCompliance(_compliance).getTokenBound()).identityRegistry().identity
            (_userAddress));
    }
}
