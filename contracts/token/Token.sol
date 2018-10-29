pragma solidity ^0.4.23;

import "./Mintable.sol";

contract Token is Mintable {
    string public name = "TREXDINO";
    string public symbol = "TREX";
    uint8 public constant decimals = 18;

    // For patient incentive programs
    uint256 public INITIAL_SUPPLY;

    event UpdatedTokenInformation(string newName, string newSymbol);

    constructor(
        address rexWallet, 
        uint256 _INITIAL_SUPPLY,
        address _identityRegistry
		)
        public
		    TransferManager(_identityRegistry)
    {
        INITIAL_SUPPLY = _INITIAL_SUPPLY * (10 ** uint256(decimals));
        totalSupply_ = INITIAL_SUPPLY;
        balances[rexWallet] = INITIAL_SUPPLY;
        emit Transfer(address(0), rexWallet, INITIAL_SUPPLY);
    }

    /**
    * Owner can update token information here
    */
    function setTokenInformation(string _name, string _symbol) external onlyOwner {
        name = _name;
        symbol = _symbol;

        emit UpdatedTokenInformation(name, symbol);
    }
}
