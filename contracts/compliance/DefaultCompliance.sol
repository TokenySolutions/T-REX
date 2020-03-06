pragma solidity ^0.6.0;

import "./ICompliance.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract DefaultCompliance is ICompliance, Ownable {

    /**
    * @notice checks that the transfer is compliant.
    * default compliance always returns true
    *
    * @param _from The address of the sender
    * @param _to The address of the receiver
    * @param _value The amount of tokens involved in the transfer
    */
    function canTransfer(address _from, address _to, uint256 _value) public override view returns (bool) {
        return true;
    }

    function transferred(address _from, address _to, uint256 _value) public override returns (bool) {
        return true;
    }

    function created(address _to, uint256 _value) public override returns (bool) {
        return true;
    }

    function destroyed(address _from, uint256 _value) public override returns (bool) {
        return true;
    }

    function transferOwnershipOnComplianceContract(address newOwner) external override onlyOwner {
        transferOwnership(newOwner);
    }
}

