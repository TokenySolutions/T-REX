pragma solidity ^0.5.10;

//interface
contract IToken{

    string public name;
    string public symbol;
    uint8 public decimals;
    string public version;
    address public onchainID;

    event UpdatedTokenInformation(string newName, string newSymbol, string newVersion, address newOnchainID);

    function setTokenInformation(string calldata _name, string calldata _symbol, string calldata _version, address calldata _onchainID) external;

}
