pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Destroyable is Ownable {
    bool private destructAuthorization;

    constructor() public {
        destructAuthorization = false;
    }

    function setDestroyAuthorization(bool _destructAuthorization) external onlyOwner {
        destructAuthorization = _destructAuthorization;
    }

    function getAuthorizationStatus() external view onlyOwner returns(bool) {
        return destructAuthorization;
    }
    function destroyContract() external onlyOwner {
        require(destructAuthorization == true, "Owner must authorize the destruction of this contract first");
        selfdestruct(msg.sender);
    }
}