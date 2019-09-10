pragma solidity ^0.5.10;

//interface
contract IClaimTopicsRegistry{

    uint256[] claimTopics;
    event claimTopicAdded(uint256 indexed claimTopic);
    event claimTopicRemoved(uint256 indexed claimTopic);


    function addClaimTopic(uint256 claimTopic) public;
    function removeClaimTopic(uint256 claimTopic) public;
    function getClaimTopics() public view returns (uint256[] memory);

}
