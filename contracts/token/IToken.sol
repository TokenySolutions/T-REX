pragma solidity >=0.4.21 <0.6.0;

//interface
contract IToken{

    string public name = "TREXDINO";
    string public symbol = "TREX";
    uint8 public constant decimals = 0;
    
    event UpdatedTokenInformation(string newName, string newSymbol);

    function setTokenInformation(string calldata _name, string calldata _symbol) external;

}
