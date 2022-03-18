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

abstract contract CountryWhitelisting is BasicCompliance {

    /**
     *  this event is emitted whenever a Country has been whitelisted.
     *  the event is emitted by 'whitelistCountry' and 'batchWhitelistCountries' functions.
     *  `_country` is the numeric ISO 3166-1 of the whitelisted country.
     */
    event WhitelistedCountry(uint16 _country);

    /**
     *  this event is emitted whenever a Country has been removed from the whitelist.
     *  the event is emitted by 'unwhitelistCountry' and 'batchBlacklistCountries' functions.
     *  `_country` is the numeric ISO 3166-1 of the whitelisted country.
     */
    event UnWhitelistedCountry(uint16 _country);

    /// Mapping between country and their whitelist status
    mapping(uint16 => bool) private _whitelistedCountries;

    /**
    *  @dev Returns true if country is whitelisted
    *  @param _country, numeric ISO 3166-1 standard of the country to be checked
    */
    function isCountryWhitelisted(uint16 _country) public view returns (bool) {
        return (_whitelistedCountries[_country]);
    }

    /**
    *  @dev whitelist country.
    *  Identities from those countries will be whitelisted & authorised to manipulate Tokens linked to this Compliance.
    *  @param _country Country to be whitelisted, should be expressed by following numeric ISO 3166-1 standard
    *  Only the owner of the Compliance smart contract can call this function
    *  emits an `WhitelistedCountry` event
    */
    function whitelistCountry(uint16 _country) public onlyOwner {
        _whitelistedCountries[_country] = true;
        emit WhitelistedCountry(_country);
    }

    /**
     *  @dev unwhitelist country.
     *  Identities from those countries will be unwhitelisted & forbidden
     *  to manipulate Tokens linked to this Compliance.
     *  @param _country Country to be unwhitelisted, should be expressed by following numeric ISO 3166-1 standard
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `UnwhitelistedCountry` event
     */
    function unWhitelistCountry(uint16 _country) public onlyOwner {
        _whitelistedCountries[_country] = false;
        emit UnWhitelistedCountry(_country);
    }

    /**
    *  @dev Adds countries to the whitelist in batch.
    *  Identities from those countries will be whitelisted & authorized to manipulate Tokens linked to this Compliance.
    *  @param _countries Countries to be whitelisted, should be expressed by following numeric ISO 3166-1 standard
    *  Only the owner of the Compliance smart contract can call this function
    *  emits an `WhitelistedCountry` event
    */
    function batchWhitelistCountries(uint16[] memory _countries) public onlyOwner {
        for (uint i = 0; i < _countries.length; i++) {
            _whitelistedCountries[_countries[i]] = true;
            emit WhitelistedCountry(_countries[i]);
        }
    }

    /**
     *  @dev Removes countries from the whitelist.
     *  Identities from those countries will be unwhitelisted.
     *  @param _countries Countries to be unwhitelisted, should be expressed by following numeric ISO 3166-1 standard
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `UnwhitelistedCountry` event
     */
    function batchBlacklistCountries(uint16[] memory _countries) public onlyOwner {
        for (uint i = 0; i < _countries.length; i++) {
            _whitelistedCountries[_countries[i]] = false;
            emit UnWhitelistedCountry(_countries[i]);
        }
    }

    function transferActionOnCountryWhitelisting(address _from, address _to, uint256 _value) internal {}

    function creationActionOnCountryWhitelisting(address _to, uint256 _value) internal {}

    function destructionActionOnCountryWhitelisting(address _from, uint256 _value) internal {}


    function complianceCheckOnCountryWhitelisting (address /*_from*/, address _to, uint256 /*_value*/)
    internal view returns (bool) {
        uint16 receiverCountry = _getCountry(_to);
        if (isCountryWhitelisted(receiverCountry)) {
            return true;
        }
        return false;
    }
}
