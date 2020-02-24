pragma solidity ^0.6.0;

interface ICompliance {
    function canTransfer(address _from, address _to, uint256 value) external view returns (bool);
    function transferred(address _from, address _to, uint256 _value) external returns (bool);
    function created(address _to, uint256 _value) external returns (bool);
    function destroyed(address _from, uint256 _value) external returns (bool);
}
