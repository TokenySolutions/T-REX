// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import "../IModularCompliance.sol";
import "../../../token/IToken.sol";
import "./AbstractModuleUpgradeable.sol";

 event MinimumTransferAmountSet(uint16 indexed country, uint256 amount);


/**
 * @title MinTransferByCountry Module
 * @dev Enforces minimum transfer amounts for token holders from specified countries
 * when creating new investors for that country
 */
contract MinTransferByCountryModule is AbstractModuleUpgradeable {

    mapping(address compliance => mapping(uint16 country => uint256 minAmount)) private _minimumTransferAmounts;
    
    function initialize() external initializer {
        __AbstractModule_init();
    }

    /**
     * @dev Sets minimum transfer amount for a country
     * @param country Country code
     * @param amount Minimum transfer amount
     */
    function setMinimumTransferAmount(uint16 country, uint256 amount) external onlyComplianceCall {
        _minimumTransferAmounts[msg.sender][country] = amount;

        emit MinimumTransferAmountSet(country, amount);
    }

    /// @inheritdoc IModule
    // solhint-disable-next-line no-empty-blocks
    function moduleTransferAction(address _from, address _to, uint256 _value) external {}

    /// @inheritdoc IModule
    // solhint-disable-next-line no-empty-blocks
    function moduleMintAction(address _to, uint256 _value) external {}

    /// @inheritdoc IModule
    // solhint-disable-next-line no-empty-blocks
    function moduleBurnAction(address _from, uint256 _value) external {}

    /// @inheritdoc IModule
    function moduleCheck(
        address _from, 
        address _to, 
        uint256 _amount, 
        address _compliance
    ) external view override returns (bool) {
        uint16 recipientCountry = _getCountry(_compliance, _to);
        if (_minimumTransferAmounts[_compliance][recipientCountry] == 0) {
            return true;
        }

        // Check for internal transfer in same country
        address idFrom = _getIdentity(_compliance, _from);
        address idTo = _getIdentity(_compliance, _to);
        if (idFrom == idTo) {
            uint16 senderCountry = _getCountry(_compliance, _from);
            return senderCountry == recipientCountry 
                || _amount >= _minimumTransferAmounts[_compliance][recipientCountry];
        }

        IToken token = IToken(IModularCompliance(_compliance).getTokenBound());
        // Check for new user
        return token.balanceOf(_to) > 0
            || _amount >= _minimumTransferAmounts[_compliance][recipientCountry];
    }

    /// @inheritdoc IModule
    function canComplianceBind(address /*_compliance*/) external view override returns (bool) {
        return true;
    }

    /// @inheritdoc IModule
    function isPlugAndPlay() external pure override returns (bool) {
        return true;
    }

    /**
     * @dev Module name
     */
    function name() public pure returns (string memory) {
        return "MinTransferByCountryModule";
    }


    /// @dev function used to get the country of a wallet address.
    /// @param _compliance the compliance contract address for which the country verification is required
    /// @param _userAddress the address of the wallet to be checked
    /// @return the ISO 3166-1 standard country code of the wallet owner
    function _getCountry(address _compliance, address _userAddress) internal view returns (uint16) {
        return IToken(IModularCompliance(_compliance).getTokenBound()).identityRegistry().investorCountry(_userAddress);
    }

    /// @dev Returns the ONCHAINID (Identity) of the _userAddress
    /// @param _compliance the compliance contract address for which the country verification is required
    /// @param _userAddress Address of the wallet
    /// @return the ONCHAINID (Identity) of the _userAddress
    function _getIdentity(address _compliance, address _userAddress) internal view returns (address) {
        return address(IToken(IModularCompliance(_compliance).getTokenBound()).identityRegistry().identity
            (_userAddress));
    }
}