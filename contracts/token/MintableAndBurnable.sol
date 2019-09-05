pragma solidity >=0.4.21 <0.6.0;

import "./TransferManager.sol";


contract MintableAndBurnable is TransferManager {

    event Mint(address indexed to, uint256 amount);

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
        onlyAgent
        whenNotPaused
        returns (bool) {
        if(identityRegistry.isVerified(_to)){
            // _totalSupply = _totalSupply.add(_amount);
            // _balances[_to] = _balances[_to].add(_amount);
            _mint(_to, _amount);
            updateShareholders(_to);
            emit Mint(_to, _amount);
            emit Transfer(address(0), _to, _amount);
            return true;
        }
        return false;
    }

    function burn(address account, uint256 value)
        external
        onlyAgent
        returns (bool) {
        _burn(account, value);
    }
}
