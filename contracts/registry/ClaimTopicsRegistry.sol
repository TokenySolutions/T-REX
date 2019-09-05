pragma solidity >=0.4.21 <0.6.0;

import "../registry/IClaimTopicsRegistry.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract ClaimTopicsRegistry is IClaimTopicsRegistry, Ownable{
    /**
    * @notice Add a trusted claim topic (For example: KYC=1, AML=2).
    * Only owner can call.
    *
    * @param claimTopic The claim topic index
    */
    function addClaimTopic(uint256 claimTopic) public onlyOwner{
        uint length = claimTopics.length;
        for(uint i = 0; i<length; i++){
            require(claimTopics[i]!=claimTopic, "claimTopic already exists");
        }
        claimTopics.push(claimTopic);
        emit claimTopicAdded(claimTopic);
    }
    /**
    * @notice Remove a trusted claim topic (For example: KYC=1, AML=2).
    * Only owner can call.
    *
    * @param claimTopic The claim topic index
    */

    function removeClaimTopic(uint256 claimTopic) public onlyOwner {
        uint length = claimTopics.length;
        for (uint i = 0; i<length; i++) {
            if(claimTopics[i] == claimTopic) {
                delete claimTopics[i];
                claimTopics[i] = claimTopics[length-1];
                delete claimTopics[length-1];
                claimTopics.length--;
                emit claimTopicRemoved(claimTopic);
                return;
            }
        }
    }
    /**
    * @notice Get the trusted claim topics for the security token
    *
    * @return Array of trusted claim topics
    */

    function getClaimTopics() public view returns (uint256[] memory) {
        return claimTopics;
    }
}
