pragma solidity ^0.6.0;

import "../registry/ITrustedIssuersRegistry.sol";
import "../registry/IClaimTopicsRegistry.sol";

import "@onchain-id/solidity/contracts/ClaimIssuer.sol";
import "@onchain-id/solidity/contracts/Identity.sol";

interface IIdentityRegistry {
    // EVENTS
    event ClaimTopicsRegistrySet(address indexed _claimTopicsRegistry);
    event CountryUpdated(address indexed investorAddress, uint16 indexed country);
    event IdentityRegistered(address indexed investorAddress, Identity indexed identity);
    event IdentityRemoved(address indexed investorAddress, Identity indexed identity);
    event IdentityUpdated(Identity indexed old_identity, Identity indexed new_identity);
    event TrustedIssuersRegistrySet(address indexed _trustedIssuersRegistry);

    // WRITE OPERATIONS
    function deleteIdentity(address _user) external;
    function registerIdentity(address _user, Identity _identity, uint16 _country) external;
    function setClaimTopicsRegistry(address _claimTopicsRegistry) external;
    function setTrustedIssuersRegistry(address _trustedIssuersRegistry) external;
    function updateCountry(address _user, uint16 _country) external;
    function updateIdentity(address _user, Identity _identity) external;

    // READ OPERATIONS
    function contains(address _wallet) external view returns (bool);
    function isVerified(address _userAddress) external view returns (bool);

    // GETTERS
    function getIdentityOfWallet(address _wallet) external view returns (Identity);
    function getInvestorCountryOfWallet(address _wallet) external view returns (uint16);
    function getIssuersRegistry() external view returns (ITrustedIssuersRegistry);
    function getTopicsRegistry() external view returns (IClaimTopicsRegistry);
}
