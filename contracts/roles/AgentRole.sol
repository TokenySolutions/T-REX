pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/access/Roles.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract AgentRole is Ownable {
    using Roles for Roles.Role;

    event AgentAdded(address indexed account);
    event AgentRemoved(address indexed account);

    Roles.Role private _agents;

    modifier onlyAgent() {
        require(isAgent(msg.sender), "AgentRole: caller does not have the Agent role");
        _;
    }

    function isAgent(address account) public view returns (bool) {
        return _agents.has(account);
    }

    function addAgent(address account) public onlyOwner {
        _addAgent(account);
    }

    function removeAgent() public {
        _removeAgent(msg.sender);
    }

    function _addAgent(address account) internal {
        _agents.add(account);
        emit AgentAdded(account);
    }

    function _removeAgent(address account) internal {
        _agents.remove(account);
        emit AgentRemoved(account);
    }
}
