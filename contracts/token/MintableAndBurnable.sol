pragma solidity ^0.5.10;

import "./TransferManager.sol";


contract MintableAndBurnable is TransferManager {
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
        onlyAgent {
        require(identityRegistry.isVerified(_to), "Identity is not verified.");

        _mint(_to, _amount);
        updateShareholders(_to);
    }

    function burn(address account, uint256 value)
        external
        onlyAgent {
        _burn(account, value);
    }
}
