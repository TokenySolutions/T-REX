
// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import '@onchain-id/solidity/contracts/interface/IIdentity.sol';

contract IRSStorage {
     /// @dev struct containing the identity contract and the country of the user
    struct Identity {
        IIdentity identityContract;
        uint16 investorCountry;
    }
   /// @dev mapping between a user address and the corresponding identity
    mapping(address => Identity) internal identities;

    /// @dev array of Identity Registries linked to this storage
    address[] internal identityRegistries;
}



