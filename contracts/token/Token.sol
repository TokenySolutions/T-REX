pragma solidity ^0.6.0;

import "./TransferManager.sol";
import "./IToken.sol";

contract Token is IToken, TransferManager {
    string public name;
    string public symbol;
    string public version;
    uint8 public decimals;
    address public onchainID;

    constructor(
        address _identityRegistry,
        address _compliance,
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        string memory _version,
        address _onchainID)
    public TransferManager(_identityRegistry, _compliance) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        version = _version;
        onchainID = _onchainID;

        emit NewTrexTokenCreated(name, symbol, decimals, version, onchainID);
    }

    /**
    * Owner can update token information here
    */
    function setTokenInformation(string calldata _name, string calldata _symbol, uint8 _decimals, string calldata _version, address _onchainID) external override onlyOwner {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        version = _version;
        onchainID = _onchainID;

        emit UpdatedTokenInformation(name, symbol, decimals, version, onchainID);
    }
}
