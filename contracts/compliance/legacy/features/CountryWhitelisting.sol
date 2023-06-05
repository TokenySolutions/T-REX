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
 *  this feature allows to setup a whitelist of countries, only investors with a whitelisted country
 *  of residence will be allowed to receive tokens
 */
abstract contract CountryWhitelisting is BasicCompliance {

    /// Mapping between country and their whitelist status
    mapping(uint16 => bool) private _whitelistedCountries;

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

    /**
    *  @dev Adds countries to the whitelist in batch.
    *  Identities from those countries will be whitelisted & authorized to manipulate Tokens linked to this Compliance.
    *  @param _countries Countries to be whitelisted, should be expressed by following numeric ISO 3166-1 standard
    *  Only the owner of the Compliance smart contract can call this function
    *  emits an `WhitelistedCountry` event
    */
    function batchWhitelistCountries(uint16[] memory _countries) external {
        for (uint i = 0; i < _countries.length; i++) {
            whitelistCountry(_countries[i]);
        }
    }

    /**
     *  @dev Removes countries from the whitelist in batch.
     *  Identities from those countries will be unwhitelisted.
     *  @param _countries Countries to be unwhitelisted, should be expressed by following numeric ISO 3166-1 standard
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `UnwhitelistedCountry` event
     */
    function batchUnWhitelistCountries(uint16[] memory _countries) external {
        for (uint i = 0; i < _countries.length; i++) {
            unWhitelistCountry(_countries[i]);
        }
    }

    /**
    *  @dev whitelist country.
    *  Identities from those countries will be whitelisted & authorised to manipulate Tokens linked to this Compliance.
    *  @param _country Country to be whitelisted, should be expressed by following numeric ISO 3166-1 standard
    *  Only the owner of the Compliance smart contract can call this function
    *  emits an `WhitelistedCountry` event
    */
    function whitelistCountry(uint16 _country) public onlyOwner {
        require(!_whitelistedCountries[_country], "country already whitelisted");
        _whitelistedCountries[_country] = true;
        emit WhitelistedCountry(_country);
    }

    /**
     *  @dev removes whitelisting status of a country.
     *  Identities from those countries will be de-whitelisted & forbidden
     *  to manipulate Tokens linked to this Compliance.
     *  @param _country Country to be de-whitelisted, should be expressed by following numeric ISO 3166-1 standard
     *  Only the owner of the Compliance smart contract can call this function
     *  emits an `UnwhitelistedCountry` event
     */
    function unWhitelistCountry(uint16 _country) public onlyOwner {
        require(_whitelistedCountries[_country], "country not whitelisted");
        _whitelistedCountries[_country] = false;
        emit UnWhitelistedCountry(_country);
    }

    /**
    *  @dev Returns true if country is whitelisted
    *  @param _country, numeric ISO 3166-1 standard of the country to be checked
    */
    function isCountryWhitelisted(uint16 _country) public view returns (bool) {
        return (_whitelistedCountries[_country]);
    }

    /**
    *  @dev check on the compliance status of a transaction.
    *  If the check returns TRUE, the transfer is allowed to be executed, if the check returns FALSE, the compliance
    *  feature will block the transfer execution
    *  The check will verify if the country of residence of `_to` is whitelisted or not, in case the country is
    *  whitelisted, this feature will allow the transfer to pass, otherwise the transfer will be blocked
    *  @param _to the address of the transfer receiver
    */
    function complianceCheckOnCountryWhitelisting (address /*_from*/, address _to, uint256 /*_value*/)
    public view returns (bool) {
        uint16 receiverCountry = _getCountry(_to);
        if (isCountryWhitelisted(receiverCountry)) {
            return true;
        }
        return false;
    }

    /**
    *  @dev state update of the compliance feature post-transfer.
    *  this compliance feature doesn't require state update post-transfer
    *  @param _from the address of the transfer sender
    *  @param _to the address of the transfer receiver
    *  @param _value the amount of tokens that `_from` sent to `_to`
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    // solhint-disable-next-line no-empty-blocks
    function _transferActionOnCountryWhitelisting(address _from, address _to, uint256 _value) internal {}

    /**
    *  @dev state update of the compliance feature post-minting.
    *  this compliance feature doesn't require state update post-minting
    *  @param _to the address of the minting beneficiary
    *  @param _value the amount of tokens minted on `_to` wallet
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    // solhint-disable-next-line no-empty-blocks
    function _creationActionOnCountryWhitelisting(address _to, uint256 _value) internal {}

    /**
    *  @dev state update of the compliance feature post-burning.
    *  this compliance feature doesn't require state update post-burning
    *  @param _from the wallet address on which tokens burnt
    *  @param _value the amount of tokens burnt from `_from` wallet
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    // solhint-disable-next-line no-empty-blocks
    function _destructionActionOnCountryWhitelisting(address _from, uint256 _value) internal {}
}
