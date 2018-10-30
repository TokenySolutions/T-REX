pragma solidity ^0.4.23;

import "../identity/ClaimHolder.sol";
import "../../zeppelin-solidity/contracts/ownership/Ownable.sol";

contract TrustedIssuersRegistry is Ownable {

    mapping (uint => ClaimHolder) trustedIssuers;
    uint[] indexes;

    event trustedIssuerAdded(uint indexed index, ClaimHolder indexed trustedIssuer);
    event trustedIssuerRemoved(uint indexed index, ClaimHolder indexed trustedIssuer);
    event trustedIssuerUpdated(uint indexed index, ClaimHolder indexed oldTrustedIssuer, ClaimHolder indexed newTrustedIssuer);

    function addTrustedIssuer(ClaimHolder _trustedIssuer, uint index) onlyOwner public {
        require(index != 0);
        require(trustedIssuers[index]==address(0), "A trustedIssuer already exists by this name");
        require(_trustedIssuer != address(0));
        uint length = indexes.length;
        for (uint i = 0; i<length; i++) {
            require(_trustedIssuer != trustedIssuers[indexes[i]], "Issuer address already exists in another index");
        }
        trustedIssuers[index] = _trustedIssuer;
        indexes.push(index);
        emit trustedIssuerAdded(index, _trustedIssuer);
    }

    function removeTrustedIssuer(uint index) onlyOwner public {
        require(index != 0);
        require(trustedIssuers[index]!=address(0), "No such issuer exists");
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
    }
 
    function getTrustedIssuers() public view returns (uint[]) {
        return indexes;
    }

    function getTrustedIssuer(uint index) public view returns (ClaimHolder) {
        require(index != 0);
        require(trustedIssuers[index]!=address(0), "No such issuer exists");
        return trustedIssuers[index];
    }

    function updateIssuerContract(uint index, ClaimHolder _newTrustedIssuer) public onlyOwner {
        require(index != 0);
        require(trustedIssuers[index]!=address(0), "No such issuer exists");
        uint length = indexes.length;
        for (uint i = 0; i<length; i++) {
            require(trustedIssuers[indexes[i]]!=_newTrustedIssuer,"Address already exists");
        }
        emit trustedIssuerUpdated(index, trustedIssuers[index], _newTrustedIssuer);
        trustedIssuers[index] = _newTrustedIssuer;
    }
}