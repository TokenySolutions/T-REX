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

import "@onchain-id/solidity/contracts/interface/IClaimIssuer.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "../interface/ITrustedIssuersRegistry.sol";
import "../storage/TIRStorage.sol";
import "../../errors/InvalidArgumentErrors.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "../../roles/IERC173.sol";

/// Errors

/// @dev Thrown when claim topics is empty.
error ClaimTopicsCannotBeEmpty();

/// @dev Thrown when maximum number of claim topics is reached.
/// @param _max maximum number of claim topics.
error MaxClaimTopcisReached(uint256 _max);

/// @dev Thrown when the maximum number of trusted issuers is reached.
/// @param _max maximum number of trusted issuers.
error MaxTrustedIssuersReached(uint256 _max);

/// @dev Thrown when called by other than a trusted issuer.
error NotATrustedIssuer();

/// @dev Thrown when trusted claim topics is empty.
error TrustedClaimTopicsCannotBeEmpty();

/// @dev Thrown when trusted issuer already exists.
error TrustedIssuerAlreadyExists();

/// @dev Thrown when trusted issuer doesn"t exist.
error TrustedIssuerDoesNotExist();


contract TrustedIssuersRegistry is ITrustedIssuersRegistry, Ownable2StepUpgradeable, TIRStorage, IERC165 {

    /// Functions

    function init() external initializer {
        __Ownable_init();
    }

    /**
     *  @dev See {ITrustedIssuersRegistry-addTrustedIssuer}.
     */
    function addTrustedIssuer(IClaimIssuer _trustedIssuer, uint256[] calldata _claimTopics) external override onlyOwner {
        require(address(_trustedIssuer) != address(0), ZeroAddress());
        require(_trustedIssuerClaimTopics[address(_trustedIssuer)].length == 0, TrustedIssuerAlreadyExists());
        require(_claimTopics.length > 0, TrustedClaimTopicsCannotBeEmpty());
        require(_claimTopics.length <= 15, MaxClaimTopcisReached(15));
        require(_trustedIssuers.length < 50, MaxTrustedIssuersReached(50));
        _trustedIssuers.push(_trustedIssuer);
        _trustedIssuerClaimTopics[address(_trustedIssuer)] = _claimTopics;
        for (uint256 i = 0; i < _claimTopics.length; i++) {
            _claimTopicsToTrustedIssuers[_claimTopics[i]].push(_trustedIssuer);
        }
        emit TrustedIssuerAdded(_trustedIssuer, _claimTopics);
    }

    /**
     *  @dev See {ITrustedIssuersRegistry-removeTrustedIssuer}.
     */
    function removeTrustedIssuer(IClaimIssuer _trustedIssuer) external override onlyOwner {
        require(address(_trustedIssuer) != address(0), ZeroAddress());
        require(_trustedIssuerClaimTopics[address(_trustedIssuer)].length != 0, NotATrustedIssuer());
        uint256 length = _trustedIssuers.length;
        for (uint256 i = 0; i < length; i++) {
            if (_trustedIssuers[i] == _trustedIssuer) {
                _trustedIssuers[i] = _trustedIssuers[length - 1];
                _trustedIssuers.pop();
                break;
            }
        }
        for (
            uint256 claimTopicIndex = 0;
            claimTopicIndex < _trustedIssuerClaimTopics[address(_trustedIssuer)].length;
            claimTopicIndex++) {
            uint256 claimTopic = _trustedIssuerClaimTopics[address(_trustedIssuer)][claimTopicIndex];
            uint256 topicsLength = _claimTopicsToTrustedIssuers[claimTopic].length;
            for (uint256 i = 0; i < topicsLength; i++) {
                if (_claimTopicsToTrustedIssuers[claimTopic][i] == _trustedIssuer) {
                    _claimTopicsToTrustedIssuers[claimTopic][i] =
                    _claimTopicsToTrustedIssuers[claimTopic][topicsLength - 1];
                    _claimTopicsToTrustedIssuers[claimTopic].pop();
                    break;
                }
            }
        }
        delete _trustedIssuerClaimTopics[address(_trustedIssuer)];
        emit TrustedIssuerRemoved(_trustedIssuer);
    }

    /**
     *  @dev See {ITrustedIssuersRegistry-updateIssuerClaimTopics}.
     */
    function updateIssuerClaimTopics(IClaimIssuer _trustedIssuer, uint256[] calldata _claimTopics) external override onlyOwner {
        require(address(_trustedIssuer) != address(0), ZeroAddress());
        require(_trustedIssuerClaimTopics[address(_trustedIssuer)].length != 0, NotATrustedIssuer());
        require(_claimTopics.length <= 15, MaxClaimTopcisReached(15));
        require(_claimTopics.length > 0, ClaimTopicsCannotBeEmpty());

        for (uint256 i = 0; i < _trustedIssuerClaimTopics[address(_trustedIssuer)].length; i++) {
            uint256 claimTopic = _trustedIssuerClaimTopics[address(_trustedIssuer)][i];
            uint256 topicsLength = _claimTopicsToTrustedIssuers[claimTopic].length;
            for (uint256 j = 0; j < topicsLength; j++) {
                if (_claimTopicsToTrustedIssuers[claimTopic][j] == _trustedIssuer) {
                    _claimTopicsToTrustedIssuers[claimTopic][j] =
                    _claimTopicsToTrustedIssuers[claimTopic][topicsLength - 1];
                    _claimTopicsToTrustedIssuers[claimTopic].pop();
                    break;
                }
            }
        }
        _trustedIssuerClaimTopics[address(_trustedIssuer)] = _claimTopics;
        for (uint256 i = 0; i < _claimTopics.length; i++) {
            _claimTopicsToTrustedIssuers[_claimTopics[i]].push(_trustedIssuer);
        }
        emit ClaimTopicsUpdated(_trustedIssuer, _claimTopics);
    }

    /**
     *  @dev See {ITrustedIssuersRegistry-getTrustedIssuers}.
     */
    function getTrustedIssuers() external view override returns (IClaimIssuer[] memory) {
        return _trustedIssuers;
    }

    /**
     *  @dev See {ITrustedIssuersRegistry-getTrustedIssuersForClaimTopic}.
     */
    function getTrustedIssuersForClaimTopic(uint256 claimTopic) external view override returns (IClaimIssuer[] memory) {
        return _claimTopicsToTrustedIssuers[claimTopic];
    }

    /**
     *  @dev See {ITrustedIssuersRegistry-isTrustedIssuer}.
     */
    function isTrustedIssuer(address _issuer) external view override returns (bool) {
        if(_trustedIssuerClaimTopics[_issuer].length > 0) {
            return true;
        }
        return false;
    }

    /**
     *  @dev See {ITrustedIssuersRegistry-getTrustedIssuerClaimTopics}.
     */
    function getTrustedIssuerClaimTopics(IClaimIssuer _trustedIssuer) external view override returns (uint256[] memory) {
        require(_trustedIssuerClaimTopics[address(_trustedIssuer)].length != 0, TrustedIssuerDoesNotExist());
        return _trustedIssuerClaimTopics[address(_trustedIssuer)];
    }

    /**
     *  @dev See {ITrustedIssuersRegistry-hasClaimTopic}.
     */
    function hasClaimTopic(address _issuer, uint256 _claimTopic) external view override returns (bool) {
        uint256 length = _trustedIssuerClaimTopics[_issuer].length;
        uint256[] memory claimTopics = _trustedIssuerClaimTopics[_issuer];
        for (uint256 i = 0; i < length; i++) {
            if (claimTopics[i] == _claimTopic) {
                return true;
            }
        }
        return false;
    }

    /**
     *  @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public pure virtual override returns (bool) {
        return
            interfaceId == type(IERC3643TrustedIssuersRegistry).interfaceId ||
            interfaceId == type(IERC173).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }
}
