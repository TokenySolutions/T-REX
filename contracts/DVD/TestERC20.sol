pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract TestERC20 is Ownable, ERC20Pausable {

    constructor(string memory name, string memory symbol, uint256 amount) ERC20(name, symbol) {
        _mint(msg.sender, amount);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

}