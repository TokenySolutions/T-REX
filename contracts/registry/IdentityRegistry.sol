pragma solidity >=0.4.21 <0.6.0;


import "../identity/ClaimHolder.sol";
import "../issuerIdentity/IssuerIdentity.sol";
import "../registry/IClaimTopicsRegistry.sol";
// import "./ClaimVerifier.sol";
// import "../../openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../registry/ITrustedIssuerRegistry.sol";
import "../registry/IIdentityRegistry.sol";

contract MultiOwnable {
    address private _owner;

    mapping(address => bool) owners;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event newOwnerAdded(address indexed newOwner);
    event ownerRemoved(address indexed owner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor () internal {
        owners[msg.sender] = true;
        // _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Returns true if the caller is the current owner.
     */
    function isOwner() public view returns (bool) {
        return owners[msg.sender];
        // return msg.sender == _owner;
    }

    function addOwner(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        owners[newOwner] = true;
        emit newOwnerAdded(newOwner);
    }

    function removeOwner(address _owner_) public onlyOwner {
        require(_owner_ != address(0), "Ownable: new owner is the zero address");
        delete owners[_owner_];
        emit ownerRemoved(_owner_);
    }
}

contract IdentityRegistry is IIdentityRegistry, MultiOwnable {

    constructor (
        address _trustedIssuersRegistry,
        address _claimTopicsRegistry
    ) public {
        topicsRegistry = IClaimTopicsRegistry(_claimTopicsRegistry);
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

    function isVerified(address _userAddress) public returns (bool) {
        if (address(identity[_userAddress])==address(0)){
            return false;
        }

        claimTopics = topicsRegistry.getClaimTopics();
        uint length = claimTopics.length;
        if(length == 0) {
            return true;
        }

        uint256 foundClaimTopic;
        uint256 scheme;
        address issuer;
        bytes memory sig;
        bytes memory data;
        uint claimTopic;
        for(claimTopic = 0; claimTopic<length; claimTopic++) {
            claimIds = identity[_userAddress].getClaimIdsByTopic(claimTopics[claimTopic]);
            if(claimIds.length == 0) {
                return false;
            }
            for(uint j = 0; j < claimIds.length; j++) {
                // Fetch claim from user
                ( foundClaimTopic, scheme, issuer, sig, data, ) = identity[_userAddress].getClaim(claimIds[j]);
                require(issuersRegistry.isTrustedIssuer(issuer), "Issuer should be trusted issuer");
                require(issuersRegistry.hasClaimTopics(issuer, claimTopics[claimTopic]), "Issuer should have claim topics");
                require(IssuerIdentity(issuer).isClaimValid(identity[_userAddress], claimIds[j], claimTopics[claimTopic], sig, data), "Investor should be valid");
            }
        }
        if(claimTopic==length){
            return true;
        }
        return false;
    }

    // Registry setters
    function setClaimTopicsRegistry(address _claimTopicsRegistry) public onlyOwner {
        topicsRegistry = IClaimTopicsRegistry(_claimTopicsRegistry);
        emit claimTopicsRegistrySet(_claimTopicsRegistry);
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
