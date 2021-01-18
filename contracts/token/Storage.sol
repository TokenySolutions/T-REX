pragma solidity ^0.6.2;
import '../compliance/ICompliance.sol';
import '../registry/IIdentityRegistry.sol';

contract Storage {
    /// ERC20 basic variables
    mapping(address => uint256) internal _balances;
    mapping(address => mapping(address => uint256)) internal _allowances;
    uint256 internal _totalSupply;

    /// Token information
    string internal tokenName;
    string internal tokenSymbol;
    uint8 internal tokenDecimals;
    address internal tokenOnchainID;
    string internal constant TOKEN_VERSION = '3.2.0';

    /// Variables of freeze and pause functions
    mapping(address => bool) internal frozen;
    mapping(address => uint256) internal frozenTokens;

    bool internal tokenPaused = false;

    /// Identity Registry contract used by the onchain validator system
    IIdentityRegistry internal tokenIdentityRegistry;

    /// Compliance contract linked to the onchain validator system
    ICompliance internal tokenCompliance;
}
