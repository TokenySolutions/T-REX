/**
 *     NOTICE
 *
 *     The T-REX software is licensed under a proprietary license or the GPL v.3.
 *     If you choose to receive it under the GPL v.3 license, the following applies:
 *     T-REX is a suite of smart contracts developed by Tokeny to manage and transfer financial assets on the ethereum blockchain
 *
 *     Copyright (C) 2019, Tokeny sàrl.
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

pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/access/Roles.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract OwnerRoles is Ownable {
    using Roles for Roles.Role;

    event RoleAdded(address indexed account, string role);
    event RoleRemoved(address indexed account, string role);

    Roles.Role private _ownerAdmin;
    Roles.Role private _registryAddressSetter;
    Roles.Role private _complianceSetter;
    Roles.Role private _claimRegistryManager;
    Roles.Role private _issuersRegistryManager;
    Roles.Role private _tokenInfoManager;

    modifier onlyAdmin() {
        require(isOwner() || isOwnerAdmin(_msgSender()), "Role: Sender is NOT Admin");
        _;
    }

    // OwnerAdmin Role _ownerAdmin

    function isOwnerAdmin(address account) public view returns (bool) {
        return _ownerAdmin.has(account);
    }

    function addOwnerAdmin(address account) public onlyAdmin {
        _ownerAdmin.add(account);
        string memory role = "OwnerAdmin";
        emit RoleAdded(account, role);
    }

    function removeOwnerAdmin(address account) public onlyAdmin {
        _ownerAdmin.remove(account);
        string memory role = "OwnerAdmin";
        emit RoleRemoved(account, role);
    }

    // RegistryAddressSetter Role _registryAddressSetter

    function isRegistryAddressSetter(address account) public view returns (bool) {
        return _registryAddressSetter.has(account);
    }

    function addRegistryAddressSetter(address account) public onlyAdmin {
        _registryAddressSetter.add(account);
        string memory role = "RegistryAddressSetter";
        emit RoleAdded(account, role);
    }

    function removeRegistryAddressSetter(address account) public onlyAdmin {
        _registryAddressSetter.remove(account);
        string memory role = "RegistryAddressSetter";
        emit RoleRemoved(account, role);
    }

    // ComplianceSetter Role _complianceSetter

    function isComplianceSetter(address account) public view returns (bool) {
        return _complianceSetter.has(account);
    }

    function addComplianceSetter(address account) public onlyAdmin {
        _complianceSetter.add(account);
        string memory role = "ComplianceSetter";
        emit RoleAdded(account, role);
    }

    function removeComplianceSetter(address account) public onlyAdmin {
        _complianceSetter.remove(account);
        string memory role = "ComplianceSetter";
        emit RoleRemoved(account, role);
    }

    // ClaimRegistryManager Role _claimRegistryManager

    function isClaimRegistryManager(address account) public view returns (bool) {
        return _claimRegistryManager.has(account);
    }

    function addClaimRegistryManager(address account) public onlyAdmin {
        _claimRegistryManager.add(account);
        string memory role = "ClaimRegistryManager";
        emit RoleAdded(account, role);
    }

    function removeClaimRegistryManager(address account) public onlyAdmin {
        _claimRegistryManager.remove(account);
        string memory role = "ClaimRegistryManager";
        emit RoleRemoved(account, role);
    }

    // IssuersRegistryManager Role _issuersRegistryManager

    function isIssuersRegistryManager(address account) public view returns (bool) {
        return _issuersRegistryManager.has(account);
    }

    function addIssuersRegistryManager(address account) public onlyAdmin {
        _issuersRegistryManager.add(account);
        string memory role = "IssuersRegistryManager";
        emit RoleAdded(account, role);
    }

    function removeIssuersRegistryManager(address account) public onlyAdmin {
        _issuersRegistryManager.remove(account);
        string memory role = "IssuersRegistryManager";
        emit RoleRemoved(account, role);
    }

    // TokenInfoManager Role _tokenInfoManager

    function isTokenInfoManager(address account) public view returns (bool) {
        return _tokenInfoManager.has(account);
    }

    function addTokenInfoManager(address account) public onlyAdmin {
        _tokenInfoManager.add(account);
        string memory role = "TokenInfoManager";
        emit RoleAdded(account, role);
    }

    function removeTokenInfoManager(address account) public onlyAdmin {
        _tokenInfoManager.remove(account);
        string memory role = "TokenInfoManager";
        emit RoleRemoved(account, role);
    }
}
