// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import '../registry/IClaimTopicsRegistry.sol';
import '../registry/ITrustedIssuersRegistry.sol';
import '../registry/IIdentityRegistryStorage.sol';

contract IRStorage {
    /// @dev Address of the ClaimTopicsRegistry Contract
    IClaimTopicsRegistry internal tokenTopicsRegistry;

    /// @dev Address of the TrustedIssuersRegistry Contract
    ITrustedIssuersRegistry internal tokenIssuersRegistry;

    /// @dev Address of the IdentityRegistryStorage Contract
    IIdentityRegistryStorage internal tokenIdentityStorage;
}
