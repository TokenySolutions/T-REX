pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/access/Roles.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract AgentRoles is Ownable {
    using Roles for Roles.Role;

    event RoleAdded(address indexed account, string role);
    event RoleRemoved(address indexed account, string role);

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

    // AgentAdmin Role _agentAdmin

    function isAgentAdmin(address account) public view returns (bool) {
        return _agentAdmin.has(account);
    }

    function addAgentAdmin(address account) public onlyAdmin {
        _agentAdmin.add(account);
        string memory role = "AgentAdmin";
        emit RoleAdded(account, role);
    }

    function removeAgentAdmin(address account) public onlyAdmin {
        _agentAdmin.remove(account);
        string memory role = "AgentAdmin";
        emit RoleRemoved(account, role);
    }

    // SupplyModifier Role _supplyModifiers

    function isSupplyModifier(address account) public view returns (bool) {
        return _supplyModifiers.has(account);
    }

    function addSupplyModifier(address account) public onlyAdmin {
        _supplyModifiers.add(account);
        string memory role = "SupplyModifier";
        emit RoleAdded(account, role);
    }

    function removeSupplyModifier(address account) public onlyAdmin {
        _supplyModifiers.remove(account);
        string memory role = "SupplyModifier";
        emit RoleRemoved(account, role);
    }

    // Freezer Role _freezers

    function isFreezer(address account) public view returns (bool) {
        return _freezers.has(account);
    }

    function addFreezer(address account) public onlyAdmin {
        _freezers.add(account);
        string memory role = "Freezer";
        emit RoleAdded(account, role);
    }

    function removeFreezer(address account) public onlyAdmin {
        _freezers.remove(account);
        string memory role = "Freezer";
        emit RoleRemoved(account, role);
    }

    // TransferManager Role _transferManagers

    function isTransferManager(address account) public view returns (bool) {
        return _transferManagers.has(account);
    }

    function addTransferManager(address account) public onlyAdmin {
        _transferManagers.add(account);
        string memory role = "TransferManager";
        emit RoleAdded(account, role);
    }

    function removeTransferManager(address account) public onlyAdmin {
        _transferManagers.remove(account);
        string memory role = "TransferManager";
        emit RoleRemoved(account, role);
    }

    // RecoveryAgent Role _recoveryAgents

    function isRecoveryAgent(address account) public view returns (bool) {
        return _recoveryAgents.has(account);
    }

    function addRecoveryAgent(address account) public onlyAdmin {
        _recoveryAgents.add(account);
        string memory role = "RecoveryAgent";
        emit RoleAdded(account, role);
    }

    function removeRecoveryAgent(address account) public onlyAdmin {
        _recoveryAgents.remove(account);
        string memory role = "RecoveryAgent";
        emit RoleRemoved(account, role);
    }

    // ComplianceAgent Role _complianceAgents

    function isComplianceAgent(address account) public view returns (bool) {
        return _complianceAgents.has(account);
    }

    function addComplianceAgent(address account) public onlyAdmin {
        _complianceAgents.add(account);
        string memory role = "ComplianceAgent";
        emit RoleAdded(account, role);
    }

    function removeComplianceAgent(address account) public onlyAdmin {
        _complianceAgents.remove(account);
        string memory role = "ComplianceAgent";
        emit RoleRemoved(account, role);
    }

    // WhiteListManager Role _whiteListManagers

    function isWhiteListManager(address account) public view returns (bool) {
        return _whiteListManagers.has(account);
    }

    function addWhiteListManager(address account) public onlyAdmin {
        _whiteListManagers.add(account);
        string memory role = "WhiteListManager";
        emit RoleAdded(account, role);
    }

    function removeWhiteListManager(address account) public onlyAdmin {
        _whiteListManagers.remove(account);
        string memory role = "WhiteListManager";
        emit RoleRemoved(account, role);
    }
}
