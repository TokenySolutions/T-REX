pragma solidity ^0.6.0;

import "@onchain-id/solidity/contracts/IIdentity.sol";
import "../roles/AgentRole.sol";
import "../registry/IIdentityRegistryStorage.sol";
import "../destroyable/Destroyable.sol";


contract IdentityRegistryStorage is IIdentityRegistryStorage, AgentRole, Destroyable {

    /// mapping between a user address and the corresponding identity contract
    mapping(address => IIdentity) private identity;

    /// mapping between a user address and its corresponding country
    mapping(address => uint16) private investorCountry;

    /// array of Identity Registries linked to this storage
    address[] private identityRegistries;

   /**
    *  @dev See {IIdentityRegistryStorage-linkedIdentityRegistries}.
    */
    function linkedIdentityRegistries() public override view returns (address[] memory){
        return identityRegistries;
    }

   /**
    *  @dev See {IIdentityRegistryStorage-storedIdentity}.
    */
    function storedIdentity(address _userAddress) public override view returns (IIdentity){
        return identity[_userAddress];
    }

   /**
    *  @dev See {IIdentityRegistryStorage-storedInvestorCountry}.
    */
    function storedInvestorCountry(address _userAddress) public override view returns (uint16){
        return investorCountry[_userAddress];
    }

   /**
    *  @dev See {IIdentityRegistryStorage-addIdentityToStorage}.
    */
    function addIdentityToStorage(address _userAddress, IIdentity _identity, uint16 _country) public override onlyAgent {
        require(address(_identity) != address(0), "contract address can't be a zero address");
        require(address(identity[_userAddress]) == address(0), "identity contract already exists, please use update");
        identity[_userAddress] = _identity;
        investorCountry[_userAddress] = _country;
        emit IdentityStored(_userAddress, _identity);
    }

   /**
    *  @dev See {IIdentityRegistryStorage-modifyStoredIdentity}.
    */
    function modifyStoredIdentity(address _userAddress, IIdentity _identity) public override onlyAgent {
        require(address(identity[_userAddress]) != address(0), "this user has no identity registered");
        require(address(_identity) != address(0), "contract address can't be a zero address");
        identity[_userAddress] = _identity;
        emit IdentityModified(identity[_userAddress], _identity);
    }

   /**
    *  @dev See {IIdentityRegistryStorage-modifyStoredInvestorCountry}.
    */
    function modifyStoredInvestorCountry(address _userAddress, uint16 _country) public override onlyAgent {
        require(address(identity[_userAddress]) != address(0), "this user has no identity registered");
        investorCountry[_userAddress] = _country;
        emit CountryModified(_userAddress, _country);
    }

   /**
    *  @dev See {IIdentityRegistryStorage-removeIdentityFromStorage}.
    */
    function removeIdentityFromStorage(address _userAddress) public override onlyAgent {
        require(address(identity[_userAddress]) != address(0), "you haven't registered an identity yet");
        delete identity[_userAddress];
        delete investorCountry[_userAddress];
        emit IdentityUnStored(_userAddress, identity[_userAddress]);
    }

   /**
    *  @dev See {IIdentityRegistryStorage-transferOwnershipOnIdentityRegistryStorage}.
    */
    function transferOwnershipOnIdentityRegistryStorage(address _newOwner) external override onlyOwner {
        transferOwnership(_newOwner);
    }

    /**
    *  @dev See {IIdentityRegistryStorage-bindIdentityRegistry}.
    */
    function bindIdentityRegistry(address _identityRegistry) external override {
        addAgent(_identityRegistry);
        identityRegistries.push(_identityRegistry);
        emit IdentityRegistryBound(_identityRegistry);
    }

    /**
     *  @dev See {IIdentityRegistryStorage-unbindIdentityRegistry}.
     */
    function unbindIdentityRegistry(address _identityRegistry) external override {
        require(identityRegistries.length > 0, "identity registry is not stored");
        uint length = identityRegistries.length;
        for (uint i = 0; i < length; i++) {
            if (identityRegistries[i] == _identityRegistry) {
                delete identityRegistries[i];
                identityRegistries[i] = identityRegistries[length - 1];
                delete identityRegistries[length - 1];
                identityRegistries.pop();
                break;
            }
        }
        removeAgent(_identityRegistry);
        emit IdentityRegistryUnbound(_identityRegistry);
    }
}
