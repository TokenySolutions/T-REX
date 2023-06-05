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

import "@onchain-id/solidity/contracts/interface/IIdentity.sol";

import "../../../token/IToken.sol";
import "../../../registry/interface/IIdentityRegistry.sol";
import "./AgentRoles.sol";

contract AgentManager is AgentRoles {
    /// @dev the token managed by this AgentManager contract
    IToken public token;

    constructor(address _token) {
        token = IToken(_token);
    }

    /**
     *  @dev calls the `forcedTransfer` function on the Token contract
     *  AgentManager has to be set as agent on the token smart contract to process this function
     *  See {IToken-forcedTransfer}.
     *  Requires that `_onchainID` is set as TransferManager on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callForcedTransfer(
        address _from,
        address _to,
        uint256 _amount,
        IIdentity _onchainID
    ) external {
        require(
            isTransferManager(address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2),
            "Role: Sender is NOT Transfer Manager"
        );
        token.forcedTransfer(_from, _to, _amount);
    }

    /**
     *  @dev calls the `batchForcedTransfer` function on the Token contract
     *  AgentManager has to be set as agent on the token smart contract to process this function
     *  See {IToken-batchForcedTransfer}.
     *  Requires that `_onchainID` is set as TransferManager on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callBatchForcedTransfer(
        address[] calldata _fromList,
        address[] calldata _toList,
        uint256[] calldata _amounts,
        IIdentity _onchainID
    ) external {
        require(
            isTransferManager(address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2),
            "Role: Sender is NOT Transfer Manager"
        );
        token.batchForcedTransfer(_fromList, _toList, _amounts);
    }

    /**
     *  @dev calls the `pause` function on the Token contract
     *  AgentManager has to be set as agent on the token smart contract to process this function
     *  See {IToken-pause}.
     *  Requires that `_onchainID` is set as Freezer on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callPause(IIdentity _onchainID) external {
        require(
            isFreezer(address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2)
            , "Role: Sender is NOT Freezer");
        token.pause();
    }

    /**
     *  @dev calls the `unpause` function on the Token contract
     *  AgentManager has to be set as agent on the token smart contract to process this function
     *  See {IToken-unpause}.
     *  Requires that `_onchainID` is set as Freezer on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callUnpause(IIdentity _onchainID) external {
        require(
            isFreezer(address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2)
            , "Role: Sender is NOT Freezer");
        token.unpause();
    }

    /**
     *  @dev calls the `mint` function on the Token contract
     *  AgentManager has to be set as agent on the token smart contract to process this function
     *  See {IToken-mint}.
     *  Requires that `_onchainID` is set as SupplyModifier on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callMint(
        address _to,
        uint256 _amount,
        IIdentity _onchainID
    ) external {
        require(
            isSupplyModifier(address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2),
            "Role: Sender is NOT Supply Modifier"
        );
        token.mint(_to, _amount);
    }

    /**
     *  @dev calls the `batchMint` function on the Token contract
     *  AgentManager has to be set as agent on the token smart contract to process this function
     *  See {IToken-batchMint}.
     *  Requires that `_onchainID` is set as SupplyModifier on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callBatchMint(
        address[] calldata _toList,
        uint256[] calldata _amounts,
        IIdentity _onchainID
    ) external {
        require(
            isSupplyModifier(address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2),
            "Role: Sender is NOT Supply Modifier"
        );
        token.batchMint(_toList, _amounts);
    }

    /**
     *  @dev calls the `burn` function on the Token contract
     *  AgentManager has to be set as agent on the token smart contract to process this function
     *  See {IToken-burn}.
     *  Requires that `_onchainID` is set as SupplyModifier on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callBurn(
        address _userAddress,
        uint256 _amount,
        IIdentity _onchainID
    ) external {
        require(
            isSupplyModifier(
                address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2)
            , "Role: Sender is NOT Supply Modifier"
        );
        token.burn(_userAddress, _amount);
    }

    /**
     *  @dev calls the `batchBurn` function on the Token contract
     *  AgentManager has to be set as agent on the token smart contract to process this function
     *  See {IToken-batchBurn}.
     *  Requires that `_onchainID` is set as SupplyModifier on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callBatchBurn(
        address[] calldata _userAddresses,
        uint256[] calldata _amounts,
        IIdentity _onchainID
    ) external {
        require(
            isSupplyModifier(address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2)
            , "Role: Sender is NOT Supply Modifier"
        );
        token.batchBurn(_userAddresses, _amounts);
    }

    /**
     *  @dev calls the `setAddressFrozen` function on the Token contract
     *  AgentManager has to be set as agent on the token smart contract to process this function
     *  See {IToken-setAddressFrozen}.
     *  Requires that `_onchainID` is set as Freezer on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callSetAddressFrozen(
        address _userAddress,
        bool _freeze,
        IIdentity _onchainID
    ) external {
        require(
            isFreezer(address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2)
            , "Role: Sender is NOT Freezer");
        token.setAddressFrozen(_userAddress, _freeze);
    }

    /**
     *  @dev calls the `batchSetAddressFrozen` function on the Token contract
     *  AgentManager has to be set as agent on the token smart contract to process this function
     *  See {IToken-batchSetAddressFrozen}.
     *  Requires that `_onchainID` is set as Freezer on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callBatchSetAddressFrozen(
        address[] calldata _userAddresses,
        bool[] calldata _freeze,
        IIdentity _onchainID
    ) external {
        require(
            isFreezer(address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2)
            , "Role: Sender is NOT Freezer");
        token.batchSetAddressFrozen(_userAddresses, _freeze);
    }

    /**
     *  @dev calls the `freezePartialTokens` function on the Token contract
     *  AgentManager has to be set as agent on the token smart contract to process this function
     *  See {IToken-freezePartialTokens}.
     *  Requires that `_onchainID` is set as Freezer on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callFreezePartialTokens(
        address _userAddress,
        uint256 _amount,
        IIdentity _onchainID
    ) external {
        require(
            isFreezer(address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2)
            , "Role: Sender is NOT Freezer");
        token.freezePartialTokens(_userAddress, _amount);
    }

    /**
     *  @dev calls the `batchFreezePartialTokens` function on the Token contract
     *  AgentManager has to be set as agent on the token smart contract to process this function
     *  See {IToken-batchFreezePartialTokens}.
     *  Requires that `_onchainID` is set as Freezer on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callBatchFreezePartialTokens(
        address[] calldata _userAddresses,
        uint256[] calldata _amounts,
        IIdentity _onchainID
    ) external {
        require(
            isFreezer(address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2)
            , "Role: Sender is NOT Freezer");
        token.batchFreezePartialTokens(_userAddresses, _amounts);
    }

    /**
     *  @dev calls the `unfreezePartialTokens` function on the Token contract
     *  AgentManager has to be set as agent on the token smart contract to process this function
     *  See {IToken-unfreezePartialTokens}.
     *  Requires that `_onchainID` is set as Freezer on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callUnfreezePartialTokens(
        address _userAddress,
        uint256 _amount,
        IIdentity _onchainID
    ) external {
        require(
            isFreezer(address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2)
            , "Role: Sender is NOT Freezer");
        token.unfreezePartialTokens(_userAddress, _amount);
    }

    /**
     *  @dev calls the `batchUnfreezePartialTokens` function on the Token contract
     *  AgentManager has to be set as agent on the token smart contract to process this function
     *  See {IToken-batchUnfreezePartialTokens}.
     *  Requires that `_onchainID` is set as Freezer on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callBatchUnfreezePartialTokens(
        address[] calldata _userAddresses,
        uint256[] calldata _amounts,
        IIdentity _onchainID
    ) external {
        require(
            isFreezer(address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2)
            , "Role: Sender is NOT Freezer");
        token.batchUnfreezePartialTokens(_userAddresses, _amounts);
    }

    /**
     *  @dev calls the `recoveryAddress` function on the Token contract
     *  AgentManager has to be set as agent on the token smart contract to process this function
     *  See {IToken-recoveryAddress}.
     *  Requires that `_managerOnchainID` is set as RecoveryAgent on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_managerOnchainID`
     *  @param _managerOnchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callRecoveryAddress(
        address _lostWallet,
        address _newWallet,
        address _onchainID,
        IIdentity _managerOnchainID
    ) external {
        require(
            isRecoveryAgent(address(_managerOnchainID)) &&
            _managerOnchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2)
            , "Role: Sender is NOT Recovery Agent"
        );
        token.recoveryAddress(_lostWallet, _newWallet, _onchainID);
    }

    /**
     *  @dev calls the `registerIdentity` function on the Identity Registry contract
     *  AgentManager has to be set as agent on the Identity Registry smart contract to process this function
     *  See {IIdentityRegistry-registerIdentity}.
     *  Requires that `ManagerOnchainID` is set as WhiteListManager on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_managerOnchainID`
     *  @param _managerOnchainID the onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callRegisterIdentity(
        address _userAddress,
        IIdentity _onchainID,
        uint16 _country,
        IIdentity _managerOnchainID
    ) external {
        require(
            isWhiteListManager(address(_managerOnchainID)) &&
            _managerOnchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2)
            , "Role: Sender is NOT WhiteList Manager"
        );
        token.identityRegistry().registerIdentity(_userAddress, _onchainID, _country);
    }

    /**
     *  @dev calls the `updateIdentity` function on the Identity Registry contract
     *  AgentManager has to be set as agent on the Identity Registry smart contract to process this function
     *  See {IIdentityRegistry-updateIdentity}.
     *  Requires that `_onchainID` is set as WhiteListManager on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callUpdateIdentity(
        address _userAddress,
        IIdentity _identity,
        IIdentity _onchainID
    ) external {
        require(
            isWhiteListManager(address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2)
            , "Role: Sender is NOT WhiteList Manager"
        );
        token.identityRegistry().updateIdentity(_userAddress, _identity);
    }

    /**
     *  @dev calls the `updateCountry` function on the Identity Registry contract
     *  AgentManager has to be set as agent on the Identity Registry smart contract to process this function
     *  See {IIdentityRegistry-updateCountry}.
     *  Requires that `_onchainID` is set as WhiteListManager on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callUpdateCountry(
        address _userAddress,
        uint16 _country,
        IIdentity _onchainID
    ) external {
        require(
            isWhiteListManager(address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2)
            , "Role: Sender is NOT WhiteList Manager"
        );
        token.identityRegistry().updateCountry(_userAddress, _country);
    }

    /**
     *  @dev calls the `deleteIdentity` function on the Identity Registry contract
     *  AgentManager has to be set as agent on the Identity Registry smart contract to process this function
     *  See {IIdentityRegistry-deleteIdentity}.
     *  Requires that `_onchainID` is set as WhiteListManager on the AgentManager contract
     *  Requires that msg.sender is a MANAGEMENT KEY on `_onchainID`
     *  @param _onchainID the _onchainID contract of the caller, e.g. "i call this function and i am Bob"
     */
    function callDeleteIdentity(address _userAddress, IIdentity _onchainID) external {
        require(
            isWhiteListManager(address(_onchainID)) &&
            _onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 2)
            , "Role: Sender is NOT WhiteList Manager"
        );
        token.identityRegistry().deleteIdentity(_userAddress);
    }
}
