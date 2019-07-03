pragma solidity >=0.4.21 <0.6.0;

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

    /**
     * @notice Improved version of default mint method. Tokens can be minted
     * to an address if only it is a verified address as per the security token.
     * This check will be useful for a complaint crowdsale.
     * Only owner can call.
     *
     * @param _to Address to mint the tokens to.
     * @param _amount Amount of tokens to mint.
     *
     * @return 'True' if minting succesful, 'False' if fails.
     */
    function mint(address _to, uint256 _amount)
        external
        onlyOwner
        canMint
        returns (bool) {
        if(identityRegistry.isVerified(_to)){
            _totalSupply = _totalSupply.add(_amount);
            _balances[_to] = _balances[_to].add(_amount);
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
