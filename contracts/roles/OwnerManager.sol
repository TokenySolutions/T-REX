pragma solidity ^0.6.0;

import "../token/IToken.sol";
import "../registry/IIdentityRegistry.sol";
import "../registry/ITrustedIssuersRegistry.sol";
import "../registry/IClaimTopicsRegistry.sol";
import "../compliance/ICompliance.sol";
import "./OwnerRoles.sol";
import "@onchain-id/solidity/contracts/IIdentity.sol";
import "@onchain-id/solidity/contracts/IClaimIssuer.sol";

contract OwnerManager is OwnerRoles {

    IToken public token;
    IIdentityRegistry public identityRegistry;
    ITrustedIssuersRegistry public issuersRegistry;
    IClaimTopicsRegistry public topicsRegistry;
    ICompliance public compliance;


    constructor (address _token) public {
        token = IToken(_token);
    }

    function callSetIdentityRegistry(address _identityRegistry, IIdentity onchainID) external {
        require(isRegistryAddressSetter(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Registry Address Setter");
        token.setIdentityRegistry(_identityRegistry);
    }

    function callSetCompliance(address _compliance, IIdentity onchainID) external {
        require(isComplianceSetter(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Compliance Setter");
        token.setCompliance(_compliance);
    }

    function callSetTokenInformation(string calldata _name, string calldata _symbol, uint8 _decimals, string calldata _version, address _onchainID, IIdentity onchainID) external {
        require(isTokenInfoManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Token Information Manager");
        token.setTokenInformation(_name, _symbol, _decimals, _version, _onchainID);
    }

    function callSetClaimTopicsRegistry(address _claimTopicsRegistry, IIdentity onchainID) external {
        require(isRegistryAddressSetter(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Registry Address Setter");
        identityRegistry = token.getIdentityRegistry();
        identityRegistry.setClaimTopicsRegistry(_claimTopicsRegistry);
    }

    function callSetTrustedIssuersRegistry(address _trustedIssuersRegistry, IIdentity onchainID) external {
        require(isRegistryAddressSetter(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT Registry Address Setter");
        identityRegistry = token.getIdentityRegistry();
        identityRegistry.setTrustedIssuersRegistry(_trustedIssuersRegistry);
    }

    function callAddTrustedIssuer(IClaimIssuer _trustedIssuer, uint index, uint[] calldata claimTopics, IIdentity onchainID) external {
        require(isIssuersRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT IssuersRegistryManager");
        identityRegistry = token.getIdentityRegistry();
        issuersRegistry = identityRegistry.getIssuersRegistry();
        issuersRegistry.addTrustedIssuer(_trustedIssuer, index, claimTopics);
    }

    function callRemoveTrustedIssuer(uint index, IIdentity onchainID) external {
        require(isIssuersRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT IssuersRegistryManager");
        identityRegistry = token.getIdentityRegistry();
        issuersRegistry = identityRegistry.getIssuersRegistry();
        issuersRegistry.removeTrustedIssuer(index);
    }

    function callUpdateIssuerContract(uint index, IClaimIssuer _newTrustedIssuer, uint[] calldata claimTopics, IIdentity onchainID) external {
        require(isIssuersRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT IssuersRegistryManager");
        identityRegistry = token.getIdentityRegistry();
        issuersRegistry = identityRegistry.getIssuersRegistry();
        issuersRegistry.updateIssuerContract(index, _newTrustedIssuer, claimTopics);
    }

    function callAddClaimTopic(uint256 claimTopic, IIdentity onchainID) external {
        require(isClaimRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT ClaimRegistryManager");
        identityRegistry = token.getIdentityRegistry();
        topicsRegistry = identityRegistry.getTopicsRegistry();
        topicsRegistry.addClaimTopic(claimTopic);
    }

    function callRemoveClaimTopic(uint256 claimTopic, IIdentity onchainID) external {
        require(isClaimRegistryManager(address(onchainID)) && onchainID.keyHasPurpose(keccak256(abi.encode(msg.sender)), 1), "Role: Sender is NOT ClaimRegistryManager");
        identityRegistry = token.getIdentityRegistry();
        topicsRegistry = identityRegistry.getTopicsRegistry();
        topicsRegistry.removeClaimTopic(claimTopic);
    }

    function callTransferOwnershipOnTokenContract(address newOwner) external onlyAdmin {
        token.transferOwnershipOnTokenContract(newOwner);
    }

    function callTransferOwnershipOnIdentityRegistryContract(address newOwner) external onlyAdmin {
        identityRegistry = token.getIdentityRegistry();
        identityRegistry.transferOwnershipOnIdentityRegistryContract(newOwner);
    }

    function callTransferOwnershipOnComplianceContract(address newOwner) external onlyAdmin {
        compliance = token.getCompliance();
        compliance.transferOwnershipOnComplianceContract(newOwner);
    }

    function callTransferOwnershipOnClaimTopicsRegistryContract(address newOwner) external onlyAdmin {
        identityRegistry = token.getIdentityRegistry();
        topicsRegistry = identityRegistry.getTopicsRegistry();
        topicsRegistry.transferOwnershipOnClaimTopicsRegistryContract(newOwner);
    }

    function callTransferOwnershipOnIssuersRegistryContract(address newOwner) external onlyAdmin {
        identityRegistry = token.getIdentityRegistry();
        issuersRegistry = identityRegistry.getIssuersRegistry();
        issuersRegistry.transferOwnershipOnIssuersRegistryContract(newOwner);
    }
}
