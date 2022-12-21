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
 *     Copyright (C) 2022, Tokeny sàrl.
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

pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ITREXImplementationAuthority.sol";
import "../../token/IToken.sol";
import "../interface/IProxy.sol";
import "../../factory/ITREXFactory.sol";
import "./IIAFactory.sol";

contract TREXImplementationAuthority is ITREXImplementationAuthority, Ownable {

    /// current version
    Version private _currentVersion;

    /// mapping to get contracts of each version
    mapping(bytes32 => TREXContracts) private _contracts;

    /// array containing all versions
    Version[] private _versions;

    /// reference ImplementationAuthority used by the TREXFactory
    bool private _reference;

    /// address of TREXFactory contract
    address private _trexFactory;

    /// address of factory for TREXImplementationAuthority contracts
    address private _iaFactory;

    /**
     *  @dev Constructor of the ImplementationAuthority contract
     *  @param referenceStatus boolean value determining if the contract
     *  is the main IA or an auxiliary contract
     *  @param trexFactory the address of TREXFactory referencing the main IA
     *  if `referenceStatus` is true then `trexFactory` at deployment is set
     *  on zero address. In that scenario, call `setTREXFactory` post-deployment
     *  @param iaFactory the address for the factory of IA contracts
     *  emits `ImplementationAuthoritySet` event
     */
    constructor (bool referenceStatus, address trexFactory, address iaFactory) {
        _reference = referenceStatus;
        _trexFactory = trexFactory;
        _iaFactory = iaFactory;
        emit ImplementationAuthoritySet(referenceStatus, trexFactory);
    }

    /**
     *  @dev See {ITREXImplementationAuthority-setTREXFactory}.
     */
    function setTREXFactory(address trexFactory) external override onlyOwner {
        require(
            isReferenceContract() &&
            ITREXFactory(trexFactory).getImplementationAuthority() == address(this)
        , "only reference contract can call");
        _trexFactory = trexFactory;
        emit TREXFactorySet(trexFactory);
    }

    /**
     *  @dev See {ITREXImplementationAuthority-setIAFactory}.
     */
    function setIAFactory(address iaFactory) external override onlyOwner {
        require(
            isReferenceContract() &&
            ITREXFactory(_trexFactory).getImplementationAuthority() == address(this)
        , "only reference contract can call");
        _iaFactory = iaFactory;
        emit IAFactorySet(iaFactory);
    }

    /**
     *  @dev See {ITREXImplementationAuthority-useTREXVersion}.
     */
    function useTREXVersion(Version calldata _version, TREXContracts calldata _trex) external override {
        addTREXVersion(_version, _trex);
        useTREXVersion(_version);
    }

    /**
     *  @dev See {ITREXImplementationAuthority-fetchVersionList}.
     */
    function fetchVersionList() external override {
        require(!isReferenceContract(), "cannot call on reference contract");
        uint256 versionLength = ITREXImplementationAuthority(getReferenceContract()).getVersions().length;
        require(_versions.length < versionLength, "already up-to-date");
        for (uint256 i = _versions.length - 1; i < versionLength; i++) {
            pullVersion((ITREXImplementationAuthority(getReferenceContract()).getVersions())[i]);
        }
    }

    /**
     *  @dev See {ITREXImplementationAuthority-getCurrentVersion}.
     */
    function getCurrentVersion() external view override returns (Version memory) {
        return _currentVersion;
    }

    /**
     *  @dev See {ITREXImplementationAuthority-getVersions}.
     */
    function getVersions() external view override returns (Version[] memory) {
        return _versions;
    }

    /**
     *  @dev See {ITREXImplementationAuthority-getContracts}.
     */
    function getContracts(Version calldata _version) external view override returns (TREXContracts memory) {
        return _contracts[versionToBytes(_version)];
    }

    /**
     *  @dev See {ITREXImplementationAuthority-getTREXFactory}.
     */
    function getTREXFactory() external view override returns (address) {
        return _trexFactory;
    }

    /**
     *  @dev See {ITREXImplementationAuthority-getTokenImplementation}.
     */
    function getTokenImplementation() external view override returns (address) {
        return _contracts[versionToBytes(_currentVersion)].tokenImplementation;
    }

    /**
     *  @dev See {ITREXImplementationAuthority-getCTRImplementation}.
     */
    function getCTRImplementation() external view override returns (address) {
        return _contracts[versionToBytes(_currentVersion)].ctrImplementation;
    }

    /**
     *  @dev See {ITREXImplementationAuthority-getIRImplementation}.
     */
    function getIRImplementation() external view override returns (address) {
        return _contracts[versionToBytes(_currentVersion)].irImplementation;
    }

    /**
     *  @dev See {ITREXImplementationAuthority-getIRSImplementation}.
     */
    function getIRSImplementation() external view override returns (address) {
        return _contracts[versionToBytes(_currentVersion)].irsImplementation;
    }

    /**
     *  @dev See {ITREXImplementationAuthority-getTIRImplementation}.
     */
    function getTIRImplementation() external view override returns (address) {
        return _contracts[versionToBytes(_currentVersion)].tirImplementation;
    }

    /**
     *  @dev See {ITREXImplementationAuthority-getMCImplementation}.
     */
    function getMCImplementation() external view override returns (address) {
        return _contracts[versionToBytes(_currentVersion)].mcImplementation;
    }

    /**
     *  @dev See {ITREXImplementationAuthority-changeImplementationAuthority}.
     */
    function changeImplementationAuthority(address _token, address _newImplementationAuthority) external override {
        require(_token != address(0), "invalid argument - zero address");
        if(_newImplementationAuthority == address(0) && !isReferenceContract()){
            revert("only reference contract can deploy new IAs");}

        address _ir = address(IToken(_token).identityRegistry());
        address _mc = address(IToken(_token).compliance());
        address _irs = address(IIdentityRegistry(_ir).identityStorage());
        address _ctr = address(IIdentityRegistry(_ir).topicsRegistry());
        address _tir = address(IIdentityRegistry(_ir).issuersRegistry());

        // calling this function requires ownership of ALL contracts of the T-REX suite
        if(
            Ownable(_token).owner() != msg.sender
            || Ownable(_ir).owner() != msg.sender
            || Ownable(_mc).owner() != msg.sender
            || Ownable(_irs).owner() != msg.sender
            || Ownable(_ctr).owner() != msg.sender
            || Ownable(_tir).owner() != msg.sender) {
            revert("caller NOT owner of all contracts impacted");
        }

        if(_newImplementationAuthority == address(0)) {
            _newImplementationAuthority = IIAFactory(_iaFactory).deployIA(_token);
        }
        else {
            if(
                versionToBytes(ITREXImplementationAuthority(_newImplementationAuthority).getCurrentVersion()) !=
                versionToBytes(_currentVersion)) {
                revert("version of new IA has to be the same as current IA");
            }
            if(
                ITREXImplementationAuthority(_newImplementationAuthority).isReferenceContract() &&
                _newImplementationAuthority != getReferenceContract()) {
                revert("new IA is NOT reference contract");
            }
            if(
                ITREXImplementationAuthority(_newImplementationAuthority).getTREXFactory() != _trexFactory) {
                revert("new IA not referencing the right TREXFactory");
            }
        }

        // ensure compatibility with legacy Proxies (token only and non-changeable TREXImplementationAuthority)
        if (IProxy(_token).getImplementationAuthority() == address(this)) {
            IProxy(_token).setImplementationAuthority(_newImplementationAuthority);
        }
        else {
            if(
                keccak256(abi.encode(IToken(_token).version()))
                !=
                keccak256(abi.encode(IToken((ITREXImplementationAuthority(_newImplementationAuthority))
                .getTokenImplementation()).version()))) {
                revert("Token version has to match target IA version");
            }
        }

        IProxy(_ir).setImplementationAuthority(_newImplementationAuthority);
        IProxy(_mc).setImplementationAuthority(_newImplementationAuthority);
        IProxy(_ctr).setImplementationAuthority(_newImplementationAuthority);
        IProxy(_tir).setImplementationAuthority(_newImplementationAuthority);
        // IRS can be shared by multiple tokens, and therefore could have been updated already
        if (IProxy(_irs).getImplementationAuthority() == address(this)) {
            IProxy(_irs).setImplementationAuthority(_newImplementationAuthority);
        }
        emit ImplementationAuthorityChanged(_token, _newImplementationAuthority);
    }

    /**
     *  @dev See {ITREXImplementationAuthority-addTREXVersion}.
     */
    function addTREXVersion(Version calldata _version, TREXContracts calldata _trex) public override onlyOwner {
        require(isReferenceContract(), "ONLY reference contract can add versions");
        if (_versions.length > 1) {
            Version memory lastVersion = _versions[_versions.length -1];
            require(
                _version.major > lastVersion.major ||
                (_version.major == lastVersion.major && _version.minor > lastVersion.minor) ||
                (_version.major == lastVersion.major && _version.minor == lastVersion.minor && _version.patch >
                lastVersion.patch)
            , "version deprecated");
        }
        require(
            _trex.ctrImplementation != address(0)
            && _trex.irImplementation != address(0)
            && _trex.irsImplementation != address(0)
            && _trex.mcImplementation != address(0)
            && _trex.tirImplementation != address(0)
            && _trex.tokenImplementation != address(0)
        , "invalid argument - zero address");
        _contracts[versionToBytes(_version)] = _trex;
        _versions.push(_version);
        emit TREXVersionAdded(_version, _trex);
    }

    /**
     *  @dev See {ITREXImplementationAuthority-useTREXVersion}.
     */
    function useTREXVersion(Version calldata _version) public override onlyOwner {
        require(versionToBytes(_version) != versionToBytes(_currentVersion), "version already in use");
        require(_contracts[versionToBytes(_version)].tokenImplementation != address(0)
        , "invalid argument - non existing version");
        _currentVersion = _version;
        emit VersionUpdated(_version);
    }

    /**
     *  @dev See {ITREXImplementationAuthority-isReferenceContract}.
     */
    function isReferenceContract() public view override returns (bool) {
        return _reference;
    }

    /**
     *  @dev See {ITREXImplementationAuthority-getReferenceContract}.
     */
    function getReferenceContract() public view override returns (address) {
        return ITREXFactory(_trexFactory).getImplementationAuthority();
    }

    /**
     *  @dev function used to pull a version from the reference contract
     *  @param _version the version to fetch contracts for
     *  updates local storage of versions by adding _version and corresponding TREX contracts
     *  emits a `TREXVersionAdded` event
     */
    function pullVersion(Version memory _version) private {
        TREXContracts memory _trex = ITREXImplementationAuthority(getReferenceContract()).getContracts(_version);
        _contracts[versionToBytes(_version)] = _trex;
        _versions.push(_version);
        emit TREXVersionAdded(_version, _trex);
    }

    /**
     *  @dev casting function Version => bytes to allow compare values easier
     */
    function versionToBytes(Version memory _version) private pure returns(bytes32) {
        return bytes32(keccak256(abi.encodePacked(_version.major, _version.minor, _version.patch)));
    }
}