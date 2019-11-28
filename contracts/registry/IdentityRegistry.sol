pragma solidity ^0.5.10;


import "@onchain-id/solidity/contracts/ClaimIssuer.sol";
import "../registry/IClaimTopicsRegistry.sol";
import "../registry/ITrustedIssuersRegistry.sol";
import "../registry/IIdentityRegistry.sol";
import "../roles/AgentRole.sol";

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "@onchain-id/solidity/contracts/Identity.sol";

contract IdentityRegistry is IIdentityRegistry, AgentRole {
    // mapping between a user address and the corresponding identity contract
    mapping (address => Identity) public identity;

    mapping (address => uint16) public investorCountry;

    IClaimTopicsRegistry public topicsRegistry;
    ITrustedIssuersRegistry public issuersRegistry;

    constructor (
        address _trustedIssuersRegistry,
        address _claimTopicsRegistry
    ) public {
        topicsRegistry = IClaimTopicsRegistry(_claimTopicsRegistry);
        issuersRegistry = ITrustedIssuersRegistry(_trustedIssuersRegistry);

        emit ClaimTopicsRegistrySet(_claimTopicsRegistry);
        emit TrustedIssuersRegistrySet(_trustedIssuersRegistry);
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
    function registerIdentity(address _user, Identity _identity, uint16 _country) public onlyAgent {
        require(address(identity[_user]) == address(0), "identity contract already exists, please use update");
        require(address(_identity) != address(0), "contract address can't be a zero address");
        identity[_user] = _identity;
        investorCountry[_user] = _country;

        emit IdentityRegistered(_user, _identity);
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
    function updateIdentity(address _user, Identity _identity) public onlyAgent {
        require(address(identity[_user]) != address(0));
        require(address(_identity) != address(0), "contract address can't be a zero address");
        identity[_user] = _identity;

        emit IdentityUpdated(identity[_user], _identity);
    }


    /**
    * @notice Updates the country corresponding to a user address.
    * Requires that the user should have an identity contract already deployed that will be replaced.
    * Only owner can call.
    *
    * @param _user The address of the user
    * @param _country The new country of the user
    */

    function updateCountry(address _user, uint16 _country) public onlyAgent {
        require(address(identity[_user])!= address(0));
        investorCountry[_user] = _country;

        emit CountryUpdated(_user, _country);
    }

    /**
    * @notice Removes an user from the identity registry.
    * Requires that the user have an identity contract already deployed that will be deleted.
    * Only owner can call.
    *
    * @param _user The address of the user to be removed
    */
    function deleteIdentity(address _user) public onlyAgent {
        require(address(identity[_user]) != address(0), "you haven't registered an identity yet");
        delete identity[_user];

        emit IdentityRemoved(_user, identity[_user]);
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
        if (address(identity[_userAddress]) == address(0)){
            return false;
        }

        uint256[] memory claimTopics = topicsRegistry.getClaimTopics();
        uint length = claimTopics.length;
        if (length == 0) {
            return true;
        }

        uint256 foundClaimTopic;
        uint256 scheme;
        address issuer;
        bytes memory sig;
        bytes memory data;
        uint256 claimTopic;
        for (claimTopic = 0; claimTopic < length; claimTopic++) {
            bytes32[] memory claimIds = identity[_userAddress].getClaimIdsByTopic(claimTopics[claimTopic]);
            if (claimIds.length == 0) {
                return false;
            }
            for (uint j = 0; j < claimIds.length; j++) {
                // Fetch claim from user
                ( foundClaimTopic, scheme, issuer, sig, data, ) = identity[_userAddress].getClaim(claimIds[j]);
                if (!issuersRegistry.isTrustedIssuer(issuer)) {
                    return false;
                }
                if (!issuersRegistry.hasClaimTopic(issuer, claimTopics[claimTopic])) {
                    return false;
                }
                if (!ClaimIssuer(issuer).isClaimValid(identity[_userAddress], claimIds[j], claimTopics[claimTopic], sig, data)) {
                    return false;
                }
            }
        }
        if (claimTopic==length){
            return true;
        }
        return false;
    }

    // Registry setters
    function setClaimTopicsRegistry(address _claimTopicsRegistry) public onlyOwner {
        topicsRegistry = IClaimTopicsRegistry(_claimTopicsRegistry);

        emit ClaimTopicsRegistrySet(_claimTopicsRegistry);
    }

    function setTrustedIssuersRegistry(address _trustedIssuersRegistry) public onlyOwner {
        issuersRegistry = ITrustedIssuersRegistry(_trustedIssuersRegistry);

        emit TrustedIssuersRegistrySet(_trustedIssuersRegistry);
    }

    function contains(address _wallet) public view returns (bool){
        require(address(identity[_wallet]) != address(0));

        return true;
    }
}
