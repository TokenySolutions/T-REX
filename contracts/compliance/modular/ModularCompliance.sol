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

pragma solidity 0.8.27;

import "../../utils/OwnableOnceNext2StepUpgradeable.sol";
import "../../token/IToken.sol";
import "./IModularCompliance.sol";
import "./MCStorage.sol";
import "./modules/IModule.sol";
import "../../errors/ComplianceErrors.sol";
import "../../errors/CommonErrors.sol";
import "../../errors/InvalidArgumentErrors.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "../../roles/IERC173.sol";

/// errors

/// @dev Thrown when trying to add more than max modules.
/// @param maxValue maximum number of modules.
error MaxModulesReached(uint256 maxValue);

/// @dev Thrown when module is already bound.
error ModuleAlreadyBound();

/// @dev Thrown when module is not bound.
error ModuleNotBound();

/// @dev Thrown when called by other than owner or token.
error OnlyOwnerOrTokenCanCall();

/// @dev Thrown when token is not bound.
error TokenNotBound();

contract ModularCompliance is
  IModularCompliance,
  OwnableOnceNext2StepUpgradeable,
  MCStorage,
  IERC165
{
  /// modifiers

  /**
   * @dev Throws if called by any address that is not a token bound to the compliance.
   */
  modifier onlyToken() {
    require(
      msg.sender == _tokenBound,
      AddressNotATokenBoundToComplianceContract()
    );
    _;
  }

  function init() external initializer {
    __Ownable_init();
  }

  /**
   *  @dev See {IERC3643Compliance-bindToken}.
   */
  function bindToken(address _token) external override {
    require(
      owner() == msg.sender ||
        (_tokenBound == address(0) && msg.sender == _token),
      OnlyOwnerOrTokenCanCall()
    );
    require(_token != address(0), ZeroAddress());
    _tokenBound = _token;
    emit TokenBound(_token);
  }

  /**
   *  @dev See {IERC3643Compliance-unbindToken}.
   */
  function unbindToken(address _token) external override {
    require(
      owner() == msg.sender || msg.sender == _token,
      OnlyOwnerOrTokenCanCall()
    );
    require(_token == _tokenBound, TokenNotBound());
    require(_token != address(0), ZeroAddress());
    delete _tokenBound;
    emit TokenUnbound(_token);
  }

  /**
   *  @dev See {IModularCompliance-removeModule}.
   */
  function removeModule(address _module) external override onlyOwner {
    require(_module != address(0), ZeroAddress());
    require(_moduleBound[_module], ModuleNotBound());
    uint256 length = _modules.length;
    for (uint256 i = 0; i < length; i++) {
      if (_modules[i] == _module) {
        IModule(_module).unbindCompliance(address(this));
        _modules[i] = _modules[length - 1];
        _modules.pop();
        _moduleBound[_module] = false;
        emit ModuleRemoved(_module);
        break;
      }
    }
  }

  /**
   *  @dev See {IERC3643Compliance-transferred}.
   */
  function transferred(
    address _from,
    address _to,
    uint256 _value
  ) external override onlyToken {
    require(_from != address(0) && _to != address(0), ZeroAddress());
    require(_value > 0, ZeroValue());
    uint256 length = _modules.length;
    for (uint256 i = 0; i < length; i++) {
      IModule(_modules[i]).moduleTransferAction(_from, _to, _value);
    }
  }

  /**
   *  @dev See {IERC3643Compliance-created}.
   */
  function created(address _to, uint256 _value) external override onlyToken {
    require(_to != address(0), ZeroAddress());
    require(_value > 0, ZeroValue());
    uint256 length = _modules.length;
    for (uint256 i = 0; i < length; i++) {
      IModule(_modules[i]).moduleMintAction(_to, _value);
    }
  }

  /**
   *  @dev See {IERC3643Compliance-destroyed}.
   */
  function destroyed(
    address _from,
    uint256 _value
  ) external override onlyToken {
    require(_from != address(0), ZeroAddress());
    require(_value > 0, ZeroValue());
    uint256 length = _modules.length;
    for (uint256 i = 0; i < length; i++) {
      IModule(_modules[i]).moduleBurnAction(_from, _value);
    }
  }

  /**
   *  @dev See {IModularCompliance-addAndSetModule}.
   */
  function addAndSetModule(
    address _module,
    bytes[] calldata _interactions
  ) external override onlyOwner {
    require(_interactions.length <= 5, ArraySizeLimited(5));
    addModule(_module);
    for (uint256 i = 0; i < _interactions.length; i++) {
      callModuleFunction(_interactions[i], _module);
    }
  }

  /**
   *  @dev See {IModularCompliance-isModuleBound}.
   */
  function isModuleBound(
    address _module
  ) external view override returns (bool) {
    return _moduleBound[_module];
  }

  /**
   *  @dev See {IModularCompliance-getModules}.
   */
  function getModules() external view override returns (address[] memory) {
    return _modules;
  }

  /**
   *  @dev See {IERC3643Compliance-getTokenBound}.
   */
  function getTokenBound() external view override returns (address) {
    return _tokenBound;
  }

  /**
   *  @dev See {IERC3643Compliance-getTokenBound}.
   */
  function isTokenBound(address _token) external view override returns (bool) {
    if (_token == _tokenBound) {
      return true;
    }
    return false;
  }

  /**
   *  @dev See {IERC3643Compliance-canTransfer}.
   */
  function canTransfer(
    address _from,
    address _to,
    uint256 _value
  ) external view override returns (bool) {
    uint256 length = _modules.length;
    for (uint256 i = 0; i < length; i++) {
      if (
        !IModule(_modules[i]).moduleCheck(_from, _to, _value, address(this))
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   *  @dev See {IModularCompliance-addModule}.
   */
  function addModule(address _module) public override onlyOwner {
    require(_module != address(0), ZeroAddress());
    require(!_moduleBound[_module], ModuleAlreadyBound());
    require(_modules.length <= 24, MaxModulesReached(25));
    IModule module = IModule(_module);
    require(
      module.isPlugAndPlay() || module.canComplianceBind(address(this)),
      ComplianceNotSuitableForBindingToModule(_module)
    );

    module.bindCompliance(address(this));
    _modules.push(_module);
    _moduleBound[_module] = true;
    emit ModuleAdded(_module);
  }

  /**
   *  @dev see {IModularCompliance-callModuleFunction}.
   */
  function callModuleFunction(
    bytes calldata callData,
    address _module
  ) public override onlyOwner {
    require(_moduleBound[_module], ModuleNotBound());
    // NOTE: Use assembly to call the interaction instead of a low level
    // call for two reasons:
    // - We don't want to copy the return data, since we discard it for
    // interactions.
    // - Solidity will under certain conditions generate code to copy input
    // calldata twice to memory (the second being a "memcopy loop").
    // solhint-disable-next-line no-inline-assembly
    assembly {
      let freeMemoryPointer := mload(0x40) // Load the free memory pointer from memory location 0x40

      // Copy callData from calldata to the free memory location
      calldatacopy(freeMemoryPointer, callData.offset, callData.length)

      if iszero(
        // Check if the call returns zero (indicating failure)
        call(
          // Perform the external call
          gas(), // Provide all available gas
          _module, // Address of the target module
          0, // No ether is sent with the call
          freeMemoryPointer, // Input data starts at the free memory pointer
          callData.length, // Input data length
          0, // Output data location (not used)
          0 // Output data size (not used)
        )
      ) {
        returndatacopy(0, 0, returndatasize()) // Copy return data to memory starting at position 0
        revert(0, returndatasize()) // Revert the transaction with the return data
      }
    }

    emit ModuleInteraction(_module, _selector(callData));
  }

  /**
   *  @dev See {IERC165-supportsInterface}.
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public pure virtual override returns (bool) {
    return
      interfaceId == type(IModularCompliance).interfaceId ||
      interfaceId == type(IERC3643Compliance).interfaceId ||
      interfaceId == type(IERC173).interfaceId ||
      interfaceId == type(IERC165).interfaceId;
  }

  /// @dev Extracts the Solidity ABI selector for the specified interaction.
  /// @param callData Interaction data.
  /// @return result The 4 byte function selector of the call encoded in
  /// this interaction.
  function _selector(
    bytes calldata callData
  ) internal pure returns (bytes4 result) {
    if (callData.length >= 4) {
      // NOTE: Read the first word of the interaction's calldata. The
      // value does not need to be shifted since `bytesN` values are left
      // aligned, and the value does not need to be masked since masking
      // occurs when the value is accessed and not stored:
      // <https://docs.soliditylang.org/en/v0.7.6/abi-spec.html#encoding-of-indexed-event-parameters>
      // <https://docs.soliditylang.org/en/v0.7.6/assembly.html#access-to-external-variables-functions-and-libraries>
      // solhint-disable-next-line no-inline-assembly
      assembly {
        result := calldataload(callData.offset)
      }
    }
  }
}
