pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/access/Roles.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract AgentRoles is Ownable {
    using Roles for Roles.Role;

    event RoleAdded(address indexed account);
    event RoleRemoved(address indexed account);

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
        emit RoleAdded(account);
    }

    function removeAgentAdmin(address account) public onlyAdmin {
        _agentAdmin.remove(account);
        emit RoleRemoved(account);
    }

    // SupplyModifier Role _supplyModifiers

    function isSupplyModifier(address account) public view returns (bool) {
        return _supplyModifiers.has(account);
    }

    function addSupplyModifier(address account) public onlyAdmin {
        _supplyModifiers.add(account);
        emit RoleAdded(account);
    }

    function removeSupplyModifier(address account) public onlyAdmin {
        _supplyModifiers.remove(account);
        emit RoleRemoved(account);
    }

    // Freezer Role _freezers

    function isFreezer(address account) public view returns (bool) {
        return _freezers.has(account);
    }

    function addFreezer(address account) public onlyAdmin {
        _freezers.add(account);
        emit RoleAdded(account);
    }

    function removeFreezer(address account) public onlyAdmin {
        _freezers.remove(account);
        emit RoleRemoved(account);
    }

    // TransferManager Role _transferManagers

    function isTransferManager(address account) public view returns (bool) {
        return _transferManagers.has(account);
    }

    function addTransferManager(address account) public onlyAdmin {
        _transferManagers.add(account);
        emit RoleAdded(account);
    }

    function removeTransferManager(address account) public onlyAdmin {
        _transferManagers.remove(account);
        emit RoleRemoved(account);
    }

    // RecoveryAgent Role _recoveryAgents

    function isRecoveryAgent(address account) public view returns (bool) {
        return _recoveryAgents.has(account);
    }

    function addRecoveryAgent(address account) public onlyAdmin {
        _recoveryAgents.add(account);
        emit RoleAdded(account);
    }

    function removeRecoveryAgent(address account) public onlyAdmin {
        _recoveryAgents.remove(account);
        emit RoleRemoved(account);
    }

    // ComplianceAgent Role _complianceAgents

    function isComplianceAgent(address account) public view returns (bool) {
        return _complianceAgents.has(account);
    }

    function addComplianceAgent(address account) public onlyAdmin {
        _complianceAgents.add(account);
        emit RoleAdded(account);
    }

    function removeComplianceAgent(address account) public onlyAdmin {
        _complianceAgents.remove(account);
        emit RoleRemoved(account);
    }

    // WhiteListManager Role _whiteListManagers

    function isWhiteListManager(address account) public view returns (bool) {
        return _whiteListManagers.has(account);
    }

    function addWhiteListManager(address account) public onlyAdmin {
        _whiteListManagers.add(account);
        emit RoleAdded(account);
    }

    function removeWhiteListManager(address account) public onlyAdmin {
        _whiteListManagers.remove(account);
        emit RoleRemoved(account);
    }
}
