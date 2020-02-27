pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../registry/IIdentityRegistry.sol";
import "../compliance/ICompliance.sol";

//interface
interface IToken is IERC20 {
    event UpdatedTokenInformation(string newName, string newSymbol, uint8 newDecimals, string newVersion, address newOnchainID);

    // getters
    function decimals() external view returns (uint8);
    function name() external view returns (string memory);
    function onchainID() external view returns (address);
    function symbol() external view returns (string memory);
    function version() external view returns (string memory);
    function getIdentityRegistry() external view returns (IIdentityRegistry);
    function getCompliance() external view returns (ICompliance);
    function paused() external view returns (bool);


    // setters
    function setTokenInformation(string calldata _name, string calldata _symbol, uint8 _decimals, string calldata _version, address _onchainID) external;
    function pause() external;
    function unpause() external;
    function setAddressFrozen(address addr, bool freeze) external;
    function freezePartialTokens(address addr, uint256 amount) external;
    function unfreezePartialTokens(address addr, uint256 amount) external;
    function setIdentityRegistry(address _identityRegistry) external;
    function setCompliance(address _compliance) external;

    // transactions
    function forcedTransfer(address _from, address _to, uint256 _value) external returns (bool);
    function mint(address _to, uint256 _amount) external;
    function burn(address account, uint256 value) external;
    function recoveryAddress(address lostWallet, address newWallet, address investorOnchainID) external returns (bool);
    function batchTransfer(address[] calldata _toList, uint256[] calldata _values) external;
    function batchForcedTransfer(address[] calldata _fromList, address[] calldata _toList, uint256[] calldata _values) external;
    function batchMint(address[] calldata _toList, uint256[] calldata _amounts) external;
    function batchBurn(address[] calldata accounts, uint256[] calldata values) external;
    function batchSetAddressFrozen(address[] calldata addrList, bool[] calldata freeze) external;
    function batchFreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts) external;
    function batchUnfreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts) external;

    // transfer contract ownership
    function transferOwnershipOnTokenContract(address newOwner) external;
}
