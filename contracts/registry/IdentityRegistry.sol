pragma solidity ^0.6.0;


import "@onchain-id/solidity/contracts/IClaimIssuer.sol";
import "@onchain-id/solidity/contracts/IIdentity.sol";
import "../registry/IClaimTopicsRegistry.sol";
import "../registry/ITrustedIssuersRegistry.sol";
import "../registry/IIdentityRegistry.sol";
import "../roles/AgentRole.sol";

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract IdentityRegistry is IIdentityRegistry, AgentRole {
    // mapping between a user address and the corresponding identity contract
    mapping(address => IIdentity) private identity;

    mapping(address => uint16) private investorCountry;

    IClaimTopicsRegistry private topicsRegistry;
    ITrustedIssuersRegistry private issuersRegistry;

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
     * @dev Returns the onchainID of an investor.
     * @param _wallet The wallet of the investor
     */
    function getIdentityOfWallet(address _wallet) public override view returns (IIdentity){
        return identity[_wallet];
    }

    /**
     * @dev Returns the country code of an investor.
     * @param _wallet The wallet of the investor
     */
    function getInvestorCountryOfWallet(address _wallet) public override view returns (uint16){
        return investorCountry[_wallet];
    }

    /**
     * @dev Returns the TrustedIssuersRegistry linked to the current IdentityRegistry.
     */
    function getIssuersRegistry() public override view returns (ITrustedIssuersRegistry){
        return issuersRegistry;
    }

    /**
     * @dev Returns the ClaimTopicsRegistry linked to the current IdentityRegistry.
     */
    function getTopicsRegistry() public override view returns (IClaimTopicsRegistry){
        return topicsRegistry;
    }

    /**
    * @notice Register an identity contract corresponding to a user address.
    * Requires that the user doesn't have an identity contract already registered.
    * Only agent can call.
    *
    * @param _user The address of the user
    * @param _identity The address of the user's identity contract
    * @param _country The country of the investor
    */
    function registerIdentity(address _user, IIdentity _identity, uint16 _country) public override onlyAgent {
        require(address(_identity) != address(0), "contract address can't be a zero address");
        require(address(identity[_user]) == address(0), "identity contract already exists, please use update");
        identity[_user] = _identity;
        investorCountry[_user] = _country;

        emit IdentityRegistered(_user, _identity);
    }

    /**
     * @notice function allowing to register identities in batch
     *  Only Agent can call this function.
     *  Requires that none of the users has an identity contract already registered.
     *
     *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_users.length` IS TOO HIGH,
     *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *
     * @param _users The addresses of the users
     * @param _identities The addresses of the corresponding identity contracts
     * @param _countries The countries of the corresponding investors
     *
     */
    function batchRegisterIdentity(address[] calldata _users, IIdentity[] calldata _identities, uint16[] calldata _countries) external override {
        for (uint256 i = 0; i < _users.length; i++) {
            registerIdentity(_users[i], _identities[i], _countries[i]);
        }
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
    function updateIdentity(address _user, IIdentity _identity) public override onlyAgent {
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
    function updateCountry(address _user, uint16 _country) public override onlyAgent {
        require(address(identity[_user]) != address(0));
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
    function deleteIdentity(address _user) public override onlyAgent {
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
    function isVerified(address _userAddress) public override view returns (bool) {
        if (address(identity[_userAddress]) == address(0)) {
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
                (foundClaimTopic, scheme, issuer, sig, data,) = identity[_userAddress].getClaim(claimIds[j]);
                if (!issuersRegistry.isTrustedIssuer(issuer)) {
                    return false;
                }
                if (!issuersRegistry.hasClaimTopic(issuer, claimTopics[claimTopic])) {
                    return false;
                }
                if (!IClaimIssuer(issuer).isClaimValid(identity[_userAddress], claimTopics[claimTopic], sig, data)) {
                    return false;
                }
            }
        }

        return true;
    }

    // Registry setters
    function setClaimTopicsRegistry(address _claimTopicsRegistry) public override onlyOwner {
        topicsRegistry = IClaimTopicsRegistry(_claimTopicsRegistry);

        emit ClaimTopicsRegistrySet(_claimTopicsRegistry);
    }

    function setTrustedIssuersRegistry(address _trustedIssuersRegistry) public override onlyOwner {
        issuersRegistry = ITrustedIssuersRegistry(_trustedIssuersRegistry);

        emit TrustedIssuersRegistrySet(_trustedIssuersRegistry);
    }

    function contains(address _wallet) public override view returns (bool){
        if (address(identity[_wallet]) == address(0)) {
            return false;
        }

        return true;
    }
}
