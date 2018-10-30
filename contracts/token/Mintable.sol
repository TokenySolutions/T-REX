pragma solidity ^0.4.23;

import "./TransferManager.sol";


contract Mintable is TransferManager {

    bool public mintingFinished = false;
    
    event Mint(address indexed to, uint256 amount);
    event MintFinished();
    event MintStarted();

    modifier canMint() {
        require(!mintingFinished);
        _;
    }

    modifier cannotMint() {
        require(mintingFinished);
        _;
    }

    function mint(address _to, uint256 _amount)
        external
        onlyOwner
        canMint
        returns (bool) {   
        if(identityRegistry.isVerified(_to)){
            totalSupply_ = totalSupply_.add(_amount);
            balances[_to] = balances[_to].add(_amount);
            updateShareholders(_to);
            emit Mint(_to, _amount);
            emit Transfer(address(0), _to, _amount);
            return true;
        }
        return false;
    }

    function finishMinting() external onlyOwner canMint returns (bool) {
        mintingFinished = true;
        emit MintFinished();
        return true;
    }

    function startMinting() external onlyOwner cannotMint returns (bool) {
        mintingFinished = false;
        emit MintStarted();
        return true;
    }
}
