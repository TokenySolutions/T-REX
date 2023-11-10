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

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../IModularCompliance.sol";
import "../../../token/IToken.sol";
import "./AbstractModule.sol";

contract MaxBalanceModule is AbstractModule {

    /// state variables

    /// mapping of preset status of compliance addresses
    mapping(address => bool) private _compliancePresetStatus;

    /// maximum balance per investor ONCHAINID per modular compliance
    mapping(address => uint256) private _maxBalance;

    /// mapping of balances per ONCHAINID per modular compliance
    // solhint-disable-next-line var-name-mixedcase
    mapping(address => mapping(address => uint256)) private _IDBalance;

    /// events

    /**
     *  this event is emitted when the max balance has been set for a compliance bound.
     *  `_compliance` is the address of modular compliance concerned
     *  `_maxBalance` is the max amount of tokens that a user can hold .
     */
    event MaxBalanceSet(address indexed _compliance, uint256 indexed _maxBalance);

    event IDBalancePreSet(address indexed _compliance, address indexed _id, uint256 _balance);

    /// errors
    error MaxBalanceExceeded(address _compliance, uint256 _value);

    error InvalidPresetValues(address _compliance, address[] _id, uint256[] _balance);

    error OnlyComplianceOwnerCanCall(address _compliance);

    error TokenAlreadyBound(address _compliance);

    /// functions

    /**
     *  @dev sets max balance limit for a bound compliance contract
     *  @param _max max amount of tokens owned by an individual
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `MaxBalanceSet` event
     */
    function setMaxBalance(uint256 _max) external onlyComplianceCall {
        _maxBalance[msg.sender] = _max;
        emit MaxBalanceSet(msg.sender, _max);
    }

    /**
     *  @dev pre-set the balance of a token holder per ONCHAINID
     *  @param _compliance the address of the compliance contract to preset
     *  @param _id the ONCHAINID address of the token holder
     *  @param _balance the current balance of the token holder
     *  Only the owner of the Compliance smart contract can call this function
     *  emits a `IDBalancePreSet` event
     */
    function preSetModuleState(address _compliance, address _id, uint256 _balance) external {
        if (OwnableUpgradeable(_compliance).owner() != msg.sender) {
            revert OnlyComplianceOwnerCanCall(_compliance);
        }

        if (IModularCompliance(_compliance).isModuleBound(address(this))) {
            revert TokenAlreadyBound(_compliance);
        }

        _preSetModuleState(_compliance, _id, _balance);
    }

    /**
     *  @dev make a batch transaction calling preSetModuleState multiple times
     *  @param _compliance the address of the compliance contract to preset
     *  @param _id the ONCHAINID address of the token holder
     *  @param _balance the current balance of the token holder
     *  Only the owner of the Compliance smart contract can call this function
     *  emits _id.length `IDBalancePreSet` events
     */
    function batchPreSetModuleState(
        address _compliance,
        address[] calldata _id,
        uint256[] calldata _balance) external {
        if(_id.length == 0 || _id.length != _balance.length) {
            revert InvalidPresetValues(_compliance, _id, _balance);
        }

        if (OwnableUpgradeable(_compliance).owner() != msg.sender) {
            revert OnlyComplianceOwnerCanCall(_compliance);
        }

        if (IModularCompliance(_compliance).isModuleBound(address(this))) {
            revert TokenAlreadyBound(_compliance);
        }

        for (uint i = 0; i < _id.length; i++) {
            _preSetModuleState(_compliance, _id[i], _balance[i]);
        }

        _compliancePresetStatus[_compliance] = true;
    }

    /**
     *  @dev updates compliance preset status as true
     *  @param _compliance the address of the compliance contract
     *  Only the owner of the Compliance smart contract can call this function
     */
    function presetCompleted(address _compliance) external {
        if (OwnableUpgradeable(_compliance).owner() != msg.sender) {
            revert OnlyComplianceOwnerCanCall(_compliance);
        }

        _compliancePresetStatus[_compliance] = true;
    }

    /**
     *  @dev See {IModule-moduleTransferAction}.
     *  no transfer action required in this module
     */
    function moduleTransferAction(address _from, address _to, uint256 _value) external override onlyComplianceCall {
        address _idFrom = _getIdentity(msg.sender, _from);
        address _idTo = _getIdentity(msg.sender, _to);
        _IDBalance[msg.sender][_idTo] += _value;
        _IDBalance[msg.sender][_idFrom] -= _value;
        if (_IDBalance[msg.sender][_idTo] > _maxBalance[msg.sender]) revert MaxBalanceExceeded(msg.sender, _value);
    }

    /**
     *  @dev See {IModule-moduleMintAction}.
     *  no mint action required in this module
     */
    function moduleMintAction(address _to, uint256 _value) external override onlyComplianceCall {
        address _idTo = _getIdentity(msg.sender, _to);
        _IDBalance[msg.sender][_idTo] += _value;
        if (_IDBalance[msg.sender][_idTo] > _maxBalance[msg.sender]) revert MaxBalanceExceeded(msg.sender, _value);
    }

    /**
     *  @dev See {IModule-moduleBurnAction}.
     *  no burn action required in this module
     */
    function moduleBurnAction(address _from, uint256 _value) external override onlyComplianceCall {
        address _idFrom = _getIdentity(msg.sender, _from);
        _IDBalance[msg.sender][_idFrom] -= _value;
    }

    /**
     *  @dev See {IModule-moduleCheck}.
     *  checks if the country of address _to is allowed for this _compliance
     *  returns TRUE if the country of _to is allowed for this _compliance
     *  returns FALSE if the country of _to is not allowed for this _compliance
     */
    function moduleCheck(
        address /*_from*/,
        address _to,
        uint256 _value,
        address _compliance
    ) external view override returns (bool) {
        if (_value > _maxBalance[_compliance]) {
            return false;
        }
        address _id = _getIdentity(_compliance, _to);
        if ((_IDBalance[_compliance][_id] + _value) > _maxBalance[_compliance]) {
            return false;
        }
        return true;
    }

    /**
    *  @dev getter for compliance identity balance
     *  @param _compliance address of the compliance contract
     *  @param _identity ONCHAINID address
     */
    function getIDBalance(address _compliance, address _identity) external view returns (uint256) {
        return _IDBalance[_compliance][_identity];
    }

    /**
      *  @dev See {IModule-canComplianceBind}.
     */
    function canComplianceBind(address _compliance) external view returns (bool) {
        if (_compliancePresetStatus[_compliance]) {
            return true;
        }

        IToken token = IToken(IModularCompliance(_compliance).getTokenBound());
        uint256 totalSupply = token.totalSupply();
        if (totalSupply == 0) {
            return true;
        }

        return false;
    }

    /**
      *  @dev See {IModule-isPlugAndPlay}.
     */
    function isPlugAndPlay() external pure returns (bool) {
        return false;
    }

    /**
     *  @dev See {IModule-name}.
     */
    function name() public pure returns (string memory _name) {
        return "MaxBalanceModule";
    }

    /**
     *  @dev pre-set the balance of a token holder per ONCHAINID
     *  @param _compliance the address of the compliance contract to preset
     *  @param _id the ONCHAINID address of the token holder
     *  @param _balance the current balance of the token holder
     *  emits a `IDBalancePreSet` event
     */
    function _preSetModuleState(address _compliance, address _id, uint256 _balance) internal {
        _IDBalance[_compliance][_id] = _balance;
        emit IDBalancePreSet(_compliance, _id, _balance);
    }

    /**
     *  @dev function used to get the country of a wallet address.
     *  @param _compliance the compliance contract address for which the country verification is required
     *  @param _userAddress the address of the wallet to be checked
     *  Returns the ONCHAINID address of the wallet owner
     *  internal function, used only by the contract itself to process checks on investor countries
     */
    function _getIdentity(address _compliance, address _userAddress) internal view returns (address) {
        address identity = address(IToken(IModularCompliance(_compliance).getTokenBound())
            .identityRegistry().identity(_userAddress));
        require(identity != address(0), "identity not found");
        return identity;
    }
}
