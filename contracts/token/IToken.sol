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

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../registry/IIdentityRegistry.sol";
import "../compliance/ICompliance.sol";

//interface
interface IToken is IERC20 {
    event UpdatedTokenInformation(string newName, string newSymbol, uint8 newDecimals, string newVersion, address newOnchainID);

    // getters
    function decimals() external view returns (uint8);
    function name() external view returns (string memory);
    function onchainID() external view returns (address);
    function symbol() external view returns (string memory);
    function version() external view returns (string memory);
    function getIdentityRegistry() external view returns (IIdentityRegistry);
    function getCompliance() external view returns (ICompliance);
    function paused() external view returns (bool);


    // setters
    function setTokenInformation(string calldata _name, string calldata _symbol, uint8 _decimals, string calldata _version, address _onchainID) external;
    function pause() external;
    function unpause() external;
    function setAddressFrozen(address addr, bool freeze) external;
    function freezePartialTokens(address addr, uint256 amount) external;
    function unfreezePartialTokens(address addr, uint256 amount) external;
    function setIdentityRegistry(address _identityRegistry) external;
    function setCompliance(address _compliance) external;

    // transactions
    function forcedTransfer(address _from, address _to, uint256 _value) external returns (bool);
    function mint(address _to, uint256 _amount) external;
    function burn(address account, uint256 value) external;
    function recoveryAddress(address lostWallet, address newWallet, address investorOnchainID) external returns (bool);
    function batchTransfer(address[] calldata _toList, uint256[] calldata _values) external;
    function batchForcedTransfer(address[] calldata _fromList, address[] calldata _toList, uint256[] calldata _values) external;
    function batchMint(address[] calldata _toList, uint256[] calldata _amounts) external;
    function batchBurn(address[] calldata accounts, uint256[] calldata values) external;
    function batchSetAddressFrozen(address[] calldata addrList, bool[] calldata freeze) external;
    function batchFreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts) external;
    function batchUnfreezePartialTokens(address[] calldata addrList, uint256[] calldata amounts) external;

    // transfer contract ownership
    function transferOwnershipOnTokenContract(address newOwner) external;

    // manage Agent Role (onlyOwner functions)
    function addAgentOnTokenContract(address agent) external;
    function removeAgentOnTokenContract(address agent) external;

}
