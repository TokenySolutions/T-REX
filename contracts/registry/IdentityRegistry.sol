pragma solidity ^0.4.23;

import "../identity/ClaimHolder.sol";

contract IdentityRegistry {
    mapping (address => ClaimHolder) public identity;

    event identityRegistered(ClaimHolder indexed identity);
    event identityRemoved(ClaimHolder indexed identity);
    event identityUpdated(ClaimHolder indexed old_identity, ClaimHolder indexed new_identity);


    //identity management
    function registerIdentity(ClaimHolder _identity) public  {
        require(msg.sender == _identity.getOwner());
        require(identity[msg.sender] == address(0), "identity contract already exists, please use update");
        require(_identity != address(0), "contract address can't be a zero address");
        identity[msg.sender] = _identity; 
        emit identityRegistered(_identity);
    }

    function updateIdentity(ClaimHolder _identity) public  {
        require(identity[msg.sender] != address(0));
        require(_identity != address(0), "contract address can't be a zero address");
        emit identityUpdated(identity[msg.sender], _identity);
        identity[msg.sender] = _identity;
    }

    function deleteIdentity() public {
        require(identity[msg.sender] != address(0), "you haven't registered an identity yet");
        delete identity[msg.sender];
        emit identityRemoved(identity[msg.sender]);
    }

    function viewIdentity() public view returns(ClaimHolder) {
        return identity[msg.sender];
    }

}