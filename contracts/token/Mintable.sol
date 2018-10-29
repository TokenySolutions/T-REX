pragma solidity ^0.4.23;

import "../transferManager/TransferManager.sol";


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
        checkGranularity(_amount)
        returns (bool)
    {
        totalSupply_ = totalSupply_.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        adjustInvestorCount(address(0), _to, _amount);
        emit Mint(_to, _amount);
        emit Transfer(address(0), _to, _amount);
        return true;
    }

    // Allow admin to force transfer token balance to new account in case of lost of wallet or private key 
    // function forceTransfer(address _oldAddress, address _newAddress)  external onlyOwner{
    //     require(_oldAddress != address(0) && _newAddress != address(0), "Cannot accept zero address");
    //     require(balances[_oldAddress] != 0, "Zero balance is not transferrable");
    //     uint256 totalBalanceOfInvestor = balances[_oldAddress];
    //     balances[_oldAddress] = 0;
    //     balances[_newAddress] = totalBalanceOfInvestor;
    //     adjustInvestorCount(_oldAddress, _newAddress, totalBalanceOfInvestor);
    //     emit Transfer(_oldAddress, _newAddress, totalBalanceOfInvestor);
    // }

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
