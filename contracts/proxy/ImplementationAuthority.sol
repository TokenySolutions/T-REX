// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;
import '../access/Ownable.sol';

contract ImplementationAuthority is Ownable {
    event UpdatedTokenImplementation(address tokenImplem);
    event UpdatedCTRImplementation(address ctrImplem);
    event UpdatedIRImplementation(address irImplem);
    event UpdatedIRSImplementation(address irsImplem);
    event UpdatedTIRImplementation(address tirImplem);
    address internal tokenImplementation;
    address internal ctrImplementation;
    address internal irImplementation;
    address internal irsImplementation;
    address internal tirImplementation;

    function getTokenImplementation() public isNotNull(tokenImplementation) view returns (address) {
        return tokenImplementation;
    }

    function setTokenImplementation(address _tokenImplementation) public onlyOwner {
        tokenImplementation = _tokenImplementation;
        emit UpdatedTokenImplementation(_tokenImplementation);
    }

    function getCTRImplementation() public isNotNull(ctrImplementation) view returns (address) {
        return ctrImplementation;
    }

    function setCTRImplementation(address _ctrImplementation) public onlyOwner {
        ctrImplementation = _ctrImplementation;
        emit UpdatedCTRImplementation(_ctrImplementation);
    }

    function getIRImplementation() public isNotNull(irImplementation) view returns (address) {
        return irImplementation;
    }

    function setIRImplementation(address _irImplementation) public onlyOwner {
        irImplementation = _irImplementation;
        emit UpdatedIRImplementation(_irImplementation);
    }

    function getIRSImplementation() public isNotNull(irsImplementation) view returns (address) {
        return irsImplementation;
    }

    function setIRSImplementation(address _irsImplementation) public onlyOwner {
        irsImplementation = _irsImplementation;
        emit UpdatedIRSImplementation(_irsImplementation);
    }

    function getTIRImplementation() public isNotNull(tirImplementation) view returns (address) {
        return tirImplementation;
    }

    function setTIRImplementation(address _tirImplementation) public onlyOwner {
        tirImplementation = _tirImplementation;
        emit UpdatedTIRImplementation(_tirImplementation);
    }

    modifier isNotNull(address implementation) {
        require(implementation != address(0x0), 'Implementation isn\'t yet defined, please set this implementation before');
        _;
    }
}
