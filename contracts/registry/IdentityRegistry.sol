pragma solidity ^0.4.23;

import "../identity/ClaimHolder.sol";
import "../../zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../transferManager/ClaimVerifier.sol";
import "../registry/ClaimTypesRegistry.sol";


contract IdentityRegistry is Ownable, ClaimVerifier {
    mapping (address => ClaimHolder) public identity;

    ClaimTypesRegistry typesRegistry;

    uint256[] claimTypes;

    event identityRegistered(ClaimHolder indexed identity);
    event identityRemoved(ClaimHolder indexed identity);
    event identityUpdated(ClaimHolder indexed old_identity, ClaimHolder indexed new_identity);

    constructor (
        address _claimIssuersRegistry,
        address _claimTypesRegistry
    ) public {
        typesRegistry = ClaimTypesRegistry(_claimTypesRegistry);
        issuersRegistry = TrustedIssuersRegistry(_claimIssuersRegistry);
    }

    //TODO: OnlyOwner can be changed to admin access
    function registerIdentity(address _user, ClaimHolder _identity) public onlyOwner {
        require(_user == _identity.getOwner());
        require(identity[_user] == address(0), "identity contract already exists, please use update");
        require(_identity != address(0), "contract address can't be a zero address");
        identity[_user] = _identity; 
        emit identityRegistered(_identity);
    }

    function updateIdentity(address _user, ClaimHolder _identity) public onlyOwner {
        require(identity[_user] != address(0));
        require(_user == _identity.getOwner());
        require(_identity != address(0), "contract address can't be a zero address");
        emit identityUpdated(identity[_user], _identity);
        identity[_user] = _identity;
    }

    function deleteIdentity(address _user) public onlyOwner {
        require(identity[_user] != address(0), "you haven't registered an identity yet");
        delete identity[_user];
        emit identityRemoved(identity[msg.sender]);
    }

    function isVerified(address _userAddress) public view returns (bool) {
        if (identity[_userAddress]==address(0)){
            return false;
        }

        claimTypes = typesRegistry.getClaimTypes();

        for(uint i = 0; i<claimTypes.length; i++) {
            if(claimIsValid(identity[_userAddress], claimTypes[i])) {
                return true;
            }
        }
        return false;
    }
}