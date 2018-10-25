pragma solidity ^0.4.23;

import "../../zeppelin-solidity/contracts/ownership/Ownable.sol";

contract ClaimTypesRegistry is Ownable{

    event claimTypeAdded(uint256 indexed claimType);
    event claimTypeRemoved(uint256 indexed claimType);

    uint256[] claimTypes;

    function addClaimType(uint256 claimType) public onlyOwner{
        for(uint i = 0; i<claimTypes.length; i++){
            require(claimTypes[i]!=claimType, "claimType already exists");
        }
        claimTypes.push(claimType);
        emit claimTypeAdded(claimType);
    }

    function removeClaimType(uint256 claimType) public onlyOwner {
        for (uint i = 0; i<claimTypes.length; i++) {
            if(claimTypes[i] == claimType) {
                delete claimTypes[i];
                claimTypes[i] = claimTypes[claimTypes.length-1];
                delete claimTypes[claimTypes.length-1];
                claimTypes.length--;
                emit claimTypeRemoved(claimType);
                return;
            }
        }
    }
 
    function getClaimTypes() public view returns (uint256[]) {
        return claimTypes;
    }
}