// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import './ITREXImplementationAuthority.sol';

contract TokenProxy {
    address public implementationAuthority;
    event TokenImplementationAuthorityUpdated(address oldImplementation, address newImplementation);

    constructor(
        address _implementationAuthority,
        address _identityRegistry,
        address _compliance,
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        address _onchainID
    ) {
        implementationAuthority = _implementationAuthority;

        address logic = (ITREXImplementationAuthority(implementationAuthority)).getTokenImplementation();

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, ) =
            logic.delegatecall(
                abi.encodeWithSignature(
                    'init(address,address,string,string,uint8,address)',
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

    function setImplementationAuthority(address newImplementationAuthority) external onlyTokenOwner {
        emit TokenImplementationAuthorityUpdated(implementationAuthority, newImplementationAuthority);
        implementationAuthority = newImplementationAuthority;
    }

    function delegatecallGetOwner() public returns (address) {
        address logic = (ITREXImplementationAuthority(implementationAuthority)).getTokenImplementation();

        bytes memory data = abi.encodeWithSelector(bytes4(keccak256('owner()')));
        (bool success, bytes memory returnedData) = logic.delegatecall(data);
        require(success);
        return abi.decode(returnedData, (address));
    }

    modifier onlyTokenOwner() {
        require(delegatecallGetOwner() == address(msg.sender), 'You\'re not the owner of the implementation');
        _;
    }

    fallback() external payable {
        address logic = (ITREXImplementationAuthority(implementationAuthority)).getTokenImplementation();

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
