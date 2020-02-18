pragma solidity ^0.6.0;

import "./MintableAndBurnable.sol";
import "./IToken.sol";

contract Token is IToken, MintableAndBurnable {
    string private tokenName = "TREXDINO";
    string private tokenSymbol = "TREX";
    string private tokenVersion = "1.2";
    uint8 public override decimals = 0;
    address public override onchainID = 0x0000000000000000000000000000000000000000;

    constructor(address _identityRegistry, address _compliance) public TransferManager(_identityRegistry, _compliance) {}

    function name() public view override returns (string memory) {
        return tokenName;
    }

    function symbol() public view override returns (string memory) {
        return tokenSymbol;
    }

    function version() public view override returns (string memory) {
        return tokenVersion;
    }

    /**
    * Owner can update token information here
    */
    function setTokenInformation(string calldata _name, string calldata _symbol, uint8 _decimals, string calldata _version, address _onchainID) external override onlyOwner {

        tokenName = _name;
        tokenSymbol = _symbol;
        decimals = _decimals;
        tokenVersion = _version;
        onchainID = _onchainID;

        emit UpdatedTokenInformation(tokenName, tokenSymbol, decimals, tokenVersion, onchainID);
    }
}
