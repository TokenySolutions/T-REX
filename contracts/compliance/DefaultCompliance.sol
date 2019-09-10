pragma solidity ^0.5.10;

import "./ICompliance.sol";

contract DefaultCompliance is Compliance {
    function canTransfer(address _from, address _to, uint256 _value) public view returns (bool) {
        return true;
    }
}

