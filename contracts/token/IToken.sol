pragma solidity ^0.5.10;

//interface
contract IToken{

    string public name;
    string public symbol;
    uint8 public constant decimals = 0;
    string public version;
    address public securityID;

    event UpdatedTokenInformation(string newName, string newSymbol, string newVersion, address newSecurityID);

    function setTokenInformation(string calldata _name, string calldata _symbol, string calldata _version, address calldata _securityID) external;

}
