pragma solidity ^0.5.10;

import "../claimIssuer/IClaimIssuer.sol";
import "@onchain-id/solidity/contracts/Identity.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract ClaimIssuer is IClaimIssuer, Identity, Ownable {
    function revokeClaim(bytes32 _claimId, address _identity) public returns(bool) {
        uint256 foundClaimTopic;
        uint256 scheme;
        address issuer;
        bytes memory  sig;
        bytes  memory data;
        ( foundClaimTopic, scheme, issuer, sig, data, ) = Identity(_identity).getClaim(_claimId);
        // require(sig != 0, "Claim does not exist");

        revokedClaims[sig] = true;
        identityAddresses[_claimId] = _identity;
        return true;
    }

    function isClaimRevoked(bytes memory _sig) public view returns(bool) {
        if(revokedClaims[_sig])
            return true;
        return false;
    }

    function isClaimValid(Identity _identity, bytes32 _claimId, uint256 claimTopic, bytes memory sig, bytes memory data)
    public
    returns (bool claimValid)
    {
        bytes32 dataHash = keccak256(abi.encode(_identity, claimTopic, data));
        // Use abi.encodePacked to concatenate the messahe prefix and the message to sign.
        bytes32 prefixedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", dataHash));

        // Recover address of data signer
        address recovered = getRecoveredAddress(sig, prefixedHash);

        // Take hash of recovered address
        bytes32 hashedAddr = keccak256(abi.encode(recovered));

        // Does the trusted identifier have they key which signed the user's claim?
        //  && (isClaimRevoked(_claimId) == false)
        if(keyHasPurpose(hashedAddr, 3)  && (isClaimRevoked(sig) == false)) {
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
