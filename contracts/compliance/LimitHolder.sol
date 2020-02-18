pragma solidity ^0.6.0;

import "./ICompliance.sol";
import "../token/Token.sol";

contract LimitHolder is ICompliance {
    Token public token;
    uint public holderLimit;

    constructor (address _token, uint _holderLimit) public {
        token = Token(_token);
        holderLimit = _holderLimit;
    }

    function getHolderCount() public view returns(uint) {
        return token.holderCount();
    }

    function canTransfer(address _from, address _to, uint256 _value) public override view returns (bool) {
        if (token.holderCount() < holderLimit) {
            return true;
        }
        return false;
    }
}
