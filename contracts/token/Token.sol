pragma solidity ^0.4.23;

import "./Mintable.sol";

contract Token is Mintable {
    string public name = "TREXDINO";
    string public symbol = "TREX";
    uint8 public constant decimals = 0;
        
    // totalSupply_ = someValue;

    event UpdatedTokenInformation(string newName, string newSymbol);

    constructor(
        address _identityRegistry
		)
        public
		    TransferManager(_identityRegistry)
    {}

    /**
    * Owner can update token information here
    */
    function setTokenInformation(string _name, string _symbol) external onlyOwner {
        name = _name;
        symbol = _symbol;

        emit UpdatedTokenInformation(name, symbol);
    }
}
