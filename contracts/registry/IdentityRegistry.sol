pragma solidity ^0.5.10;


import "../claimIssuer/ClaimIssuer.sol";
import "../registry/IClaimTopicsRegistry.sol";
import "../registry/ITrustedIssuersRegistry.sol";
import "../registry/IIdentityRegistry.sol";
import "../roles/AgentRole.sol";

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "@onchain-id/solidity/contracts/Identity.sol";

contract MultiAgent is Ownable {
    address private _agent;

    mapping(address => bool) agents;

    event AgentshipTransferred(address indexed previousAgent, address indexed newAgent);
    event newAgentAdded(address indexed newAgent);
    event agentRemoved(address indexed agent);



    /**
     * @dev Returns the address of the current agent.
     */
    function agent() public view returns (address) {
        return _agent;
    }

    /**
     * @dev Throws if called by any account other than the agent.
     */
    modifier onlyAgent() {
        require(isAgent(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Returns true if the caller is the current owner.
     */
    function isAgent() public view returns (bool) {
        return agents[msg.sender];
        // return msg.sender == _agent;
    }

    function addAgent(address newAgent) public onlyOwner {
        require(newAgent != address(0), "Ownable: new Agent is the zero address");
        agents[newAgent] = true;
        emit newAgentAdded(newAgent);
    }

    function removeAgent(address _agent_) public onlyOwner {
        require(_agent_ != address(0), "Ownable: new owner is the zero address");
        delete agents[_agent_];
        emit agentRemoved(_agent_);
    }
}

contract IdentityRegistry is IIdentityRegistry, MultiAgent {

    constructor (
        address _trustedIssuersRegistry,
        address _claimTopicsRegistry
    ) public {
        topicsRegistry = IClaimTopicsRegistry(_claimTopicsRegistry);
        issuersRegistry = ITrustedIssuersRegistry(_trustedIssuersRegistry);
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
    function updateIdentity(address _user, Identity _identity) public onlyAgent {
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

    function updateCountry(address _user, uint16 _country) public onlyAgent {
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
    function deleteIdentity(address _user) public onlyAgent {
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

    function isVerified(address _userAddress) public view returns (bool) {
        if (address(identity[_userAddress])==address(0)){
            return false;
        }

        uint256[] memory claimTopics = topicsRegistry.getClaimTopics();
        uint length = claimTopics.length;
        if(length == 0) {
            return true;
        }

        uint256 foundClaimTopic;
        uint256 scheme;
        address issuer;
        bytes memory sig;
        bytes memory data;
        uint256 claimTopic;
        for(claimTopic = 0; claimTopic<length; claimTopic++) {
            bytes32[] memory claimIds = identity[_userAddress].getClaimIdsByTopic(claimTopics[claimTopic]);
            if(claimIds.length == 0) {
                return false;
            }
            for(uint j = 0; j < claimIds.length; j++) {
                // Fetch claim from user
                ( foundClaimTopic, scheme, issuer, sig, data, ) = identity[_userAddress].getClaim(claimIds[j]);
                if(!issuersRegistry.isTrustedIssuer(issuer)) {
                    return false;
                }
                if(!issuersRegistry.hasClaimTopics(issuer, claimTopics[claimTopic])) {
                    return false;
                }
                if(!ClaimIssuer(issuer).isClaimValid(identity[_userAddress], claimIds[j], claimTopics[claimTopic], sig, data)) {
                    return false;
                }
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
        issuersRegistry = ITrustedIssuersRegistry(_trustedIssuersRegistry);
        emit trustedIssuersRegistrySet(_trustedIssuersRegistry);
    }

    function contains(address _wallet) public view returns (bool){
        require(address(identity[_wallet]) != address(0));
        return true;
    }
}
