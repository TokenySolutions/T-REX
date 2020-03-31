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

import "./Roles.sol";
import "./Ownable.sol";

contract AgentRoles is Ownable {
    using Roles for Roles.Role;

    event RoleAdded(address indexed _agent, string _role);
    event RoleRemoved(address indexed _agent, string _role);

    Roles.Role private _supplyModifiers;
    Roles.Role private _freezers;
    Roles.Role private _transferManagers;
    Roles.Role private _recoveryAgents;
    Roles.Role private _complianceAgents;
    Roles.Role private _whiteListManagers;
    Roles.Role private _agentAdmin;

    modifier onlyAdmin() {
        require(isOwner() || isAgentAdmin(_msgSender()), "Role: Sender is NOT Admin");
        _;
    }

    /// AgentAdmin Role _agentAdmin

    function isAgentAdmin(address _agent) public view returns (bool) {
        return _agentAdmin.has(_agent);
    }

    function addAgentAdmin(address _agent) public onlyAdmin {
        _agentAdmin.add(_agent);
        string memory _role = "AgentAdmin";
        emit RoleAdded(_agent, _role);
    }

    function removeAgentAdmin(address _agent) public onlyAdmin {
        _agentAdmin.remove(_agent);
        string memory _role = "AgentAdmin";
        emit RoleRemoved(_agent, _role);
    }

    /// SupplyModifier Role _supplyModifiers

    function isSupplyModifier(address _agent) public view returns (bool) {
        return _supplyModifiers.has(_agent);
    }

    function addSupplyModifier(address _agent) public onlyAdmin {
        _supplyModifiers.add(_agent);
        string memory _role = "SupplyModifier";
        emit RoleAdded(_agent, _role);
    }

    function removeSupplyModifier(address _agent) public onlyAdmin {
        _supplyModifiers.remove(_agent);
        string memory _role = "SupplyModifier";
        emit RoleRemoved(_agent, _role);
    }

    /// Freezer Role _freezers

    function isFreezer(address _agent) public view returns (bool) {
        return _freezers.has(_agent);
    }

    function addFreezer(address _agent) public onlyAdmin {
        _freezers.add(_agent);
        string memory _role = "Freezer";
        emit RoleAdded(_agent, _role);
    }

    function removeFreezer(address _agent) public onlyAdmin {
        _freezers.remove(_agent);
        string memory _role = "Freezer";
        emit RoleRemoved(_agent, _role);
    }

    /// TransferManager Role _transferManagers

    function isTransferManager(address _agent) public view returns (bool) {
        return _transferManagers.has(_agent);
    }

    function addTransferManager(address _agent) public onlyAdmin {
        _transferManagers.add(_agent);
        string memory _role = "TransferManager";
        emit RoleAdded(_agent, _role);
    }

    function removeTransferManager(address _agent) public onlyAdmin {
        _transferManagers.remove(_agent);
        string memory _role = "TransferManager";
        emit RoleRemoved(_agent, _role);
    }

    /// RecoveryAgent Role _recoveryAgents

    function isRecoveryAgent(address _agent) public view returns (bool) {
        return _recoveryAgents.has(_agent);
    }

    function addRecoveryAgent(address _agent) public onlyAdmin {
        _recoveryAgents.add(_agent);
        string memory _role = "RecoveryAgent";
        emit RoleAdded(_agent, _role);
    }

    function removeRecoveryAgent(address _agent) public onlyAdmin {
        _recoveryAgents.remove(_agent);
        string memory _role = "RecoveryAgent";
        emit RoleRemoved(_agent, _role);
    }

    /// ComplianceAgent Role _complianceAgents

    function isComplianceAgent(address _agent) public view returns (bool) {
        return _complianceAgents.has(_agent);
    }

    function addComplianceAgent(address _agent) public onlyAdmin {
        _complianceAgents.add(_agent);
        string memory _role = "ComplianceAgent";
        emit RoleAdded(_agent, _role);
    }

    function removeComplianceAgent(address _agent) public onlyAdmin {
        _complianceAgents.remove(_agent);
        string memory _role = "ComplianceAgent";
        emit RoleRemoved(_agent, _role);
    }

    /// WhiteListManager Role _whiteListManagers

    function isWhiteListManager(address _agent) public view returns (bool) {
        return _whiteListManagers.has(_agent);
    }

    function addWhiteListManager(address _agent) public onlyAdmin {
        _whiteListManagers.add(_agent);
        string memory _role = "WhiteListManager";
        emit RoleAdded(_agent, _role);
    }

    function removeWhiteListManager(address _agent) public onlyAdmin {
        _whiteListManagers.remove(_agent);
        string memory _role = "WhiteListManager";
        emit RoleRemoved(_agent, _role);
    }
}
