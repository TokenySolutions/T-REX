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

contract DefaultCompliance is ICompliance, Ownable {
    /// @dev Mapping between agents and their statuses
    mapping(address => bool) private _tokenAgentsList;

    /// @dev Mapping of tokens linked to the compliance contract
    mapping(address => bool) private _tokensBound;

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
     *  @dev See {ICompliance-canTransfer}.
     */
    function canTransfer(
        address /* _from */,
        address /* _to */,
        uint256 /* _value */
    ) external view override returns (bool) {
        return true;
    }

    /**
     *  @dev See {ICompliance-transferred}.
     */
    function transferred(
        address /* _from */,
        address /* _to */,
        uint256 /* _value */
    ) external override {}

    /**
     *  @dev See {ICompliance-created}.
     */
    function created(address /* _to */, uint256 /* _value */) external override {}

    /**
     *  @dev See {ICompliance-destroyed}.
     */
    function destroyed(address /* _from */, uint256 /* _value */) external override {}

    /**
     *  @dev See {ICompliance-transferOwnershipOnComplianceContract}.
     */
    function transferOwnershipOnComplianceContract(address newOwner) external override onlyOwner {
        transferOwnership(newOwner);
    }
}
