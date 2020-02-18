pragma solidity ^0.6.0;

interface ICompliance {
    function canTransfer(address _from, address _to, uint256 value) external view returns (bool);
}
