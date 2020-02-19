pragma solidity ^0.5.10;

//interface
interface IToken {
    event UpdatedTokenInformation(string newName, string newSymbol, uint8 newDecimals, string newVersion, address newOnchainID);

    // getters
    function decimals() external view returns (uint8);
    function name() external view returns (string memory);
    function onchainID() external view returns (address);
    function symbol() external view returns (string memory);
    function version() external view returns (string memory);

    // setters
    function setTokenInformation(string calldata _name, string calldata _symbol, uint8 _decimals, string calldata _version, address _onchainID) external;
}
