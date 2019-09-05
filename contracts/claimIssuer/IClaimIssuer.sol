pragma solidity >=0.4.21 <0.6.0;

import "../identity/ClaimHolder.sol";

//interface
contract IClaimIssuer{
    uint public issuedClaimCount;
   
    mapping (bytes => bool) revokedClaims;
    mapping (bytes32 => address) identityAddresses;

    event ClaimValid(ClaimHolder _identity, uint256 claimTopic);
    event ClaimInvalid(ClaimHolder _identity, uint256 claimTopic);

    function revokeClaim(bytes32 _claimId, address _identity) public returns(bool);
    // function revokeClaim(bytes memory _sig, address _identity) public returns(bool);
    // function isClaimRevoked(bytes32 _claimId) public view returns(bool);
    function isClaimRevoked(bytes memory _sig) public view returns(bool result);
    function isClaimValid(ClaimHolder _identity, bytes32 _claimId, uint256 claimTopic, bytes memory sig, bytes memory data)
    public
    returns (bool claimValid);

}
