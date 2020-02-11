pragma solidity ^0.5.10;

import "./UpgradeableToken.sol";
import "./IToken.sol";

contract Token is IToken, UpgradeableToken {
    string public name = "TREXDINO";
    string public symbol = "TREX";
    string public version = "1.2";
    uint8 public decimals = 0;
    address public onchainID = 0x0000000000000000000000000000000000000000;

    constructor(
        address _identityRegistry,
        address _compliance,
		address _upgradeMaster
		)
        public
		    TransferManager(_identityRegistry, _compliance)
			UpgradeableToken(_upgradeMaster)
    {}

    /**
    * Owner can update token information here
    */
    function setTokenInformation(string calldata _name, string calldata _symbol, uint8 _decimals, string calldata _version, address _onchainID) external onlyOwner {

        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        version = _version;
		onchainID = _onchainID;


        emit UpdatedTokenInformation(name, symbol, decimals, version, onchainID);
    }
}
