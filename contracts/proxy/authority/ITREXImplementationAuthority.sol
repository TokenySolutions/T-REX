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

interface ITREXImplementationAuthority {

    /// types

    struct TREXContracts {
        // address of token implementation contract
        address tokenImplementation;
        // address of ClaimTopicsRegistry implementation contract
        address ctrImplementation;
        // address of IdentityRegistry implementation contract
        address irImplementation;
        // address of IdentityRegistryStorage implementation contract
        address irsImplementation;
        // address of TrustedIssuersRegistry implementation contract
        address tirImplementation;
        // address of ModularCompliance implementation contract
        address mcImplementation;
    }

    struct Version {
        // major version
        uint8 major;
        // minor version
        uint8 minor;
        // patch version
        uint8 patch;
    }

    /// events

    /// event emitted when a new TREX version is added to the contract memory
    event TREXVersionAdded(Version indexed version, TREXContracts indexed trex);

    /// event emitted when a new TREX version is fetched from reference contract by auxiliary contract
    event TREXVersionFetched(Version indexed version, TREXContracts indexed trex);

    /// event emitted when the current version is updated
    event VersionUpdated(Version indexed version);

    /// event emitted by the constructor when the IA is deployed
    event ImplementationAuthoritySet(bool referenceStatus, address trexFactory);

    /// event emitted when the TREX factory address is set
    event TREXFactorySet(address indexed trexFactory);

    /// event emitted when the IA factory address is set
    event IAFactorySet(address indexed iaFactory);

    /// event emitted when a token issuer decides to change current IA for a new one
    event ImplementationAuthorityChanged(address indexed _token, address indexed _newImplementationAuthority);

    /// functions

    /**
     *  @dev allows to fetch a TREX version available on the reference contract
     *  can be called only from auxiliary contracts, not on reference (main) contract
     *  throws if the version was already fetched
     *  adds the new version on the local storage
     *  allowing the update of contracts through the `useTREXVersion` afterwards
     */
    function fetchVersion(Version calldata _version) external;

    /**
     *  @dev setter for _trexFactory variable
     *  _trexFactory is set at deployment for auxiliary contracts
     *  for main contract it must be set post-deployment as main IA is
     *  deployed before the TREXFactory.
     *  @param trexFactory the address of TREXFactory contract
     *  emits a TREXFactorySet event
     *  only Owner can call
     *  can be called only on main contract, auxiliary contracts cannot call
     */
    function setTREXFactory(address trexFactory) external;

    /**
     *  @dev setter for _iaFactory variable
     *  _iaFactory is set at zero address for auxiliary contracts
     *  for main contract it can be set post-deployment or at deployment
     *  in the constructor
     *  @param iaFactory the address of IAFactory contract
     *  emits a IAFactorySet event
     *  only Owner can call
     *  can be called only on main contract, auxiliary contracts cannot call
     */
    function setIAFactory(address iaFactory) external;

    /**
     *  @dev adds a new Version of TREXContracts to the mapping
     *  only callable on the reference contract
     *  only Owner can call this function
     *  @param _version the new version to add to the mapping
     *  @param _trex the list of contracts corresponding to the new version
     *  _trex cannot contain zero addresses
     *  emits a `TREXVersionAdded` event
     */
    function addTREXVersion(Version calldata _version, TREXContracts calldata _trex) external;

    /**
     *  @dev updates the current version in use by the proxies
     *  variation of the `useTREXVersion` allowing to use a new version
     *  this function calls in a single transaction the `addTREXVersion`
     *  and the `useTREXVersion` using an existing version
     *  @param _version the version to use
     *  @param _trex the set of contracts corresponding to the version
     *  only Owner can call (check performed in addTREXVersion)
     *  only reference contract can call (check performed in addTREXVersion)
     *  emits a `TREXVersionAdded`event
     *  emits a `VersionUpdated` event
     */
    function addAndUseTREXVersion(Version calldata _version, TREXContracts calldata _trex) external;

    /**
     *  @dev updates the current version in use by the proxies
     *  @param _version the version to use
     *  reverts if _version is already used or if version does not exist
     *  only Owner can call
     *  emits a `VersionUpdated` event
     */
    function useTREXVersion(Version calldata _version) external;

    /**
     *  @dev change the implementationAuthority address of all proxy contracts linked to a given token
     *  only the owner of all proxy contracts can call this function
     *  @param _token the address of the token proxy
     *  @param _newImplementationAuthority the address of the new IA contract
     *  caller has to be owner of all contracts linked to the token and impacted by the change
     *  Set _newImplementationAuthority on zero address to deploy a new IA contract
     *  New IA contracts can only be deployed ONCE per token and only if current IA is the main IA
     *  if _newImplementationAuthority is not a new contract it must be using the same version
     *  as the current IA contract.
     *  calls `setImplementationAuthority` on all proxies linked to the token
     *  emits a `ImplementationAuthorityChanged` event
     */
    function changeImplementationAuthority(address _token, address _newImplementationAuthority) external;

    /**
     *  @dev getter function returning the current version of contracts used by proxies
     */
    function getCurrentVersion() external view returns (Version memory);

    /**
     *  @dev getter function returning the contracts corresponding to a version
     *  @param _version the version that contracts are requested for
     */
    function getContracts(Version calldata _version) external view returns (TREXContracts memory);

    /**
     *  @dev getter function returning address of reference TREX factory
     */
    function getTREXFactory() external view returns (address);

    /**
     *  @dev getter function returning address of token contract implementation
     *  currently used by the proxies using this TREXImplementationAuthority
     */
    function getTokenImplementation() external view returns (address);

    /**
     *  @dev getter function returning address of ClaimTopicsRegistry contract implementation
     *  currently used by the proxies using this TREXImplementationAuthority
     */
    function getCTRImplementation() external view returns (address);

    /**
     *  @dev getter function returning address of IdentityRegistry contract implementation
     *  currently used by the proxies using this TREXImplementationAuthority
     */
    function getIRImplementation() external view returns (address);

    /**
     *  @dev getter function returning address of IdentityRegistryStorage contract implementation
     *  currently used by the proxies using this TREXImplementationAuthority
     */
    function getIRSImplementation() external view returns (address);

    /**
     *  @dev getter function returning address of TrustedIssuersRegistry contract implementation
     *  currently used by the proxies using this TREXImplementationAuthority
     */
    function getTIRImplementation() external view returns (address);

    /**
     *  @dev getter function returning address of ModularCompliance contract implementation
     *  currently used by the proxies using this TREXImplementationAuthority
     */
    function getMCImplementation() external view returns (address);

    /**
     *  @dev returns true if the contract is the main contract
     *  returns false if the contract is an auxiliary contract
     */
    function isReferenceContract() external view returns (bool);

    /**
     *  @dev getter for reference contract address
     */
    function getReferenceContract() external view returns (address);
}