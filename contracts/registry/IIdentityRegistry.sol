pragma solidity ^0.5.10;

import "../claimIssuer/ClaimIssuer.sol";
import "../registry/ITrustedIssuerRegistry.sol";
import "../registry/IClaimTopicsRegistry.sol";

import "@onchain-id/solidity/contracts/Identity.sol";


//interface
contract IIdentityRegistry{

    //mapping between a user address and the corresponding identity contract
    mapping (address => Identity) public identity;

    mapping (address => uint16) public investorCountry;

    //Array storing trusted claim topics of the security token.
    uint256[] claimTopics;

    // Array storing claim ids of user corresponding to given claim
    bytes32[] claimIds;

    IClaimTopicsRegistry public topicsRegistry;
    ITrustedIssuerRegistry public issuersRegistry;

    event identityRegistered(address indexed investorAddress, Identity indexed identity);
    event identityRemoved(address indexed investorAddress, Identity indexed identity);
    event identityUpdated(Identity indexed old_identity, Identity indexed new_identity);
    event countryUpdated(address indexed investorAddress, uint16 indexed country);
    event claimTopicsRegistrySet(address indexed _claimTopicsRegistry);
    event trustedIssuersRegistrySet(address indexed _trustedIssuersRegistry);

    function registerIdentity(address _user, Identity _identity, uint16 _country) public;
    function updateIdentity(address _user, Identity _identity) public;
    function updateCountry(address _user, uint16 _country) public;
    function deleteIdentity(address _user) public;
    function isVerified(address _userAddress) public returns (bool);
    function setClaimTopicsRegistry(address _claimTopicsRegistry) public;
    function setTrustedIssuerRegistry(address _trustedIssuersRegistry) public;
    function contains(address _wallet) public view returns (bool);

}
