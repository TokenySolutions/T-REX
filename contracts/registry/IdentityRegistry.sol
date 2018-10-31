pragma solidity ^0.4.23;

import "../identity/ClaimHolder.sol";
import "../registry/ClaimTypesRegistry.sol";
import "./ClaimVerifier.sol";
import "../../zeppelin-solidity/contracts/ownership/Ownable.sol";

contract IdentityRegistry is Ownable, ClaimVerifier {
    //mapping between a user address and the corresponding identity contract
    mapping (address => ClaimHolder) public identity;

    //Array storing trusted claim types of the security token.
    uint256[] claimTypes;

    ClaimTypesRegistry typesRegistry;

    event identityRegistered(ClaimHolder indexed identity);
    event identityRemoved(ClaimHolder indexed identity);
    event identityUpdated(ClaimHolder indexed old_identity, ClaimHolder indexed new_identity);
    event claimTypesRegistrySet(address indexed _claimTypesRegistry);
    event trustedIssuersRegistrySet(address indexed _trustedIssuersRegistry);

    constructor (
        address _trustedIssuersRegistry,
        address _claimTypesRegistry
    ) public {
        typesRegistry = ClaimTypesRegistry(_claimTypesRegistry);
        issuersRegistry = TrustedIssuersRegistry(_trustedIssuersRegistry);
    }

    /**
    * @notice Register an identity contract corresponding to a user address. 
    * Requires that the user address should be the owner of the identity contract.
    * Requires that the user doesn't have an identity contract already deployed.
    * Only owner can call.
    *
    * @param _user The address of the user
    * @param _identity The address of the user's identity contract
    */
    function registerIdentity(address _user, ClaimHolder _identity) public onlyOwner {
        require(_user == _identity.getOwner());
        require(identity[_user] == address(0), "identity contract already exists, please use update");
        require(_identity != address(0), "contract address can't be a zero address");
        identity[_user] = _identity; 
        emit identityRegistered(_identity);
    }
    
    /**
    * @notice Updates an identity contract corresponding to a user address. 
    * Requires that the user address should be the owner of the identity contract.
    * Requires that the user should have an identity contract already deployed that will be replaced.
    * Only owner can call.
    *
    * @param _user The address of the user
    * @param _identity The address of the user's new identity contract
    */
    function updateIdentity(address _user, ClaimHolder _identity) public onlyOwner {
        require(identity[_user] != address(0));
        require(_user == _identity.getOwner());
        require(_identity != address(0), "contract address can't be a zero address");
        emit identityUpdated(identity[_user], _identity);
        identity[_user] = _identity;
    }

    /**
    * @notice Removes an user from the identity registry. 
    * Requires that the user have an identity contract already deployed that will be deleted.
    * Only owner can call.
    *
    * @param _user The address of the user to be removed
    */
    function deleteIdentity(address _user) public onlyOwner {
        require(identity[_user] != address(0), "you haven't registered an identity yet");
        delete identity[_user];
        emit identityRemoved(identity[msg.sender]);
    }

    /**
    * @notice This functions checks whether an identity contract
    * corresponding to the provided user address has the required claims or not based
    * on the security token. 
    *
    * @param _userAddress The address of the user to be verified.
    *
    * @return 'True' if the address is verified, 'false' if not.
    */
    function isVerified(address _userAddress) public view returns (bool) {
        if (identity[_userAddress]==address(0)){
            return false;
        }

        claimTypes = typesRegistry.getClaimTypes();
        uint length = claimTypes.length;

        for(uint i = 0; i<length; i++) {
            if(claimIsValid(identity[_userAddress], claimTypes[i])) {
                return true;
            }
        }
        return false;
    } 

    // Registry setters
    function setClaimTypesRegistry(address _claimTypesRegistry) public onlyOwner {
        typesRegistry = ClaimTypesRegistry(_claimTypesRegistry);
        emit claimTypesRegistrySet(_claimTypesRegistry);
    }

    function setTrustedIssuerRegistry(address _trustedIssuersRegistry) public onlyOwner {
        issuersRegistry = TrustedIssuersRegistry(_trustedIssuersRegistry);
        emit trustedIssuersRegistrySet(_trustedIssuersRegistry);
    }
}
