pragma solidity ^0.5.10;

import "@onchain-id/solidity/contracts/Identity.sol";

//interface
contract IClaimIssuer{
    uint public issuedClaimCount;

    mapping (bytes => bool) revokedClaims;
    mapping (bytes32 => address) identityAddresses;

    event ClaimValid(Identity _identity, uint256 claimTopic);
    event ClaimInvalid(Identity _identity, uint256 claimTopic);

    function revokeClaim(bytes32 _claimId, address _identity) public returns(bool);
    // function revokeClaim(bytes memory _sig, address _identity) public returns(bool);
    // function isClaimRevoked(bytes32 _claimId) public view returns(bool);
    function isClaimRevoked(bytes memory _sig) public view returns(bool result);
    function isClaimValid(Identity _identity, bytes32 _claimId, uint256 claimTopic, bytes memory sig, bytes memory data)
    public
    view
    returns (bool claimValid);

}
