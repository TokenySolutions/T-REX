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

import "@openzeppelin/contracts/access/Ownable.sol";

import "../../Roles.sol";

contract OwnerRoles is Ownable {
    using Roles for Roles.Role;

    /// variables

    Roles.Role private _ownerAdmin;
    Roles.Role private _registryAddressSetter;
    Roles.Role private _complianceSetter;
    Roles.Role private _complianceManager;
    Roles.Role private _claimRegistryManager;
    Roles.Role private _issuersRegistryManager;
    Roles.Role private _tokenInfoManager;

    /// events

    event RoleAdded(address indexed _owner, string _role);
    event RoleRemoved(address indexed _owner, string _role);

    /// modifiers

    modifier onlyAdmin() {
        require(owner() == msg.sender || isOwnerAdmin(_msgSender()), "Role: Sender is NOT Admin");
        _;
    }

    /// functions

    function addOwnerAdmin(address _owner) external onlyAdmin {
        _ownerAdmin.add(_owner);
        string memory _role = "OwnerAdmin";
        emit RoleAdded(_owner, _role);
    }

    function removeOwnerAdmin(address _owner) external onlyAdmin {
        _ownerAdmin.remove(_owner);
        string memory _role = "OwnerAdmin";
        emit RoleRemoved(_owner, _role);
    }

    function addRegistryAddressSetter(address _owner) external onlyAdmin {
        _registryAddressSetter.add(_owner);
        string memory _role = "RegistryAddressSetter";
        emit RoleAdded(_owner, _role);
    }

    function removeRegistryAddressSetter(address _owner) external onlyAdmin {
        _registryAddressSetter.remove(_owner);
        string memory _role = "RegistryAddressSetter";
        emit RoleRemoved(_owner, _role);
    }

    function addComplianceSetter(address _owner) external onlyAdmin {
        _complianceSetter.add(_owner);
        string memory _role = "ComplianceSetter";
        emit RoleAdded(_owner, _role);
    }

    function removeComplianceSetter(address _owner) external onlyAdmin {
        _complianceSetter.remove(_owner);
        string memory _role = "ComplianceSetter";
        emit RoleRemoved(_owner, _role);
    }

    function addComplianceManager(address _owner) external onlyAdmin {
        _complianceManager.add(_owner);
        string memory _role = "ComplianceManager";
        emit RoleAdded(_owner, _role);
    }

    function removeComplianceManager(address _owner) external onlyAdmin {
        _complianceManager.remove(_owner);
        string memory _role = "ComplianceManager";
        emit RoleRemoved(_owner, _role);
    }

    function addClaimRegistryManager(address _owner) external onlyAdmin {
        _claimRegistryManager.add(_owner);
        string memory _role = "ClaimRegistryManager";
        emit RoleAdded(_owner, _role);
    }

    function removeClaimRegistryManager(address _owner) external onlyAdmin {
        _claimRegistryManager.remove(_owner);
        string memory _role = "ClaimRegistryManager";
        emit RoleRemoved(_owner, _role);
    }

    function addIssuersRegistryManager(address _owner) external onlyAdmin {
        _issuersRegistryManager.add(_owner);
        string memory _role = "IssuersRegistryManager";
        emit RoleAdded(_owner, _role);
    }

    function removeIssuersRegistryManager(address _owner) external onlyAdmin {
        _issuersRegistryManager.remove(_owner);
        string memory _role = "IssuersRegistryManager";
        emit RoleRemoved(_owner, _role);
    }

    function addTokenInfoManager(address _owner) external onlyAdmin {
        _tokenInfoManager.add(_owner);
        string memory _role = "TokenInfoManager";
        emit RoleAdded(_owner, _role);
    }

    function removeTokenInfoManager(address _owner) external onlyAdmin {
        _tokenInfoManager.remove(_owner);
        string memory _role = "TokenInfoManager";
        emit RoleRemoved(_owner, _role);
    }

    function isOwnerAdmin(address _owner) public view returns (bool) {
        return _ownerAdmin.has(_owner);
    }

    function isTokenInfoManager(address _owner) public view returns (bool) {
        return _tokenInfoManager.has(_owner);
    }

    function isIssuersRegistryManager(address _owner) public view returns (bool) {
        return _issuersRegistryManager.has(_owner);
    }

    function isClaimRegistryManager(address _owner) public view returns (bool) {
        return _claimRegistryManager.has(_owner);
    }

    function isComplianceManager(address _owner) public view returns (bool) {
        return _complianceManager.has(_owner);
    }

    function isComplianceSetter(address _owner) public view returns (bool) {
        return _complianceSetter.has(_owner);
    }

    function isRegistryAddressSetter(address _owner) public view returns (bool) {
        return _registryAddressSetter.has(_owner);
    }
}
