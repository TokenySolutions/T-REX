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

pragma solidity 0.8.27;

import "../IModularCompliance.sol";
import "../../../token/IToken.sol";
import "../../../roles/AgentRole.sol";
import "./AbstractModuleUpgradeable.sol";

/// Events

/// @dev This event is emitted whenever a fee definition is updated for the given compliance address.
/// @param _compliance is the compliance contract address.
/// @param _rate is the rate of the fee in BPS (0.01% = 1, 1% = 100, 100% = 10000).
/// @param _collector is the collector wallet address.
event FeeUpdated(
  address indexed _compliance,
  uint256 _rate,
  address _collector
);

/// @dev This event is emitted whenever a whitelisted address is updated for the given compliance address.
/// @param _compliance is the compliance contract address.
/// @param _address is the address to be whitelisted.
/// @param _status is the status of the whitelisted address.
event WhitelistedUpdated(
  address indexed _compliance,
  address _address,
  bool _status
);

/// Errors

/// @dev Thrown when fee rate is out of range.
/// @param _compliance compliance contract address.
/// @param _rate rate value.
error FeeRateIsOutOfRange(address _compliance, uint256 _rate);

/// @dev Thrown when the collector address is not verified.
/// @param _compliance compliance contract address.
/// @param _collector collector contract address.
error CollectorAddressIsNotVerified(address _compliance, address _collector);

/// @dev Thrown when transfer fee collection failed.
error TransferFeeCollectionFailed();

contract TransferFeesModule is AbstractModuleUpgradeable {
  /// Struct of fees
  struct Fee {
    uint256 rate; // min = 0, max = 10000, 0.01% = 1, 1% = 100, 100% = 10000
    address collector;
  }

  /// Mapping for compliance fees
  mapping(address compliance => mapping(uint256 nonce => Fee)) private _fees;

  /// Mapping for whitelisted addresses (no fees)
  mapping(address compliance => mapping(uint256 nonce => mapping(address => bool)))
    private _whitelisted;

  /**
   * @dev initializes the contract and sets the initial state.
   * @notice This function should only be called once during the contract deployment.
   */
  function initialize() external initializer {
    __AbstractModule_init();
  }

  /**
   *  @dev Sets the fee rate and collector of the given compliance
   *  @param _rate is the rate of the fee (0.01% = 1, 1% = 100, 100% = 10000)
   *  @param _collector is the collector wallet address
   *  Only the owner of the Compliance smart contract can call this function
   *  Collector wallet address must be verified
   */
  function setFee(
    uint256 _rate,
    address _collector
  ) external onlyComplianceCall {
    address tokenAddress = IModularCompliance(msg.sender).getTokenBound();
    require(_rate <= 10000, FeeRateIsOutOfRange(msg.sender, _rate));

    IERC3643IdentityRegistry identityRegistry = IToken(tokenAddress)
      .identityRegistry();
    require(
      identityRegistry.isVerified(_collector),
      CollectorAddressIsNotVerified(msg.sender, _collector)
    );

    uint256 nonce = getNonce(msg.sender);
    _fees[msg.sender][nonce].rate = _rate;
    _fees[msg.sender][nonce].collector = _collector;
    emit FeeUpdated(msg.sender, _rate, _collector);
  }

  function setWhitelisted(
    address _address,
    bool _status
  ) external onlyComplianceCall {
    uint256 nonce = getNonce(msg.sender);
    _whitelisted[msg.sender][nonce][_address] = _status;

    emit WhitelistedUpdated(msg.sender, _address, _status);
  }

  /**
   *  @dev See {IModule-moduleTransferAction}.
   */
  function moduleTransferAction(
    address _from,
    address _to,
    uint256 _value
  ) external override onlyComplianceCall {
    address senderIdentity = _getIdentity(msg.sender, _from);
    address receiverIdentity = _getIdentity(msg.sender, _to);

    uint256 nonce = getNonce(msg.sender);
    if (
      senderIdentity == receiverIdentity ||
      _whitelisted[msg.sender][nonce][_from]
    ) {
      return;
    }

    Fee memory fee = _fees[msg.sender][nonce];
    if (fee.rate == 0 || _from == fee.collector || _to == fee.collector) {
      return;
    }

    uint256 feeAmount = (_value * fee.rate) / 10000;
    if (feeAmount == 0) {
      return;
    }

    IToken token = IToken(IModularCompliance(msg.sender).getTokenBound());
    bool sent = token.forcedTransfer(_to, fee.collector, feeAmount);
    require(sent, TransferFeeCollectionFailed());
  }

  /**
   *  @dev See {IModule-moduleMintAction}.
   */
  // solhint-disable-next-line no-empty-blocks
  function moduleMintAction(
    address _to,
    uint256 _value
  ) external override onlyComplianceCall {}

  /**
   *  @dev See {IModule-moduleBurnAction}.
   */
  // solhint-disable-next-line no-empty-blocks
  function moduleBurnAction(
    address _from,
    uint256 _value
  ) external override onlyComplianceCall {}

  /**
   *  @dev getter for `_fees` variable
   *  @param _compliance the Compliance smart contract to be checked
   *  returns the Fee
   */
  function getFee(address _compliance) external view returns (Fee memory) {
    uint256 nonce = getNonce(_compliance);
    return _fees[_compliance][nonce];
  }

  /**
   *  @dev See {IModule-canComplianceBind}.
   */
  function canComplianceBind(address _compliance) external view returns (bool) {
    address tokenAddress = IModularCompliance(_compliance).getTokenBound();
    return AgentRole(tokenAddress).isAgent(address(this));
  }

  /**
   *  @dev Returns the whitelisted status of the given address for the given compliance
   *  @param _compliance is the compliance contract address
   *  @param _address is the address to be checked
   *  @return true if the address is whitelisted, false otherwise
   */
  function isWhitelisted(
    address _compliance,
    address _address
  ) external view returns (bool) {
    return _whitelisted[_compliance][getNonce(_compliance)][_address];
  }

  /**
   *  @dev See {IModule-moduleCheck}.
   */
  function moduleCheck(
    address /*_from*/,
    address /*_to*/,
    uint256 /*_value*/,
    address /*_compliance*/
  ) external pure override returns (bool) {
    return true;
  }

  /**
   *  @dev See {IModule-isPlugAndPlay}.
   */
  function isPlugAndPlay() external pure returns (bool) {
    return false;
  }

  /**
   *  @dev See {IModule-name}.
   */
  function name() public pure returns (string memory _name) {
    return "TransferFeesModule";
  }

  /**
   *  @dev Returns the ONCHAINID (Identity) of the _userAddress
   *  @param _userAddress Address of the wallet
   *  internal function, can be called only from the functions of the Compliance smart contract
   */
  function _getIdentity(
    address _compliance,
    address _userAddress
  ) internal view returns (address) {
    return
      address(
        IToken(IModularCompliance(_compliance).getTokenBound())
          .identityRegistry()
          .identity(_userAddress)
      );
  }
}
