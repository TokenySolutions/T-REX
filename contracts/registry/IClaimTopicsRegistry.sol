pragma solidity ^0.5.10;

//interface
contract IClaimTopicsRegistry{

    uint256[] claimTopics;
    event ClaimTopicAdded(uint256 indexed claimTopic);
    event ClaimTopicRemoved(uint256 indexed claimTopic);


    function addClaimTopic(uint256 claimTopic) public;
    function removeClaimTopic(uint256 claimTopic) public;
    function getClaimTopics() public view returns (uint256[] memory);

}
