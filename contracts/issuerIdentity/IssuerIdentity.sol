pragma solidity >=0.4.21 <0.6.0;

import "../identity/ClaimHolder.sol";
import "../issuerIdentity/IIssuerIdentity.sol";
import "../registry/TrustedIssuersRegistry.sol";
import "../../openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract IssuerIdentity is IIssuerIdentity, ClaimHolder, Ownable{

    function revokeClaim(bytes32 _claimId, address _identity) public onlyOwner returns(bool) {
        if(revokedClaims[_identity] == _claimId) {
            return false;
        }
        revokedClaims[_identity] = _claimId;
        identityAddresses[issuedClaimCount++] = _identity;
        return true;
    }

    function isClaimRevoked(bytes32 _claimId) public view returns(bool) {
        for(uint i = 0; i < issuedClaimCount; i++){
            address identityAddress = identityAddresses[i];
            bytes32 claimId = revokedClaims[identityAddress];
            if(claimId == _claimId) {
                return true;
            }
        }
        return false;
    }

    function isClaimValid(ClaimHolder _identity, bytes32 _claimId, uint256 claimTopic, bytes memory sig, bytes memory data)
    public
    returns (bool claimValid)
    {
        bytes32 dataHash = keccak256(abi.encodePacked(_identity, claimTopic, data));
        bytes32 prefixedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", dataHash));

        // Recover address of data signer
        address recovered = getRecoveredAddress(sig, prefixedHash);

        // Take hash of recovered address
        bytes32 hashedAddr = keccak256(abi.encodePacked(recovered));

        // Does the trusted identifier have they key which signed the user's claim?
        if(keyHasPurpose(hashedAddr, 3) && (isClaimRevoked(_claimId) == false)) {
            emit ClaimValid(_identity, claimTopic);
            return true;
        }
        emit ClaimInvalid(_identity, claimTopic);
        return false;
    }

    function getRecoveredAddress(bytes memory sig, bytes32 dataHash)
        public
        pure
        returns (address addr)
    {
        bytes32 ra;
        bytes32 sa;
        uint8 va;

        // Check the signature length
        if (sig.length != 65) {
            return address(0);
        }

        // Divide the signature in r, s and v variables
        assembly {
          ra := mload(add(sig, 32))
          sa := mload(add(sig, 64))
          va := byte(0, mload(add(sig, 96)))
        }

        if (va < 27) {
            va += 27;
        }

        address recoveredAddress = ecrecover(dataHash, va, ra, sa);

        return (recoveredAddress);
    }
}