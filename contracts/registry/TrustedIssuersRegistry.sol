pragma solidity ^0.6.0;


import "../registry/ITrustedIssuersRegistry.sol";
import "@onchain-id/solidity/contracts/ClaimIssuer.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract TrustedIssuersRegistry is ITrustedIssuersRegistry, Ownable {
    // Mapping between a trusted issuer index and its corresponding identity contract address.
    mapping(uint => ClaimIssuer) public trustedIssuers;
    mapping(uint => mapping(uint => uint)) public trustedIssuerClaimTopics;
    mapping(uint => uint) public trustedIssuerClaimCount;
    mapping(address => bool) public trustedIssuer;
    // Array stores the trusted issuer indexes
    uint[] public indexes;

    /**
     * @notice Adds the identity contract of a trusted claim issuer corresponding
     * to the index provided.
     * Requires the index to be greater than zero.
     * Requires that an identity contract doesnt already exist corresponding to the index.
     * Only owner can
     *
     * @param _trustedIssuer The identity contract address of the trusted claim issuer.
     * @param index The desired index of the claim issuer
     * @param claimTopics list of authorized claim topics for each trusted claim issuer
     */
    function addTrustedIssuer(ClaimIssuer _trustedIssuer, uint index, uint[] memory claimTopics) public override onlyOwner {
        require(index > 0);
        uint claimTopicsLength = claimTopics.length;
        require(claimTopicsLength > 0);
        require(address(trustedIssuers[index]) == address(0), "A trustedIssuer already exists by this name");
        require(address(_trustedIssuer) != address(0));
        uint length = indexes.length;
        for (uint i = 0; i < length; i++) {
            require(_trustedIssuer != trustedIssuers[indexes[i]], "Issuer address already exists in another index");
        }
        trustedIssuers[index] = _trustedIssuer;
        indexes.push(index);
        uint i;
        for (i = 0; i < claimTopicsLength; i++) {
            trustedIssuerClaimTopics[index][i] = claimTopics[i];
        }
        trustedIssuerClaimCount[index] = i;
        trustedIssuer[address(trustedIssuers[index])] = true;

        emit TrustedIssuerAdded(index, _trustedIssuer, claimTopics);
    }



    /**
     * @notice Removes the identity contract of a trusted claim issuer corresponding
     * to the index provided.
     * Requires the index to be greater than zero.
     * Requires that an identity contract exists corresponding to the index.
     * Only owner can call.
     *
     * @param index The desired index of the claim issuer to be removed.
     */
    function removeTrustedIssuer(uint index) public override onlyOwner {
        require(index > 0);
        require(address(trustedIssuers[index]) != address(0), "No such issuer exists");
        delete trustedIssuer[address(trustedIssuers[index])];
        delete trustedIssuers[index];

        uint length = indexes.length;
        for (uint i = 0; i < length; i++) {
            if (indexes[i] == index) {
                delete indexes[i];
                indexes[i] = indexes[length - 1];
                delete indexes[length - 1];
                indexes.pop();
                break;
            }
        }
        uint claimTopicCount = trustedIssuerClaimCount[index];
        for (uint i = 0; i < claimTopicCount; i++) {
            if (trustedIssuerClaimTopics[index][i] != 0) {
                delete trustedIssuerClaimTopics[index][i];
            }
        }
        delete trustedIssuerClaimCount[index];

        emit TrustedIssuerRemoved(index, trustedIssuers[index]);
    }

    /**
     * @notice Function for getting all the trusted claim issuer indexes stored.
     *
     * @return array of indexes of all the trusted claim issuer indexes stored.
     */
    function getTrustedIssuers() public override view returns (uint[] memory) {
        return indexes;
    }

    function isTrustedIssuer(address issuer) public override view returns (bool) {
        return trustedIssuer[issuer];
    }
    /**
     * @notice Function for getting the trusted claim issuer's
     * identity contract address corresponding to the index provided.
     * Requires the provided index to have an identity contract stored.
     * Only owner can call.
     *
     * @param index The index corresponding to which identity contract address is required.
     *
     * @return Address of the identity contract address of the trusted claim issuer.
     */
    function getTrustedIssuer(uint index) public override view returns (ClaimIssuer) {
        require(index > 0);
        require(address(trustedIssuers[index]) != address(0), "No such issuer exists");

        return trustedIssuers[index];
    }

    /**
    * @notice Function for getting all the claim topic of trusted claim issuer
    * Requires the provided index to have an identity contract stored and claim topic.
    * Only owner can call.
    *
    * @param index The index corresponding to which identity contract address is required.
    *
    * @return The claim topics corresponding to the trusted issuers.
    */
    function getTrustedIssuerClaimTopics(uint index) public override view returns (uint[] memory) {
        require(index > 0);
        require(address(trustedIssuers[index]) != address(0), "No such issuer exists");
        uint length = trustedIssuerClaimCount[index];
        uint[] memory claimTopics = new uint[](length);
        for (uint i = 0; i < length; i++) {
            claimTopics[i] = trustedIssuerClaimTopics[index][i];
        }

        return claimTopics;
    }

    /**
    * @notice Function for checking the trusted claim issuer's
    * has corresponding claim topic
    *
    * @return true if the issuer is trusted for this claim topic.
    */
    function hasClaimTopic(address issuer, uint claimTopic) public override view returns (bool) {
        require(claimTopic > 0);

        for (uint i = 0; i < indexes.length; i++) {
            if (address(trustedIssuers[indexes[i]]) == issuer) {
                uint claimTopicCount = trustedIssuerClaimCount[indexes[i]];
                for (uint j = 0; j < claimTopicCount; j++) {
                    if (trustedIssuerClaimTopics[indexes[i]][j] == claimTopic) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * @notice Updates the identity contract of a trusted claim issuer corresponding
     * to the index provided.
     * Requires the index to be greater than zero.
     * Requires that an identity contract already exists corresponding to the provided index.
     * Only owner can call.
     *
     * @param index The desired index of the claim issuer to be updated.
     * @param _newTrustedIssuer The new identity contract address of the trusted claim issuer.
     * @param claimTopics list of authorized claim topics for each trusted claim issuer
     */
    function updateIssuerContract(uint index, ClaimIssuer _newTrustedIssuer, uint[] memory claimTopics) public override onlyOwner {
        require(index > 0);
        require(address(trustedIssuers[index]) != address(0), "No such issuer exists");
        uint length = indexes.length;
        uint claimTopicsLength = claimTopics.length;
        require(claimTopicsLength > 0);
        for (uint i = 0; i < length; i++) {
            require(trustedIssuers[indexes[i]] != _newTrustedIssuer, "Address already exists");
        }
        uint i;
        for (i = 0; i < claimTopicsLength; i++) {
            trustedIssuerClaimTopics[index][i] = claimTopics[i];
        }
        trustedIssuerClaimCount[index] = i;
        trustedIssuers[index] = _newTrustedIssuer;

        emit TrustedIssuerUpdated(index, trustedIssuers[index], _newTrustedIssuer, claimTopics);
    }
}
