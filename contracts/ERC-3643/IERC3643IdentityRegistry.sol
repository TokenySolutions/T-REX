// SPDX-License-Identifier: CC0-1.0
//
//                                             :+#####%%%%%%%%%%%%%%+
//                                         .-*@@@%+.:+%@@@@@%%#***%@@%=
//                                     :=*%@@@#=.      :#@@%       *@@@%=
//                       .-+*%@%*-.:+%@@@@@@+.     -*+:  .=#.       :%@@@%-
//                   :=*@@@@%%@@@@@@@@@%@@@-   .=#@@@%@%=             =@@@@#.
//             -=+#%@@%#*=:.  :%@@@@%.   -*@@#*@@@@@@@#=:-              *@@@@+
//            =@@%=:.     :=:   *@@@@@%#-   =%*%@@@@#+-.        =+       :%@@@%-
//           -@@%.     .+@@@     =+=-.         @@#-           +@@@%-       =@@@@%:
//          :@@@.    .+@@#%:                   :    .=*=-::.-%@@@+*@@=       +@@@@#.
//          %@@:    +@%%*                         =%@@@@@@@@@@@#.  .*@%-       +@@@@*.
//         #@@=                                .+@@@@%:=*@@@@@-      :%@%:      .*@@@@+
//        *@@*                                +@@@#-@@%-:%@@*          +@@#.      :%@@@@-
//       -@@%           .:-=++*##%%%@@@@@@@@@@@@*. :@+.@@@%:            .#@@+       =@@@@#:
//      .@@@*-+*#%%%@@@@@@@@@@@@@@@@%%#**@@%@@@.   *@=*@@#                :#@%=      .#@@@@#-
//      -%@@@@@@@@@@@@@@@*+==-:-@@@=    *@# .#@*-=*@@@@%=                 -%@@@*       =@@@@@%-
//         -+%@@@#.   %@%%=   -@@:+@: -@@*    *@@*-::                   -%@@%=.         .*@@@@@#
//            *@@@*  +@* *@@##@@-  #@*@@+    -@@=          .         :+@@@#:           .-+@@@%+-
//             +@@@%*@@:..=@@@@*   .@@@*   .#@#.       .=+-       .=%@@@*.         :+#@@@@*=:
//              =@@@@%@@@@@@@@@@@@@@@@@@@@@@%-      :+#*.       :*@@@%=.       .=#@@@@%+:
//               .%@@=                 .....    .=#@@+.       .#@@@*:       -*%@@@@%+.
//                 +@@#+===---:::...         .=%@@*-         +@@@+.      -*@@@@@%+.
//                  -@@@@@@@@@@@@@@@@@@@@@@%@@@@=          -@@@+      -#@@@@@#=.
//                    ..:::---===+++***###%%%@@@#-       .#@@+     -*@@@@@#=.
//                                           @@@@@@+.   +@@*.   .+@@@@@%=.
//                                          -@@@@@=   =@@%:   -#@@@@%+.
//                                          +@@@@@. =@@@=  .+@@@@@*:
//                                          #@@@@#:%@@#. :*@@@@#-
//                                          @@@@@%@@@= :#@@@@+.
//                                         :@@@@@@@#.:#@@@%-
//                                         +@@@@@@-.*@@@*:
//                                         #@@@@#.=@@@+.
//                                         @@@@+-%@%=
//                                        :@@@#%@%=
//                                        +@@@@%-
//                                        :#%%=
//
pragma solidity 0.8.27;

import "@onchain-id/solidity/contracts/interface/IIdentity.sol";
import "./IERC3643IdentityRegistryStorage.sol";
import "./IERC3643TrustedIssuersRegistry.sol";
import "./IERC3643ClaimTopicsRegistry.sol";

/// Events

/// @dev This event is emitted when the ClaimTopicsRegistry has been set for the IdentityRegistry.
/// @param _claimTopicsRegistry is the address of the Claim Topics Registry contract.
event ClaimTopicsRegistrySet(address indexed _claimTopicsRegistry);

/// @dev This event is emitted when the IdentityRegistryStorage has been set for the IdentityRegistry.
/// @param _identityStorage is the address of the Identity Registry Storage contract.
event IdentityStorageSet(address indexed _identityStorage);

/// @dev This event is emitted when the TrustedIssuersRegistry has been set for the IdentityRegistry.
/// @param _trustedIssuersRegistry is the address of the Trusted Issuers Registry contract.
event TrustedIssuersRegistrySet(address indexed _trustedIssuersRegistry);

/// @dev This event is emitted when an Identity is registered into the Identity Registry.
/// @param _investorAddress is the address of the investor's wallet.
/// @param _identity is the address of the Identity smart contract (onchainID).
event IdentityRegistered(
  address indexed _investorAddress,
  IIdentity indexed _identity
);

/// @dev This event is emitted when an Identity is removed from the Identity Registry.
/// @param _investorAddress is the address of the investor's wallet.
/// @param _identity is the address of the Identity smart contract (onchainID).
event IdentityRemoved(
  address indexed _investorAddress,
  IIdentity indexed _identity
);

/// @dev This event is emitted when an Identity has been updated.
/// @param _oldIdentity is the old Identity contract's address to update.
/// @param _newIdentity is the new Identity contract's.
event IdentityUpdated(
  IIdentity indexed _oldIdentity,
  IIdentity indexed _newIdentity
);

/// @dev This event is emitted when an Identity's country has been updated.
/// @param _investorAddress is the address on which the country has been updated
/// @param _country is the numeric code (ISO 3166-1) of the new country
event CountryUpdated(address indexed _investorAddress, uint16 indexed _country);

interface IERC3643IdentityRegistry {
  /// Functions

  /// Identity Registry Setters

  /**
   *  @dev Replace the actual identityRegistryStorage contract with a new one.
   *  This function can only be called by the wallet set as owner of the smart contract
   *  @param _identityRegistryStorage The address of the new Identity Registry Storage
   *  emits `IdentityStorageSet` event
   */
  function setIdentityRegistryStorage(
    address _identityRegistryStorage
  ) external;

  /**
   *  @dev Replace the actual claimTopicsRegistry contract with a new one.
   *  This function can only be called by the wallet set as owner of the smart contract
   *  @param _claimTopicsRegistry The address of the new claim Topics Registry
   *  emits `ClaimTopicsRegistrySet` event
   */
  function setClaimTopicsRegistry(address _claimTopicsRegistry) external;

  /**
   *  @dev Replace the actual trustedIssuersRegistry contract with a new one.
   *  This function can only be called by the wallet set as owner of the smart contract
   *  @param _trustedIssuersRegistry The address of the new Trusted Issuers Registry
   *  emits `TrustedIssuersRegistrySet` event
   */
  function setTrustedIssuersRegistry(address _trustedIssuersRegistry) external;

  /// Registry Actions
  /**
   *  @dev Register an identity contract corresponding to a user address.
   *  Requires that the user doesn't have an identity contract already registered.
   *  This function can only be called by a wallet set as agent of the smart contract
   *  @param _userAddress The address of the user
   *  @param _identity The address of the user's identity contract
   *  @param _country The country of the investor
   *  emits `IdentityRegistered` event
   */
  function registerIdentity(
    address _userAddress,
    IIdentity _identity,
    uint16 _country
  ) external;

  /**
   *  @dev Removes an user from the identity registry.
   *  Requires that the user have an identity contract already deployed that will be deleted.
   *  This function can only be called by a wallet set as agent of the smart contract
   *  @param _userAddress The address of the user to be removed
   *  emits `IdentityRemoved` event
   */
  function deleteIdentity(address _userAddress) external;

  /**
   *  @dev Updates the country corresponding to a user address.
   *  Requires that the user should have an identity contract already deployed that will be replaced.
   *  This function can only be called by a wallet set as agent of the smart contract
   *  @param _userAddress The address of the user
   *  @param _country The new country of the user
   *  emits `CountryUpdated` event
   */
  function updateCountry(address _userAddress, uint16 _country) external;

  /**
   *  @dev Updates an identity contract corresponding to a user address.
   *  Requires that the user address should be the owner of the identity contract.
   *  Requires that the user should have an identity contract already deployed that will be replaced.
   *  This function can only be called by a wallet set as agent of the smart contract
   *  @param _userAddress The address of the user
   *  @param _identity The address of the user's new identity contract
   *  emits `IdentityUpdated` event
   */
  function updateIdentity(address _userAddress, IIdentity _identity) external;

  /**
   *  @dev function allowing to register identities in batch
   *  This function can only be called by a wallet set as agent of the smart contract
   *  Requires that none of the users has an identity contract already registered.
   *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_userAddresses.length` IS TOO HIGH,
   *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
   *  @param _userAddresses The addresses of the users
   *  @param _identities The addresses of the corresponding identity contracts
   *  @param _countries The countries of the corresponding investors
   *  emits _userAddresses.length `IdentityRegistered` events
   */
  function batchRegisterIdentity(
    address[] calldata _userAddresses,
    IIdentity[] calldata _identities,
    uint16[] calldata _countries
  ) external;

  /// Registry Consultation

  /**
   *  @dev This functions checks whether a wallet has its Identity registered or not
   *  in the Identity Registry.
   *  @param _userAddress The address of the user to be checked.
   *  @return 'True' if the address is contained in the Identity Registry, 'false' if not.
   */
  function contains(address _userAddress) external view returns (bool);

  /**
   *  @dev This functions checks whether an identity contract
   *  corresponding to the provided user address has the required claims or not based
   *  on the data fetched from trusted issuers registry and from the claim topics registry
   *  @param _userAddress The address of the user to be verified.
   *  @return 'True' if the address is verified, 'false' if not.
   */
  function isVerified(address _userAddress) external view returns (bool);

  /**
   *  @dev Returns the onchainID of an investor.
   *  @param _userAddress The wallet of the investor
   */
  function identity(address _userAddress) external view returns (IIdentity);

  /**
   *  @dev Returns the country code of an investor.
   *  @param _userAddress The wallet of the investor
   */
  function investorCountry(address _userAddress) external view returns (uint16);

  // identity registry getters
  /**
   *  @dev Returns the IdentityRegistryStorage linked to the current IdentityRegistry.
   */
  function identityStorage()
    external
    view
    returns (IERC3643IdentityRegistryStorage);

  /**
   *  @dev Returns the TrustedIssuersRegistry linked to the current IdentityRegistry.
   */
  function issuersRegistry()
    external
    view
    returns (IERC3643TrustedIssuersRegistry);

  /**
   *  @dev Returns the ClaimTopicsRegistry linked to the current IdentityRegistry.
   */
  function topicsRegistry() external view returns (IERC3643ClaimTopicsRegistry);
}
