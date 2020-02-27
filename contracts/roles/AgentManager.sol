pragma solidity ^0.6.0;

import "../token/IToken.sol";
import "../registry/IIdentityRegistry.sol";
import "./AgentRoles.sol";
import "@onchain-id/solidity/contracts/IIdentity.sol";

contract AgentManager is AgentRoles {

    IToken public token;
    IIdentityRegistry public identityRegistry;

    constructor (address _token) public {
        token = IToken(_token);
    }

    function callForcedTransfer(address _from, address _to, uint256 _value, IIdentity onchainID) external {
        require(isTransferManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Transfer Manager");
        token.forcedTransfer(_from, _to, _value);
    }

    function callBatchForcedTransfer(address[] calldata _fromList, address[] calldata _toList, uint256[] calldata _values, IIdentity onchainID) external {
        require(isTransferManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Transfer Manager");
        token.batchForcedTransfer(_fromList, _toList, _values);
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

    function callBatchMint(address[] calldata _toList, uint256[] calldata _amounts, IIdentity onchainID) external {
        require(isSupplyModifier(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Supply Modifier");
        token.batchMint(_toList, _amounts);
    }

    function callBurn(address account, uint256 value, IIdentity onchainID) external {
        require(isSupplyModifier(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Supply Modifier");
        token.burn(account, value);
    }

    function callBatchBurn(address[] calldata accounts, uint256[] calldata values, IIdentity onchainID) external {
        require(isSupplyModifier(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Supply Modifier");
        token.batchBurn(accounts, values);
    }

    function callSetAddressFrozen(address addr, bool freeze, IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.setAddressFrozen(addr, freeze);
    }

    function callBatchSetAddressFrozen(address[] calldata addrList, bool[] calldata freeze, IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.batchSetAddressFrozen(addrList, freeze);
    }

    function callFreezePartialTokens(address addr, uint256 amount, IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.freezePartialTokens(addr, amount);
    }

    function callBatchFreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts, IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.batchFreezePartialTokens(addrList, amounts);
    }

    function callUnfreezePartialTokens(address addr, uint256 amount, IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.unfreezePartialTokens(addr, amount);
    }

    function callBatchUnfreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts, IIdentity onchainID) external {
        require(isFreezer(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Freezer");
        token.batchUnfreezePartialTokens(addrList, amounts);
    }

    function callRecoveryAddress(address wallet_lostAddress, address wallet_newAddress, address investorOnchainID, IIdentity onchainID) external {
        require(isRecoveryAgent(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Recovery Agent");
        token.recoveryAddress(wallet_lostAddress, wallet_newAddress, investorOnchainID);
    }

    function callRegisterIdentity(address _user, IIdentity _identity, uint16 _country, IIdentity onchainID) external {
        require(isWhiteListManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT WhiteList Manager");
        identityRegistry = token.getIdentityRegistry();
        identityRegistry.registerIdentity(_user, _identity, _country);
    }

    function callUpdateIdentity(address _user, IIdentity _identity, IIdentity onchainID) external {
        require(isWhiteListManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT WhiteList Manager");
        identityRegistry = token.getIdentityRegistry();
        identityRegistry.updateIdentity(_user, _identity);
    }

    function callUpdateCountry(address _user, uint16 _country, IIdentity onchainID) external {
        require(isWhiteListManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT WhiteList Manager");
        identityRegistry = token.getIdentityRegistry();
        identityRegistry.updateCountry(_user, _country);
    }

    function callDeleteIdentity(address _user, IIdentity onchainID) external {
        require(isWhiteListManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT WhiteList Manager");
        identityRegistry = token.getIdentityRegistry();
        identityRegistry.deleteIdentity(_user);
    }
}
