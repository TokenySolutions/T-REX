// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.9;

interface IImplementationAuthority {
    function getImplementation() external view returns (address);
}

contract TokenProxy {
    address public implementationAuthority;

    constructor(
        address _implementationAuthority,
        address _identityRegistry,
        address _compliance,
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        address _onchainID
    ) public {
        implementationAuthority = _implementationAuthority;

        address logic = IImplementationAuthority(implementationAuthority).getImplementation();

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, ) =
            logic.delegatecall(
                abi.encodeWithSignature(
                    '__Token_init(address, address, string memory, string memory, uint8, address)',
                    _identityRegistry,
                    _compliance,
                    _name,
                    _symbol,
                    _decimals,
                    _onchainID
                )
            );
        require(success, 'Initialization failed.');
    }

    fallback() external payable {
        address logic = IImplementationAuthority(implementationAuthority).getImplementation();

        assembly {
            // solium-disable-line
            calldatacopy(0x0, 0x0, calldatasize())
            let success := delegatecall(sub(gas(), 10000), logic, 0x0, calldatasize(), 0, 0)
            let retSz := returndatasize()
            returndatacopy(0, 0, retSz)
            switch success
                case 0 {
                    revert(0, retSz)
                }
                default {
                    return(0, retSz)
                }
        }
    }
}
