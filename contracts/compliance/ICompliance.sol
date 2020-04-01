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

interface ICompliance {

   /**
    *  @dev checks that the transfer is compliant.
    *  default compliance always returns true
    *  READ ONLY FUNCTION, this function cannot be used to increment
    *  counters, emit events, ...
    *  @param _from The address of the sender
    *  @param _to The address of the receiver
    *  @param _amount The amount of tokens involved in the transfer
    */
    function canTransfer(address _from, address _to, uint256 _amount) external view returns (bool);

   /**
    *  @dev function called whenever tokens are transferred
    *  from one wallet to another
    *  this function can update state variables in the compliance contract
    *  these state variables being used by `canTransfer` to decide if a transfer
    *  is compliant or not depending on the values stored in these state variables and on
    *  the parameters of the compliance smart contract
    *  @param _from The address of the sender
    *  @param _to The address of the receiver
    *  @param _amount The amount of tokens involved in the transfer
    */
    function transferred(address _from, address _to, uint256 _amount) external;

   /**
    *  @dev function called whenever tokens are created
    *  on a wallet
    *  this function can update state variables in the compliance contract
    *  these state variables being used by `canTransfer` to decide if a transfer
    *  is compliant or not depending on the values stored in these state variables and on
    *  the parameters of the compliance smart contract
    *  @param _to The address of the receiver
    *  @param _amount The amount of tokens involved in the transfer
    */
    function created(address _to, uint256 _amount) external;

   /**
    *  @dev function called whenever tokens are destroyed
    *  this function can update state variables in the compliance contract
    *  these state variables being used by `canTransfer` to decide if a transfer
    *  is compliant or not depending on the values stored in these state variables and on
    *  the parameters of the compliance smart contract
    *  @param _from The address of the receiver
    *  @param _amount The amount of tokens involved in the transfer
    */
    function destroyed(address _from, uint256 _amount) external;

   /**
    *  @dev function used to transfer the ownership of the compliance contract
    *  to a new owner, giving him access to the `OnlyOwner` functions implemented on the contract
    *  @param newOwner The address of the new owner of the compliance contract
    *  This function can only be called by the owner of the compliance contract
    *  emits an `OwnershipTransferred` event
    */
    function transferOwnershipOnComplianceContract(address newOwner) external;
}
