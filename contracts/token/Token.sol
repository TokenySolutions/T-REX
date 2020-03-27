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

    /// ERC20 basic variables
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;

    /// Token information
    string private tokenName;
    string private tokenSymbol;
    string private tokenVersion;
    uint8 private tokenDecimals;
    address private tokenOnchainID;
    
    /// Variables of freeze and pause functions
    mapping(address => bool) private frozen;
    mapping(address => uint256) private frozenTokens;

    bool private tokenPaused = false;

    /// Identity Registry contract used by the onchain validator system
    IIdentityRegistry private tokenIdentityRegistry;

    /// Compliance contract linked to the onchain validator system
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

    /// Modifier to make a function callable only when the contract is not paused.
    modifier whenNotPaused() {
        require(!tokenPaused, "Pausable: paused");
        _;
    }

    /// Modifier to make a function callable only when the contract is paused.
    modifier whenPaused() {
        require(tokenPaused, "Pausable: not paused");
        _;
    }

   /**
    *  @dev See {IERC20-totalSupply}.
    */
    function totalSupply() public override view returns (uint256) {
        return _totalSupply;
    }

   /**
    *  @dev See {IERC20-balanceOf}.
    */
    function balanceOf(address _userAddress) public override view returns (uint256) {
        return _balances[_userAddress];
    }

   /**
    *  @dev See {IERC20-allowance}.
    */
    function allowance(address _owner, address _spender) public override view virtual returns (uint256) {
        return _allowances[_owner][_spender];
    }

   /**
    *  @dev See {IERC20-approve}.
    */
    function approve(address _spender, uint256 _amount) public override virtual returns (bool) {
        _approve(_msgSender(), _spender, _amount);
        return true;
    }

   /**
    *  @dev See {ERC20-increaseAllowance}.
    */
    function increaseAllowance(address _spender, uint256 _addedValue) public virtual returns (bool) {
        _approve(_msgSender(), _spender, _allowances[_msgSender()][_spender].add(_addedValue));
        return true;
    }

   /**
    *  @dev See {ERC20-decreaseAllowance}.
    */
    function decreaseAllowance(address _spender, uint256 _subtractedValue) public virtual returns (bool) {
        _approve(_msgSender(), _spender, _allowances[_msgSender()][_spender].sub(_subtractedValue, "ERC20: decreased allowance below zero"));
        return true;
    }

   /**
    *  @dev See {ERC20-_mint}.
    */
    function _transfer(address _from, address _to, uint256 _amount) internal virtual {
        require(_from != address(0), "ERC20: transfer from the zero address");
        require(_to != address(0), "ERC20: transfer to the zero address");

        _beforeTokenTransfer(_from, _to, _amount);

        _balances[_from] = _balances[_from].sub(_amount, "ERC20: transfer amount exceeds balance");
        _balances[_to] = _balances[_to].add(_amount);
        emit Transfer(_from, _to, _amount);
    }

   /**
    *  @dev See {ERC20-_mint}.
    */
    function _mint(address _userAddress, uint256 _amount) internal virtual {
        require(_userAddress != address(0), "ERC20: mint to the zero address");

        _beforeTokenTransfer(address(0), _userAddress, _amount);

        _totalSupply = _totalSupply.add(_amount);
        _balances[_userAddress] = _balances[_userAddress].add(_amount);
        emit Transfer(address(0), _userAddress, _amount);
    }

   /**
    *  @dev See {ERC20-_burn}.
    */
    function _burn(address _userAddress, uint256 _amount) internal virtual {
        require(_userAddress != address(0), "ERC20: burn from the zero address");

        _beforeTokenTransfer(_userAddress, address(0), _amount);

        _balances[_userAddress] = _balances[_userAddress].sub(_amount, "ERC20: burn amount exceeds balance");
        _totalSupply = _totalSupply.sub(_amount);
        emit Transfer(_userAddress, address(0), _amount);
    }

   /**
    *  @dev See {ERC20-_approve}.
    */
    function _approve(address _owner, address _spender, uint256 _amount) internal virtual {
        require(_owner != address(0), "ERC20: approve from the zero address");
        require(_spender != address(0), "ERC20: approve to the zero address");

        _allowances[_owner][_spender] = _amount;
        emit Approval(_owner, _spender, _amount);
    }

   /**
    *  @dev See {ERC20-_beforeTokenTransfer}.
    */
    function _beforeTokenTransfer(address _from, address _to, uint256 _amount) internal virtual { }


   /**
    *  @dev See {IToken-decimals}.
    */
    function decimals() public override view returns (uint8){
        return tokenDecimals;
    }

   /**
    *  @dev See {IToken-name}.
    */
    function name() public override view returns (string memory){
        return tokenName;
    }

   /**
    *  @dev See {IToken-onchainID}.
    */
    function onchainID() public override view returns (address){
        return tokenOnchainID;
    }

   /**
    *  @dev See {IToken-symbol}.
    */
    function symbol() public override view returns (string memory){
        return tokenSymbol;
    }

   /**
    *  @dev See {IToken-version}.
    */
    function version() public override view returns (string memory){
        return tokenVersion;
    }

   /**
    *  @dev See {IToken-setTokenInformation}.
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
    *  @dev See {IToken-paused}.
    */
    function paused() public override view returns (bool) {
        return tokenPaused;
    }

   /**
    *  @dev See {IToken-isFrozen}.
    */
    function isFrozen(address _userAddress) external override view returns (bool) {
        return frozen[_userAddress];
    }

   /**
    *  @dev See {IToken-getFrozenTokens}.
    */
    function getFrozenTokens(address _userAddress) external override view returns (uint256) {
        return frozenTokens[_userAddress];
    }

   /**
    *  @notice ERC-20 overridden function that include logic to check for trade validity.
    *  Require that the msg.sender and to addresses are not frozen.
    *  Require that the value should not exceed available balance .
    *  Require that the to address is a verified address
    *  @param _to The address of the receiver
    *  @param _amount The number of tokens to transfer
    *  @return `true` if successful and revert if unsuccessful
    */
    function transfer(address _to, uint256 _amount) public override whenNotPaused returns (bool) {
        require(!frozen[_to] && !frozen[msg.sender]);
        require(_amount <= balanceOf(msg.sender).sub(frozenTokens[msg.sender]), "Insufficient Balance");
        if (tokenIdentityRegistry.isVerified(_to) && tokenCompliance.canTransfer(msg.sender, _to, _amount)) {
            tokenCompliance.transferred(msg.sender, _to, _amount);
            _transfer(_msgSender(), _to, _amount);
            return true;
        }
        revert("Transfer not possible");
    }

   /**
    *  @dev See {IToken-pause}.
    */
    function pause() public override onlyAgent whenNotPaused {
        tokenPaused = true;
        emit Paused(msg.sender);
    }

   /**
    *  @dev See {IToken-unpause}.
    */
    function unpause() public override onlyAgent whenPaused {
        tokenPaused = false;
        emit UnPaused(msg.sender);
    }

   /**
    *  @dev See {IToken-identityRegistry}.
    */
    function identityRegistry() public override view returns (IIdentityRegistry) {
        return tokenIdentityRegistry;
    }

   /**
    *  @dev See {IToken-compliance}.
    */
    function compliance() public override view returns (ICompliance) {
        return tokenCompliance;
    }

   /**
    *  @dev See {IToken-batchTransfer}.
    */
    function batchTransfer(address[] calldata _toList, uint256[] calldata _amounts) external override {
        for (uint256 i = 0; i < _toList.length; i++) {
            transfer(_toList[i], _amounts[i]);
        }
    }

   /**
    *  @notice ERC-20 overridden function that include logic to check for trade validity.
    *  Require that the from and to addresses are not frozen.
    *  Require that the value should not exceed available balance .
    *  Require that the to address is a verified address
    *  @param _from The address of the sender
    *  @param _to The address of the receiver
    *  @param _amount The number of tokens to transfer
    *  @return `true` if successful and revert if unsuccessful
    */
    function transferFrom(address _from, address _to, uint256 _amount) public override whenNotPaused returns (bool) {
        require(!frozen[_to] && !frozen[_from]);
        require(_amount <= balanceOf(_from).sub(frozenTokens[_from]), "Insufficient Balance");
        if (tokenIdentityRegistry.isVerified(_to) && tokenCompliance.canTransfer(_from, _to, _amount)) {
            tokenCompliance.transferred(_from, _to, _amount);
            _transfer(_from, _to, _amount);
            _approve(_from, _msgSender(), _allowances[_from][_msgSender()].sub(_amount, "TREX: transfer amount exceeds allowance"));
            return true;
        }

        revert("Transfer not possible");
    }

   /**
    *  @dev See {IToken-forcedTransfer}.
    */
    function forcedTransfer(address _from, address _to, uint256 _amount) public override onlyAgent returns (bool) {
        uint256 freeBalance = balanceOf(_from) - frozenTokens[_from];
        if (_amount > freeBalance) {
            uint256 tokensToUnfreeze = _amount - freeBalance;
            frozenTokens[_from] -= tokensToUnfreeze;
            emit TokensUnfrozen(_from, tokensToUnfreeze);
        }
        if (tokenIdentityRegistry.isVerified(_to) && tokenCompliance.canTransfer(_from, _to, _amount)) {
            tokenCompliance.transferred(_from, _to, _amount);
            _transfer(_from, _to, _amount);
            return true;
        }
        revert("Transfer not possible");
    }

   /**
    *  @dev See {IToken-batchForcedTransfer}.
    */
    function batchForcedTransfer(address[] calldata _fromList, address[] calldata _toList, uint256[] calldata _amounts) external override {
        for (uint256 i = 0; i < _fromList.length; i++) {
            forcedTransfer(_fromList[i], _toList[i], _amounts[i]);
        }
    }

   /**
    *  @dev See {IToken-mint}.
    */
    function mint(address _to, uint256 _amount) public override onlyAgent {
        require(tokenIdentityRegistry.isVerified(_to), "Identity is not verified.");
        require(tokenCompliance.canTransfer(msg.sender, _to, _amount), "Compliance not followed");
        _mint(_to, _amount);
        tokenCompliance.created(_to, _amount);
    }

   /**
    *  @dev See {IToken-batchMint}.
    */
    function batchMint(address[] calldata _toList, uint256[] calldata _amounts) external override {
        for (uint256 i = 0; i < _toList.length; i++) {
            mint(_toList[i], _amounts[i]);
        }
    }

   /**
    *  @dev See {IToken-burn}.
    */
    function burn(address _userAddress, uint256 _amount) public override onlyAgent {
        uint256 freeBalance = balanceOf(_userAddress) - frozenTokens[_userAddress];
        if (_amount > freeBalance) {
            uint256 tokensToUnfreeze = _amount - freeBalance;
            frozenTokens[_userAddress] -= tokensToUnfreeze;
            emit TokensUnfrozen(_userAddress, tokensToUnfreeze);
        }
        _burn(_userAddress, _amount);
        tokenCompliance.destroyed(_userAddress, _amount);
    }

   /**
    *  @dev See {IToken-batchBurn}.
    */
    function batchBurn(address[] calldata _userAddresses, uint256[] calldata _amounts) external override {
        for (uint256 i = 0; i < _userAddresses.length; i++) {
            burn(_userAddresses[i], _amounts[i]);
        }
    }

   /**
    *  @dev See {IToken-setAddressFrozen}.
    */
    function setAddressFrozen(address _userAddress, bool _freeze) public override onlyAgent {
        frozen[_userAddress] = _freeze;

        emit AddressFrozen(_userAddress, _freeze, msg.sender);
    }

   /**
    *  @dev See {IToken-batchSetAddressFrozen}.
    */
    function batchSetAddressFrozen(address[] calldata _userAddresses, bool[] calldata _freeze) external override {
        for (uint256 i = 0; i < _userAddresses.length; i++) {
            setAddressFrozen(_userAddresses[i], _freeze[i]);
        }
    }

   /**
    *  @dev See {IToken-freezePartialTokens}.
    */
    function freezePartialTokens(address _userAddress, uint256 _amount) public override onlyAgent {
        uint256 balance = balanceOf(_userAddress);
        require(balance >= frozenTokens[_userAddress] + _amount, "Amount exceeds available balance");
        frozenTokens[_userAddress] += _amount;
        emit TokensFrozen(_userAddress, _amount);
    }

   /**
    *  @dev See {IToken-batchFreezePartialTokens}.
    */
    function batchFreezePartialTokens(address[] calldata _userAddresses, uint256[] calldata _amounts) external override {
        for (uint256 i = 0; i < _userAddresses.length; i++) {
            freezePartialTokens(_userAddresses[i], _amounts[i]);
        }
    }

   /**
    *  @dev See {IToken-unfreezePartialTokens}.
    */
    function unfreezePartialTokens(address _userAddress, uint256 _amount) public override onlyAgent {
        require(frozenTokens[_userAddress] >= _amount, "Amount should be less than or equal to frozen tokens");
        frozenTokens[_userAddress] -= _amount;
        emit TokensUnfrozen(_userAddress, _amount);
    }

   /**
    *  @dev See {IToken-batchUnfreezePartialTokens}.
    */
    function batchUnfreezePartialTokens(address[] calldata _userAddresses, uint256[] calldata _amounts) external override {
        for (uint256 i = 0; i < _userAddresses.length; i++) {
            unfreezePartialTokens(_userAddresses[i], _amounts[i]);
        }
    }

   /**
    *  @dev See {IToken-setIdentityRegistry}.
    */
    function setIdentityRegistry(address _identityRegistry) public override onlyOwner {
        tokenIdentityRegistry = IIdentityRegistry(_identityRegistry);
        emit IdentityRegistryAdded(_identityRegistry);
    }

   /**
    *  @dev See {IToken-setCompliance}.
    */
    function setCompliance(address _compliance) public override onlyOwner {
        tokenCompliance = ICompliance(_compliance);
        emit ComplianceAdded(_compliance);
    }

   /**
    *  @dev See {IToken-recoveryAddress}.
    */
    function recoveryAddress(address _lostWallet, address _newWallet, address _investorOnchainID) public override onlyAgent returns (bool){
        require(balanceOf(_lostWallet) != 0);
        IIdentity _onchainID = IIdentity(_investorOnchainID);
        bytes32 _key = keccak256(abi.encode(_newWallet));
        if (_onchainID.keyHasPurpose(_key, 1)) {
            uint investorTokens = balanceOf(_lostWallet);
            uint _frozenTokens = frozenTokens[_lostWallet];
            tokenIdentityRegistry.registerIdentity(_newWallet, _onchainID, tokenIdentityRegistry.getInvestorCountryOfWallet(_lostWallet));
            tokenIdentityRegistry.deleteIdentity(_lostWallet);
            forcedTransfer(_lostWallet, _newWallet, investorTokens);
            if (_frozenTokens > 0) {
                freezePartialTokens(_newWallet, _frozenTokens);
            }
            if (frozen[_lostWallet] == true) {
                setAddressFrozen(_newWallet, true);
            }
            emit RecoverySuccess(_lostWallet, _newWallet, _investorOnchainID);
            return true;
        }
        emit RecoveryFails(_lostWallet, _newWallet, _investorOnchainID);
        revert("Recovery not possible");
    }

   /**
    *  @dev See {IToken-transferOwnershipOnTokenContract}.
    */
    function transferOwnershipOnTokenContract(address _newOwner) public onlyOwner override {
        transferOwnership(_newOwner);
    }

   /**
    *  @dev See {IToken-addAgentOnTokenContract}.
    */
    function addAgentOnTokenContract(address _agent) external override {
        addAgent(_agent);
    }

   /**
    *  @dev See {IToken-removeAgentOnTokenContract}.
    */
    function removeAgentOnTokenContract(address _agent) external override {
        removeAgent(_agent);
    }
}
