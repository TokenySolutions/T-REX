pragma solidity ^0.5.10;

import "./ICompliance.sol";
import "../token/Token.sol";

contract LimitHolder is Compliance {
    Token token;
    uint holderLimit;


    constructor (address _token, uint _holderLimit) public {
        token = Token(_token);
        holderLimit = _holderLimit;
    }

    function getHolderCount() public view returns(uint) {
        return token.holderCount();
    }

    function canTransfer(address _from, address _to, uint256 _value) public view returns (bool) {
        if(token.holderCount() < holderLimit) {
            return true;
        }
        return false;
    }
}
