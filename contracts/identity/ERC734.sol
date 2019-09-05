pragma solidity >=0.4.21 <0.6.0;


contract ERC734 {

    uint256 constant MANAGEMENT_KEY = 1;
    uint256 constant EXECUTION_KEY = 2;
    uint256 constant CLAIM_SIGNER_KEY = 3;
    uint256 constant ENCRYPTION_KEY = 4;

    event KeyAdded(bytes32 indexed key, uint256 indexed purpose, uint256 indexed keyType);
    event KeyRemoved(bytes32 indexed key, uint256 indexed purpose, uint256 indexed keyType);
    event ExecutionRequested(uint256 indexed executionId, address indexed to, uint256 indexed value, bytes data);
    event Executed(uint256 indexed executionId, address indexed to, uint256 indexed value, bytes data);
    event Approved(uint256 indexed executionId, bool approved);
    event KeysRequiredChanged(uint256 purpose, uint256 number);

    struct Key {
        uint256[] purposes; //e.g., MANAGEMENT_KEY = 1, EXECUTION_KEY = 2, etc.
        uint256 keyType; // e.g. 1 = ECDSA, 2 = RSA, etc.
        bytes32 key;
    }

    function getKey(bytes32 _key) public view returns(uint256[] memory purposes, uint256 keyType, bytes32 key);
    function getKeyPurpose(bytes32 _key) public view returns(uint256[] memory purposes);
    function keyHasPurpose(bytes32 _key, uint256 _purpose) public view returns (bool exists);
    function getKeysByPurpose(uint256 _purpose) public view returns (bytes32[] memory keys);
    function addKey(bytes32 _key, uint256 _purpose, uint256 _keyType) public returns (bool success);
    function removeKey(bytes32 _key, uint256 _purpose) public returns (bool success);
    function changeKeysRequired(uint256 purpose, uint256 number) external;
    function getKeysRequired(uint256 purpose) external view returns(uint256);
    function execute(address _to, uint256 _value, bytes memory _data) public returns (uint256 executionId);
    function approve(uint256 _id, bool _approve) public returns (bool success);
}
