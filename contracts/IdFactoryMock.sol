// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@onchain-id/solidity/contracts/factory/IdFactory.sol";

contract IdFactoryMock is IdFactory {
    constructor(address implAddy) IdFactory(implAddy) {}
}