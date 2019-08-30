pragma solidity >=0.4.21 <0.6.0;

import "../claimIssuer/ClaimIssuer.sol";
import "../identity/ClaimHolder.sol";
import "../registry/ITrustedIssuerRegistry.sol";
import "../registry/IClaimTopicsRegistry.sol";


//interface
contract IIdentityRegistry{

    //mapping between a user address and the corresponding identity contract
    mapping (address => ClaimHolder) public identity;

    mapping (address => uint16) public investorCountry;

    //Array storing trusted claim topics of the security token.
    uint256[] claimTopics;
    
    // Array storing claim ids of user corresponding to given claim
    bytes32[] claimIds;
    
    IClaimTopicsRegistry public topicsRegistry;
    ITrustedIssuerRegistry public issuersRegistry;

    event identityRegistered(address indexed investorAddress, ClaimHolder indexed identity);
    event identityRemoved(address indexed investorAddress, ClaimHolder indexed identity);
    event identityUpdated(ClaimHolder indexed old_identity, ClaimHolder indexed new_identity);
    event countryUpdated(address indexed investorAddress, uint16 indexed country);
    event claimTopicsRegistrySet(address indexed _claimTopicsRegistry);
    event trustedIssuersRegistrySet(address indexed _trustedIssuersRegistry);

    function registerIdentity(address _user, ClaimHolder _identity, uint16 _country) public;
    function updateIdentity(address _user, ClaimHolder _identity) public;
    function updateCountry(address _user, uint16 _country) public;
    function deleteIdentity(address _user) public;
    function isVerified(address _userAddress) public returns (bool);
    function setClaimTopicsRegistry(address _claimTopicsRegistry) public;
    function setTrustedIssuerRegistry(address _trustedIssuersRegistry) public;
    function contains(address _wallet) public view returns (bool);

}
