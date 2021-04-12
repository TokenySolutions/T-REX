// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import './ITREXImplementationAuthority.sol';

contract TREXImplementationAuthority is ITREXImplementationAuthority, Ownable {
    event UpdatedTokenImplementation(address tokenImplem);
    event UpdatedCTRImplementation(address ctrImplem);
    event UpdatedIRImplementation(address irImplem);
    event UpdatedIRSImplementation(address irsImplem);
    event UpdatedTIRImplementation(address tirImplem);
    address private tokenImplementation;
    address private ctrImplementation;
    address private irImplementation;
    address private irsImplementation;
    address private tirImplementation;

    function getTokenImplementation() public isNotNull(tokenImplementation) view override returns (address) {
        return tokenImplementation;
    }

    function setTokenImplementation(address _tokenImplementation) public override onlyOwner {
        tokenImplementation = _tokenImplementation;
        emit UpdatedTokenImplementation(_tokenImplementation);
    }

    function getCTRImplementation() public isNotNull(ctrImplementation) view override returns (address) {
        return ctrImplementation;
    }

    function setCTRImplementation(address _ctrImplementation) public override onlyOwner {
        ctrImplementation = _ctrImplementation;
        emit UpdatedCTRImplementation(_ctrImplementation);
    }

    function getIRImplementation() public isNotNull(irImplementation) view override returns (address) {
        return irImplementation;
    }

    function setIRImplementation(address _irImplementation) public override onlyOwner {
        irImplementation = _irImplementation;
        emit UpdatedIRImplementation(_irImplementation);
    }

    function getIRSImplementation() public isNotNull(irsImplementation) view override returns (address) {
        return irsImplementation;
    }

    function setIRSImplementation(address _irsImplementation) public override onlyOwner {
        irsImplementation = _irsImplementation;
        emit UpdatedIRSImplementation(_irsImplementation);
    }

    function getTIRImplementation() public isNotNull(tirImplementation) view override returns (address) {
        return tirImplementation;
    }

    function setTIRImplementation(address _tirImplementation) public override onlyOwner {
        tirImplementation = _tirImplementation;
        emit UpdatedTIRImplementation(_tirImplementation);
    }

    modifier isNotNull(address implementation) {
        require(implementation != address(0x0), 'Implementation isn\'t yet defined, please set this implementation before');
        _;
    }
}
