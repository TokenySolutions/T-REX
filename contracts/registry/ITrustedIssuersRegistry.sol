pragma solidity ^0.5.10;

import "@onchain-id/solidity/contracts/ClaimIssuer.sol";

interface ITrustedIssuersRegistry {
    // EVENTS
    event TrustedIssuerAdded(uint indexed index, ClaimIssuer indexed trustedIssuer, uint[] claimTopics);
    event TrustedIssuerRemoved(uint indexed index, ClaimIssuer indexed trustedIssuer);
    event TrustedIssuerUpdated(uint indexed index, ClaimIssuer indexed oldTrustedIssuer, ClaimIssuer indexed newTrustedIssuer, uint[] claimTopics);

    // READ OPERATIONS
    function getTrustedIssuer(uint index) external view returns (ClaimIssuer);
    function getTrustedIssuerClaimTopics(uint index) external view returns(uint[] memory);
    function getTrustedIssuers() external view returns (uint[] memory);
    function hasClaimTopic(address issuer, uint claimTopic) external view returns(bool);
    function isTrustedIssuer(address issuer) external view returns(bool);

    // WRITE OPERATIONS
    function addTrustedIssuer(ClaimIssuer _trustedIssuer, uint index, uint[] calldata claimTopics) external;
    function removeTrustedIssuer(uint index) external;
    function updateIssuerContract(uint index, ClaimIssuer _newTrustedIssuer, uint[] calldata claimTopics) external;
}
