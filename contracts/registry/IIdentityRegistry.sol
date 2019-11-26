pragma solidity ^0.5.10;

import "../registry/ITrustedIssuersRegistry.sol";
import "../registry/IClaimTopicsRegistry.sol";

import "@onchain-id/solidity/contracts/ClaimIssuer.sol";
import "@onchain-id/solidity/contracts/Identity.sol";

interface IIdentityRegistry {

    event IdentityRegistered(address indexed investorAddress, Identity indexed identity);
    event IdentityRemoved(address indexed investorAddress, Identity indexed identity);
    event IdentityUpdated(Identity indexed old_identity, Identity indexed new_identity);
    event CountryUpdated(address indexed investorAddress, uint16 indexed country);
    event ClaimTopicsRegistrySet(address indexed _claimTopicsRegistry);
    event TrustedIssuersRegistrySet(address indexed _trustedIssuersRegistry);

    function registerIdentity(address _user, Identity _identity, uint16 _country) external;
    function updateIdentity(address _user, Identity _identity) external;
    function updateCountry(address _user, uint16 _country) external;
    function deleteIdentity(address _user) external;
    function isVerified(address _userAddress) external view returns (bool);
    function setClaimTopicsRegistry(address _claimTopicsRegistry) external;
    function setTrustedIssuersRegistry(address _trustedIssuersRegistry) external;
    function contains(address _wallet) external view returns (bool);
    function investorCountry(address _wallet) external view returns (uint16);
    function identity(address _wallet) external view returns (Identity);
    function topicsRegistry() external view returns (IClaimTopicsRegistry);
    function issuersRegistry() external view returns (ITrustedIssuersRegistry);

}
