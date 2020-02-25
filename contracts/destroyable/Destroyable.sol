pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Destroyable is Ownable {
    bool private authorization;

    constructor() public {
        authorization = false;
    }

    function setDestroyAuthorization(bool _authorization) external onlyOwner {
        authorization = _authorization;
    }

    function destroyContract() external onlyOwner {
        require(authorization == true, "Owner must authorize the destruction of this contract first");
        selfdestruct(msg.sender);
    }
}