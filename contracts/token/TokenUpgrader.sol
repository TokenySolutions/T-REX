pragma solidity ^0.4.23;


/**
 * Token upgrader interface inspired by Lunyr.
 *
 * Token upgrader transfers previous version tokens to a newer version.
 * Token upgrader itself can be the token contract, or just a middle man contract doing the heavy lifting.
 */
contract TokenUpgrader {
    uint public originalSupply;

    /** Interface marker */
    function isTokenUpgrader() external pure returns (bool) {
        return true;
    }

    function upgradeFrom(address _from, uint256 _value) public {}
}
