pragma solidity >=0.4.21 <0.6.0;

//interface
contract IClaimTypesRegistry{
    
    uint256[] claimTypes;
    event claimTypeAdded(uint256 indexed claimType);
    event claimTypeRemoved(uint256 indexed claimType);


    function addClaimType(uint256 claimType) public;
    function removeClaimType(uint256 claimType) public;
    function getClaimTypes() public view returns (uint256[] memory);

}
