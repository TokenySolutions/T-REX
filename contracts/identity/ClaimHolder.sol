pragma solidity >=0.4.21 <0.6.0;


import "./ERC735.sol";
import "./KeyHolder.sol";

contract ClaimHolder is KeyHolder, ERC735  {

    mapping (bytes32 => Claim) public claims;
    mapping (uint256 => bytes32[]) claimsByType;
 /**
    * @notice Implementation of the addClaim function from the ERC-735 standard
    *  Require that the msg.sender has claim signer key.
    *
    * @param _claimType The type of claim
    * @param _scheme The scheme with which this claim SHOULD be verified or how it should be processed.
    * @param _issuer The issuers identity contract address, or the address used to sign the above signature.
    * @param _signature Signature which is the proof that the claim issuer issued a claim of claimType for this identity.
    * it MUST be a signed message of the following structure: keccak256(address identityHolder_address, uint256 _ claimType, bytes data)
    * or keccak256(abi.encode(identityHolder_address, claimType, data))
    * @param _data The hash of the claim data, sitting in another location, a bit-mask, call data, or actual data based on the claim scheme.
    * @param _uri The location of the claim, this can be HTTP links, swarm hashes, IPFS hashes, and such.
    *
    * @return Returns claimRequestId: COULD be send to the approve function, to approve or reject this claim.
    * triggers ClaimAdded event.
    */

    function addClaim(
        uint256 _claimType,
        uint256 _scheme,
        address _issuer,
        bytes memory _signature,
        bytes memory _data,
        string memory _uri
    )
        public
        returns (bytes32 claimRequestId)
    {
        bytes32 claimId = keccak256(abi.encodePacked(_issuer, _claimType));

        if (msg.sender != address(this)) {
            require(keyHasPurpose(keccak256(abi.encodePacked(msg.sender)), 3), "Sender does not have claim signer key");
        }

        if (claims[claimId].issuer != _issuer) {
            claimsByType[_claimType].push(claimId);
        }

        claims[claimId].claimType = _claimType;
        claims[claimId].scheme = _scheme;
        claims[claimId].issuer = _issuer;
        claims[claimId].signature = _signature;
        claims[claimId].data = _data;
        claims[claimId].uri = _uri;
        
        emit ClaimAdded(
            claimId,
            _claimType,
            _scheme,
            _issuer,
            _signature,
            _data,
            _uri
        );

        return claimId;
    }

 /**
    * @notice Implementation of the removeClaim function from the ERC-735 standard
    * Require that the msg.sender has management key.
    * Can only be removed by the claim issuer, or the claim holder itself.
    *
    * @param _claimId The identity of the claim i.e. keccak256(address issuer_address + uint256 claimType)
    *
    * @return Returns TRUE when the claim was removed.
    * triggers ClaimRemoved event
    */

    function removeClaim(bytes32 _claimId) public returns (bool success) {
        if (msg.sender != address(this)) {
            require(keyHasPurpose(keccak256(abi.encodePacked(msg.sender)), 1), "Sender does not have management key");
        }

        emit ClaimRemoved(
            _claimId,
            claims[_claimId].claimType,
            claims[_claimId].scheme,
            claims[_claimId].issuer,
            claims[_claimId].signature,
            claims[_claimId].data,
            claims[_claimId].uri
        );

        bytes32[] storage claimList = claimsByType[claims[_claimId].claimType];

        for(uint i = 0; i<claimList.length; i++) {
            if(claimList[i] == _claimId) {
                delete claimList[i];
                claimList[i] = claimList[claimList.length-1];
                claimList.length--;
            }
        }

        delete claims[_claimId];

        return true;
    }

/**
    * @notice Implementation of the getClaim function from the ERC-735 standard.
    *
    * @param _claimId The identity of the claim i.e. keccak256(address issuer_address + uint256 claimType)
    *
    * @return Returns all the parameters of the claim for the specified _claimId (claimType, scheme, signature, issuer, data, uri) .
    */

    function getClaim(bytes32 _claimId)
        public
        view
        returns(
            uint256 claimType,
            uint256 scheme,
            address issuer,
            bytes memory signature,
            bytes memory data,
            string memory uri
        )
    {
        return (
            claims[_claimId].claimType,
            claims[_claimId].scheme,
            claims[_claimId].issuer,
            claims[_claimId].signature,
            claims[_claimId].data,
            claims[_claimId].uri
        );
    }

/**
    * @notice Implementation of the getClaimIdsByType function from the ERC-735 standard.
    * used to get all the claims from the specified claimType
    *
    * @param _claimType The identity of the claim i.e. keccak256(address issuer_address + uint256 claimType)
    *
    * @return Returns an array of claim IDs by claimType.
    */

    function getClaimIdsByType(uint256 _claimType)
        public
        view
        returns(bytes32[] memory claimIds)
    {
        return claimsByType[_claimType];
    }

}
