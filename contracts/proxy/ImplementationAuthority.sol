// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.9;

import '@openzeppelin/contracts/access/Ownable.sol';

contract ImplementationAuthority is Ownable {
    event UpdatedImplementation(address newAddress);

    address implementation;

    constructor(address _implementation) public {
        implementation = _implementation;
        emit UpdatedImplementation(_implementation);
    }

    function getImplementation() external view returns (address) {
        return implementation;
    }

    function updateImplementation(address _newImplementation) public onlyOwner {
        implementation = _newImplementation;
        emit UpdatedImplementation(_newImplementation);
    }
}
