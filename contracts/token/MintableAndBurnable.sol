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
    function mint(address _to, uint256 _amount) public onlyAgent {
        require(identityRegistry.isVerified(_to), "Identity is not verified.");

        _mint(_to, _amount);
        updateShareholders(_to);
    }

    function batchMint(address[] calldata _to, uint256[] calldata _amount) external {
        for (uint256 i = 0; i < _to.length; i++) {
            mint(_to[i], _amount[i]);
        }
    }

    function burn(address account, uint256 value) public onlyAgent {
        _burn(account, value);
    }

    function batchBurn(address[] calldata account, uint256[] calldata value) external {
        for (uint256 i = 0; i < account.length; i++) {
            burn(account[i], value[i]);
        }
    }
}
