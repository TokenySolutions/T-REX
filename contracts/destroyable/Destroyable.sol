pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Destroyable is Ownable {
    function kill() public onlyOwner {
        selfdestruct(msg.sender);
    }
}
