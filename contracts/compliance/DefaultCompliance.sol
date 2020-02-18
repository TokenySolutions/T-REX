pragma solidity ^0.6.0;

import "./ICompliance.sol";

contract DefaultCompliance is ICompliance {
    function canTransfer(address _from, address _to, uint256 _value) public override view returns (bool) {
        return true;
    }
}

