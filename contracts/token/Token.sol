pragma solidity ^0.4.23;

import "./UpgradeableToken.sol";
import "../../zeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";


contract Token is UpgradeableToken, BurnableToken {
    string public name = "TREXDINO";
    string public symbol = "TREX";

    // For patient incentive programs
    uint256 public INITIAL_SUPPLY;

    event UpdatedTokenInformation(string newName, string newSymbol);

    constructor(
        address rexWallet, 
        address _upgradeMaster, 
        uint256 _INITIAL_SUPPLY,
        address _claimIssuersRegistry,
        address _claimTypesRegistry,
        address _identityRegistry
		)
        public
        UpgradeableToken(_upgradeMaster)
		    TransferManager(_claimIssuersRegistry, _claimTypesRegistry, _identityRegistry)
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

    /**
    * Owner can burn token here
    */
    function burn(uint256 _value) public onlyOwner {
        adjustInvestorCount(msg.sender, address(0), _value);
        super.burn(_value);
    }
}
