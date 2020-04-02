pragma solidity ^0.6.0;

import "@onchain-id/solidity/contracts/IIdentity.sol";
import "../roles/AgentRole.sol";
import "../registry/IIdentityRegistryStorage.sol";


contract IdentityRegistryStorage is IIdentityRegistryStorage, AgentRole {

    /// struct containing the identity contract and the country of the user
    struct Identity {
        IIdentity identityContract;
        uint16 investorCountry;
    }

    /// mapping between a user address and the corresponding identity
    mapping(address => Identity) identities;

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
        return identities[_userAddress].identityContract;
    }

   /**
    *  @dev See {IIdentityRegistryStorage-storedInvestorCountry}.
    */
    function storedInvestorCountry(address _userAddress) public override view returns (uint16){
        return identities[_userAddress].investorCountry;
    }

   /**
    *  @dev See {IIdentityRegistryStorage-addIdentityToStorage}.
    */
    function addIdentityToStorage(address _userAddress, IIdentity _identity, uint16 _country) public override onlyAgent {
        require(address(_identity) != address(0), "contract address can't be a zero address");
        require(address(identities[_userAddress].identityContract) == address(0), "identity contract already exists, please use update");
        identities[_userAddress].identityContract = _identity;
        identities[_userAddress].investorCountry = _country;
        emit IdentityStored(_userAddress, _identity);
    }

   /**
    *  @dev See {IIdentityRegistryStorage-modifyStoredIdentity}.
    */
    function modifyStoredIdentity(address _userAddress, IIdentity _identity) public override onlyAgent {
        require(address(identities[_userAddress].identityContract) != address(0), "this user has no identity registered");
        require(address(_identity) != address(0), "contract address can't be a zero address");
        identities[_userAddress].identityContract = _identity;
        emit IdentityModified(identities[_userAddress].identityContract, _identity);
    }

   /**
    *  @dev See {IIdentityRegistryStorage-modifyStoredInvestorCountry}.
    */
    function modifyStoredInvestorCountry(address _userAddress, uint16 _country) public override onlyAgent {
        require(address(identities[_userAddress].identityContract) != address(0), "this user has no identity registered");
        identities[_userAddress].investorCountry = _country;
        emit CountryModified(_userAddress, _country);
    }

   /**
    *  @dev See {IIdentityRegistryStorage-removeIdentityFromStorage}.
    */
    function removeIdentityFromStorage(address _userAddress) public override onlyAgent {
        require(address(identities[_userAddress].identityContract) != address(0), "you haven't registered an identity yet");
        delete identities[_userAddress];
        emit IdentityUnstored(_userAddress, identities[_userAddress].identityContract);
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
