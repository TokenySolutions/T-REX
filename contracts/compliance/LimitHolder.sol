// SPDX-License-Identifier: GPL-3.0

/**
 *     NOTICE
 *
 *     The T-REX software is licensed under a proprietary license or the GPL v.3.
 *     If you choose to receive it under the GPL v.3 license, the following applies:
 *     T-REX is a suite of smart contracts developed by Tokeny to manage and transfer financial assets on the ethereum blockchain
 *
 *     Copyright (C) 2021, Tokeny sàrl.
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

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';

import './ICompliance.sol';
import '../token/IToken.sol';
import '../registry/IIdentityRegistry.sol';

contract LimitHolder is ICompliance, Ownable

 {
    /// @dev the token on which this compliance contract is applied
    IToken public token;

    /// @dev the limit of holders for this token
    uint256 private holderLimit;

    /// @dev the Identity registry contract linked to `token`
    IIdentityRegistry private identityRegistry;

    /// @dev the index of each shareholder in the array `shareholders`
    mapping(address => uint256) private holderIndices;

    /// @dev the amount of shareholders per country
    mapping(uint16 => uint256) private countryShareHolders;

    /// @dev the addresses of all shareholders
    address[] private shareholders;

    /// @dev Mapping between agents and their statuses
    mapping(address => bool) private _tokenAgentsList;

    /// @dev Mapping of tokens linked to the compliance contract
    mapping(address => bool) private _tokensBound;

    /**
     * @dev Throws if called by any address that is not a token bound to the compliance.
     */
    modifier onlyToken() {
        require(isToken(), 'error : this address is not a token bound to the compliance contract');
        _;
    }

    /**
     *  this event is emitted when the holder limit is set.
     *  the event is emitted by the setHolderLimit function and by the constructor
     *  `_holderLimit` is the holder limit for this token
     */
    event HolderLimitSet(uint256 _holderLimit);

    /**
     *  @dev the constructor initiates the smart contract with the initial state variables
     *  @param _token the address of the token concerned by the rules of this compliance contract
     *  @param _holderLimit the holder limit for the token concerned
     *  emits a `HolderLimitSet` event
     */
    constructor(address _token, uint256 _holderLimit) {
        token = IToken(_token);
        holderLimit = _holderLimit;
        identityRegistry = token.identityRegistry();
        emit HolderLimitSet(_holderLimit);
    }

    /**
     *  @dev See {ICompliance-isTokenAgent}.
     */
    function isTokenAgent(address _agentAddress) public view override returns (bool) {
        return (_tokenAgentsList[_agentAddress]);
    }

    /**
     *  @dev See {ICompliance-isTokenBound}.
     */
    function isTokenBound(address _token) public view override returns (bool) {
        return (_tokensBound[_token]);
    }

    /**
     *  @dev See {ICompliance-addTokenAgent}.
     */
    function addTokenAgent(address _agentAddress) external override onlyOwner {
        require(!_tokenAgentsList[_agentAddress], 'This Agent is already registered');
        _tokenAgentsList[_agentAddress] = true;
        emit TokenAgentAdded(_agentAddress);
    }

    /**
     *  @dev See {ICompliance-isTokenAgent}.
     */
    function removeTokenAgent(address _agentAddress) external override onlyOwner {
        require(_tokenAgentsList[_agentAddress], 'This Agent is not registered yet');
        _tokenAgentsList[_agentAddress] = false;
        emit TokenAgentRemoved(_agentAddress);
    }

    /**
     *  @dev See {ICompliance-isTokenAgent}.
     */
    function bindToken(address _token) external override onlyOwner {
        require(!_tokensBound[_token], 'This token is already bound');
        _tokensBound[_token] = true;
        emit TokenBound(_token);
    }

    /**
     *  @dev See {ICompliance-isTokenAgent}.
     */
    function unbindToken(address _token) external override onlyOwner {
        require(_tokensBound[_token], 'This token is not bound yet');
        _tokensBound[_token] = false;
        emit TokenUnbound(_token);
    }

    /**
     *  @dev Returns true if the sender corresponds to a token that is bound with the Compliance contract
     */
    function isToken() internal view returns (bool) {
        return isTokenBound(msg.sender);
    }

    /**
     *  @dev sets the holder limit as required for compliance purpose
     *  @param _holderLimit the holder limit for the token concerned
     *  This function can only be called by the agent of the Compliance contract
     *  emits a `HolderLimitSet` event
     */
    function setHolderLimit(uint256 _holderLimit) external onlyOwner {
        holderLimit = _holderLimit;
        emit HolderLimitSet(_holderLimit);
    }

    /**
     *  @dev returns the holder limit as set on the contract
     */
    function getHolderLimit() external view returns (uint256) {
        return holderLimit;
    }

    /**
     *  @dev returns the amount of token holders
     */
    function holderCount() public view returns (uint256) {
        return shareholders.length;
    }

    /**
     *  @dev By counting the number of token holders using `holderCount`
     *  you can retrieve the complete list of token holders, one at a time.
     *  It MUST throw if `index >= holderCount()`.
     *  @param index The zero-based index of the holder.
     *  @return `address` the address of the token holder with the given index.
     */
    function holderAt(uint256 index) external view returns (address) {
        require(index < shareholders.length, 'shareholder doesn\'t exist');
        return shareholders[index];
    }

    /**
     *  @dev If the address is not in the `shareholders` array then push it
     *  and update the `holderIndices` mapping.
     *  @param addr The address to add as a shareholder if it's not already.
     */
    function updateShareholders(address addr) internal {
        if (holderIndices[addr] == 0) {
            shareholders.push(addr);
            holderIndices[addr] = shareholders.length;
            uint16 country = identityRegistry.investorCountry(addr);
            countryShareHolders[country]++;
        }
    }

    /**
     *  If the address is in the `shareholders` array and the forthcoming
     *  transfer or transferFrom will reduce their balance to 0, then
     *  we need to remove them from the shareholders array.
     *  @param addr The address to prune if their balance will be reduced to 0.
     *  @dev see https://ethereum.stackexchange.com/a/39311
     */
    function pruneShareholders(address addr) internal {
        require(holderIndices[addr] != 0, 'Shareholder does not exist');
        uint256 balance = token.balanceOf(addr);
        if (balance > 0) {
            return;
        }
        uint256 holderIndex = holderIndices[addr] - 1;
        uint256 lastIndex = shareholders.length - 1;
        address lastHolder = shareholders[lastIndex];
        shareholders[holderIndex] = lastHolder;
        holderIndices[lastHolder] = holderIndices[addr];
        shareholders.pop();
        holderIndices[addr] = 0;
        uint16 country = identityRegistry.investorCountry(addr);
        countryShareHolders[country]--;
    }

    /**
     *  @dev get the amount of shareholders in a country
     *  @param index the index of the country, following ISO 3166-1
     */
    function getShareholderCountByCountry(uint16 index) external view returns (uint256) {
        return countryShareHolders[index];
    }

    /**
     *  @dev See {ICompliance-canTransfer}.
     *  @return true if the amount of holders post-transfer is less or
     *  equal to the maximum amount of token holders
     */
    function canTransfer(
        address /* _from */,
        address _to,
        uint256 /* _value */
    ) external view override returns (bool) {
        if (holderIndices[_to] != 0) {
            return true;
        }
        if (holderCount() < holderLimit) {
            return true;
        }
        return false;
    }

    /**
     *  @dev See {ICompliance-transferred}.
     *  updates the counter of shareholders if necessary
     */
    function transferred(
        address _from,
        address _to,
        uint256 /*_value */
    ) external override onlyToken {
        updateShareholders(_to);
        pruneShareholders(_from);
    }

    /**
     *  @dev See {ICompliance-created}.
     *  updates the counter of shareholders if necessary
     */
    function created(address _to, uint256 _value) external override onlyToken {
        require(_value > 0, 'No token created');
        updateShareholders(_to);
    }

    /**
     *  @dev See {ICompliance-destroyed}.
     *  updates the counter of shareholders if necessary
     */
    function destroyed(address _from, uint256 /* _value */) external override onlyToken {
        pruneShareholders(_from);
    }

    /**
     *  @dev See {ICompliance-transferOwnershipOnComplianceContract}.
     */
    function transferOwnershipOnComplianceContract(address newOwner) external override onlyOwner {
        transferOwnership(newOwner);
    }
}
