pragma solidity ^0.5.10;

import "./ICompliance.sol";

contract DefaultCompliance is ICompliance {
    /**
    * @notice checks that the transfer is compliant.
    * default compliance always returns true
    *
    * @param _from The address of the sender
    * @param _to The address of the receiver
    * @param _value The amount of tokens involved in the transfer
    */
    function canTransfer(address _from, address _to, uint256 _value) public view returns (bool) {
        return true;
    }
}

