// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import './ITREXImplementationAuthority.sol';

contract IdentityRegistryProxy {
    address public implementationAuthority;

    constructor(
        address _implementationAuthority,
        address _trustedIssuersRegistry,
        address _claimTopicsRegistry,
        address _identityStorage
    ) {
        implementationAuthority = _implementationAuthority;

        address logic = (ITREXImplementationAuthority(implementationAuthority)).getIRImplementation();

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, ) =
            logic.delegatecall(
                abi.encodeWithSignature(
                    'init(address,address,address)',
                    _trustedIssuersRegistry,
                    _claimTopicsRegistry,
                    _identityStorage
                )
            );
        require(success, 'Initialization failed.');
    }

    fallback() external payable {
        address logic = (ITREXImplementationAuthority(implementationAuthority)).getIRImplementation();

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
