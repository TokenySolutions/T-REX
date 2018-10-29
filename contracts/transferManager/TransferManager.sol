pragma solidity ^0.4.23;

import "../registry/IdentityRegistry.sol";
import "../../zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

/// @notice A service that points to a `RegulatorService`
contract TransferManager is Ownable, PausableToken {

    uint8 public constant decimals = 18;
    uint256 public granularity;
    bool public nonDivisibleToken = true;
    
    // Total number of non-zero token holders
    uint256 public investorCount;

    // List of token holders
    address[] public investors;

    /**
    * @notice Triggered when service address is replaced
    */

    IdentityRegistry identityRegistry;

    constructor (
        address _identityRegistry
    ) public {
        identityRegistry = IdentityRegistry(_identityRegistry);
    }


    // Emit when the granularity get changed
    event LogDivisibilityChanged(uint256 granularity, address owner, bool status);

    // Emit when the granularity get changed
    event LogGranularityChanged(uint256 _oldGranularity, uint256 _newGranularity);

    /**
    * @notice Triggered when regulator checks pass or fail
    */
    event CheckStatus(uint8 reason, address indexed spender, address indexed from, address indexed to, uint256 value);

    /**
    * @dev Validate checkGranularity
    * Credit: 
    *
    * @param _amount The amount of a tokens
    */
    modifier checkGranularity(uint256 _amount) {
        if(nonDivisibleToken) {
            require(_amount % granularity == 0, "Unable to modify token balances at this granularity");
        }
        _;
    }

    /**
    * @notice allows owner to change token granularity
    * @param _granularity granularity level of the token
    */
    function changeGranularity(uint256 _granularity) external onlyOwner {
        require(_granularity != 0, "Granularity can not be 0");
        emit LogGranularityChanged(granularity, _granularity);
        granularity = _granularity;
    }


    /**
    * @notice ERC-20 overridden function that include logic to check for trade validity.
    *
    * @param _to The address of the receiver
    * @param _value The number of tokens to transfer
    *
    * @return `true` if successful and `false` if unsuccessful
    */
    function transfer(address _to, uint256 _value) checkGranularity(_value) public returns (bool) {
        // for(uint i = 0; i<claimTypes.length; i++) {
        //     if (claimIsValid(userIdentity.identity(msg.sender), claimTypes[i]) && claimIsValid(userIdentity.identity(_to), claimTypes[i])) {
        //         adjustInvestorCount(msg.sender, _to, _value);
        //         return super.transfer(_to, _value);
        //     } 
        // }
        // revert("Transfer not possible");

        if(identityRegistry.isVerified(msg.sender) && identityRegistry.isVerified(_to)){
            return super.transfer(_to, _value);
        }
        
        revert("Transfer not possible");
    }

    /**
    * @notice ERC-20 overridden function that include logic to check for trade validity.
    *
    * @param _from The address of the sender
    * @param _to The address of the receiver
    * @param _value The number of tokens to transfer
    *
    * @return `true` if successful and `false` if unsuccessful
    */
    function transferFrom(address _from, address _to, uint256 _value) public checkGranularity(_value) returns (bool) {
        if(identityRegistry.isVerified(_from) && identityRegistry.isVerified(_to)){
            return super.transfer(_to, _value);
        }
        
        revert("Transfer not possible");

    }

     /**
    * @notice keeps track of the number of non-zero token holders
    * @param _from sender of transfer
    * @param _to receiver of transfer
    * @param _value value of transfer
    */
    function adjustInvestorCount(address _from, address _to, uint256 _value) internal {
        if ((_value == 0) || (_from == _to)) {
            return;
        }
        // Check whether receiver is a new token holder
        if ((balanceOf(_to) == 0) && (_to != address(0))) {
            investorCount = investorCount.add(1);
            investors.push(_to);
        }
        // Check whether sender is moving all of their tokens
        if (_value == balanceOf(_from)) {
            investorCount = investorCount.sub(1);
            for (uint i = 0; i<investors.length; i++) {
                if(investors[i] == _from) {
                    delete investors[i];
                    for(uint j = i; j<investors.length-1; j++) {
                        investors[j] = investors[j+1];
                    }
                    delete investors[investors.length-1];
                    investors.length--;
                }
            }
        }
    }

    /**
     * @notice gets length of investors array
     * NB - this length may differ from investorCount if list has not been pruned of zero balance investors
     * @return length
     */

    function getInvestorsLength() public view returns(uint256) {
        return investors.length;
    }

    // To allow fractional token transfer
    function allowDisvisableToken() onlyOwner external {
        nonDivisibleToken = false;
        emit LogDivisibilityChanged(granularity, msg.sender, false);
    }

    // To restrict fractional token transfer
    function restrictDisvisableToken() onlyOwner external {
        nonDivisibleToken = true;
        emit LogDivisibilityChanged(granularity, msg.sender, true);
    }

}

