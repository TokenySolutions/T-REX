// SPDX-License-Identifier: GPL-3.0
//
//                                             :+#####%%%%%%%%%%%%%%+
//                                         .-*@@@%+.:+%@@@@@%%#***%@@%=
//                                     :=*%@@@#=.      :#@@%       *@@@%=
//                       .-+*%@%*-.:+%@@@@@@+.     -*+:  .=#.       :%@@@%-
//                   :=*@@@@%%@@@@@@@@@%@@@-   .=#@@@%@%=             =@@@@#.
//             -=+#%@@%#*=:.  :%@@@@%.   -*@@#*@@@@@@@#=:-              *@@@@+
//            =@@%=:.     :=:   *@@@@@%#-   =%*%@@@@#+-.        =+       :%@@@%-
//           -@@%.     .+@@@     =+=-.         @@#-           +@@@%-       =@@@@%:
//          :@@@.    .+@@#%:                   :    .=*=-::.-%@@@+*@@=       +@@@@#.
//          %@@:    +@%%*                         =%@@@@@@@@@@@#.  .*@%-       +@@@@*.
//         #@@=                                .+@@@@%:=*@@@@@-      :%@%:      .*@@@@+
//        *@@*                                +@@@#-@@%-:%@@*          +@@#.      :%@@@@-
//       -@@%           .:-=++*##%%%@@@@@@@@@@@@*. :@+.@@@%:            .#@@+       =@@@@#:
//      .@@@*-+*#%%%@@@@@@@@@@@@@@@@%%#**@@%@@@.   *@=*@@#                :#@%=      .#@@@@#-
//      -%@@@@@@@@@@@@@@@*+==-:-@@@=    *@# .#@*-=*@@@@%=                 -%@@@*       =@@@@@%-
//         -+%@@@#.   %@%%=   -@@:+@: -@@*    *@@*-::                   -%@@%=.         .*@@@@@#
//            *@@@*  +@* *@@##@@-  #@*@@+    -@@=          .         :+@@@#:           .-+@@@%+-
//             +@@@%*@@:..=@@@@*   .@@@*   .#@#.       .=+-       .=%@@@*.         :+#@@@@*=:
//              =@@@@%@@@@@@@@@@@@@@@@@@@@@@%-      :+#*.       :*@@@%=.       .=#@@@@%+:
//               .%@@=                 .....    .=#@@+.       .#@@@*:       -*%@@@@%+.
//                 +@@#+===---:::...         .=%@@*-         +@@@+.      -*@@@@@%+.
//                  -@@@@@@@@@@@@@@@@@@@@@@%@@@@=          -@@@+      -#@@@@@#=.
//                    ..:::---===+++***###%%%@@@#-       .#@@+     -*@@@@@#=.
//                                           @@@@@@+.   +@@*.   .+@@@@@%=.
//                                          -@@@@@=   =@@%:   -#@@@@%+.
//                                          +@@@@@. =@@@=  .+@@@@@*:
//                                          #@@@@#:%@@#. :*@@@@#-
//                                          @@@@@%@@@= :#@@@@+.
//                                         :@@@@@@@#.:#@@@%-
//                                         +@@@@@@-.*@@@*:
//                                         #@@@@#.=@@@+.
//                                         @@@@+-%@%=
//                                        :@@@#%@%=
//                                        +@@@@%-
//                                        :#%%=
//

/**
 *     NOTICE
 *
 *     The T-REX software is licensed under a proprietary license or the GPL v.3.
 *     If you choose to receive it under the GPL v.3 license, the following applies:
 *     T-REX is a suite of smart contracts implementing the ERC-3643 standard and
 *     developed by Tokeny to manage and transfer financial assets on EVM blockchains
 *
 *     Copyright (C) 2023, Tokeny sàrl.
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

pragma solidity 0.8.26;

import "./IToken.sol";
import "@onchain-id/solidity/contracts/interface/IIdentity.sol";
import "./TokenStorage.sol";
import "../roles/AgentRoleUpgradeable.sol";
import "../roles/IERC173.sol";
import "../errors/InvalidArgumentErrors.sol";
import "../errors/CommonErrors.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// errors

/// @dev Thrown when address is not an agent.
/// @param _agent address of agent.
error AddressNotAgent(address _agent);

/// @dev Thrown when agent is not authorized.
/// @param _agent address of agent.
/// @param _reason authorisation label.
error AgentNotAuthorized(address _agent, string _reason);

/// @dev Thrown when already initialized.
error AlreadyInitialized();

/// @dev Thrown when amount is above maximum amount.
/// @param _amount amount value.
/// @param _maxAmount maximum amount value.
error AmountAboveFrozenTokens(uint256 _amount, uint256 _maxAmount);

/// @dev Thrown when wallet is frozen.
error FrozenWallet();

/// @dev Thrown when compliance is not followed.
error ComplianceNotFollowed();

/// @dev Thrown when thers is no token to recover.
error NoTokenToRecover();

/// @dev Thrown when recovery is not possible.
error RecoveryNotPossible();

/// @dev Thrown when transfer is not possible.
error TransferNotPossible();

/// @dev Thrown when identity is not verified.
error UnverifiedIdentity();

/// @dev Thrown when default allowance is already enabled for _user.
error DefaultAllowanceAlreadyEnabled(address _user);

/// @dev Thrown when default allowance is already disabled for _user.
error DefaultAllowanceAlreadyDisabled(address _user);

/// @dev Thrown when default allowance is already set for _target.
error DefaultAllowanceAlreadySet(address _target);


contract Token is IToken, AgentRoleUpgradeable, TokenStorage, IERC165 {

    /// modifiers

    /// @dev Modifier to make a function callable only when the contract is not paused.
    modifier whenNotPaused() {
        require(!_tokenPaused, EnforcedPause());
        _;
    }

    /// @dev Modifier to make a function callable only when the contract is paused.
    modifier whenPaused() {
        require(_tokenPaused, ExpectedPause());
        _;
    }

    /**
     *  @dev the constructor initiates the token contract
     *  msg.sender is set automatically as the owner of the smart contract
     *  @param _identityRegistry the address of the Identity registry linked to the token
     *  @param _compliance the address of the compliance contract linked to the token
     *  @param _name the name of the token
     *  @param _symbol the symbol of the token
     *  @param _decimals the decimals of the token
     *  @param _onchainID the address of the onchainID of the token
     *  emits an `UpdatedTokenInformation` event
     *  emits an `IdentityRegistryAdded` event
     *  emits a `ComplianceAdded` event
     */
    function init(
        address _identityRegistry,
        address _compliance,
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        // _onchainID can be zero address if not set, can be set later by owner
        address _onchainID
    ) external initializer {
        // that require is protecting legacy versions of TokenProxy contracts
        // as there was a bug with the initializer modifier on these proxies
        // that check is preventing attackers to call the init functions on those
        // legacy contracts.
        require(owner() == address(0), AlreadyInitialized());
        require(
            _identityRegistry != address(0)
            && _compliance != address(0)
        , ZeroAddress());
        require(
            keccak256(abi.encode(_name)) != keccak256(abi.encode(""))
            && keccak256(abi.encode(_symbol)) != keccak256(abi.encode(""))
        , EmptyString());
        require(0 <= _decimals && _decimals <= 18, DecimalsOutOfRange(_decimals));
        __Ownable_init();
        _tokenName = _name;
        _tokenSymbol = _symbol;
        _tokenDecimals = _decimals;
        _tokenOnchainID = _onchainID;
        _tokenPaused = true;
        setIdentityRegistry(_identityRegistry);
        setCompliance(_compliance);
        emit UpdatedTokenInformation(_tokenName, _tokenSymbol, _tokenDecimals, _TOKEN_VERSION, _tokenOnchainID);
    }

    /**
     *  @dev See {IERC20-approve}.
     */
    function approve(address _spender, uint256 _amount) external virtual override returns (bool) {
        _approve(msg.sender, _spender, _amount);
        return true;
    }

    /**
     *  @dev See {ERC20-increaseAllowance}.
     */
    function increaseAllowance(address _spender, uint256 _addedValue) external virtual returns (bool) {
        _approve(msg.sender, _spender, _allowances[msg.sender][_spender] + (_addedValue));
        return true;
    }

    /**
     *  @dev See {ERC20-decreaseAllowance}.
     */
    function decreaseAllowance(address _spender, uint256 _subtractedValue) external virtual returns (bool) {
        _approve(msg.sender, _spender, _allowances[msg.sender][_spender] - _subtractedValue);
        return true;
    }

    /**
     *  @dev See {IToken-setName}.
     */
    function setName(string calldata _name) external override onlyOwner {
        require(keccak256(abi.encode(_name)) != keccak256(abi.encode("")), EmptyString());
        _tokenName = _name;
        emit UpdatedTokenInformation(_tokenName, _tokenSymbol, _tokenDecimals, _TOKEN_VERSION, _tokenOnchainID);
    }

    /**
     *  @dev See {IToken-setSymbol}.
     */
    function setSymbol(string calldata _symbol) external override onlyOwner {
        require(keccak256(abi.encode(_symbol)) != keccak256(abi.encode("")), EmptyString());
        _tokenSymbol = _symbol;
        emit UpdatedTokenInformation(_tokenName, _tokenSymbol, _tokenDecimals, _TOKEN_VERSION, _tokenOnchainID);
    }

    /**
     *  @dev See {IToken-setOnchainID}.
     *  if _onchainID is set at zero address it means no ONCHAINID is bound to this token
     */
    function setOnchainID(address _onchainID) external override onlyOwner {
        _tokenOnchainID = _onchainID;
        emit UpdatedTokenInformation(_tokenName, _tokenSymbol, _tokenDecimals, _TOKEN_VERSION, _tokenOnchainID);
    }

    /**
     *  @dev See {IToken-pause}.
     */
    function pause() external override onlyAgent whenNotPaused {
        require(!getAgentRestrictions(msg.sender).disablePause, AgentNotAuthorized(msg.sender, "pause disabled"));
        _tokenPaused = true;
        emit Paused(msg.sender);
    }

    /**
     *  @dev See {IToken-unpause}.
     */
    function unpause() external override onlyAgent whenPaused {
        require(!getAgentRestrictions(msg.sender).disablePause, AgentNotAuthorized(msg.sender, "pause disabled"));
        _tokenPaused = false;
        emit Unpaused(msg.sender);
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
     *  @dev See {IToken-setAgentRestrictions}.
     */
    function setAgentRestrictions(address agent, TokenRoles memory restrictions) external override onlyOwner {
        if(!isAgent(agent)) {
            revert AddressNotAgent(agent);
        }
        _agentsRestrictions[agent] = restrictions;
        emit AgentRestrictionsSet(
        agent,
        restrictions.disableMint,
        restrictions.disableBurn,
        restrictions.disableAddressFreeze,
        restrictions.disableForceTransfer,
        restrictions.disablePartialFreeze,
        restrictions.disablePause,
        restrictions.disableRecovery );
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
    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    ) external override whenNotPaused returns (bool) {
        require(!_frozen[_to] && !_frozen[_from], FrozenWallet());

        uint256 balance = balanceOf(_from) - (_frozenTokens[_from]);
        require(_amount <= balance, ERC20InsufficientBalance(_from, balance, _amount));
        if (_tokenIdentityRegistry.isVerified(_to) && _tokenCompliance.canTransfer(_from, _to, _amount)) {
            if (!_defaultAllowances[msg.sender] || _defaultAllowanceOptOuts[_from]) {
                _approve(_from, msg.sender, _allowances[_from][msg.sender] - (_amount));
            }
            _transfer(_from, _to, _amount);
            _tokenCompliance.transferred(_from, _to, _amount);
            return true;
        }
        revert TransferNotPossible();
    }

    /**
     *  @dev See {IToken-batchForcedTransfer}.
     */
    function batchForcedTransfer(
        address[] calldata _fromList,
        address[] calldata _toList,
        uint256[] calldata _amounts
    ) external override {
        for (uint256 i = 0; i < _fromList.length; i++) {
            forcedTransfer(_fromList[i], _toList[i], _amounts[i]);
        }
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
     *  @dev See {IToken-batchBurn}.
     */
    function batchBurn(address[] calldata _userAddresses, uint256[] calldata _amounts) external override {
        for (uint256 i = 0; i < _userAddresses.length; i++) {
            burn(_userAddresses[i], _amounts[i]);
        }
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
     *  @dev See {IToken-batchFreezePartialTokens}.
     */
    function batchFreezePartialTokens(address[] calldata _userAddresses, uint256[] calldata _amounts) external override {
        for (uint256 i = 0; i < _userAddresses.length; i++) {
            freezePartialTokens(_userAddresses[i], _amounts[i]);
        }
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
     *  @dev See {IToken-recoveryAddress}.
     */
    function recoveryAddress(
        address _lostWallet,
        address _newWallet,
        address _investorOnchainID
    ) external override onlyAgent returns (bool) {
        require(!getAgentRestrictions(msg.sender).disableRecovery, AgentNotAuthorized(msg.sender, "recovery disabled"));
        require(balanceOf(_lostWallet) != 0, NoTokenToRecover());
        require(_tokenIdentityRegistry.contains(_lostWallet) ||
            _tokenIdentityRegistry.contains(_newWallet), RecoveryNotPossible());
        uint256 investorTokens = balanceOf(_lostWallet);
        uint256 frozenTokens = _frozenTokens[_lostWallet];
        bool addressFreeze = _frozen[_lostWallet];
        _transfer(_lostWallet, _newWallet, investorTokens);
        if(frozenTokens > 0) {
            _frozenTokens[_lostWallet] = 0;
            emit TokensUnfrozen(_lostWallet, frozenTokens);
            _frozenTokens[_newWallet] += frozenTokens;
            emit TokensFrozen(_newWallet, frozenTokens);
        }
        if(addressFreeze) {
            _frozen[_lostWallet] = false;
            emit AddressFrozen(_lostWallet, false, address(this));
            if(!_frozen[_newWallet]){
                _frozen[_newWallet] = true;
                emit AddressFrozen(_newWallet, true, address(this));
            }
        }
        if(_tokenIdentityRegistry.contains(_lostWallet)) {
            if(!_tokenIdentityRegistry.contains(_newWallet)) {
                _tokenIdentityRegistry.registerIdentity(
                    _newWallet, IIdentity(_investorOnchainID),
                    _tokenIdentityRegistry.investorCountry(_lostWallet));
            }
            _tokenIdentityRegistry.deleteIdentity(_lostWallet);
        }
        emit RecoverySuccess(_lostWallet, _newWallet, _investorOnchainID);
        return true;
    }

    /// @dev See {IToken-setAllowanceForAll}.
    function setAllowanceForAll(bool _allow, address[] calldata _targets) external override onlyOwner {
        uint256 targetsCount = _targets.length;
        require(targetsCount <= 100, ArraySizeLimited(100));
        for (uint256 i = 0; i < targetsCount; i++) {
            require(_defaultAllowances[_targets[i]] != _allow, DefaultAllowanceAlreadySet(_targets[i]));
            _defaultAllowances[_targets[i]] = _allow;
            emit DefaultAllowance(_targets[i], _allow);
        }
    }

    /// @dev See {IToken-disableDefaultAllowance}.
    function disableDefaultAllowance() external override {
        require(!_defaultAllowanceOptOuts[msg.sender], DefaultAllowanceAlreadyDisabled(msg.sender));
        _defaultAllowanceOptOuts[msg.sender] = true;
        emit DefaultAllowanceDisabled(msg.sender);
    }

    /// @dev See {IToken-enableDefaultAllowance}.
    function enableDefaultAllowance() external override {
        require(_defaultAllowanceOptOuts[msg.sender], DefaultAllowanceAlreadyEnabled(msg.sender));
        _defaultAllowanceOptOuts[msg.sender] = false;
        emit DefaultAllowanceEnabled(msg.sender);
    }

    /**
     *  @dev See {IERC20-totalSupply}.
     */
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    /**
     *  @dev See {IERC20-allowance}.
     */
    function allowance(address _owner, address _spender) external view virtual override returns (uint256) {
        if (_defaultAllowances[_spender] && !_defaultAllowanceOptOuts[_owner]) {
            return type(uint256).max;
        }

        return _allowances[_owner][_spender];
    }

    /**
     *  @dev See {IToken-identityRegistry}.
     */
    function identityRegistry() external view override returns (IIdentityRegistry) {
        return _tokenIdentityRegistry;
    }

    /**
     *  @dev See {IToken-compliance}.
     */
    function compliance() external view override returns (IModularCompliance) {
        return _tokenCompliance;
    }

    /**
     *  @dev See {IToken-paused}.
     */
    function paused() external view override returns (bool) {
        return _tokenPaused;
    }

    /**
     *  @dev See {IToken-isFrozen}.
     */
    function isFrozen(address _userAddress) external view override returns (bool) {
        return _frozen[_userAddress];
    }

    /**
     *  @dev See {IToken-getFrozenTokens}.
     */
    function getFrozenTokens(address _userAddress) external view override returns (uint256) {
        return _frozenTokens[_userAddress];
    }

    /**
     *  @dev See {IToken-decimals}.
     */
    function decimals() external view override returns (uint8) {
        return _tokenDecimals;
    }

    /**
     *  @dev See {IToken-name}.
     */
    function name() external view override returns (string memory) {
        return _tokenName;
    }

    /**
     *  @dev See {IToken-onchainID}.
     */
    function onchainID() external view override returns (address) {
        return _tokenOnchainID;
    }

    /**
     *  @dev See {IToken-symbol}.
     */
    function symbol() external view override returns (string memory) {
        return _tokenSymbol;
    }

    /**
     *  @dev See {IToken-version}.
     */
    function version() external pure override returns (string memory) {
        return _TOKEN_VERSION;
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
        require(!_frozen[_to] && !_frozen[msg.sender], FrozenWallet());
        uint256 balance = balanceOf(msg.sender) - _frozenTokens[msg.sender];
        require(_amount <= balance, ERC20InsufficientBalance(msg.sender, balance, _amount));
        if (_tokenIdentityRegistry.isVerified(_to) && _tokenCompliance.canTransfer(msg.sender, _to, _amount)) {
            _transfer(msg.sender, _to, _amount);
            _tokenCompliance.transferred(msg.sender, _to, _amount);
            return true;
        }

        revert TransferNotPossible();
    }

    /**
     *  @dev See {IToken-forcedTransfer}.
     */
    function forcedTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) public override onlyAgent returns (bool) {
        require(!getAgentRestrictions(msg.sender).disableForceTransfer, AgentNotAuthorized(msg.sender, "forceTransfer disabled"));
        require(balanceOf(_from) >= _amount, ERC20InsufficientBalance(_from, balanceOf(_from), _amount));
        uint256 freeBalance = balanceOf(_from) - (_frozenTokens[_from]);
        if (_amount > freeBalance) {
            uint256 tokensToUnfreeze = _amount - (freeBalance);
            _frozenTokens[_from] = _frozenTokens[_from] - (tokensToUnfreeze);
            emit TokensUnfrozen(_from, tokensToUnfreeze);
        }
        if (_tokenIdentityRegistry.isVerified(_to)) {
            _transfer(_from, _to, _amount);
            _tokenCompliance.transferred(_from, _to, _amount);
            return true;
        }
        revert TransferNotPossible();
    }

    /**
     *  @dev See {IToken-mint}.
     */
    function mint(address _to, uint256 _amount) public override onlyAgent {
        require(!getAgentRestrictions(msg.sender).disableMint, AgentNotAuthorized(msg.sender, "mint disabled"));
        require(_tokenIdentityRegistry.isVerified(_to), UnverifiedIdentity());
        require(_tokenCompliance.canTransfer(address(0), _to, _amount), ComplianceNotFollowed());
        _mint(_to, _amount);
        _tokenCompliance.created(_to, _amount);
    }

    /**
     *  @dev See {IToken-burn}.
     */
    function burn(address _userAddress, uint256 _amount) public override onlyAgent {
        require(!getAgentRestrictions(msg.sender).disableBurn, AgentNotAuthorized(msg.sender, "burn disabled"));
        require(balanceOf(_userAddress) >= _amount, 
            ERC20InsufficientBalance(_userAddress, balanceOf(_userAddress), _amount));
        uint256 freeBalance = balanceOf(_userAddress) - _frozenTokens[_userAddress];
        if (_amount > freeBalance) {
            uint256 tokensToUnfreeze = _amount - (freeBalance);
            _frozenTokens[_userAddress] = _frozenTokens[_userAddress] - (tokensToUnfreeze);
            emit TokensUnfrozen(_userAddress, tokensToUnfreeze);
        }
        _burn(_userAddress, _amount);
        _tokenCompliance.destroyed(_userAddress, _amount);
    }

    /**
     *  @dev See {IToken-setAddressFrozen}.
     */
    function setAddressFrozen(address _userAddress, bool _freeze) public override onlyAgent {
        require(!getAgentRestrictions(msg.sender).disableAddressFreeze, 
            AgentNotAuthorized(msg.sender, "address freeze disabled"));
        _frozen[_userAddress] = _freeze;

        emit AddressFrozen(_userAddress, _freeze, msg.sender);
    }

    /**
     *  @dev See {IToken-freezePartialTokens}.
     */
    function freezePartialTokens(address _userAddress, uint256 _amount) public override onlyAgent {
        require(!getAgentRestrictions(msg.sender).disablePartialFreeze,
            AgentNotAuthorized(msg.sender, "partial freeze disabled"));
        uint256 balance = balanceOf(_userAddress);
        require(balance >= _frozenTokens[_userAddress] + _amount, 
            ERC20InsufficientBalance(_userAddress, balance, _amount));
        _frozenTokens[_userAddress] = _frozenTokens[_userAddress] + (_amount);
        emit TokensFrozen(_userAddress, _amount);
    }

    /**
     *  @dev See {IToken-unfreezePartialTokens}.
     */
    function unfreezePartialTokens(address _userAddress, uint256 _amount) public override onlyAgent {
        require(!getAgentRestrictions(msg.sender).disablePartialFreeze, 
            AgentNotAuthorized(msg.sender, "partial freeze disabled"));
        require(_frozenTokens[_userAddress] >= _amount, AmountAboveFrozenTokens(_amount, _frozenTokens[_userAddress]));
        _frozenTokens[_userAddress] = _frozenTokens[_userAddress] - (_amount);
        emit TokensUnfrozen(_userAddress, _amount);
    }

    /**
     *  @dev See {IToken-setIdentityRegistry}.
     */
    function setIdentityRegistry(address _identityRegistry) public override onlyOwner {
        _tokenIdentityRegistry = IIdentityRegistry(_identityRegistry);
        emit IdentityRegistryAdded(_identityRegistry);
    }

    /**
     *  @dev See {IToken-setCompliance}.
     */
    function setCompliance(address _compliance) public override onlyOwner {
        if (address(_tokenCompliance) != address(0)) {
            _tokenCompliance.unbindToken(address(this));
        }
        _tokenCompliance = IModularCompliance(_compliance);
        _tokenCompliance.bindToken(address(this));
        emit ComplianceAdded(_compliance);
    }

    /**
     *  @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address _userAddress) public view override returns (uint256) {
        return _balances[_userAddress];
    }

    /**
     *  @dev See {IToken-getAgentRestrictions}.
     */
    function getAgentRestrictions(address agent) public view override returns (TokenRoles memory) {
        return _agentsRestrictions[agent];
    }

    /**
     *  @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public pure virtual override returns (bool) {
        return
            interfaceId == type(IERC20).interfaceId || // 0x36372b07
            interfaceId == type(IToken).interfaceId || // 0x4768ee17
            interfaceId == type(IERC173).interfaceId || // 0x7f5828d0
            interfaceId == type(IERC165).interfaceId; // 0x01ffc9a7
    }

    /**
     *  @dev See {ERC20-_transfer}.
     */
    function _transfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal virtual {
        require(_from != address(0), ERC20InvalidSpender(_from));
        require(_to != address(0), ERC20InvalidReceiver(_to));

        _beforeTokenTransfer(_from, _to, _amount);

        _balances[_from] = _balances[_from] - _amount;
        _balances[_to] = _balances[_to] + _amount;
        emit Transfer(_from, _to, _amount);
    }

    /**
     *  @dev See {ERC20-_mint}.
     */
    function _mint(address _userAddress, uint256 _amount) internal virtual {
        require(_userAddress != address(0), ERC20InvalidReceiver(_userAddress));

        _beforeTokenTransfer(address(0), _userAddress, _amount);

        _totalSupply = _totalSupply + _amount;
        _balances[_userAddress] = _balances[_userAddress] + _amount;
        emit Transfer(address(0), _userAddress, _amount);
    }

    /**
     *  @dev See {ERC20-_burn}.
     */
    function _burn(address _userAddress, uint256 _amount) internal virtual {
        require(_userAddress != address(0), ERC20InvalidSpender(_userAddress));

        _beforeTokenTransfer(_userAddress, address(0), _amount);

        _balances[_userAddress] = _balances[_userAddress] - _amount;
        _totalSupply = _totalSupply - _amount;
        emit Transfer(_userAddress, address(0), _amount);
    }

    /**
     *  @dev See {ERC20-_approve}.
     */
    function _approve(
        address _owner,
        address _spender,
        uint256 _amount
    ) internal virtual {
        require(_owner != address(0), ERC20InvalidSender(_owner));
        require(_spender != address(0), ERC20InvalidSpender(_spender));

        _allowances[_owner][_spender] = _amount;
        emit Approval(_owner, _spender, _amount);
    }

    /**
     *  @dev See {ERC20-_beforeTokenTransfer}.
     */
    // solhint-disable-next-line no-empty-blocks
    function _beforeTokenTransfer(address _from, address _to, uint256 _amount) internal virtual {}

}
