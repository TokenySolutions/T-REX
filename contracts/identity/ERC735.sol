pragma solidity >=0.4.21 <0.6.0;


contract ERC735 {

    event ClaimRequested(uint256 indexed claimRequestId, uint256 indexed claimTopic, uint256 scheme, address indexed issuer, bytes signature, bytes data, string uri);
    event ClaimAdded(bytes32 indexed claimId, uint256 indexed claimTopic, uint256 scheme, address indexed issuer, bytes signature, bytes data, string uri);
    event ClaimRemoved(bytes32 indexed claimId, uint256 indexed claimTopic, uint256 scheme, address indexed issuer, bytes signature, bytes data, string uri);
    event ClaimChanged(bytes32 indexed claimId, uint256 indexed claimTopic, uint256 scheme, address indexed issuer, bytes signature, bytes data, string uri);

    struct Claim {
        uint256 claimTopic;
        uint256 scheme;
        address issuer; // msg.sender
        bytes signature; // this.address + claimTopic + data
        bytes data;
        string uri;
    }

    function getClaim(bytes32 _claimId) public view returns(uint256 claimTopic, uint256 scheme, address issuer, bytes memory signature, bytes memory data, string memory uri);
    function getClaimIdsByTopic(uint256 _claimTopic) public view returns(bytes32[] memory claimIds);
    function addClaim(uint256 _claimTopic, uint256 _scheme, address issuer, bytes memory _signature, bytes memory _data, string memory _uri) public returns (bytes32 claimRequestId);
    function removeClaim(bytes32 _claimId) public returns (bool success);
}
