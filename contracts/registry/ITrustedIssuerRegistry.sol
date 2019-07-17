pragma solidity >=0.4.21 <0.6.0;

import "../issuerIdentity/IssuerIdentity.sol";
//interface
contract ITrustedIssuerRegistry{

    //Mapping between a trusted issuer index and its corresponding identity contract address.
    mapping (uint => IssuerIdentity) trustedIssuers;
    mapping (uint => mapping (uint => uint)) trustedIssuerClaimTopics;
    mapping (uint => uint) trustedIssuerClaimCount;
    mapping (address => bool) trustedIssuer;
    //Array stores the trusted issuer indexes
    uint[] indexes;

    event trustedIssuerAdded(uint indexed index, IssuerIdentity indexed trustedIssuer, uint[] claimTopics);
    event trustedIssuerRemoved(uint indexed index, IssuerIdentity indexed trustedIssuer);
    event trustedIssuerUpdated(uint indexed index, IssuerIdentity indexed oldTrustedIssuer, IssuerIdentity indexed newTrustedIssuer, uint[] claimTopics);

    function addTrustedIssuer(IssuerIdentity _trustedIssuer, uint index, uint[] memory claimTopics) public;
    function removeTrustedIssuer(uint index) public;
    function getTrustedIssuers() public view returns (uint[] memory);
    function isTrustedIssuer(address issuer) public view returns(bool);
    function getTrustedIssuer(uint index) public view returns (IssuerIdentity);
    function getTrustedIssuerClaimTopics(uint index) public view returns(uint[] memory);
    function hasClaimTopics(address issuer, uint claimTopic) public view returns(bool);
    function updateIssuerContract(uint index, IssuerIdentity _newTrustedIssuer, uint[] memory claimTopics) public;
}
