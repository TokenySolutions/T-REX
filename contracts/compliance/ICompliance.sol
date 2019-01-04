pragma solidity ^0.4.24;

//interface
contract Compliance {

    function canTransfer(address _from, address _to, uint256 value) public view returns(bool);
}
