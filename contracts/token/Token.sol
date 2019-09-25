pragma solidity ^0.5.10;

import "./MintableAndBurnable.sol";
import "./IToken.sol";

contract Token is IToken, MintableAndBurnable {
    string public name = "TREXDINO";
    string public symbol = "TREX";
    string public version = "1.2";
    // uint8 public constant decimals = 0;
    address public onchainID = 0x0000000000000000000000000000000000000000;

    constructor(
        address _identityRegistry,
        address _compliance
		)
        public
		    TransferManager(_identityRegistry, _compliance)
    {}

    /**
    * Owner can update token information here
    */
    function setTokenInformation(string calldata _name, string calldata _symbol, string calldata _version, address calldata _onchainID) external onlyOwner {
        name = _name;
        symbol = _symbol;
        version = _version;
	onchainID = _onchainID;

        emit UpdatedTokenInformation(name, symbol, version, onchainID);
    }
}
