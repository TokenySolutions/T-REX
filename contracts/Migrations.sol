// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

// imports here are just for testing purpose

import '@onchain-id/solidity/contracts/ClaimIssuer.sol';
import '@onchain-id/solidity/contracts/Identity.sol';

contract Migrations {
    address public owner;
    uint256 public lastCompletedMigration;

    constructor() {
        owner = msg.sender;
    }

    modifier restricted() {
        if (msg.sender == owner) _;
    }

    function setCompleted(uint256 completed) external restricted {
        lastCompletedMigration = completed;
    }

    function upgrade(address new_address) external restricted {
        Migrations upgraded = Migrations(new_address);
        upgraded.setCompleted(lastCompletedMigration);
    }
}
