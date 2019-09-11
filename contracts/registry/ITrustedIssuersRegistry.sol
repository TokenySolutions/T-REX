pragma solidity ^0.5.10;

import "../claimIssuer/ClaimIssuer.sol";
//interface
contract ITrustedIssuersRegistry {

    //Mapping between a trusted issuer index and its corresponding identity contract address.
    mapping (uint => ClaimIssuer) trustedIssuers;
    mapping (uint => mapping (uint => uint)) trustedIssuerClaimTopics;
    mapping (uint => uint) trustedIssuerClaimCount;
    mapping (address => bool) trustedIssuer;
    //Array stores the trusted issuer indexes
    uint[] indexes;

    event trustedIssuerAdded(uint indexed index, ClaimIssuer indexed trustedIssuer, uint[] claimTopics);
    event trustedIssuerRemoved(uint indexed index, ClaimIssuer indexed trustedIssuer);
    event trustedIssuerUpdated(uint indexed index, ClaimIssuer indexed oldTrustedIssuer, ClaimIssuer indexed newTrustedIssuer, uint[] claimTopics);

    function addTrustedIssuer(ClaimIssuer _trustedIssuer, uint index, uint[] memory claimTopics) public;
    function removeTrustedIssuer(uint index) public;
    function getTrustedIssuers() public view returns (uint[] memory);
    function isTrustedIssuer(address issuer) public view returns(bool);
    function getTrustedIssuer(uint index) public view returns (ClaimIssuer);
    function getTrustedIssuerClaimTopics(uint index) public view returns(uint[] memory);
    function hasClaimTopics(address issuer, uint claimTopic) public view returns(bool);
    function updateIssuerContract(uint index, ClaimIssuer _newTrustedIssuer, uint[] memory claimTopics) public;
}
