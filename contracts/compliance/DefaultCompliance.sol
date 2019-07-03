pragma solidity >=0.4.21 <0.6.0;

import "./ICompliance.sol";

contract DefaultCompliance is Compliance {
    function canTransfer(address _from, address _to, uint256 _value) public view returns (bool) {
        return true;
    }
}

