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

pragma solidity 0.8.27;

import "../../errors/InvalidArgumentErrors.sol";

import "../../roles/AgentRoleUpgradeable.sol";
import "../../roles/IERC173.sol";
import "../interface/IIdentityRegistryStorage.sol";
import "../storage/IRSStorage.sol";
import "@onchain-id/solidity/contracts/factory/IIdFactory.sol";
import "@onchain-id/solidity/contracts/interface/IIdentity.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// Errors

/// @dev Thrown when address is already stored
error AddressAlreadyStored();

/// @dev Thrown when address is not yet stored.
error AddressNotYetStored();

/// @dev Thrown when trying to call write functions.
error ContractIsReadOnly();

/// @dev Thrown when maximum numbe of identity registry by identity registry storage is reached.
/// @param _max miximum number of IR by IRS.
error MaxIRByIRSReached(uint256 _max);


contract GlobalIdentityRegistryStorage is IERC3643IdentityRegistryStorage, AgentRoleUpgradeable, IRSStorage, IERC165 {
    IIdFactory internal _iidFactory;
    function init(_identityFactoryAddress) external initializer {
        require(_identityFactoryAddress != address(0), ZeroAddress());
        _iidFactory = IIdFactory(_identityFactoryAddress);
        __Ownable_init();
    }

    /**
     *  @dev See {IIdentityRegistryStorage-addIdentityToStorage}.
     */
    function addIdentityToStorage(
        address _userAddress,
        IIdentity _identity,
        uint16 _country
    ) external view override onlyAgent {
        bytes32 hash = keccak256(
                abi.encode(
                    "Authorize ONCHAINID wallet addition",
                    _identity,
                    _userAddress
                )
            );
    }

    /**
     *  @dev See {IIdentityRegistryStorage-modifyStoredIdentity}.
     */
    function modifyStoredIdentity() external view override onlyAgent {
    }

    /**
     *  @dev See {IIdentityRegistryStorage-modifyStoredInvestorCountry}.
     */
    function modifyStoredInvestorCountry() external view override onlyAgent {
    }

    /**
     *  @dev See {IIdentityRegistryStorage-removeIdentityFromStorage}.
     */
    function removeIdentityFromStorage(address _userAddress) external view override onlyAgent {
        // verify message sender
    }

    /**
     *  @dev See {IIdentityRegistryStorage-bindIdentityRegistry}.
     */
    function bindIdentityRegistry() external view override {
    }

    /**
     *  @dev See {IIdentityRegistryStorage-unbindIdentityRegistry}.
     */
    function unbindIdentityRegistry() external view override {
    }

    /**
     *  @dev See {IIdentityRegistryStorage-linkedIdentityRegistries}.
     */
    function linkedIdentityRegistries() external view override returns (address[] memory) {
        return _identityRegistries;
    }

    /**
     *  @dev See {IIdentityRegistryStorage-storedIdentity}.
     */
    function storedIdentity(address _userAddress) external view override returns (IIdentity) {
        if (_identities[_userAddress] != address(0)) {
            return _identities[_userAddress].identityContract;
        }
        address identity = _iidFactory.getIdentity(_userAddress);
        if (identity != address(0)) {
            _identities[_userAddress].identityContract = IIdentity(identity);
            return _identities[_userAddress].identityContract;
        }
        return address(0);
    }

    /**
     *  @dev See {IIdentityRegistryStorage-storedInvestorCountry}.
     */
    function storedInvestorCountry(address _userAddress) external view override returns (uint16) {
        if(_identities[_userAddress].investorCountry != 0) {
            return _identities[_userAddress].investorCountry;
        }
        return 42;
    }

    /**
     *  @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public pure virtual override returns (bool) {
        return
            interfaceId == type(IERC3643IdentityRegistryStorage).interfaceId ||
            interfaceId == type(IERC173).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }
}
