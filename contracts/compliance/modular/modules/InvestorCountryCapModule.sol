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

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./AbstractModuleUpgradeable.sol";
import "../IModularCompliance.sol";
import "../../../token/IToken.sol";
import "../../../roles/AgentRole.sol";

event CountryCapSet(uint16 indexed country, uint256 cap);
event BypassedIdentityAdded(address indexed identity);
event BypassedIdentityRemoved(address indexed identity);

error ExpectedPause();
error IdentityNotBypassed(address identity);
error CapLowerThanCurrent(uint16 country, uint256 cap, uint256 currentCap);
error WalletCountLimitReached(address identity, uint256 maxWallets);

uint256 constant MAX_WALLET_PER_IDENTITY = 20;


contract InvestorCountryCapModule is AbstractModuleUpgradeable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;

    struct CountryParams {
        bool capped;
        uint256 cap;
        uint256 count;
        mapping(address identity => bool counted) identities;
    }

    EnumerableSet.UintSet internal _countries;
    mapping(address identity => bool bypassed) internal _bypassedIdentities;

    mapping(address compliance => mapping(uint16 country => CountryParams params)) internal _countryParams;
    mapping(address compliance => mapping(address identity => EnumerableSet.AddressSet wallets)) internal _identityToWallets;

    /// @notice Used only during batchInitialize / canComplianceBind
    mapping(address token => uint256 supply) public calculatedSupply;
    
    
    /// @dev initializes the contract and sets the initial state.
    /// @notice This function should only be called once during the contract deployment, and after (optionally) batchInitialize.
    function initialize() external initializer {
        __AbstractModule_init();
    }

    /// @dev Initialize the module for a compliance and a list of holders
    /// @param _compliance Address of the compliance.
    /// @param _holders Addresses of the holders already holding tokens (addresses should be unique - no control is done on that).
    function batchInitialize(address _compliance, address[] memory _holders) external onlyOwner {
        // TODO calculate gas cost and revert if _holders.length is too high
        
        IToken token = IToken(IModularCompliance(_compliance).getTokenBound());
        require(token.paused(), ExpectedPause());

        uint256 holdersCount = _holders.length;
        for (uint256 i; i < holdersCount; i++) {
            address holder = _holders[i];
            address idTo = _getIdentity(_compliance, holder);

            if (_bypassedIdentities[idTo]) {
                return;
            }

            _registerWallet(_compliance, holder, idTo, _getCountry(_compliance, holder));

            calculatedSupply[address(token)] += token.balanceOf(holder);
        }
    }

    /// @dev Set the cap for a country
    /// @param _country Country code
    /// @param _cap New cap
    function setCountryCap(uint16 _country, uint256 _cap) external onlyComplianceCall {
        CountryParams storage params = _countryParams[msg.sender][_country];

        // Can't set cap lower than current cap
        if (_cap < params.cap) {
            revert CapLowerThanCurrent(_country, _cap, params.cap);
        }

        params.capped = true;
        params.cap = _cap;

        _countries.add(_country);

        emit CountryCapSet(_country, _cap);
    }

    /// @dev Add an identity to the list of bypassed identities
    /// @param _identity Address of the identity
    function addBypassedIdentity(address _identity) external onlyComplianceCall {
        _bypassedIdentities[_identity] = true;

        emit BypassedIdentityAdded(_identity);
    }

    /// @dev Remove an identity from the list of bypassed identities
    /// @param _identity Address of the identity
    function removeBypassedIdentity(address _identity) external onlyComplianceCall {
        require(_bypassedIdentities[_identity], IdentityNotBypassed(_identity));
        _bypassedIdentities[_identity] = false;

        emit BypassedIdentityRemoved(_identity);
    }

    /// @inheritdoc IModule
    function moduleBurnAction(address _from, uint256 /*_value*/) external onlyComplianceCall {
        address _idFrom = _getIdentity(msg.sender, _from);

        uint16 country = _getCountry(msg.sender, _from);
        _removeWalletIfNoBalance(_idFrom, country);
    }

    /// @inheritdoc IModule
    function moduleMintAction(address _to, uint256 /*_value*/) external onlyComplianceCall {
        address _idTo = _getIdentity(msg.sender, _to);

        if (_bypassedIdentities[_idTo]) {
            return;
        }

        uint16 country = _getCountry(msg.sender, _to);
        _registerWallet(msg.sender, _to, _idTo, country);
    }

    /// @inheritdoc IModule
    function moduleTransferAction(address _from, address _to, uint256 /*_value*/) external onlyComplianceCall {
        address _idTo = _getIdentity(msg.sender, _to);

        if (_bypassedIdentities[_idTo]) {
            return;
        }

        uint16 country = _getCountry(msg.sender, _to);
        if (!_countryParams[msg.sender][country].capped) {
            return;
        }

        _registerWallet(msg.sender, _to, _idTo, country);
        _removeWalletIfNoBalance(_getIdentity(msg.sender, _from), country);
    }

        /// @inheritdoc IModule
    function moduleCheck(address /*_from*/, address _to, uint256 /*_value*/, address _compliance) external view returns (bool) {
        address _idTo = _getIdentity(_compliance, _to);

        // Bypassed identity are always allowed
        if (_bypassedIdentities[_idTo]) {
            return true;
        }

        uint16 country = _getCountry(_compliance, _to);
        CountryParams storage params = _countryParams[_compliance][country];

        // If country is not capped, allow transfer
        if (!params.capped) {
            return true;
        }

        // If identity is not already counted, check cap
        if (!params.identities[_idTo]) {
            return params.count < params.cap;
        }

        // Check max wallets per identity
        if (!_identityToWallets[_compliance][_idTo].contains(_to)) {
            return _identityToWallets[_compliance][_idTo].length() + 1 < MAX_WALLET_PER_IDENTITY;
        }

        return true;
    }

    /// @inheritdoc IModule
    function canComplianceBind(address _compliance) external view override returns (bool) {
        IToken token = IToken(IModularCompliance(_compliance).getTokenBound());

        return token.paused() && calculatedSupply[address(token)] == token.totalSupply();
    }

    /// @inheritdoc IModule
    function isPlugAndPlay() public pure override returns (bool) {
        return false;
    }

    /// @inheritdoc IModule
    function name() public pure override returns (string memory) {
        return "InvestorCountryCapModule";
    }

    /// @dev Register a wallet for an identity, and check for country change
    /// @param _compliance Address of the compliance
    /// @param _wallet Address of the wallet
    /// @param _identity Address of the identity
    /// @param _country Country code
    function _registerWallet(address _compliance, address _wallet, address _identity, uint16 _country) internal {
        IToken token = IToken(IModularCompliance(_compliance).getTokenBound());
        CountryParams storage params = _countryParams[_compliance][_country];

        // Register wallet for this country if not already registered
        if (!params.identities[_identity]) {
            if (token.balanceOf(_wallet) > 0) { 
                // Wallet has a balance, either:
                // - User have several countries (Identity already registered)
                // - User country has changed
                if (_identityToWallets[_compliance][_identity].length() == 0) {
                    uint256 countryCount = _countries.length();
                    for (uint16 i; i < countryCount; i++) {
                        uint16 otherCountry = uint16(_countries.at(i));
                        if (otherCountry != _country && _countryParams[_compliance][otherCountry].identities[_identity]) {
                            // Unlink previous country
                            _countryParams[_compliance][otherCountry].identities[_identity] = false;
                            _countryParams[_compliance][otherCountry].count--;
                        }
                    }
                }
            }

            params.count++;
            params.identities[_identity] = true;
        }

        _identityToWallets[_compliance][_identity].add(_wallet);
    }

    /// @dev Remove a wallet from an identity if no balance
    /// @param _identity Address of the identity
    /// @param _country Country code
    function _removeWalletIfNoBalance(address _identity, uint16 _country) internal {
        if (_bypassedIdentities[_identity]) {
            return;
        }

        IToken token = IToken(IModularCompliance(msg.sender).getTokenBound());
        uint256 walletCount = _identityToWallets[msg.sender][_identity].length();
        uint256 balance;
        for (uint256 i; i < walletCount; i++) {
            balance += token.balanceOf(_identityToWallets[msg.sender][_identity].at(i));
        }

        // If balance is 0, the identity has no more wallets and should be uncounted
        if (balance == 0) {
            _countryParams[msg.sender][_country].count--;
            _countryParams[msg.sender][_country].identities[_identity] = false;
        }
    }

    /// @dev Returns the country code of the wallet owner
    /// @param _compliance Address of the compliance
    /// @param _userAddress Address of the wallet
    function _getCountry(address _compliance, address _userAddress) internal view returns (uint16) {
        return IToken(IModularCompliance(_compliance).getTokenBound()).identityRegistry().investorCountry(_userAddress);
    }

    /// @dev Returns the ONCHAINID (Identity) of the _userAddress
    /// @param _compliance Address of the compliance
    /// @param _userAddress Address of the wallet
    function _getIdentity(address _compliance, address _userAddress) internal view returns (address) {
        return address(IToken(IModularCompliance(_compliance).getTokenBound()).identityRegistry().identity
        (_userAddress));
    }

}
