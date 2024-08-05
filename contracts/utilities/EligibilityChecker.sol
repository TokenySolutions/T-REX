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

pragma solidity 0.8.26;

import { IClaimIssuer, IIdentity } from "@onchain-id/solidity/contracts/interface/IClaimIssuer.sol";
import { IIdentityRegistry, IClaimTopicsRegistry, ITrustedIssuersRegistry } from "../registry/interface/IIdentityRegistry.sol";


contract EligibilityChecker {
      
    struct EligibilityCheckDetails {
        IClaimIssuer issuer;
        uint256 topic;
        bool pass;
    }

    function verifiedCheckDetails(address _identityRegistry, address _userAddress) 
        external view returns (EligibilityCheckDetails [] memory _details) {
        
        IClaimTopicsRegistry tokenTopicsRegistry = IIdentityRegistry(_identityRegistry).topicsRegistry();
        ITrustedIssuersRegistry tokenIssuersRegistry = IIdentityRegistry(_identityRegistry).issuersRegistry();
        IIdentity identity = IIdentityRegistry(_identityRegistry).identity(_userAddress);

        uint256 foundClaimTopic;
        uint256 scheme;
        address issuer;
        bytes memory sig;
        bytes memory data;
        uint256 topic;
        uint256[] memory requiredClaimTopics = tokenTopicsRegistry.getClaimTopics();
        uint256 topicsCount = requiredClaimTopics.length;
        _details = new EligibilityCheckDetails[](topicsCount); 
        for (uint256 claimTopic; claimTopic < topicsCount; claimTopic++) {
            topic = requiredClaimTopics[claimTopic];
            IClaimIssuer[] memory trustedIssuers =
                tokenIssuersRegistry.getTrustedIssuersForClaimTopic(topic);
            
            for (uint256 i; i < trustedIssuers.length; i++) {
                bytes32 claimId = keccak256(abi.encode(trustedIssuers[i], topic));
                (foundClaimTopic, scheme, issuer, sig, data, ) = identity.getClaim(claimId);
                if (foundClaimTopic == topic) {
                    bool pass;
                    try IClaimIssuer(issuer).isClaimValid(identity, topic, sig, data) returns(bool validity) {
                        pass = validity;
                    }
                    catch {
                        pass = false;
                    }

                    _details[claimTopic] = EligibilityCheckDetails({
                        pass: pass,
                        issuer: trustedIssuers[i],
                        topic: topic
                    });
                }
            }
        }
    }
}