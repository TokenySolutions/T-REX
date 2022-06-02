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
 *     T-REX is a suite of smart contracts developed by Tokeny to manage and transfer financial assets on the ethereum blockchain
 *
 *     Copyright (C) 2021, Tokeny sàrl.
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
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '../token/IToken.sol';
import '../registry/IClaimTopicsRegistry.sol';
import '../registry/IIdentityRegistry.sol';
import '../compliance/IModularCompliance.sol';
import '../registry/ITrustedIssuersRegistry.sol';
import '../registry/IIdentityRegistryStorage.sol';
import '../proxy/ITREXImplementationAuthority.sol';
import '../proxy/TokenProxy.sol';
import '../proxy/ClaimTopicsRegistryProxy.sol';
import '../proxy/IdentityRegistryProxy.sol';
import '../proxy/IdentityRegistryStorageProxy.sol';
import '../proxy/TrustedIssuersRegistryProxy.sol';
import '../proxy/ModularComplianceProxy.sol';


contract TREXFactory is Ownable {

    /// event emitted whenever a single contract is deployed by the factory
    event Deployed(address _addr);

    /// event emitted when the implementation authority of the factory contract is set
    event ImplementationAuthoritySet(address _implementationAuthority);

    /// event emitted by the factory when a full suite of T-REX contracts is deployed
    event TREXSuiteDeployed(address _token, address _ir, address _irs, address _tir, address _ctr, string _salt);

    /// the address of the implementation authority contract used in the tokens deployed by the factory
    address public implementationAuthority;

    /// mapping containing info about the token contracts corresponding to salt already used for CREATE2 deployments
    mapping(string => address) public tokenDeployed;

    struct TokenDetails {
        // name of the token
        string name;
        // symbol / ticker of the token
        string symbol;
        // decimals of the token (can be between 0 and 18)
        uint8 decimals;
        // identity registry storage address
        // set it to ZERO address if you want to deploy a new storage
        // if an address is provided, please ensure that the factory is set as owner of the contract
        address irs;
        // ONCHAINID of the token
        address ONCHAINID;
        // list of agents of the identity registry (can be set to an AgentManager contract)
        address[] irAgents;
        // list of agents of the token
        address[] tokenAgents;
    }

    struct ClaimDetails {
        // claim topics required
        uint256[] claimTopics;
        // trusted issuers addresses
        address[] issuers;
        // claims that issuers are allowed to emit, by index, index corresponds to the `issuers` indexes
        uint256[][] issuerClaims;
    }


    /// constructor is setting the implementation authority of the factory
    constructor(address _implementationAuthority) {
        setImplementationAuthority(_implementationAuthority);
    }

    /// setter for the implementation authority contract
    /// can only be called by the owner of the contract
    /// can only be called for a valid contract address with all the implementations set as it should
    function setImplementationAuthority(address _implementationAuthority) public onlyOwner {
        // should not be possible to set an implementation authority that is not complete
        require(
            (ITREXImplementationAuthority(_implementationAuthority)).getTokenImplementation() != address(0)
            && (ITREXImplementationAuthority(_implementationAuthority)).getCTRImplementation() != address(0)
            && (ITREXImplementationAuthority(_implementationAuthority)).getIRImplementation() != address(0)
            && (ITREXImplementationAuthority(_implementationAuthority)).getIRSImplementation() != address(0)
            && (ITREXImplementationAuthority(_implementationAuthority)).getMCImplementation() != address(0)
            && (ITREXImplementationAuthority(_implementationAuthority)).getTIRImplementation() != address(0),
            'invalid Implementation Authority');
        implementationAuthority = _implementationAuthority;
        emit ImplementationAuthoritySet(_implementationAuthority);
    }

    /// deploy function with create2 opcode call
    /// returns the address of the contract created
    function deploy(string memory salt, bytes memory bytecode) internal returns (address) {
        bytes memory implInitCode = bytecode;
        address addr;
        assembly {
            let encoded_data := add(0x20, implInitCode) // load initialization code.
            let encoded_size := mload(implInitCode)     // load init code's length.
            addr := create2(0, encoded_data, encoded_size, salt)
            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }
        emit Deployed(addr);
        return addr;
    }

    /// main factory function, used to deploy a full T-REX suite of contracts
    /// emits an event containing the addresses of all contracts deployed
    function deployTREXSuite(string memory _salt, TokenDetails calldata _tokenDetails, ClaimDetails calldata
        _claimDetails)
    external onlyOwner {
        require(tokenDeployed[_salt] == address(0), 'token already deployed');
        require((_claimDetails.issuers).length == (_claimDetails.issuerClaims).length, 'claim pattern not valid');
        ITrustedIssuersRegistry tir = ITrustedIssuersRegistry(deployTIR(_salt, implementationAuthority));
        IClaimTopicsRegistry ctr = IClaimTopicsRegistry(deployCTR(_salt, implementationAuthority));
        IModularCompliance mc = IModularCompliance(deployMC(_salt, implementationAuthority));
        IIdentityRegistryStorage irs;
        if (_tokenDetails.irs == address(0)) {
            irs = IIdentityRegistryStorage(deployIRS(_salt, implementationAuthority));
        }
        else {
            irs = IIdentityRegistryStorage(_tokenDetails.irs);
        }
        IIdentityRegistry ir = IIdentityRegistry(deployIR(_salt, implementationAuthority, address(tir), address (ctr), address (irs)));
        IToken token = IToken(deployToken
        (
            _salt,
            implementationAuthority,
            address(ir),
            address(mc),
            _tokenDetails.name,
            _tokenDetails.symbol,
            _tokenDetails.decimals,
            _tokenDetails.ONCHAINID
        ));
        for (uint256 i = 0; i < (_claimDetails.claimTopics).length; i++) {
            ctr.addClaimTopic(_claimDetails.claimTopics[i]);
        }
        for (uint256 i = 0; i < (_claimDetails.issuers).length; i++) {
            tir.addTrustedIssuer(IClaimIssuer((_claimDetails).issuers[i]), _claimDetails.issuerClaims[i]);
        }
        irs.bindIdentityRegistry(address(ir));
        ir.addAgentOnIdentityRegistryContract(address(token));
        for (uint256 i = 0; i < (_tokenDetails.irAgents).length; i++) {
            ir.addAgentOnIdentityRegistryContract(_tokenDetails.irAgents[i]);
        }
        for (uint256 i = 0; i < (_tokenDetails.tokenAgents).length; i++) {
            token.addAgentOnTokenContract(_tokenDetails.tokenAgents[i]);
        }
        tokenDeployed[_salt] = address(token);
        (Ownable(address(token))).transferOwnership(msg.sender);
        (Ownable(address(ir))).transferOwnership(msg.sender);
        (Ownable(address(tir))).transferOwnership(msg.sender);
        (Ownable(address(ctr))).transferOwnership(msg.sender);
        emit TREXSuiteDeployed(address(token), address(ir), address(irs), address(tir), address(ctr), _salt);
    }

    /// function used to deploy a trusted issuers registry using CREATE2
    function deployTIR
    (
        string memory _salt,
        address _implementationAuthority
    ) internal returns (address){
        bytes memory _code = type(TrustedIssuersRegistryProxy).creationCode;
        bytes memory _constructData = abi.encode(_implementationAuthority);
        bytes memory bytecode = abi.encodePacked(_code, _constructData);
        return deploy(_salt, bytecode);
    }

    /// function used to deploy a claim topics registry using CREATE2
    function  deployCTR
    (
        string memory _salt,
        address _implementationAuthority
    ) internal returns (address) {
        bytes memory _code = type(ClaimTopicsRegistryProxy).creationCode;
        bytes memory _constructData = abi.encode(_implementationAuthority);
        bytes memory bytecode = abi.encodePacked(_code, _constructData);
        return deploy(_salt, bytecode);
    }

    /// function used to deploy modular compliance contract using CREATE2
    function  deployMC
    (
        string memory _salt,
        address _implementationAuthority
    ) internal returns (address) {
        bytes memory _code = type(ModularComplianceProxy).creationCode;
        bytes memory _constructData = abi.encode(_implementationAuthority);
        bytes memory bytecode = abi.encodePacked(_code, _constructData);
        return deploy(_salt, bytecode);
    }

    /// function used to deploy an identity registry storage using CREATE2
    function deployIRS
    (
        string memory _salt,
        address _implementationAuthority
    ) internal returns (address) {
        bytes memory _code = type(IdentityRegistryStorageProxy).creationCode;
        bytes memory _constructData = abi.encode(_implementationAuthority);
        bytes memory bytecode = abi.encodePacked(_code, _constructData);
        return deploy(_salt, bytecode);
    }

    /// function used to deploy an identity registry using CREATE2
    function deployIR
    (
        string memory _salt,
        address _implementationAuthority,
        address _trustedIssuersRegistry,
        address _claimTopicsRegistry,
        address _identityStorage
    ) internal returns (address) {
        bytes memory _code = type(IdentityRegistryProxy).creationCode;
        bytes memory _constructData = abi.encode
        (
            _implementationAuthority,
            _trustedIssuersRegistry,
            _claimTopicsRegistry,
            _identityStorage
        );
        bytes memory bytecode = abi.encodePacked(_code, _constructData);
        return deploy(_salt, bytecode);
    }

    /// function used to deploy a token using CREATE2
    function deployToken
    (
        string memory _salt,
        address _implementationAuthority,
        address _identityRegistry,
        address _compliance,
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        address _ONCHAINID
    ) internal returns (address) {
        bytes memory _code = type(TokenProxy).creationCode;
        bytes memory _constructData = abi.encode
        (
            _implementationAuthority,
            _identityRegistry,
            _compliance,
            _name,
            _symbol,
            _decimals,
            _ONCHAINID
        );
        bytes memory bytecode = abi.encodePacked(_code, _constructData);
        return deploy(_salt, bytecode);
    }

    /// function to use to recover ownership of contracts when ownership was given to the factory
    /// typically used for IdentityRegistryStorage
    function recoverContractOwnership(address _contract, address _newOwner) external onlyOwner {
        (Ownable(_contract)).transferOwnership(_newOwner);
    }
}
