pragma solidity ^0.6.0;

import "./IToken.sol";
import "@onchain-id/solidity/contracts/IERC734.sol";
import "@onchain-id/solidity/contracts/IERC735.sol";
import "@onchain-id/solidity/contracts/IIdentity.sol";
import "../registry/IClaimTopicsRegistry.sol";
import "../registry/IIdentityRegistry.sol";
import "../compliance/ICompliance.sol";
import "../roles/AgentRole.sol";
import "openzeppelin-solidity/contracts/GSN/Context.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "openzeppelin-solidity/contracts/access/Roles.sol";

contract Token is IToken, Context, AgentRole {
    using SafeMath for uint256;

    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowances;
    uint256 private _totalSupply;

    string private tokenName;
    string private tokenSymbol;
    string private tokenVersion;
    uint8 private tokenDecimals;
    address private tokenOnchainID;
    mapping(address => bool) public frozen;
    mapping(address => uint256) public frozenTokens;
    bool private _paused = false;

    IIdentityRegistry private identityRegistry;
    ICompliance private compliance;

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

    constructor(
        address _identityRegistry,
        address _compliance,
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        string memory _version,
        address _onchainID
        )
    public {
        tokenName = _name;
        tokenSymbol = _symbol;
        tokenDecimals = _decimals;
        tokenVersion = _version;
        tokenOnchainID = _onchainID;
        identityRegistry = IIdentityRegistry(_identityRegistry);
        emit IdentityRegistryAdded(_identityRegistry);
        compliance = ICompliance(_compliance);
        emit ComplianceAdded(_compliance);
        emit UpdatedTokenInformation(tokenName, tokenSymbol, tokenDecimals, tokenVersion, tokenOnchainID);
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
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public override view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) public override view returns (uint256) {
        return _balances[account];
    }

    /**
    * @dev See {IERC20-allowance}.
    */
    function allowance(address owner, address spender) public override view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 amount) public override virtual returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].add(addedValue));
        return true;
    }

    /**
     * @dev Atomically decreases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` must have allowance for the caller of at least
     * `subtractedValue`.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].sub(subtractedValue, "ERC20: decreased allowance below zero"));
        return true;
    }

    /**
     * @dev Moves tokens `amount` from `sender` to `recipient`.
     *
     * This is internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `sender` cannot be the zero address.
     * - `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     */
    function _transfer(address sender, address recipient, uint256 amount) internal virtual {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        _beforeTokenTransfer(sender, recipient, amount);

        _balances[sender] = _balances[sender].sub(amount, "ERC20: transfer amount exceeds balance");
        _balances[recipient] = _balances[recipient].add(amount);
        emit Transfer(sender, recipient, amount);
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements
     *
     * - `to` cannot be the zero address.
     */
    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");

        _beforeTokenTransfer(address(0), account, amount);

        _totalSupply = _totalSupply.add(amount);
        _balances[account] = _balances[account].add(amount);
        emit Transfer(address(0), account, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, reducing the
     * total supply.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * Requirements
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens.
     */
    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");

        _beforeTokenTransfer(account, address(0), amount);

        _balances[account] = _balances[account].sub(amount, "ERC20: burn amount exceeds balance");
        _totalSupply = _totalSupply.sub(amount);
        emit Transfer(account, address(0), amount);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner`s tokens.
     *
     * This is internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`.`amount` is then deducted
     * from the caller's allowance.
     *
     * See {_burn} and {_approve}.
     */
    function _burnFrom(address account, uint256 amount) internal virtual {
        _burn(account, amount);
        _approve(account, _msgSender(), _allowances[account][_msgSender()].sub(amount, "ERC20: burn amount exceeds allowance"));
    }

    /**
     * @dev Hook that is called before any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of `from`'s tokens
     * will be to transferred to `to`.
     * - when `from` is zero, `amount` tokens will be minted for `to`.
     * - when `to` is zero, `amount` of `from`'s tokens will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:using-hooks.adoc[Using Hooks].
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual { }


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

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public override view returns (bool) {
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
            _transfer(_msgSender(), _to, _value);
            return true;
        }

        revert("Transfer not possible");
    }

    /**
     * @dev Called by an agent to pause, triggers stopped state.
     */
    function pause() public override onlyAgent whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev Called by an agent to unpause, returns to normal state.
     */
    function unpause() public override onlyAgent whenPaused {
        _paused = false;
        emit UnPaused(msg.sender);
    }

    function getIdentityRegistry() public override view returns (IIdentityRegistry) {
        return identityRegistry;
    }

    function getCompliance() public override view returns (ICompliance) {
        return compliance;
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

    function batchTransfer(address[] calldata _toList, uint256[] calldata _values) external override {
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
            _transfer(_from, _to, _value);
            _approve(_from, _msgSender(), _allowances[_from][_msgSender()].sub(_value, "TREX: transfer amount exceeds allowance"));
            return true;
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
    function forcedTransfer(address _from, address _to, uint256 _value) public override onlyAgent returns (bool) {
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

    function batchForcedTransfer(address[] calldata _fromList, address[] calldata _toList, uint256[] calldata _values) external override {
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
    function mint(address _to, uint256 _amount) public override onlyAgent {
        require(identityRegistry.isVerified(_to), "Identity is not verified.");
        if (compliance.created(_to, _amount)) {
            _mint(_to, _amount);
        }
    }

    function batchMint(address[] calldata _toList, uint256[] calldata _amounts) external override {
        for (uint256 i = 0; i < _toList.length; i++) {
            mint(_toList[i], _amounts[i]);
        }
    }

    function burn(address account, uint256 value) public override onlyAgent {
        _burn(account, value);
        compliance.destroyed(account, value);
    }

    function batchBurn(address[] calldata accounts, uint256[] calldata values) external override {
        for (uint256 i = 0; i < accounts.length; i++) {
            burn(accounts[i], values[i]);
        }
    }

    /**
     *  Sets an address frozen status for this token.
     *  @param addr The address for which to update frozen status
     *  @param freeze Frozen status of the address
     */
    function setAddressFrozen(address addr, bool freeze) public override onlyAgent {
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

    function batchSetAddressFrozen(address[] calldata addrList, bool[] calldata freeze) external override {
        for (uint256 i = 0; i < addrList.length; i++) {
            setAddressFrozen(addrList[i], freeze[i]);
        }
    }

    /**
     *  Freezes token amount specified for given address.
     *  @param addr The address for which to update frozen tokens
     *  @param amount Amount of Tokens to be frozen
     */
    function freezePartialTokens(address addr, uint256 amount) public override onlyAgent {
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

    function batchFreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts) external override {
        for (uint256 i = 0; i < addrList.length; i++) {
            freezePartialTokens(addrList[i], amounts[i]);
        }
    }

    /**
     *  Unfreezes token amount specified for given address
     *  @param addr The address for which to update frozen tokens
     *  @param amount Amount of Tokens to be unfrozen
     */
    function unfreezePartialTokens(address addr, uint256 amount) public override onlyAgent {
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

    function batchUnfreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts) external override {
        for (uint256 i = 0; i < addrList.length; i++) {
            unfreezePartialTokens(addrList[i], amounts[i]);
        }
    }

    //Identity registry setter.
    function setIdentityRegistry(address _identityRegistry) public override onlyOwner {
        identityRegistry = IIdentityRegistry(_identityRegistry);
        emit IdentityRegistryAdded(_identityRegistry);
    }

    function setCompliance(address _compliance) public override onlyOwner {
        compliance = ICompliance(_compliance);
        emit ComplianceAdded(_compliance);
    }

    function recoveryAddress(address wallet_lostAddress, address wallet_newAddress, address investorOnchainID) public override onlyAgent returns (bool){
        require(balanceOf(wallet_lostAddress) != 0);
        IIdentity _onchainID = IIdentity(investorOnchainID);
        bytes32 _key = keccak256(abi.encode(wallet_newAddress));
        if (_onchainID.keyHasPurpose(_key, 1)) {
            uint investorTokens = balanceOf(wallet_lostAddress);
            identityRegistry.registerIdentity(wallet_newAddress, _onchainID, identityRegistry.getInvestorCountryOfWallet(wallet_lostAddress));
            identityRegistry.deleteIdentity(wallet_lostAddress);
            forcedTransfer(wallet_lostAddress, wallet_newAddress, investorTokens);
            emit RecoverySuccess(wallet_lostAddress, wallet_newAddress, investorOnchainID);
            return true;
        }
        emit RecoveryFails(wallet_lostAddress, wallet_newAddress, investorOnchainID);
        revert("Recovery not possible");
    }
}
