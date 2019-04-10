pragma solidity ^0.4.24;

import "../identity/ClaimHolder.sol";
import "../registry/ClaimTypesRegistry.sol";
import "./ClaimVerifier.sol";
import "../../zeppelin-solidity/contracts/ownership/Ownable.sol";

contract IdentityRegistry is Ownable, ClaimVerifier {
    //mapping between a user address and the corresponding identity contract
    mapping (address => ClaimHolder) public identity;

    mapping (address => uint16) public investorCountry;

    struct IdentityContract {
        address user;
        ClaimHolder userIdentity;
    }
    //Array storing trusted claim types of the security token.
    uint256[] claimTypes;

    IdentityContract[] public identities;

    ClaimTypesRegistry public typesRegistry;

    event identityRegistered(address indexed investorAddress, ClaimHolder indexed identity);
    event identityRemoved(address indexed investorAddress, ClaimHolder indexed identity);
    event identityUpdated(ClaimHolder indexed old_identity, ClaimHolder indexed new_identity);
    event countryUpdated(address indexed investorAddress, uint16 indexed country);
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
    * @param _country The country of the investor
    */
    function registerIdentity(address _user, ClaimHolder _identity, uint16 _country) public onlyOwner {
        require(identity[_user] == address(0), "identity contract already exists, please use update");
        require(_identity != address(0), "contract address can't be a zero address");
        IdentityContract memory identityContract;
        identity[_user] = _identity;
        investorCountry[_user] = _country;
        identityContract.user = _user;
        identityContract.userIdentity = _identity;
        identities.push(identityContract);
        emit identityRegistered(_user, _identity);
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
        require(_identity != address(0), "contract address can't be a zero address");
        emit identityUpdated(identity[_user], _identity);
        identity[_user] = _identity;
    }

    /**
    * @notice Get the list of registered identities.
    *
    * @return The array of users and the array of their identities (must be destructured).
    */
    function getIdentities() public view returns (address[], ClaimHolder[]) {
        address[] memory users = new address[](identities.length);
        ClaimHolder[] memory userIdentities = new ClaimHolder[](identities.length);

        for (uint i = 0; i < identities.length; i++) {
            IdentityContract memory identityContract = identities[i];
            users[i] = identityContract.user;
            userIdentities[i] = identityContract.userIdentity;
        }

        return (users, userIdentities);
    }


    /**
    * @notice Updates the country corresponding to a user address.
    * Requires that the user should have an identity contract already deployed that will be replaced.
    * Only owner can call.
    *
    * @param _user The address of the user
    * @param _country The new country of the user
    */

    function updateCountry(address _user, uint16 _country) public onlyOwner {
        require(identity[_user] != address(0));
        investorCountry[_user] = _country;
        emit countryUpdated(_user, _country);
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
        uint length = identities.length;
        for (uint i = 0; i<length; i++) {
            if(identities[i].user == _user) {
                delete identities[i];
                identities[i] = identities[length-1];
                delete identities[length-1];
                identities.length--;
            }
        }
        emit identityRemoved(_user, identity[_user]);
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
