// SPDX-License-Identifier: GPL-3.0
// This contract is also licensed under the Creative Commons Attribution-NonCommercial 4.0 International License.
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
 *     Copyright (C) 2024, Tokeny sàrl.
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
 *
 *     This specific smart contract is also licensed under the Creative Commons
 *     Attribution-NonCommercial 4.0 International License (CC-BY-NC-4.0),
 *     which prohibits commercial use. For commercial inquiries, please contact
 *     Tokeny sàrl for licensing options.
 */

pragma solidity 0.8.17;

import "../IModularCompliance.sol";
import "../../../token/IToken.sol";
import "./AbstractModuleUpgradeable.sol";

/// Types

enum ListingType {
    NOT_CONFIGURED, // default value (token is not configured yet)
    WHITELISTING,
    BLACKLISTING
}

enum InvestorAddressType {
    WALLET,
    ONCHAINID
}

/// Errors

/// @dev Thrown when the token is already configured
/// @param _tokenAddress the address of the token
error TokenAlreadyConfigured(address _tokenAddress);

/// @dev Thrown when the token is not configured
/// @param _tokenAddress the address of the token
error TokenIsNotConfigured(address _tokenAddress);

/// @dev Thrown when the token is already listed for the investor
/// @param _tokenAddress the address of the token
/// @param _investorAddress the investor address (a wallet or an ONCHAINID address)
error TokenAlreadyListed(address _tokenAddress, address _investorAddress);

/// @dev Thrown when the token is not listed for the investor
/// @param _tokenAddress the address of the token
/// @param _investorAddress the investor address (a wallet or an ONCHAINID address)
error TokenIsNotListed(address _tokenAddress, address _investorAddress);

/// @dev Thrown when the identity is not found
/// @param _tokenAddress the address of the token
/// @param _userAddress the user address (a wallet or an ONCHAINID address)
error IdentityNotFound(address _tokenAddress, address _userAddress);

/// @dev Thrown when the listing type is invalid for configuration
/// @param _listingType the listing type
error InvalidListingTypeForConfiguration(ListingType _listingType);

contract TokenListingRestrictionsModule is AbstractModuleUpgradeable {
    /// Mapping between token and listing type
    mapping(address => ListingType) private _tokenListingType;

    /// Mapping between tokenAddress and investor (wallet or OID address)
    /// and listing status (whitelisted or blacklisted depending on the listing type of the token)
    mapping(address => mapping(address => bool)) private _tokenInvestorListingStatus;

    /// events

    /// @dev This event is emitted whenever a token is configured with a non-zero listing type
    /// @param _tokenAddress the address of the configured token
    /// @param _listingType the configured listing type for the token (1: WHITELISTING, 2: BLACKLISTING)
    event TokenListingConfigured(address _tokenAddress, ListingType _listingType);

    /// @dev This event is emitted whenever a token is listed (whitelisted or blacklisted) for an investor
    /// @param _tokenAddress the address of the listed token
    /// @param _investorAddress the investor address (a wallet or an ONCHAINID address)
    event TokenListed(address _tokenAddress, address _investorAddress);

    /// @dev This event is emitted whenever a token is unlisted for an investor
    /// @param _tokenAddress the address of the unlisted token
    /// @param _investorAddress the investor address (a wallet or an ONCHAINID address)
    event TokenUnlisted(address _tokenAddress, address _investorAddress);

    /// functions
    /**
     * @dev initializes the contract and sets the initial state.
     * @notice This function should only be called once during the contract deployment.
     */
    function initialize() external initializer {
        __AbstractModule_init();
    }

    /**
    *  @dev Configures the listing type of a token
    *  Can only be called once per token
    *  @param _listingType can be WHITELISTING(1) or BLACKLISTING(2)
    *  WHITELISTING(1): investors must whitelist/allow the token address in order to receive it
    *  BLACKLISTING(2): investors can receive this token by default. If they do not want to receive it,
    *   they need to blacklist/disallow it.
    *  Only the owner of the Compliance smart contract can call this function
    */
    function configureToken(ListingType _listingType) external onlyComplianceCall {
        address tokenAddress = _getBoundTokenAddress(msg.sender);
        if (_listingType == ListingType.NOT_CONFIGURED) {
            revert InvalidListingTypeForConfiguration(_listingType);
        }

        if (_tokenListingType[tokenAddress] != ListingType.NOT_CONFIGURED) {
            revert TokenAlreadyConfigured(tokenAddress);
        }

        _tokenListingType[tokenAddress] = _listingType;
        emit TokenListingConfigured(tokenAddress, _listingType);
    }

    /**
    *  @dev Lists multiple tokens for the investor (caller)
    *  If the token listing type is WHITELISTING, it will be whitelisted/allowed for the investor.
    *  If the token listing type is BLACKLISTING, it will be blaclisted/disallowed for the investor.
    *  @param _tokenAddresses is the array of addresses of tokens to be listed
    *  @param _addressType can be WALLET(0) or ONCHAINID(1)
    *  If it is WALLET, the token will be listed only for the caller wallet address
    *  If it is ONCHAINID, the token will be listed for the ONCHAINID (it will be applied to all wallet addresses of the OID)
    *  It will revert if the listing type of the token is not configured
    */
    function batchListTokens(address[] calldata _tokenAddresses, InvestorAddressType _addressType) external {
        for (uint256 i = 0; i < _tokenAddresses.length; i++) {
            listToken(_tokenAddresses[i], _addressType);
        }
    }

    /**
    *  @dev Unlists multiple tokens for the investor (caller)
    *  @param _tokenAddresses is the array of addresses of tokens to be unlisted
    *  @param _addressType can be WALLET(0) or ONCHAINID(1)
    *  If it is WALLET, the token will be unlisted only for the caller wallet address
    *  If it is ONCHAINID, the token will be unlisted for the ONCHAINID
    */
    function batchUnlistTokens(address[] calldata _tokenAddresses, InvestorAddressType _addressType) external {
        for (uint256 i = 0; i < _tokenAddresses.length; i++) {
            unlistToken(_tokenAddresses[i], _addressType);
        }
    }

    /**
     *  @dev See {IModule-moduleTransferAction}.
     *  no transfer action required in this module
     */
    // solhint-disable-next-line no-empty-blocks
    function moduleTransferAction(address _from, address _to, uint256 _value) external override onlyComplianceCall {}

    /**
     *  @dev See {IModule-moduleMintAction}.
     *  no mint action required in this module
     */
    // solhint-disable-next-line no-empty-blocks
    function moduleMintAction(address _to, uint256 _value) external override onlyComplianceCall {}

    /**
     *  @dev See {IModule-moduleBurnAction}.
     *  no burn action required in this module
     */
    // solhint-disable-next-line no-empty-blocks
    function moduleBurnAction(address _from, uint256 _value) external override onlyComplianceCall {}

    /**
     *  @dev See {IModule-moduleCheck}.
     *  checks whether the _to address allows this token to receive
     *  returns TRUE if the token is allowed for the address of _to (or for the OID of _to)
     *  returns FALSE if the token is not allowed for the address of _to
     */
    function moduleCheck(
        address /*_from*/,
        address _to,
        uint256 /*_value*/,
        address _compliance
    ) external view override returns (bool) {
        if (_to == address(0)) {
            return true;
        }

        address tokenAddress = _getBoundTokenAddress(_compliance);
        ListingType listingType = _tokenListingType[tokenAddress];
        if (listingType == ListingType.NOT_CONFIGURED) {
            return true;
        }

        bool listed = _tokenInvestorListingStatus[tokenAddress][_to]
            || _tokenInvestorListingStatus[tokenAddress][_getIdentityByTokenAddress(tokenAddress, _to)];

        if (listingType == ListingType.BLACKLISTING) {
            return !listed;
        }

        return listed;
    }

    /**
     *  @dev Returns the configured listing type of the given token address
     *  @param _tokenAddress the token smart contract to be checked
     *  returns the listing type of the token:
     *  NOT_CONFIGURED(0): The token is not configured for this module yet
     *  WHITELISTING(1): investors must whitelist/allow the token address in order to receive it
     *  BLACKLISTING(2): investors can receive this token by default. If they do not want to receive it,
     *   they need to blacklist/disallow it.
     */
    function getTokenListingType(address _tokenAddress) external view returns (ListingType) {
        return _tokenListingType[_tokenAddress];
    }

    /**
     *  @dev Returns the listing status of the given investor address for the token
     *  @param _tokenAddress the token smart contract to be checked
     *  @param _investorAddress the WALLET or ONCHAINID address of an investor to be checked
     *  returns the listing status of the given investor.
     *  If it is true:
     *  - if the listing type of the token is WHITELISTING(1): investor can receive this token.
     *  - if the listing type of the token is BLACKLISTING(2): investor can not receive this token.
     *  If it is false:
     *  - if the listing type of the token is WHITELISTING(1): investor can not receive this token.
     *  - if the listing type of the token is BLACKLISTING(2): investor can receive this token.
     */
    function getInvestorListingStatus(address _tokenAddress, address _investorAddress) external view returns (bool) {
        return _tokenInvestorListingStatus[_tokenAddress][_investorAddress];
    }

    /**
     *  @dev See {IModule-canComplianceBind}.
     */
    function canComplianceBind(address /*_compliance*/) external pure override returns (bool) {
        return true;
    }

    /**
     *  @dev See {IModule-isPlugAndPlay}.
     */
    function isPlugAndPlay() external pure override returns (bool) {
        return true;
    }

    /**
    *  @dev Lists a token for the investor (caller)
    *  If the token listing type is WHITELISTING, it will be whitelisted/allowed for the investor.
    *  If the token listing type is BLACKLISTING, it will be blaclisted/disallowed for the investor.
    *  @param _tokenAddress is the address of the token to be listed
    *  @param _addressType can be WALLET(0) or ONCHAINID(1)
    *  If it is WALLET, the token will be listed only for the caller wallet address
    *  If it is ONCHAINID, the token will be listed for the ONCHAINID (it will be applied to all wallet addresses of the OID)
    *  It will revert if the listing type of the token is not configured
    */
    function listToken(address _tokenAddress, InvestorAddressType _addressType) public {
        if (_tokenListingType[_tokenAddress] == ListingType.NOT_CONFIGURED) {
            revert TokenIsNotConfigured(_tokenAddress);
        }

        address investorAddress = _getInvestorAddressByAddressType(_tokenAddress, msg.sender, _addressType);
        if (_tokenInvestorListingStatus[_tokenAddress][investorAddress]) {
            revert TokenAlreadyListed(_tokenAddress, investorAddress);
        }

        _tokenInvestorListingStatus[_tokenAddress][investorAddress] = true;
        emit TokenListed(_tokenAddress, investorAddress);
    }

    /**
    *  @dev Unlists a token for the investor (caller)
    *  @param _tokenAddress is the address of the token to be unlisted
    *  @param _addressType can be WALLET(0) or ONCHAINID(1)
    *  If it is WALLET, the token will be unlisted only for the caller wallet address
    *  If it is ONCHAINID, the token will be unlisted for the ONCHAINID
    */
    function unlistToken(address _tokenAddress, InvestorAddressType _addressType) public {
        address investorAddress = _getInvestorAddressByAddressType(_tokenAddress, msg.sender, _addressType);
        if (!_tokenInvestorListingStatus[_tokenAddress][investorAddress]) {
            revert TokenIsNotListed(_tokenAddress, investorAddress);
        }

        _tokenInvestorListingStatus[_tokenAddress][investorAddress] = false;
        emit TokenUnlisted(_tokenAddress, investorAddress);
    }

    /**
     *  @dev See {IModule-name}.
     */
    function name() public pure returns (string memory _name) {
        return "TokenListingRestrictionsModule";
    }

    function _getInvestorAddressByAddressType(
        address _tokenAddress,
        address _userAddress,
        InvestorAddressType _addressType
    ) internal view returns (address) {
        if (_addressType == InvestorAddressType.WALLET) {
            return _userAddress;
        }

        address identity = _getIdentityByTokenAddress(_tokenAddress, _userAddress);
        if (identity == address(0)) {
            revert IdentityNotFound(_tokenAddress, _userAddress);
        }

        return identity;
    }

    function _getIdentityByTokenAddress(address _tokenAddress, address _userAddress) internal view returns (address) {
        return address(IToken(_tokenAddress).identityRegistry().identity(_userAddress));
    }

    function _getBoundTokenAddress(address _compliance) internal view returns (address) {
        return IModularCompliance(_compliance).getTokenBound();
    }
}