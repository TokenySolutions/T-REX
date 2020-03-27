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
import "../token/IToken.sol";
import "../roles/AgentRole.sol";
import "../registry/IIdentityRegistry.sol";

contract LimitHolder is ICompliance, AgentRole {
    IToken public token;
    uint public holderLimit;
    IIdentityRegistry private identityRegistry;
    mapping(address => uint256) private holderIndices;
    mapping(uint16 => uint256) private countryShareHolders;
    address[] private shareholders;

    constructor (address _token, uint _holderLimit) public {
        token = IToken(_token);
        holderLimit = _holderLimit;
        identityRegistry = token.identityRegistry();
    }


    /**
     * Holder count simply returns the total number of token holder addresses.
     */
    function holderCount() public view returns (uint) {
        return shareholders.length;
    }

    /**
     *  By counting the number of token holders using `holderCount`
     *  you can retrieve the complete list of token holders, one at a time.
     *  It MUST throw if `index >= holderCount()`.
     *  @param index The zero-based index of the holder.
     *  @return `address` the address of the token holder with the given index.
     */
    function holderAt(uint256 index) public view returns (address){
        require(index < shareholders.length);
        return shareholders[index];
    }


    /**
     *  If the address is not in the `shareholders` array then push it
     *  and update the `holderIndices` mapping.
     *  @param addr The address to add as a shareholder if it's not already.
     */
    function updateShareholders(address addr) internal {
        if (holderIndices[addr] == 0) {
            shareholders.push(addr);
            holderIndices[addr] = shareholders.length;
            uint16 country = identityRegistry.getInvestorCountryOfWallet(addr);
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
    function pruneShareholders(address addr, uint256 value) internal {
        uint256 balance = token.balanceOf(addr);
        if (balance > 0) {
            return;
        }
        uint256 holderIndex = holderIndices[addr] - 1;
        uint256 lastIndex = shareholders.length - 1;
        address lastHolder = shareholders[lastIndex];
        // overwrite the addr's slot with the last shareholder
        shareholders[holderIndex] = lastHolder;
        // also copy over the index
        holderIndices[lastHolder] = holderIndices[addr];
        // trim the shareholders array (which drops the last entry)
        shareholders.pop();
        // and zero out the index for addr
        holderIndices[addr] = 0;
        //Decrease the country count
        uint16 country = identityRegistry.getInvestorCountryOfWallet(addr);
        countryShareHolders[country]--;
    }

    function getShareholderCountByCountry(uint16 index) public view returns (uint) {
        return countryShareHolders[index];
    }


    /**
    * @notice checks that the transfer is compliant.
    * this function will check if the amount of holders is
    * allowing the transfer to happen, considering a maximum
    * amount of holders
    *
    * @param _from The address of the sender
    * @param _to The address of the receiver
    * @param _value The amount of tokens involved in the transfer
    */
    function canTransfer(address _from, address _to, uint256 _value) public override view returns (bool) {
        if (holderIndices[_to] != 0) {
            return true;
        }
        if (holderCount() < holderLimit) {
            return true;
        }
        return false;
    }

    function transferred(address _from, address _to, uint256 _value) public override onlyAgent returns (bool) {
        updateShareholders(_to);
        pruneShareholders(_from, _value);
        return true;
    }

    function created(address _to, uint256 _value) public override onlyAgent returns (bool) {
        require(_value > 0, "No token created");
        updateShareholders(_to);
        return true;
    }

    function destroyed(address _from, uint256 _value) public override onlyAgent returns (bool) {
        pruneShareholders(_from, _value);
        return true;
    }

    function transferOwnershipOnComplianceContract(address newOwner) external override onlyOwner {
        transferOwnership(newOwner);
    }
}
