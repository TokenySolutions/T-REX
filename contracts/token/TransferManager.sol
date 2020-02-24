pragma solidity ^0.6.0;

import "@onchain-id/solidity/contracts/IERC734.sol";
import "@onchain-id/solidity/contracts/IERC735.sol";
import "@onchain-id/solidity/contracts/IIdentity.sol";
import "../registry/IClaimTopicsRegistry.sol";
import "../registry/IIdentityRegistry.sol";
import "../compliance/ICompliance.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../roles/AgentRole.sol";

import "openzeppelin-solidity/contracts/access/Roles.sol";


contract TransferManager is AgentRole, ERC20 {
    mapping(address => bool) public frozen;
    mapping(address => uint256) public frozenTokens;
    bool private _paused = false;

    IIdentityRegistry public identityRegistry;
    ICompliance public compliance;

    event IdentityRegistryAdded(address indexed _identityRegistry);

    event ComplianceAdded(address indexed _compliance);

    event AddressFrozen(
        address indexed addr,
        bool indexed isFrozen,
        address indexed owner
    );

    event RecoverySuccess(
        address wallet_lostAddress,
        address wallet_newAddress,
        address onchainID
    );

    event RecoveryFails(
        address wallet_lostAddress,
        address wallet_newAddress,
        address onchainID
    );

    event TokensFrozen(address indexed addr, uint256 amount);

    event TokensUnfrozen(address indexed addr, uint256 amount);

    /**
     * @dev Emitted when the pause is triggered by a pauser (`account`).
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by a pauser (`account`).
     */
    event UnPaused(address account);

    constructor (
        address _identityRegistry,
        address _compliance
    ) public {
        identityRegistry = IIdentityRegistry(_identityRegistry);
        emit IdentityRegistryAdded(_identityRegistry);
        compliance = ICompliance(_compliance);
        emit ComplianceAdded(_compliance);
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view returns (bool) {
        return _paused;
    }

    /**
    * @notice ERC-20 overridden function that include logic to check for trade validity.
    *  Require that the msg.sender and to addresses are not frozen.
    *  Require that the value should not exceed available balance .
    *  Require that the to address is a verified address,
    *  If the `to` address is not currently a shareholder then it MUST become one.
    *  If the transfer will reduce `msg.sender`'s balance to 0 then that address
    *  MUST be removed from the list of shareholders.
    *
    * @param _to The address of the receiver
    * @param _value The number of tokens to transfer
    *
    * @return `true` if successful and revert if unsuccessful
    */
    function transfer(address _to, uint256 _value) public override whenNotPaused returns (bool) {
        require(!frozen[_to] && !frozen[msg.sender]);
        require(_value <= balanceOf(msg.sender).sub(frozenTokens[msg.sender]), "Insufficient Balance");
        if (identityRegistry.isVerified(_to) && compliance.canTransfer(msg.sender, _to, _value)) {
            compliance.transferred(msg.sender, _to, _value);
            return super.transfer(_to, _value);
        }

        revert("Transfer not possible");
    }

    /**
     * @dev Called by an agent to pause, triggers stopped state.
     */
    function pause() public onlyAgent whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev Called by an agent to unpause, returns to normal state.
     */
    function unpause() public onlyAgent whenPaused {
        _paused = false;
        emit UnPaused(msg.sender);
    }

    function getIdentityRegistry() public view returns (IIdentityRegistry) {
        return identityRegistry;
    }

    /**
    * @notice function allowing to issue transfers in batch
    *  Require that the msg.sender and `to` addresses are not frozen.
    *  Require that the total value should not exceed available balance.
    *  Require that the `to` addresses are all verified addresses,
    *  If one of the `to` addresses is not currently a shareholder then it MUST become one.
    *  If the batchTransfer will reduce `msg.sender`'s balance to 0 then that address
    *  MUST be removed from the list of shareholders.
    *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_toList.length` IS TOO HIGH,
    *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
    *
    * @param _toList The addresses of the receivers
    * @param _values The number of tokens to transfer to the corresponding receiver
    *
    */

    function batchTransfer(address[] calldata _toList, uint256[] calldata _values) external {
        for (uint256 i = 0; i < _toList.length; i++) {
            transfer(_toList[i], _values[i]);
        }
    }

    /**
    * @notice ERC-20 overridden function that include logic to check for trade validity.
    *  Require that the from and to addresses are not frozen.
    *  Require that the value should not exceed available balance .
    *  Require that the to address is a verified address,
    *  If the `to` address is not currently a shareholder then it MUST become one.
    *  If the transfer will reduce `from`'s balance to 0 then that address
    *  MUST be removed from the list of shareholders.
    *
    * @param _from The address of the sender
    * @param _to The address of the receiver
    * @param _value The number of tokens to transfer
    *
    * @return `true` if successful and revert if unsuccessful
    */
    function transferFrom(address _from, address _to, uint256 _value) public override whenNotPaused returns (bool) {
        require(!frozen[_to] && !frozen[_from]);
        require(_value <= balanceOf(_from).sub(frozenTokens[_from]), "Insufficient Balance");
        if (identityRegistry.isVerified(_to) && compliance.canTransfer(_from, _to, _value)) {
            compliance.transferred(_from, _to, _value);
            return super.transferFrom(_from, _to, _value);
        }

        revert("Transfer not possible");
    }

    /**
    *
    *  In case the `from` address has not enough free tokens (unfrozen tokens)
    *  but has a total balance higher or equal to the `value` amount
    *  the amount of frozen tokens is reduced in order to have enough free tokens
    *  to proceed the transfer, in such a case, the remaining balance on the `from`
    *  account is 100% composed of frozen tokens post-transfer.
    *  Require that the `to` address is a verified address,
    *  If the `to` address is not currently a shareholder then it MUST become one.
    *  If the transfer will reduce `from`'s balance to 0 then that address
    *  MUST be removed from the list of shareholders.
    *
    * @param _from The address of the sender
    * @param _to The address of the receiver
    * @param _value The number of tokens to transfer
    *
    * @return `true` if successful and revert if unsuccessful
    */
    function forcedTransfer(address _from, address _to, uint256 _value) public onlyAgent returns (bool) {
        uint256 freeBalance = balanceOf(_from) - frozenTokens[_from];
        if (_value > freeBalance) {
            uint256 tokensToUnfreeze = _value - freeBalance;
            frozenTokens[_from] -= tokensToUnfreeze;
        }
        if (identityRegistry.isVerified(_to) && compliance.canTransfer(_from, _to, _value)) {
            compliance.transferred(_from, _to, _value);
            _transfer(_from, _to, _value);
            return true;
        }
        revert("Transfer not possible");
    }

    /**
   * @notice function allowing to issue forced transfers in batch
   *  Only Agent can call this function.
   *  Require that `value` should not exceed available balance of `_from`.
   *  Require that the `to` addresses are all verified addresses,
   *  If one of the `to` addresses is not currently a shareholder then it MUST become one.
   *  If the batchForcedTransfer will reduce `_from`'s balance to 0 then that address
   *  MUST be removed from the list of shareholders.
   *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_fromList.length` IS TOO HIGH,
   *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
   *
   * @param _fromList The addresses of the senders
   * @param _toList The addresses of the receivers
   * @param _values The number of tokens to transfer to the corresponding receiver
   *
   */

    function batchForcedTransfer(address[] calldata _fromList, address[] calldata _toList, uint256[] calldata _values) external {
        for (uint256 i = 0; i < _fromList.length; i++) {
            forcedTransfer(_fromList[i], _toList[i], _values[i]);
        }
    }

    /**
     * @notice Improved version of default mint method. Tokens can be minted
     * to an address if only it is a verified address as per the security token.
     * This check will be useful for a complaint crowdsale.
     * Only owner can call.
     *
     * @param _to Address to mint the tokens to.
     * @param _amount Amount of tokens to mint.
     *
     */
    function mint(address _to, uint256 _amount) public onlyAgent {
        require(identityRegistry.isVerified(_to), "Identity is not verified.");

        _mint(_to, _amount);
        compliance.created(_to, _amount);
    }

    function batchMint(address[] calldata _to, uint256[] calldata _amount) external {
        for (uint256 i = 0; i < _to.length; i++) {
            mint(_to[i], _amount[i]);
        }
    }

    function burn(address account, uint256 value) public onlyAgent {
        _burn(account, value);
        compliance.destroyed(account, value);
    }

    function batchBurn(address[] calldata account, uint256[] calldata value) external {
        for (uint256 i = 0; i < account.length; i++) {
            burn(account[i], value[i]);
        }
    }

    /**
     *  Sets an address frozen status for this token.
     *  @param addr The address for which to update frozen status
     *  @param freeze Frozen status of the address
     */
    function setAddressFrozen(address addr, bool freeze) public onlyAgent {
        frozen[addr] = freeze;

        emit AddressFrozen(addr, freeze, msg.sender);
    }

    /**
     * @notice function allowing to set frozen addresses in batch
     *  Only Agent can call this function.
     *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `addrList.length` IS TOO HIGH,
     *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *
     *  @param addrList The addresses for which to update frozen status
     *  @param freeze Frozen status of the corresponding address
     *
     */

    function batchSetAddressFrozen(address[] calldata addrList, bool[] calldata freeze) external {
        for (uint256 i = 0; i < addrList.length; i++) {
            setAddressFrozen(addrList[i], freeze[i]);
        }
    }

    /**
     *  Freezes token amount specified for given address.
     *  @param addr The address for which to update frozen tokens
     *  @param amount Amount of Tokens to be frozen
     */
    function freezePartialTokens(address addr, uint256 amount) public onlyAgent {
        uint256 balance = balanceOf(addr);
        require(balance >= frozenTokens[addr] + amount, "Amount exceeds available balance");
        frozenTokens[addr] += amount;
        emit TokensFrozen(addr, amount);
    }

    /**
     * @notice function allowing to freeze tokens partially in batch
     *  Only Agent can call this function.
     *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `addrList.length` IS TOO HIGH,
     *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *
     *  @param addrList The addresses on which tokens need to be frozen
     *  @param amounts the amount of tokens to freeze on the corresponding address
     *
     */

    function batchFreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts) external {
        for (uint256 i = 0; i < addrList.length; i++) {
            freezePartialTokens(addrList[i], amounts[i]);
        }
    }

    /**
     *  Unfreezes token amount specified for given address
     *  @param addr The address for which to update frozen tokens
     *  @param amount Amount of Tokens to be unfrozen
     */
    function unfreezePartialTokens(address addr, uint256 amount) public onlyAgent {
        require(frozenTokens[addr] >= amount, "Amount should be less than or equal to frozen tokens");
        frozenTokens[addr] -= amount;
        emit TokensUnfrozen(addr, amount);
    }

    /**
     * @notice function allowing to unfreeze tokens partially in batch
     *  Only Agent can call this function.
     *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `addrList.length` IS TOO HIGH,
     *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *
     *  @param addrList The addresses on which tokens need to be unfrozen
     *  @param amounts the amount of tokens to unfreeze on the corresponding address
     *
     */

    function batchUnfreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts) external {
        for (uint256 i = 0; i < addrList.length; i++) {
            unfreezePartialTokens(addrList[i], amounts[i]);
        }
    }

    //Identity registry setter.
    function setIdentityRegistry(address _identityRegistry) public onlyOwner {
        identityRegistry = IIdentityRegistry(_identityRegistry);
        emit IdentityRegistryAdded(_identityRegistry);
    }

    function setCompliance(address _compliance) public onlyOwner {
        compliance = ICompliance(_compliance);
        emit ComplianceAdded(_compliance);
    }

    function recoveryAddress(address wallet_lostAddress, address wallet_newAddress, address onchainID) public onlyAgent returns (bool){
        require(balanceOf(wallet_lostAddress) != 0);
        IIdentity _onchainID = IIdentity(onchainID);
        bytes32 _key = keccak256(abi.encode(wallet_newAddress));
        if (_onchainID.keyHasPurpose(_key, 1)) {
            uint investorTokens = balanceOf(wallet_lostAddress);
            identityRegistry.registerIdentity(wallet_newAddress, _onchainID, identityRegistry.getInvestorCountryOfWallet(wallet_lostAddress));
            identityRegistry.deleteIdentity(wallet_lostAddress);
            forcedTransfer(wallet_lostAddress, wallet_newAddress, investorTokens);
            emit RecoverySuccess(wallet_lostAddress, wallet_newAddress, onchainID);
            return true;
        }
        emit RecoveryFails(wallet_lostAddress, wallet_newAddress, onchainID);
        revert("Recovery not possible");
    }
}

