// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import '@onchain-id/solidity/contracts/interface/IClaimIssuer.sol';

contract TIRStorage {
    /// @dev Array containing all TrustedIssuers identity contract address.
    IClaimIssuer[] internal trustedIssuers;

    /// @dev Mapping between a trusted issuer index and its corresponding claimTopics.
    mapping(address => uint256[]) internal trustedIssuerClaimTopics;
}
