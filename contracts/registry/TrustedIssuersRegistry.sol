pragma solidity >=0.4.21 <0.6.0;



import "../identity/ClaimHolder.sol";
import "../../openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract TrustedIssuersRegistry is Ownable {

    //Mapping between a trusted issuer index and its corresponding identity contract address.
    mapping (uint => ClaimHolder) trustedIssuers;

    //Array stores the trusted issuer indexes
    uint[] indexes;

    event trustedIssuerAdded(uint indexed index, ClaimHolder indexed trustedIssuer);
    event trustedIssuerRemoved(uint indexed index, ClaimHolder indexed trustedIssuer);
    event trustedIssuerUpdated(uint indexed index, ClaimHolder indexed oldTrustedIssuer, ClaimHolder indexed newTrustedIssuer);

   /**
    * @notice Adds the identity contract of a trusted claim issuer corresponding
    * to the index provided.
    * Requires the index to be greater than zero.
    * Requires that an identity contract doesnt already exist corresponding to the index.
    * Only owner can
    *
    * @param _trustedIssuer The identity contract address of the trusted claim issuer.
    * @param index The desired index of the claim issuer
    */
    function addTrustedIssuer(ClaimHolder _trustedIssuer, uint index) onlyOwner public {
        require(index > 0);
        require(address(trustedIssuers[index])==address(0), "A trustedIssuer already exists by this name");
        require(address(_trustedIssuer) != address(0));
        uint length = indexes.length;
        for (uint i = 0; i<length; i++) {
            require(_trustedIssuer != trustedIssuers[indexes[i]], "Issuer address already exists in another index");
        }
        trustedIssuers[index] = _trustedIssuer;
        indexes.push(index);
        emit trustedIssuerAdded(index, _trustedIssuer);
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
    }

   /**
    * @notice Function for getting all the trusted claim issuer indexes stored.
    *
    * @return array of indexes of all the trusted claim issuer indexes stored.
    */
    function getTrustedIssuers() public view returns (uint[] memory) {
        return indexes;
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
    function getTrustedIssuer(uint index) public view returns (ClaimHolder) {
        require(index > 0);
        require(address(trustedIssuers[index])!=address(0), "No such issuer exists");
        return trustedIssuers[index];
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
    */
    function updateIssuerContract(uint index, ClaimHolder _newTrustedIssuer) public onlyOwner {
        require(index > 0);
        require(address(trustedIssuers[index])!=address(0), "No such issuer exists");
        uint length = indexes.length;
        for (uint i = 0; i<length; i++) {
            require(trustedIssuers[indexes[i]]!=_newTrustedIssuer,"Address already exists");
        }
        emit trustedIssuerUpdated(index, trustedIssuers[index], _newTrustedIssuer);
        trustedIssuers[index] = _newTrustedIssuer;
    }
}
