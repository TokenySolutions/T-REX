pragma solidity >=0.4.21 <0.6.0;


import "../identity/ClaimHolder.sol";
import "../issuerIdentity/IssuerIdentity.sol";
import "../registry/IClaimTypesRegistry.sol";
// import "./ClaimVerifier.sol";
import "../../openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../registry/ITrustedIssuerRegistry.sol";
import "../registry/IIdentityRegistry.sol";

contract IdentityRegistry is IIdentityRegistry, Ownable {
    // //mapping between a user address and the corresponding identity contract
    // mapping (address => ClaimHolder) public identity;

    // mapping (address => uint16) public investorCountry;

    // //Array storing trusted claim types of the security token.
    // uint256[] claimTypes;
    
    // // Array storing claim ids of user corresponding to given claim
    // bytes32[] claimIds;
    
    // IClaimTypesRegistry public typesRegistry;
    // ITrustedIssuerRegistry public issuersRegistry;

    // event identityRegistered(address indexed investorAddress, ClaimHolder indexed identity);
    // event identityRemoved(address indexed investorAddress, ClaimHolder indexed identity);
    // event identityUpdated(ClaimHolder indexed old_identity, ClaimHolder indexed new_identity);
    // event countryUpdated(address indexed investorAddress, uint16 indexed country);
    // event claimTypesRegistrySet(address indexed _claimTypesRegistry);
    // event trustedIssuersRegistrySet(address indexed _trustedIssuersRegistry);

    constructor (
        address _trustedIssuersRegistry,
        address _claimTypesRegistry
    ) public {
        typesRegistry = IClaimTypesRegistry(_claimTypesRegistry);
        issuersRegistry = ITrustedIssuerRegistry(_trustedIssuersRegistry);
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
        require(address(identity[_user]) == address(0), "identity contract already exists, please use update");
        require(address(_identity) != address(0), "contract address can't be a zero address");
        identity[_user] = _identity;
        investorCountry[_user] = _country;
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
        require(address(identity[_user]) != address(0));
        require(address(_identity) != address(0), "contract address can't be a zero address");
        emit identityUpdated(identity[_user], _identity);
        identity[_user] = _identity;
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
        require(address(identity[_user])!= address(0));
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
        require(address(identity[_user]) != address(0), "you haven't registered an identity yet");
        delete identity[_user];
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
    // function isVerified(address _userAddress) public returns (bool) {
    //     if (address(identity[_userAddress])==address(0)){
    //         return false;
    //     }

    //     claimTypes = typesRegistry.getClaimTypes();
    //     uint length = claimTypes.length;
    //     if(length == 0) {
    //         return true;
    //     }
    //     for(uint i = 0; i<length; i++) {
    //         if(claimIsValid(identity[_userAddress], claimTypes[i])) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    function isVerified(address _userAddress) public returns (bool) {
        if (address(identity[_userAddress])==address(0)){
            return false;
        }

        claimTypes = typesRegistry.getClaimTypes();
        uint length = claimTypes.length;
        if(length == 0) {
            return true;
        }

        uint256 foundClaimType;
        uint256 scheme;
        address issuer;
        bytes memory sig;
        bytes memory data;
        uint claimType;
        for(claimType = 0; claimType<length; claimType++) {
            claimIds = identity[_userAddress].getClaimIdsByType(claimTypes[claimType]);
            if(claimIds.length == 0) {
                return false;
            }
            for(uint j = 0; j < claimIds.length; j++) {
                // Fetch claim from user
                ( foundClaimType, scheme, issuer, sig, data, ) = identity[_userAddress].getClaim(claimIds[j]);
                require(issuersRegistry.isTrustedIssuer(issuer), "Issuer should be trusted issuer");
                require(issuersRegistry.hasClaimTopics(issuer, claimTypes[claimType]), "Issuer should have claim topics");
                require(IssuerIdentity(issuer).isClaimValid(identity[_userAddress], claimIds[j], claimTypes[claimType], sig, data), "Investor should be valid");
            }
        }
        if(claimType==length){
            return true;
        }
        return false;
    }

    // Registry setters
    function setClaimTypesRegistry(address _claimTypesRegistry) public onlyOwner {
        typesRegistry = IClaimTypesRegistry(_claimTypesRegistry);
        emit claimTypesRegistrySet(_claimTypesRegistry);
    }

    function setTrustedIssuerRegistry(address _trustedIssuersRegistry) public onlyOwner {
        issuersRegistry = ITrustedIssuerRegistry(_trustedIssuersRegistry);
        emit trustedIssuersRegistrySet(_trustedIssuersRegistry);
    }

    function contains(address _wallet) public view returns (bool){
        require(address(identity[_wallet]) != address(0));
        return true;
    }
}
