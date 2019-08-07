pragma solidity >=0.4.21 <0.6.0;

import "../identity/ClaimHolder.sol";

//interface
contract IIssuerIdentity{
    uint public issuedClaimCount;
    mapping (address => bytes32) revokedClaims;
    mapping (uint => address) identityAddresses;

    event ClaimValid(ClaimHolder _identity, uint256 claimTopic);
    event ClaimInvalid(ClaimHolder _identity, uint256 claimTopic);

    function revokeClaim(bytes32 _claimId, address _identity) public returns(bool);
    function isClaimRevoked(bytes32 _claimId) public view returns(bool);
    function isClaimValid(ClaimHolder _identity, bytes32 _claimId, uint256 claimTopic, bytes memory sig, bytes memory data)
    public
    returns (bool claimValid);

}
