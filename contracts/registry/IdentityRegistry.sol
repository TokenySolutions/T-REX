pragma solidity ^0.4.23;

import "../identity/ClaimHolder.sol";

contract IdentityRegistry {
    mapping (address => ClaimHolder) public identity;

    event identityRegistered(ClaimHolder indexed identity);
    event identityRemoved(ClaimHolder indexed identity);
    event identityUpdated(ClaimHolder indexed old_identity, ClaimHolder indexed new_identity);


    //identity management
    function registerIdentity(address _user, ClaimHolder _identity) public  {
        require(_user == _identity.getOwner());
        require(identity[_user] == address(0), "identity contract already exists, please use update");
        require(_identity != address(0), "contract address can't be a zero address");
        identity[_user] = _identity; 
        emit identityRegistered(_identity);
    }

    function updateIdentity(address _user, ClaimHolder _identity) public  {
        require(identity[_user] != address(0));
        require(_identity != address(0), "contract address can't be a zero address");
        emit identityUpdated(identity[_user], _identity);
        identity[_user] = _identity;
    }

    function deleteIdentity(address _user) public {
        require(identity[_user] != address(0), "you haven't registered an identity yet");
        delete identity[_user];
        emit identityRemoved(identity[msg.sender]);
    }
}