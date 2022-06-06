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

abstract contract CountryRestrictions is BasicCompliance {

    /**
     *  this event is emitted whenever a Country has been restricted.
     *  the event is emitted by 'addCountryRestriction' and 'batchRestrictCountries' functions.
     *  `_country` is the numeric ISO 3166-1 of the restricted country.
     */
    event AddedRestrictedCountry(uint16 _country);

    /**
     *  this event is emitted whenever a Country has been unrestricted.
     *  the event is emitted by 'removeCountryRestriction' and 'batchUnrestrictCountries' functions.
     *  `_country` is the numeric ISO 3166-1 of the unrestricted country.
     */
    event RemovedRestrictedCountry(uint16 _country);

    /// Mapping between country and their restriction status
    mapping(uint16 => bool) private _restrictedCountries;

    /**
    *  @dev Returns true if country is Restricted
    *  @param _country, numeric ISO 3166-1 standard of the country to be checked
    */
    function isCountryRestricted(uint16 _country) public view returns (bool) {
        return (_restrictedCountries[_country]);
    }

    /**
    *  @dev Adds country restriction.
    *  Identities from those countries will be forbidden to manipulate Tokens linked to this Compliance.
    *  @param _country Country to be restricted, should be expressed by following numeric ISO 3166-1 standard
    *  Only the owner of the Compliance smart contract can call this function
    *  emits an `AddedRestrictedCountry` event
    */
    function addCountryRestriction(uint16 _country) external onlyOwner {
        _restrictedCountries[_country] = true;
        emit AddedRestrictedCountry(_country);
    }

    /**
     *  @dev Removes country restriction.
     *  Identities from those countries will again be authorised to manipulate Tokens linked to this Compliance.
     *  @param _country Country to be unrestricted, should be expressed by following numeric ISO 3166-1 standard
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `RemovedRestrictedCountry` event
     */
    function removeCountryRestriction(uint16 _country) external onlyOwner {
        _restrictedCountries[_country] = false;
        emit RemovedRestrictedCountry(_country);
    }

    /**
    *  @dev Adds countries restriction in batch.
    *  Identities from those countries will be forbidden to manipulate Tokens linked to this Compliance.
    *  @param _countries Countries to be restricted, should be expressed by following numeric ISO 3166-1 standard
    *  Only the owner of the Compliance smart contract can call this function
    *  emits an `AddedRestrictedCountry` event
    */
    function batchRestrictCountries(uint16[] calldata _countries) external onlyOwner {
        for (uint i = 0; i < _countries.length; i++) {
            _restrictedCountries[_countries[i]] = true;
            emit AddedRestrictedCountry(_countries[i]);
        }
    }

    /**
     *  @dev Removes countries restriction in batch.
     *  Identities from those countries will again be authorised to manipulate Tokens linked to this Compliance.
     *  @param _countries Countries to be unrestricted, should be expressed by following numeric ISO 3166-1 standard
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `RemovedRestrictedCountry` event
     */
    function batchUnrestrictCountries(uint16[] calldata _countries) external onlyOwner {
        for (uint i = 0; i < _countries.length; i++) {
            _restrictedCountries[_countries[i]] = false;
            emit RemovedRestrictedCountry(_countries[i]);
        }
    }

    function transferActionOnCountryRestrictions(address /*_from*/, address /*_to*/, uint256 /*_value*/) internal {}

    function creationActionOnCountryRestrictions(address /*_to*/, uint256 /*_value*/) internal {}

    function destructionActionOnCountryRestrictions(address _from, uint256 _value) internal {}


    function complianceCheckOnCountryRestrictions (address /*_from*/, address _to, uint256 /*_value*/)
    internal view returns (bool) {
        uint16 receiverCountry = _getCountry(_to);
        if (isCountryRestricted(receiverCountry)) {
            return false;
        }
        return true;
    }
}
