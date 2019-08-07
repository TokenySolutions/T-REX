pragma solidity >=0.4.21 <0.6.0;

import "./Mintable.sol";
import "./IToken.sol";

contract Token is IToken, Mintable {
    // string public name = "TREXDINO";
    // string public symbol = "TREX";
    // uint8 public constant decimals = 0;

    // // totalSupply_ = someValue;

    // event UpdatedTokenInformation(string newName, string newSymbol);

    constructor(
        address _identityRegistry,
        address _compliance,
        address _topicsRegistry
		)
        public
		    TransferManager(_identityRegistry, _compliance, _topicsRegistry)
    {}

    /**
    * Owner can update token information here
    */
    function setTokenInformation(string calldata _name, string calldata _symbol) external onlyOwner {
        name = _name;
        symbol = _symbol;

        emit UpdatedTokenInformation(name, symbol);
    }
}
