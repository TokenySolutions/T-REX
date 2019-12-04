pragma solidity ^0.5.10;

interface IClaimTopicsRegistry{
    // EVENTS
    event ClaimTopicAdded(uint256 indexed claimTopic);
    event ClaimTopicRemoved(uint256 indexed claimTopic);

    // OPERATIONS
    function addClaimTopic(uint256 claimTopic) external;
    function removeClaimTopic(uint256 claimTopic) external;

    // GETTERS
    function getClaimTopics() external view returns (uint256[] memory);
}
