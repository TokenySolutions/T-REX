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

pragma solidity ^0.8.17;

import "../IModularCompliance.sol";
import "../../../token/IToken.sol";
import "./AbstractModule.sol";

contract TransferRestrictModule is AbstractModule {
    /// allowed identities mapping
    mapping(address => mapping(address => bool)) private _allowedIdentities;

    /**
     *  this event is emitted when an identity is allowed for transfer
     *  `_compliance` is the compliance address.
     *  `_identity` is the allowed identity address
     */
    event IdentityAllowed(address _compliance, address _identity);

    /**
     *  this event is emitted when an identity is disallowed for transfer
     *  `_compliance` is the compliance address.
     *  `_identity` is the disallowed identity address
     */
    event IdentityDisallowed(address _compliance, address _identity);

    /**
     *  @dev allows an identity for transfer.
     *  @param _identity is the address of the identity
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `IdentityAllowed` event
     */
    function allowIdentity(address _identity) external onlyComplianceCall {
        _allowedIdentities[msg.sender][_identity] = true;
        emit IdentityAllowed(msg.sender, _identity);
    }

    /**
     *  @dev allows multiple identities for transfer.
     *  @param _identities is the array of identity addresses
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `IdentityAllowed` event
     */
    function batchAllowIdentities(address[] memory _identities) external onlyComplianceCall {
        uint256 length = _identities.length;
        for (uint256 i = 0; i < length; i++) {
            address _identity = _identities[i];
            _allowedIdentities[msg.sender][_identity] = true;
            emit IdentityAllowed(msg.sender, _identity);
        }
    }

    /**
     *  @dev disallows an identity for transfer.
     *  @param _identity is the address of the identity
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `IdentityDisallowed` event
     */
    function disallowIdentity(address _identity) external onlyComplianceCall {
        _allowedIdentities[msg.sender][_identity] = false;
        emit IdentityDisallowed(msg.sender, _identity);
    }

    /**
    *  @dev disallows multiple identities for transfer.
     *  @param _identities is the array of identity addresses
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `IdentityDisallowed` event
     */
    function batchDisallowIdentities(address[] memory _identities) external onlyComplianceCall {
        uint256 length = _identities.length;
        for (uint256 i = 0; i < length; i++) {
            address _identity = _identities[i];
            _allowedIdentities[msg.sender][_identity] = false;
            emit IdentityDisallowed(msg.sender, _identity);
        }
    }

    /**
     *  @dev See {IModule-moduleTransferAction}.
     *  no transfer action required in this module
     */
    // solhint-disable-next-line no-empty-blocks
    function moduleTransferAction(address _from, address _to, uint256 _value) external onlyComplianceCall {}

    /**
     *  @dev See {IModule-moduleMintAction}.
     *  no mint action required in this module
     */
    // solhint-disable-next-line no-empty-blocks
    function moduleMintAction(address _to, uint256 _value) external onlyComplianceCall {}

    /**
     *  @dev See {IModule-moduleBurnAction}.
     *  no burn action required in this module
     */
    // solhint-disable-next-line no-empty-blocks
    function moduleBurnAction(address _from, uint256 _value) external onlyComplianceCall {}

    /**
     *  @dev See {IModule-moduleCheck}.
     */
    function moduleCheck(
        address _from,
        address _to,
        uint256 /*_value*/,
        address _compliance
    ) external view override returns (bool) {
        address senderIdentity = _getIdentity(_compliance, _from);
        if(_allowedIdentities[_compliance][senderIdentity]) {
            return true;
        }

        address receiverIdentity = _getIdentity(_compliance, _to);
        return _allowedIdentities[_compliance][receiverIdentity];
    }

    /**
    *  @dev getter for `_allowedIdentities` mapping
    *  @param _compliance the Compliance smart contract to be checked
    *  @param _identity the identity address to be checked
    *  returns the true if identity is allowed to transfer
    */
    function isIdentityAllowed(address _compliance, address _identity) external view returns (bool) {
        return _allowedIdentities[_compliance][_identity];
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
     *  @dev See {IModule-name}.
     */
    function name() public pure returns (string memory _name) {
        return "TransferRestrictModule";
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