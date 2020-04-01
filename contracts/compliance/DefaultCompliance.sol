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

import "./ICompliance.sol";

import "../roles/Ownable.sol";

contract DefaultCompliance is ICompliance, Ownable {

   /**
    *  @dev See {ICompliance-canTransfer}.
    */
    function canTransfer(address _from, address _to, uint256 _value) public override view returns (bool) {
        return true;
    }

   /**
    *  @dev See {ICompliance-transferred}.
    */
    function transferred(address _from, address _to, uint256 _value) public override {

    }

   /**
    *  @dev See {ICompliance-created}.
    */
    function created(address _to, uint256 _value) public override {

    }

   /**
    *  @dev See {ICompliance-destroyed}.
    */
    function destroyed(address _from, uint256 _value) public override {

    }

   /**
    *  @dev See {ICompliance-transferOwnershipOnComplianceContract}.
    */
    function transferOwnershipOnComplianceContract(address newOwner) external override onlyOwner {
        transferOwnership(newOwner);
    }
}
