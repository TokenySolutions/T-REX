pragma solidity ^0.6.0;

import "./TransferManager.sol";
import "./IToken.sol";

contract Token is IToken, TransferManager {

    string private tokenName;
    string private tokenSymbol;
    string private tokenVersion;
    uint8 private tokenDecimals;
    address private tokenOnchainID;

    constructor(
        address _identityRegistry,
        address _compliance,
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        string memory _version,
        address _onchainID)
    public TransferManager(_identityRegistry, _compliance) {
        tokenName = _name;
        tokenSymbol = _symbol;
        tokenDecimals = _decimals;
        tokenVersion = _version;
        tokenOnchainID = _onchainID;

        emit UpdatedTokenInformation(tokenName, tokenSymbol, tokenDecimals, tokenVersion, tokenOnchainID);
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * balanceOf() and transfer().
     */
    function decimals() public override view returns (uint8){
        return tokenDecimals;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public override view returns (string memory){
        return tokenName;
    }

    /**
     * @dev Returns the address of the onchainID of the token.
     * the onchainID of the token gives all the information available
     * about the token and is managed by the token issuer or his agent.
     */
    function onchainID() public override view returns (address){
        return tokenOnchainID;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public override view returns (string memory){
        return tokenSymbol;
    }

    /**
     * @dev Returns the TREX version of the token.
     * current version is 2.5.0
     */
    function version() public override view returns (string memory){
        return tokenVersion;
    }

    /**
     * @dev Sets the values for `tokenName`, `tokenSymbol`, `tokenDecimals`,
     * `tokenVersion` and `tokenOnchainID`
     */

    function setTokenInformation(string calldata _name, string calldata _symbol, uint8 _decimals, string calldata _version, address _onchainID) external override onlyOwner {
        tokenName = _name;
        tokenSymbol = _symbol;
        tokenDecimals = _decimals;
        tokenVersion = _version;
        tokenOnchainID = _onchainID;

        emit UpdatedTokenInformation(tokenName, tokenSymbol, tokenDecimals, tokenVersion, tokenOnchainID);
    }
}
