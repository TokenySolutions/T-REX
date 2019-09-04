pragma solidity >=0.4.21 <0.6.0;


import "../registry/ITrustedIssuerRegistry.sol";
import "../issuerIdentity/IssuerIdentity.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract TrustedIssuersRegistry is ITrustedIssuerRegistry,Ownable {
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
    function addTrustedIssuer(IssuerIdentity _trustedIssuer, uint index, uint[] memory claimTopics) onlyOwner public {
        require(index > 0);
        uint claimTopicsLength = claimTopics.length;
        require(claimTopicsLength > 0);
        require(address(trustedIssuers[index])==address(0), "A trustedIssuer already exists by this name");
        require(address(_trustedIssuer) != address(0));
        uint length = indexes.length;
        for (uint i = 0; i<length; i++) {
            require(_trustedIssuer != trustedIssuers[indexes[i]], "Issuer address already exists in another index");
        }
        trustedIssuers[index] = _trustedIssuer;
        indexes.push(index);
        uint i;
        for(i = 0; i < claimTopicsLength; i++) {
            trustedIssuerClaimTopics[index][i] = claimTopics[i];
        }
        trustedIssuerClaimCount[index] = i;
        trustedIssuer[address(trustedIssuers[index])] = true;
        emit trustedIssuerAdded(index, _trustedIssuer, claimTopics);
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
    function removeTrustedIssuer(uint index) public onlyOwner {
        require(index > 0);
        require(address(trustedIssuers[index])!=address(0), "No such issuer exists");
        delete trustedIssuers[index];
        emit trustedIssuerRemoved(index, trustedIssuers[index]);
        uint length = indexes.length;
        for (uint i = 0; i<length; i++) {
            if(indexes[i] == index) {
                delete indexes[i];
                indexes[i] = indexes[length-1];
                delete indexes[length-1];
                indexes.length--;
                return;
            }
        }
        uint claimTopicCount = trustedIssuerClaimCount[index];
        for(uint i = 0; i < claimTopicCount; i++){
            if(trustedIssuerClaimTopics[index][i] != 0){
                delete trustedIssuerClaimTopics[index][i];
            }
        }
        delete trustedIssuer[address(trustedIssuers[index])];
        delete trustedIssuerClaimCount[index];
    }

   /**
    * @notice Function for getting all the trusted claim issuer indexes stored.
    *
    * @return array of indexes of all the trusted claim issuer indexes stored.
    */
    function getTrustedIssuers() public view returns (uint[] memory) {
        return indexes;
    }

    function isTrustedIssuer(address issuer) public view returns(bool) {
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
    function getTrustedIssuer(uint index) public view returns (IssuerIdentity) {
        require(index > 0);
        require(address(trustedIssuers[index])!=address(0), "No such issuer exists");
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
    function getTrustedIssuerClaimTopics(uint index) public view returns(uint[] memory) {
        require(index > 0);
        require(address(trustedIssuers[index])!=address(0), "No such issuer exists");
        uint256[] memory claimTopics;
        for(uint i = 0; i < trustedIssuerClaimCount[index]; i++) {
            claimTopics[i] = trustedIssuerClaimTopics[index][i];
        }
        return claimTopics;
    }

    /**
    * @notice Function for checking the trusted claim issuer's
    * has corresponding claim topic
    * Requires the provided index to have an identity contract stored and claim topic.
    * Only owner can call.
    *
    * 
    *
    * @return The claim topics corresponding to the trusted issuers.
    */
    function hasClaimTopics(address issuer, uint claimTopic) public view returns(bool) {
        require(claimTopic > 0);
        for( uint i=0;i < indexes.length; i++) {
            if(address(trustedIssuers[indexes[i]])==issuer) {
                uint claimTopicCount = trustedIssuerClaimCount[indexes[i]];
                for(uint j = 0; j < claimTopicCount; j++){
                    if(trustedIssuerClaimTopics[indexes[i]][j] == claimTopic){
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
    function updateIssuerContract(uint index, IssuerIdentity _newTrustedIssuer, uint[] memory claimTopics) public onlyOwner {
        require(index > 0);
        require(address(trustedIssuers[index])!=address(0), "No such issuer exists");
        uint length = indexes.length;
        uint claimTopicsLength = claimTopics.length;
        require(claimTopicsLength > 0);
        for (uint i = 0; i<length; i++) {
            require(trustedIssuers[indexes[i]]!=_newTrustedIssuer,"Address already exists");
        }
        uint i;
        for(i = 0; i < claimTopicsLength; i++) {
            trustedIssuerClaimTopics[index][i] = claimTopics[i];
        }
        trustedIssuerClaimCount[index] = i;
        emit trustedIssuerUpdated(index, trustedIssuers[index], _newTrustedIssuer, claimTopics);
        trustedIssuers[index] = _newTrustedIssuer;
    }
}
