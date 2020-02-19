pragma solidity ^0.6.0;

//interface
interface IToken {
    event UpdatedTokenInformation(string newName, string newSymbol, uint8 newDecimals, string newVersion, address newOnchainID);

    // getters
    function getDecimals() external view returns (uint8);
    function getName() external view returns (string memory);
    function getOnchainID() external view returns (address);
    function getSymbol() external view returns (string memory);
    function getVersion() external view returns (string memory);

    // setters
    function setTokenInformation(string calldata _name, string calldata _symbol, uint8 _decimals, string calldata _version, address _onchainID) external;
}
