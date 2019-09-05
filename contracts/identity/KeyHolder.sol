pragma solidity >=0.4.21 <0.6.0;

import './ERC734.sol';

contract KeyHolder is ERC734 {

    uint256 executionNonce;

    struct Execution {
        address to;
        uint256 value;
        bytes data;
        bool approved;
        bool executed;
    }

    mapping (bytes32 => Key) keys;
    mapping (uint256 => bytes32[]) keysByPurpose;
    mapping (uint256 => Execution) executions;

    event ExecutionFailed(uint256 indexed executionId, address indexed to, uint256 indexed value, bytes data);

    constructor() public {
        bytes32 _key = keccak256(abi.encodePacked(msg.sender));
        keys[_key].key = _key;
        keys[_key].purposes.push(1);
        // keys[_key].purposes.push(3);
        keys[_key].keyType = 1;
        keysByPurpose[1].push(_key);
        emit KeyAdded(_key, 1, 1);
    }

 /**
    * @notice Implementation of the getKey function from the ERC-734 standard
    *
    * @param _key The public key.  for non-hex and long keys, its the Keccak256 hash of the key
    *
    * @return Returns the full key data, if present in the identity.
    */

    function getKey(bytes32 _key)
        public
        view
        returns(uint256[] memory _purposes, uint256 keyType, bytes32 key)
    {
        return (keys[_key].purposes, keys[_key].keyType, keys[_key].key);
    }

/**
    * @notice gets the purpose of a key
    *
    * @param _key The public key.  for non-hex and long keys, its the Keccak256 hash of the key
    *
    * @return Returns the purpose of the specified key
    */

    function getKeyPurpose(bytes32 _key)
        public
        view
        returns(uint256[] memory _purposes)
    {
        return (keys[_key].purposes);
    }

/**
    * @notice gets all the keys with a specific purpose from an identity
    *
    * @param _purpose a uint256[] Array of the key types, like 1 = MANAGEMENT, 2 = ACTION, 3 = CLAIM, 4 = ENCRYPTION
    *
    * @return Returns an array of public key bytes32 hold by this identity and having the specified purpose
    */

    function getKeysByPurpose(uint256 _purpose)
        public
        view
        returns(bytes32[] memory _keys)
    {
        return keysByPurpose[_purpose];
    }

/**
    * @notice implementation of the addKey function of the ERC-734 standard
    * Adds a _key to the identity. The _purpose specifies the purpose of key. Initially we propose four purposes:
    * 1: MANAGEMENT keys, which can manage the identity
    * 2: ACTION keys, which perform actions in this identities name (signing, logins, transactions, etc.)
    * 3: CLAIM signer keys, used to sign claims on other identities which need to be revokable.
    * 4: ENCRYPTION keys, used to encrypt data e.g. hold in claims.
    * MUST only be done by keys of purpose 1, or the identity itself.
    * If its the identity itself, the approval process will determine its approval.
    *
    * @param _key keccak256 representation of an ethereum address
    * @param _type type of key used, which would be a uint256 for different key types. e.g. 1 = ECDSA, 2 = RSA, etc.
    * @param _purpose a uint256[] Array of the key types, like 1 = MANAGEMENT, 2 = ACTION, 3 = CLAIM, 4 = ENCRYPTION
    *
    * @return Returns TRUE if the addition was successful and FALSE if not
    */

    function addKey(bytes32 _key, uint256 _purpose, uint256 _type)
        public
        returns (bool success)
    {
        uint256[] storage purposeList = keys[_key].purposes;

        for(uint i = 0; i<purposeList.length; i++) {
            require(keys[_key].purposes[i] != _purpose, "Purpose corresponding to this Key already exists");
        }

        // require(keys[_key].key != _key, "Key already exists"); // Key should not already exist
        if (msg.sender != address(this)) {
            require(keyHasPurpose(keccak256(abi.encodePacked(msg.sender)), 1), "Sender does not have management key"); // Sender has MANAGEMENT_KEY
        }

        keys[_key].key = _key;
        keys[_key].purposes.push(_purpose);
        keys[_key].keyType = _type;

        keysByPurpose[_purpose].push(_key);

        emit KeyAdded(_key, _purpose, _type);

        return true;
    }

    function approve(uint256 _id, bool _approve)
        public
        returns (bool success)
    {
        require(keyHasPurpose(keccak256(abi.encodePacked(msg.sender)), 2), "Sender does not have action key");

        emit Approved(_id, _approve);

        if (_approve == true) {
            executions[_id].approved = true;
            // success= executions[_id].to.call.data(executions[_id].data).value(executions[_id].value);
            (success, ) = executions[_id].to.call.value(executions[_id].value).gas(50000)(executions[_id].data);
            // success = true; // for temporary usage
            if (success) {
                executions[_id].executed = true;
                emit Executed(
                    _id,
                    executions[_id].to,
                    executions[_id].value,
                    executions[_id].data
                );
                return true;
            } else {
                emit ExecutionFailed(
                    _id,
                    executions[_id].to,
                    executions[_id].value,
                    executions[_id].data
                );
                return false;
            }
        } else {
            executions[_id].approved = false;
        }
        return true;
    }

    function execute(address _to, uint256 _value, bytes memory _data)
        public
        returns (uint256 executionId)
    {
        require(!executions[executionNonce].executed, "Already executed");
        executions[executionNonce].to = _to;
        executions[executionNonce].value = _value;
        executions[executionNonce].data = _data;

        emit ExecutionRequested(executionNonce, _to, _value, _data);

        if (keyHasPurpose(keccak256(abi.encodePacked(msg.sender)),1) || keyHasPurpose(keccak256(abi.encodePacked(msg.sender)),2)) {
            approve(executionNonce, true);
        }

        executionNonce++;
        return executionNonce-1;
    }

    function removeKey(bytes32 _key, uint256 _purpose)
        public
        returns (bool success)
    {
        uint256[] storage purposeList = keys[_key].purposes;
        bool purposeExists;
        for(uint i = 0; i<purposeList.length; i++) {
            if(keys[_key].purposes[i] == _purpose){
                purposeExists = true;
            }
        }

        require(purposeExists, "Purpose does not exist");
        
        // require(keys[_key].key == _key, "No such key");
        if (msg.sender != address(this)) {
            require(keyHasPurpose(keccak256(abi.encodePacked(msg.sender)), 1), "Sender does not have management key"); // Sender has MANAGEMENT_KEY
        }
        emit KeyRemoved(keys[_key].key, _purpose, keys[_key].keyType);

        /* uint index;
        (index,) = keysByPurpose[keys[_key].purpose.indexOf(_key);
        keysByPurpose[keys[_key].purpose.removeByIndex(index); */

        bytes32[] storage keyList = keysByPurpose[_purpose];

        for(uint i = 0; i<keyList.length; i++) {
            if(keyList[i] == _key) {
                delete keyList[i];
                keyList[i] = keyList[keyList.length-1];
                keyList.length--;
            }
        }

        for(uint i = 0; i<purposeList.length; i++) {
            if(purposeList[i] == _purpose) {
                purposeList[i] = purposeList[purposeList.length-1];
                purposeList.length--;
            }
        }

        return true;
    }

    /**
    * @notice implementation of the changeKeysRequired from ERC-734 standard
    * TODO : complete the code for this function Dilip
    */
    function changeKeysRequired(uint256 purpose, uint256 number) external
    {
        if (purpose == 0) {
            revert();
        }

        if (number == 0) {
            revert();
        }
        return;
    }

    /**
    * @notice implementation of the getKeysRequired from ERC-734 standard
    * TODO : complete the code for this function Dilip
    */
    function getKeysRequired(uint256 purpose) external view returns(uint256)
    {
        return purpose;
    }

    function keyHasPurpose(bytes32 _key, uint256 _purpose)
        public
        view
        returns(bool result)
    {
        bool isThere;
        if (keys[_key].key == 0) return false;
        for(uint purpose = 0; purpose < keys[_key].purposes.length; purpose++) {
            if(keys[_key].purposes[purpose] <= _purpose)
                isThere = true;
        }
        // isThere = keys[_key].purpose <= _purpose;
        return isThere;
    }
}
