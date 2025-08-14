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

import { IClaimIssuer } from "@onchain-id/solidity/contracts/interface/IClaimIssuer.sol";

interface IUtilityChecker {
  struct ComplianceCheckDetails {
    string moduleName;
    bool pass;
  }

  struct EligibilityCheckDetails {
    IClaimIssuer issuer;
    uint256 topic;
    bool pass;
  }

  /// @dev This function verifies if the transfer is restricted due to frozen addresses or tokens.
  /// @param _token The address of the token contract.
  /// @param _from The address of the sender.
  /// @param _to The address of the recipient.
  /// @param _amount The amount of tokens to be transferred.
  /// @return _frozen bool Returns true if the transfer is affected by freeze conditions, false otherwise.
  /// @return _availableBalance uint256 Available unfreezed balance.
  function testFreeze(
    address _token,
    address _from,
    address _to,
    uint256 _amount
  ) external view returns (bool _frozen, uint256 _availableBalance);

  /// @dev This function performs a comprehensive check on whether a transfer would succeed:
  ///     - check if token is paused,
  ///     - check freeze conditions,
  ///     - check eligibilty,
  ///     - check compliance.
  /// @param _token The address of the token contract.
  /// @param _from The address of the sender.
  /// @param _to The address of the recipient.
  /// @param _amount The amount of tokens to be transferred.
  /// @return _freezeStatus bool
  ///      Returns true if the transfer would be successful according to pause/freeze conditions, false otherwise.
  /// @return _eligibilityStatus bool
  ///      Returns true if the transfer would be successful according to eligibilty conditions, false otherwise.
  /// @return _complianceStatus bool
  ///     Returns true if the transfer would be successful according to compliance conditions, false otherwise.
  function testTransfer(
    address _token,
    address _from,
    address _to,
    uint256 _amount
  )
    external
    view
    returns (
      bool _freezeStatus,
      bool _eligibilityStatus,
      bool _complianceStatus
    );

  /// @dev Check trade validity and return the status of each module for this transfer.
  /// @param _token The address of the token contract.
  /// @param _from Address of the sender.
  /// @param _to Address of the receiver.
  /// @param _value Amount of tokens to transfer.
  /// @return _details Array of struct with module name and result of the `moduleCheck` call.
  function testTransferDetails(
    address _token,
    address _from,
    address _to,
    uint256 _value
  ) external view returns (ComplianceCheckDetails[] memory _details);

  /// @dev This functions checks whether an identity contract corresponding to the provided user address has the
  ///      required claims or not based on the data fetched from trusted issuers registry and from the claim topics
  ///      registry.
  ///      It returns the details of each (issuer, topic).
  /// @param _token Address of the token contract.
  /// @param _userAddress Address of the user to be verified.
  /// @return _details Array of struct with issuer, topic, and the verified status.
  function testVerifiedDetails(
    address _token,
    address _userAddress
  ) external view returns (EligibilityCheckDetails[] memory _details);
}
