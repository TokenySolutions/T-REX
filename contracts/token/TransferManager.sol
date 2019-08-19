pragma solidity >=0.4.21 <0.6.0;

import "../identity/ClaimHolder.sol";
import "../registry/IClaimTopicsRegistry.sol";
import "../registry/IIdentityRegistry.sol";
import "../compliance/ICompliance.sol";
import "../../openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract TransferManager is Ownable, ERC20 {

    mapping(address => uint256) private holderIndices;
    mapping(address => address) private cancellations;
    mapping (address => bool) frozen;
    mapping (address => ClaimHolder)  _identity;

    mapping(uint16 => uint256) countryShareHolders;

    address[] private shareholders;
    bytes32[] public claimsNotInNewAddress;

    IIdentityRegistry public identityRegistry;
    IClaimTopicsRegistry public topicsRegistry;

    Compliance public compliance;

    event identityRegistryAdded(address indexed _identityRegistry);

    event complianceAdded(address indexed _compliance);

    event VerifiedAddressSuperseded(
        address indexed original,
        address indexed replacement,
        address indexed sender
    );

    event AddressFrozen(
        address indexed addr,
        bool indexed isFrozen,
        address indexed owner
    );

    event recoverySuccess(
        address wallet_lostAddress,
        address wallet_newAddress,
        address investorID
    );

    event recoveryFails(
        address wallet_lostAddress,
        address wallet_newAddress,
        address investorID
    );

    constructor (
        address _identityRegistry,
        address _compliance,
        address _topicsRegistry
    ) public {
        identityRegistry = IIdentityRegistry(_identityRegistry);
        compliance = Compliance(_compliance);
        topicsRegistry = IClaimTopicsRegistry(_topicsRegistry);
    }

    /**
    * @notice ERC-20 overridden function that include logic to check for trade validity.
    *  Require that the msg.sender and to addresses are not frozen.
    *  Require that the to address is a verified address,
    *  If the `to` address is not currently a shareholder then it MUST become one.
    *  If the transfer will reduce `msg.sender`'s balance to 0 then that address
    *  MUST be removed from the list of shareholders.
    *
    * @param _to The address of the receiver
    * @param _value The number of tokens to transfer
    *
    * @return `true` if successful and revert if unsuccessful
    */
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(!frozen[_to] && !frozen[msg.sender]);
        if(identityRegistry.isVerified(_to) && compliance.canTransfer(msg.sender, _to, _value)){
            updateShareholders(_to);
            pruneShareholders(msg.sender, _value);
            return super.transfer(_to, _value);
        }

        revert("Transfer not possible");
    }

    /**
    * @notice ERC-20 overridden function that include logic to check for trade validity.
    *  Require that the from and to addresses are not frozen.
    *  Require that the to address is a verified address,
    *  If the `to` address is not currently a shareholder then it MUST become one.
    *  If the transfer will reduce `from`'s balance to 0 then that address
    *  MUST be removed from the list of shareholders.
    *
    * @param _from The address of the sender
    * @param _to The address of the receiver
    * @param _value The number of tokens to transfer
    *
    * @return `true` if successful and revert if unsuccessful
    */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(!frozen[_to] && !frozen[_from]);
        if(identityRegistry.isVerified(_to) && compliance.canTransfer(_from, _to, _value)){
            updateShareholders(_to);
            pruneShareholders(_from, _value);
            return super.transferFrom(_from, _to, _value);
        }

        revert("Transfer not possible");
    }

    /**
     * Holder count simply returns the total number of token holder addresses.
     */
    function holderCount()
        public
        view
        returns (uint)
    {
        return shareholders.length;
    }

    /**
     *  By counting the number of token holders using `holderCount`
     *  you can retrieve the complete list of token holders, one at a time.
     *  It MUST throw if `index >= holderCount()`.
     *  @param index The zero-based index of the holder.
     *  @return the address of the token holder with the given index.
     */
    function holderAt(uint256 index)
        public
        onlyOwner
        view
        returns (address)
    {
        require(index < shareholders.length);
        return shareholders[index];
    }


    /**
     *  If the address is not in the `shareholders` array then push it
     *  and update the `holderIndices` mapping.
     *  @param addr The address to add as a shareholder if it's not already.
     */
    function updateShareholders(address addr)
        internal
    {
        if (holderIndices[addr] == 0) {
            holderIndices[addr] = shareholders.push(addr);
            uint16 country = identityRegistry.investorCountry(addr);
            countryShareHolders[country]++;
        }
    }

    /**
     *  If the address is in the `shareholders` array and the forthcoming
     *  transfer or transferFrom will reduce their balance to 0, then
     *  we need to remove them from the shareholders array.
     *  @param addr The address to prune if their balance will be reduced to 0.
     @  @dev see https://ethereum.stackexchange.com/a/39311
     */
    function pruneShareholders(address addr, uint256 value)
        internal
    {
        uint256 balance = _balances[addr] - value;
        if (balance > 0) {
            return;
        }
        uint256 holderIndex = holderIndices[addr] - 1;
        uint256 lastIndex = shareholders.length - 1;
        address lastHolder = shareholders[lastIndex];
        // overwrite the addr's slot with the last shareholder
        shareholders[holderIndex] = lastHolder;
        // also copy over the index
        holderIndices[lastHolder] = holderIndices[addr];
        // trim the shareholders array (which drops the last entry)
        shareholders.length--;
        // and zero out the index for addr
        holderIndices[addr] = 0;
        //Decrease the country count
        uint16 country = identityRegistry.investorCountry(addr);
        countryShareHolders[country]--;
    }

    function getShareholderCountByCountry(uint16 index) public view returns (uint) {
        return countryShareHolders[index];
    }

    /**
     *  Cancel the original address and reissue the Tokens to the replacement address.
     *
     *  Access to this function MUST be strictly controlled.
     *  The `original` address MUST be removed from the identity registry.
     *  Throw if the `original` address supplied is not a shareholder.
     *  Throw if the replacement address is not a verified address.
     *  This function MUST emit the `VerifiedAddressSuperseded` event.
     *  @param original The address to be superseded. This address MUST NOT be reused.
     *  @param replacement The address  that supersedes the original. This address MUST be verified.
     */

    function cancelAndReissue(address original, address replacement)
        public
        onlyOwner
    {
        // replace the original address in the shareholders array
        // and update all the associated mappings
        require(replacement != address(0));
        require(holderIndices[original] != 0 && holderIndices[replacement] == 0);
        require(identityRegistry.isVerified(replacement));
        identityRegistry.deleteIdentity(original);
        cancellations[original] = replacement;
        uint256 holderIndex = holderIndices[original] - 1;
        shareholders[holderIndex] = replacement;
        holderIndices[replacement] = holderIndices[original];
        holderIndices[original] = 0;
        _balances[replacement] = _balances[original];
        _balances[original] = 0;
        emit VerifiedAddressSuperseded(original, replacement, msg.sender);
    }

    /**
     *  Checks to see if the supplied address was superseded.
     *  @param addr The address to check
     *  @return true if the supplied address was superseded by another address.
     */
    function isSuperseded(address addr)
        public
        view
        onlyOwner
        returns (bool)
    {
        return cancellations[addr] != address(0);
    }

    /**
     *  Gets the most recent address, given a superseded one.
     *  Addresses may be superseded multiple times, so this function needs to
     *  follow the chain of addresses until it reaches the final, verified address.
     *  @param addr The superseded address.
     *  @return the verified address that ultimately holds the share.
     */
    function getCurrentFor(address addr)
        public
        view
        onlyOwner
        returns (address)
    {
        return findCurrentFor(addr);
    }

    /**
     *  Recursively find the most recent address given a superseded one.
     *  @param addr The superseded address.
     *  @return the verified address that ultimately holds the share.
     */
    function findCurrentFor(address addr)
        internal
        view
        returns (address)
    {
        address candidate = cancellations[addr];
        if (candidate == address(0)) {
            return addr;
        }
        return findCurrentFor(candidate);
    }

    /**
     *  Sets an address frozen status for this token.
     *  @param addr The address for which to update frozen status
     *  @param freeze Frozen status of the address
     */
    function setAddressFrozen(address addr, bool freeze)
    external
    onlyOwner {
        frozen[addr] = freeze;

        emit AddressFrozen(addr, freeze, msg.sender);
    }

    //Identity registry setter.
    function setIdentityRegistry(address _identityRegistry) public onlyOwner {
        identityRegistry = IIdentityRegistry(_identityRegistry);
        emit identityRegistryAdded(_identityRegistry);
    }

    function setCompliance(address _compliance) public onlyOwner {
        compliance = Compliance(_compliance);
        emit complianceAdded(_compliance);
    }

    uint256[]  claimTopics;
    bytes32[]  lostAddressClaimIds;
    bytes32[]  newAddressClaimIds;
    uint256 foundClaimTopic;
    uint256 scheme;
    address issuer;
    bytes  sig;
    bytes  data;

    function recoveryAddress(address wallet_lostAddress, address wallet_newAddress, address investorID) public  {
        require(identityRegistry.contains(wallet_lostAddress), "wallet should be in the registry");

        ClaimHolder _investorID = ClaimHolder(investorID);

        // Check if the token issuer/Tokeny has the management key to the investorID
        bytes32 _key = keccak256(abi.encodePacked(msg.sender));

        if(_investorID.keyHasPurpose(_key, 1)) {
            require(_investorID.keyHasPurpose(_key, 1), "Signer should have management key");

            // Burn tokens on the lost wallet
            uint investorTokens = balanceOf(wallet_lostAddress);
            _burn(wallet_lostAddress, investorTokens);

            // Remove lost wallet management key from the investorID
            bytes32 lostWalletkey = keccak256(abi.encodePacked(wallet_lostAddress));
            if (_investorID.keyHasPurpose(lostWalletkey, 1)) {
                _investorID.removeKey(lostWalletkey);
            }

            // Add new wallet to the identity registry and link it with the investorID
            identityRegistry.registerIdentity(wallet_newAddress, _investorID, identityRegistry.investorCountry(wallet_lostAddress));

            // Remove lost wallet from the identity registry
            identityRegistry.deleteIdentity(wallet_lostAddress);

            // Mint equivalent token amount on the new wallet
            _mint(wallet_newAddress, investorTokens);

            emit recoverySuccess(wallet_lostAddress, wallet_newAddress, investorID);

        }
        else {
            emit recoveryFails(wallet_lostAddress, wallet_newAddress, investorID);
        }
    }
}
