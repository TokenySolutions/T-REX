pragma solidity ^0.6.0;
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../token/IToken.sol";
import "../registry/IIdentityRegistry.sol";
import "./AgentRoles.sol";
import "@onchain-id/solidity/contracts/IIdentity.sol";

contract AgentManager is Ownable, AgentRoles {

    IToken public token;
    IIdentityRegistry public identityRegistry;


    constructor (address _token) public {
        token = IToken(_token);
        identityRegistry = token.getIdentityRegistry();
    }

    function callForcedTransfer(address _from, address _to, uint256 _value, IIdentity onchainID) external {
        require(isTransferManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Transfer Manager");
        token.forcedTransfer(_from, _to, _value);
    }

    function callPause(IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.pause();
    }

    function callUnpause(IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.unpause();
    }

    function callMint(address _to, uint256 _amount, IIdentity onchainID) external {
        require(isSupplyModifier(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Supply Modifier");
        token.mint(_to, _amount);
    }

    function callBurn(address account, uint256 value, IIdentity onchainID) external {
        require(isSupplyModifier(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Supply Modifier");
        token.mint(account, value);
    }

    function callSetAddressFrozen(address addr, bool freeze, IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.setAddressFrozen(addr, freeze);
    }

    function callFreezePartialTokens(address addr, uint256 amount, IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.freezePartialTokens(addr, amount);
    }

    function callUnfreezePartialTokens(address addr, uint256 amount, IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.unfreezePartialTokens(addr, amount);
    }

    function callRecoveryAddress(address wallet_lostAddress, address wallet_newAddress, address investorOnchainID, IIdentity onchainID) external {
        require(isRecoveryAgent(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Recovery Agent");
        token.recoveryAddress(wallet_lostAddress, wallet_newAddress, investorOnchainID);
    }

    function callRegisterIdentity(address _user, IIdentity _identity, uint16 _country, IIdentity onchainID) external {
        require(isWhiteListManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT WhiteList Manager");
        identityRegistry.registerIdentity(_user, _identity, _country);
    }

    function callUpdateIdentity(address _user, IIdentity _identity, IIdentity onchainID) external {
        require(isWhiteListManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT WhiteList Manager");
        identityRegistry.updateIdentity(_user, _identity);
    }

    function callUpdateCountry(address _user, uint16 _country, IIdentity onchainID) external {
        require(isWhiteListManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT WhiteList Manager");
        identityRegistry.updateCountry(_user, _country);
    }

    function callDeleteIdentity(address _user, IIdentity onchainID) external {
        require(isWhiteListManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT WhiteList Manager");
        identityRegistry.deleteIdentity(_user);
    }
}
