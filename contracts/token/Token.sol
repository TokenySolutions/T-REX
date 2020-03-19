/**
 *     NOTICE
 *
 *     The T-REX software is licensed under a proprietary license or the GPL v.3.
 *     If you choose to receive it under the GPL v.3 license, the following applies:
 *     T-REX is a suite of smart contracts developed by Tokeny to manage and transfer financial assets on the ethereum blockchain
 *
 *     Copyright (C) 2019, Tokeny sàrl.
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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


contract Token is IToken, Context, AgentRole {
    using SafeMath for uint256;

    //ERC20 basic variables

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;

    //Token information

    string private tokenName;
    string private tokenSymbol;
    string private tokenVersion;
    uint8 private tokenDecimals;
    address private tokenOnchainID;
    
    //Variables for freeze and pause functions
    
    mapping(address => bool) private frozen;
    mapping(address => uint256) private frozenTokens;

    bool private _paused = false;

    //Identity Registry contract used by the onchain validator system

    IIdentityRegistry private tokenIdentityRegistry;

    //Compliance contract linked to the onchain validator system

    ICompliance private tokenCompliance;

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
        tokenIdentityRegistry = IIdentityRegistry(_identityRegistry);
        emit IdentityRegistryAdded(_identityRegistry);
        tokenCompliance = ICompliance(_compliance);
        emit ComplianceAdded(_compliance);
        emit UpdatedTokenInformation(tokenName, tokenSymbol, tokenDecimals, tokenVersion, tokenOnchainID);
    }

    // Modifier to make a function callable only when the contract is not paused.

    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }


    // Modifier to make a function callable only when the contract is paused.

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
     */

    function approve(address spender, uint256 amount) public override virtual returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    /**
     * @dev See {ERC20-increaseAllowance}.
     */

    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].add(addedValue));
        return true;
    }

    /**
     * @dev See {ERC20-decreaseAllowance}.
     */

    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].sub(subtractedValue, "ERC20: decreased allowance below zero"));
        return true;
    }

    /**
     *  @dev See {ERC20-_mint}.
     */

    function _transfer(address sender, address recipient, uint256 amount) internal virtual {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        _beforeTokenTransfer(sender, recipient, amount);

        _balances[sender] = _balances[sender].sub(amount, "ERC20: transfer amount exceeds balance");
        _balances[recipient] = _balances[recipient].add(amount);
        emit Transfer(sender, recipient, amount);
    }

    /**
     *  @dev See {ERC20-_mint}.
     */

    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");

        _beforeTokenTransfer(address(0), account, amount);

        _totalSupply = _totalSupply.add(amount);
        _balances[account] = _balances[account].add(amount);
        emit Transfer(address(0), account, amount);
    }

    /**
     * @dev See {ERC20-_burn}.
     */

    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");

        _beforeTokenTransfer(account, address(0), amount);

        _balances[account] = _balances[account].sub(amount, "ERC20: burn amount exceeds balance");
        _totalSupply = _totalSupply.sub(amount);
        emit Transfer(account, address(0), amount);
    }

    /**
     * @dev See {ERC20-_approve}.
     */

    function _approve(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

   /**
    * @dev See {ERC20-_beforeTokenTransfer}.
    */

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual { }


   /**
    * @dev See {IToken-decimals}.
    */

    function decimals() public override view returns (uint8){
        return tokenDecimals;
    }

   /**
    * @dev See {IToken-name}.
    */

    function name() public override view returns (string memory){
        return tokenName;
    }

   /**
    * @dev See {IToken-onchainID}.
    */

    function onchainID() public override view returns (address){
        return tokenOnchainID;
    }

   /**
    * @dev See {IToken-symbol}.
    */

    function symbol() public override view returns (string memory){
        return tokenSymbol;
    }

   /**
    * @dev See {IToken-version}.
    */

    function version() public override view returns (string memory){
        return tokenVersion;
    }

   /**
    * @dev See {IToken-setTokenInformation}.
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
    * @dev See {IToken-paused}.
    */

    function paused() public override view returns (bool) {
        return _paused;
    }

   /**
    * @dev See {IToken-isFrozen}.
    */

    function isFrozen(address addr) external override view returns (bool) {
        return frozen[addr];
    }

   /**
    * @dev See {IToken-getFrozenTokens}.
    */

    function getFrozenTokens(address addr) external override view returns (uint256) {
        return frozenTokens[addr];
    }

   /**
    *  @notice ERC-20 overridden function that include logic to check for trade validity.
    *  Require that the msg.sender and to addresses are not frozen.
    *  Require that the value should not exceed available balance .
    *  Require that the to address is a verified address
    *  @param _to The address of the receiver
    *  @param _value The number of tokens to transfer
    *  @return `true` if successful and revert if unsuccessful
    */

    function transfer(address _to, uint256 _value) public override whenNotPaused returns (bool) {
        require(!frozen[_to] && !frozen[msg.sender]);
        require(_value <= balanceOf(msg.sender).sub(frozenTokens[msg.sender]), "Insufficient Balance");
        if (tokenIdentityRegistry.isVerified(_to) && tokenCompliance.canTransfer(msg.sender, _to, _value)) {
            tokenCompliance.transferred(msg.sender, _to, _value);
            _transfer(_msgSender(), _to, _value);
            return true;
        }
        revert("Transfer not possible");
    }

   /**
    * @dev See {IToken-pause}.
    */

    function pause() public override onlyAgent whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

   /**
    * @dev See {IToken-unpause}.
    */

    function unpause() public override onlyAgent whenPaused {
        _paused = false;
        emit UnPaused(msg.sender);
    }

   /**
    * @dev See {IToken-identityRegistry}.
    */

    function identityRegistry() public override view returns (IIdentityRegistry) {
        return tokenIdentityRegistry;
    }

   /**
    * @dev See {IToken-compliance}.
    */

    function compliance() public override view returns (ICompliance) {
        return tokenCompliance;
    }

   /**
    * @dev See {IToken-batchTransfer}.
    */

    function batchTransfer(address[] calldata _toList, uint256[] calldata _values) external override {
        for (uint256 i = 0; i < _toList.length; i++) {
            transfer(_toList[i], _values[i]);
        }
    }

   /**
    *  @notice ERC-20 overridden function that include logic to check for trade validity.
    *  Require that the from and to addresses are not frozen.
    *  Require that the value should not exceed available balance .
    *  Require that the to address is a verified address
    *  @param _from The address of the sender
    *  @param _to The address of the receiver
    *  @param _value The number of tokens to transfer
    *  @return `true` if successful and revert if unsuccessful
    */

    function transferFrom(address _from, address _to, uint256 _value) public override whenNotPaused returns (bool) {
        require(!frozen[_to] && !frozen[_from]);
        require(_value <= balanceOf(_from).sub(frozenTokens[_from]), "Insufficient Balance");
        if (tokenIdentityRegistry.isVerified(_to) && tokenCompliance.canTransfer(_from, _to, _value)) {
            tokenCompliance.transferred(_from, _to, _value);
            _transfer(_from, _to, _value);
            _approve(_from, _msgSender(), _allowances[_from][_msgSender()].sub(_value, "TREX: transfer amount exceeds allowance"));
            return true;
        }

        revert("Transfer not possible");
    }

   /**
    * @dev See {IToken-forcedTransfer}.
    */

    function forcedTransfer(address _from, address _to, uint256 _value) public override onlyAgent returns (bool) {
        uint256 freeBalance = balanceOf(_from) - frozenTokens[_from];
        if (_value > freeBalance) {
            uint256 tokensToUnfreeze = _value - freeBalance;
            frozenTokens[_from] -= tokensToUnfreeze;
            emit TokensUnfrozen(_from, tokensToUnfreeze);
        }
        if (tokenIdentityRegistry.isVerified(_to) && tokenCompliance.canTransfer(_from, _to, _value)) {
            tokenCompliance.transferred(_from, _to, _value);
            _transfer(_from, _to, _value);
            return true;
        }
        revert("Transfer not possible");
    }

   /**
    * @dev See {IToken-batchForcedTransfer}.
    */

    function batchForcedTransfer(address[] calldata _fromList, address[] calldata _toList, uint256[] calldata _values) external override {
        for (uint256 i = 0; i < _fromList.length; i++) {
            forcedTransfer(_fromList[i], _toList[i], _values[i]);
        }
    }

   /**
    * @dev See {IToken-mint}.
    */

    function mint(address _to, uint256 _amount) public override onlyAgent {
        require(tokenIdentityRegistry.isVerified(_to), "Identity is not verified.");
        require(tokenCompliance.canTransfer(msg.sender, _to, _amount), "Compliance not followed");
        _mint(_to, _amount);
        tokenCompliance.created(_to, _amount);
    }

   /**
    * @dev See {IToken-batchMint}.
    */

    function batchMint(address[] calldata _toList, uint256[] calldata _amounts) external override {
        for (uint256 i = 0; i < _toList.length; i++) {
            mint(_toList[i], _amounts[i]);
        }
    }

   /**
    * @dev See {IToken-burn}.
    */

    function burn(address account, uint256 value) public override onlyAgent {
        uint256 freeBalance = balanceOf(account) - frozenTokens[account];
        if (value > freeBalance) {
            uint256 tokensToUnfreeze = value - freeBalance;
            frozenTokens[account] -= tokensToUnfreeze;
            emit TokensUnfrozen(account, tokensToUnfreeze);
        }
        _burn(account, value);
        tokenCompliance.destroyed(account, value);
    }

   /**
    * @dev See {IToken-batchBurn}.
    */

    function batchBurn(address[] calldata accounts, uint256[] calldata values) external override {
        for (uint256 i = 0; i < accounts.length; i++) {
            burn(accounts[i], values[i]);
        }
    }

   /**
    * @dev See {IToken-setAddressFrozen}.
    */

    function setAddressFrozen(address addr, bool freeze) public override onlyAgent {
        frozen[addr] = freeze;

        emit AddressFrozen(addr, freeze, msg.sender);
    }

   /**
    * @dev See {IToken-batchSetAddressFrozen}.
    */

    function batchSetAddressFrozen(address[] calldata addrList, bool[] calldata freeze) external override {
        for (uint256 i = 0; i < addrList.length; i++) {
            setAddressFrozen(addrList[i], freeze[i]);
        }
    }

   /**
    * @dev See {IToken-freezePartialTokens}.
    */

    function freezePartialTokens(address addr, uint256 amount) public override onlyAgent {
        uint256 balance = balanceOf(addr);
        require(balance >= frozenTokens[addr] + amount, "Amount exceeds available balance");
        frozenTokens[addr] += amount;
        emit TokensFrozen(addr, amount);
    }

   /**
    * @dev See {IToken-batchFreezePartialTokens}.
    */

    function batchFreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts) external override {
        for (uint256 i = 0; i < addrList.length; i++) {
            freezePartialTokens(addrList[i], amounts[i]);
        }
    }

   /**
    * @dev See {IToken-unfreezePartialTokens}.
    */

    function unfreezePartialTokens(address addr, uint256 amount) public override onlyAgent {
        require(frozenTokens[addr] >= amount, "Amount should be less than or equal to frozen tokens");
        frozenTokens[addr] -= amount;
        emit TokensUnfrozen(addr, amount);
    }

    /**
     * @dev See {IToken-batchUnfreezePartialTokens}.
     */

    function batchUnfreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts) external override {
        for (uint256 i = 0; i < addrList.length; i++) {
            unfreezePartialTokens(addrList[i], amounts[i]);
        }
    }

    /**
     * @dev See {IToken-setIdentityRegistry}.
     */

    function setIdentityRegistry(address _identityRegistry) public override onlyOwner {
        tokenIdentityRegistry = IIdentityRegistry(_identityRegistry);
        emit IdentityRegistryAdded(_identityRegistry);
    }

    /**
     * @dev See {IToken-setCompliance}.
     */

    function setCompliance(address _compliance) public override onlyOwner {
        tokenCompliance = ICompliance(_compliance);
        emit ComplianceAdded(_compliance);
    }

    /**
     * @dev See {IToken-recoveryAddress}.
     */

    function recoveryAddress(address wallet_lostAddress, address wallet_newAddress, address investorOnchainID) public override onlyAgent returns (bool){
        require(balanceOf(wallet_lostAddress) != 0);
        IIdentity _onchainID = IIdentity(investorOnchainID);
        bytes32 _key = keccak256(abi.encode(wallet_newAddress));
        if (_onchainID.keyHasPurpose(_key, 1)) {
            uint investorTokens = balanceOf(wallet_lostAddress);
            tokenIdentityRegistry.registerIdentity(wallet_newAddress, _onchainID, tokenIdentityRegistry.getInvestorCountryOfWallet(wallet_lostAddress));
            tokenIdentityRegistry.deleteIdentity(wallet_lostAddress);
            forcedTransfer(wallet_lostAddress, wallet_newAddress, investorTokens);
            emit RecoverySuccess(wallet_lostAddress, wallet_newAddress, investorOnchainID);
            return true;
        }
        emit RecoveryFails(wallet_lostAddress, wallet_newAddress, investorOnchainID);
        revert("Recovery not possible");
    }

    /**
     * @dev See {IToken-transferOwnershipOnTokenContract}.
     */

    function transferOwnershipOnTokenContract(address newOwner) public onlyOwner override {
        transferOwnership(newOwner);
    }

    /**
     * @dev See {IToken-addAgentOnTokenContract}.
     */

    function addAgentOnTokenContract(address agent) external override {
        addAgent(agent);
    }

    /**
     * @dev See {IToken-removeAgentOnTokenContract}.
     */

    function removeAgentOnTokenContract(address agent) external override {
        removeAgent(agent);
    }
}
