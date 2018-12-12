# T-REX : Token for Regulated EXchanges

<br><br>

<p align="center">
  <a href="https://tokeny.com/whitepaper-t-rex-security-tokens/">
  <img src="./docs/img/Xmas T-REX.png" width="150" title="t-rex">
  </a>
</p>


## Table of contents

- [Abstract](#abstract)
- [Motivation](#motivation)
  - [Constraints for Tokenized Securities](#constraints)
  - [Necessity of Permissioned Tokens](#permissioned)
  - [On-chain identity management](#onchainID)
- [Definitions](#definitions)
- [Specifications](#specifications)
  - [Identity Contract](#idContractSpec)
  - [Identity Registry](#idRegistrySpec)
  - [Claim Verifier](#claimVerifierSpec)
  - [Trusted Claim Issuers Registry](#trustedClaimIssuerRegistrySpec)
  - [Trusted Claim Types Registry](#trustedClaimTypesRegistrySpec)
  - [Transfer Manager](#transferManagerSpec)
  - [Token](#tokenSpec)
- [Additional References](#additionalRef)
- [Developers](#developers)
  - [Setup](#setup)
  - [Run Tests](#runTest)
  
------------------------------------------------------------------------------------------------------------------------------------------

<div id='abstract'>

## Abstract

Following the emergence of Bitcoin and other so-called crypto-currencies, the last two years have seen through a wave of ICOs (Initial Coins Offerings), leveraging on the DLT technology underpinning most cryptocurrencies to support the issuance of other types of instruments. This wave has seen mainly the issuance of utility tokens in a completely unregulated environment. More recently, we have seen a new type of tokens emerging in the form of security (or investment) tokens which, in essence - and a number of regulators have started to confirm that - should be assimilated to securities i.e. equivalents to traditional securities but which are issued, maintained and transferred on a DLT infrastructure. One of the most important features that security tokens bear is, contrary to utility tokens, the fact that existing securities laws and practices should be considered as applying to them and, among others, all requirements in terms of KYC and AML regulations which, essentially, aim at controlling who holds a security and transacts in it in order to detect and prevent money-laundering, terrorism financing and other illegal or fraudulent activities.

The main goal of the T-REX standard is to create a set of global tools, fully based on blockchain technologies, to allow frictionless and compliant issuance and use of tokenized securities on a peer to peer basis or through marketplaces but in full compliance with regulations and issuers requirements, by embedding controls mechanisms in the tokens themselves. With T-REX, we are implementing a “Compliance by Design” approach where it is simply impossible for an investor to buy a security without being compliant. The regulator itself can verify the compliance of the Issuer through the auditing of the smart contracts that support the Security Token life cycle.

The management of compliant transactions through T-REX backed permission tokens will be based on 3 main pillars creating a decentralized Validator: 

- A blockchain based identity management system, allowing the creation of a globally accessible identity for every stakeholder; 
- A set of claims, as described in the [ERC-725](https://github.com/ethereum/EIPs/issues/725) and [ERC-735](https://github.com/ethereum/EIPs/issues/735) standards.
- A transfer manager whose role is to act as a filter of all the transactions of tokenized securities and which will check the claims of the stakeholders, essentially it will check that the receiver has the rights to receive the tokens following the specific compliance rules and issuer requirements applicable for this specific asset. The transfer manager will block the transaction if the receiver misses a mandatory claim and will notify him about the reason of the failure. 

These 3 key elements allow issuers to use a decentralized Validator to control transfers and enforce compliance on the holders of the security token he has issued. The Validator includes rules for the whole offering (e.g. managing the max number of holders allowed in a specific markets, when such rule apply), and rules for each investors (e.g. KYC or issuer-defined eligibility criteria) thanks to the identity management system. 
</div>

------------------------------------------------------------------------------------------------------------------------------------------

<div id='motivation'>
  
## Motivation

  <div id ='constraints'>
  
### Constraints for Tokenized Securities

Although, so far, the rules applicable to issuing and holding utility tokens were largely undefined - or at least very vague - in most countries, an STO consists in the issuance of a security that uses the blockchain technology as its registry, proof of ownership and transfer infrastructure. Such instrument is regulated in every country and, as a consequence, STOs have to comply with the related regulations of the country where the security token is issued as well as those of the countries where it is distributed (sold). 

Characteristics | Utility Token | Security Token
:---: | :---: | :---:
Purpose | Usage | Investment
Regulation | Non existing or vague in most cases | Stringent as existing securities laws should be taken as reference
Lifecycle | Simple | As complex as a security
Secondary Market | Nearly no constraints | As complex as a security

Another significant difference between ICOs and STOs is related to the token lifecycle. ICOs - dealing with utility tokens - result in the issuance of tokens having a relatively simple life cycle: once the token is shared among a decentralized network, its governance is mostly the results of its token economics. As to security tokens, it is quite different, as the issuer - or its appointed agent - remains generally liable for applying a number of controls to his token after issuance and during the entire “life” of its security token. In addition, he might need to apply a number of corporate actions (dividend/interests payments, … ) or corporate events (calling for an AGM/EGM, …) to its token which further increase the need for the issuer to keep in touch with (keep some control on) the investors in his token.

One could identify two main types of control requirements related to the issuance, the holding and the transfer of security tokens :
- One relates to regulations applicable to the security considered, that are independent of the security token itself (i.e. general rules). For example, the need to identify the investor, to collect a proof of his identity, to check his name against blacklists, i.e. generally speaking, control requirements related to AML/KYC, or other applicable regulatory rules.
- Then some controls might be related specifically to the security that is issued, for example, restrictions about the investor type and location or about the amount of money that can be invested on a certain period. These might be linked to the regulatory environment under which the issuer has decided to issue his token or simply linked to eligibility criteria defined by the issuer for instance, for commercial reasons (e.g. restricting the access of a certain share class, having specific fees characteristics, to investors of a specific country).

Addressing these different control requirements will require a high level of reusability and flexibility when designing the token. 
This is the reason why we have designed the T-REX standard. It  provides a set of generic tools helping token issuers to apply and manage the necessary controls and permissions to security tokens through a flexible decentralized validation system (the transfer manager), allowing them to add all the rules that need to be addressed to approve holding and transacting in their tokens.
  
  </div>
  <div id ='permissioned'>
  
### Necessity of Permissioned Tokens

In our opinion, only permissioned tokens are suitable to issue security tokens because there cannot be a total, uncontrolled, freedom of the transaction in such instruments and, investors need to comply with a number of criteria - either by regulation or imposed by the issuer himself in order to be eligible for holding the tokens. The main technical difference between standard [ERC-20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md) tokens and T-REX permissioned tokens resides in the transfer function of T-REX tokens being made conditional, the condition for a transaction to be executed being that the transfer manager approves it according to the governance criteria defined for the the token in question. However, despite this modification of the transfer function of the token, it is to be highlighted that, because the token structure is based on the ERC-20 standard, it remains fully compatible with with it and all the available exchanges and tools based on ERC-20 tokens. 

Most of the “Security token protocols” promoted in the industry so far are permissioned tokens. The transfer function is modified and requests a transfer approval from an external validator service to control the transfer of tokens. 
T-REX involves an on-chain identity management system allowing issuers to control the transfer of ownership directly on-chain.  
  
  </div>
  <div id ='onchainID'>

### On-chain identity management

As mentioned before, by essence, a security token being subject to a stringent governance, its distribution has to follow all the applicable regulations and, in particular, those aspects related to KYC rules. In that respect, we believe that identity management is key to implement such compliance on the blockchain. 

As the ownership of a security token is registered on the blockchain, we believe it is necessary to have a way to track the token ownership and to prohibit illicit transactions directly on the blockchain. This is why there is a need need to make a link between wallet addresses and identities and to manage rights through an identity contract directly on the blockchain. In addition, we also need to ensure privacy of those identities in order to comply with personal data related regulation. For this reason, personal data should not be stored directly on the blockchain but only the validation certificates (claims) issued by trusted third parties (KYC provider, government, lawyer,…) having checked these data. Those certificates (claims), stored in the identities of parties to a transaction will be used by the transfer manager to validate whether those parties are hold and transact a specific security token, or not. 

Linking an investor’s wallet and to his identity can bring significant added value to stakeholders in the nascent security tokens market. For example, it will allow a token issuer to replace the tokens of an investor if the investor loses access to his wallet (which happens pretty often and generally results in the loss of the owner’s assets ), by verifying that his on-chain identity fits with off-chain data linked to the identity contract corresponding to the lost wallet. After the identity of the investor is confirmed, the issuer can burn the lost tokens and mint new tokens on the new wallet of the investor. 

Also, on-chain identities and the certificates (claims) they store can potentially be re-used for passing KYC’s for other security tokens than the one for which those claims were originally provided or even for other purposes than investments (e.g. account opening at an exchange, identification with compatible web services, …). If Google and Facebook accounts are the identities of most people on the internet of information, on-chain identities can be the ones of the internet of value. They are really owned and controlled by their owner. 

  </div>
</div>

------------------------------------------------------------------------------------------------------------------------------------------

<div id='definitions'>

## Definitions

<p align="center">
  <img src="./docs/img/T-REX Components.png" width="800" title="components">
</p>

- `claim` : For more details about `claims` and `claim` related issues (`claim type`, `claim issuer`, ...), take a look at [ERC-735](https://github.com/ethereum/EIPs/issues/735)

- `keys` : For more details about `keys`and `keys` related issues, take a look at [ERC-725](https://github.com/ethereum/EIPs/issues/725)

- `Identity Contract` : This is a smart contract deployed by a user to record and manage his identity on blockchain. In the context of T-REX, investor’s (but also the issuer’s and issuer’s provider’s) identities are used to interact with the security token (obviously, this onchain identity is also to be used for other activities where the identification of the identity holder might be relevant) . The identity holds `keys` and `claims`. The identity contract is based on the ERC-725 and ERC-735 standards and it includes all the necessary functions to manage `keys` and `claims` related to that specific identity. The `Identity Contract` is not linked to a specific token and it only needs to be deployed once by each user. It can then be used for whatever purpose where the use of an onchain identity might be relevant).

- `Identity Registry` : This smart contract stores the identity addresses of all the authorized investors in the issuer’s security token i.e. all identities of investors who have been authorized to hold and transact in the token after having gone through the appropriate KYC and eligibility checks. It is actually a dynamic whitelist of identities for a specific token. It also contains a function called `isVerified()` which returns a status based on the validity of `claims` (as per the security token requirements) in the user’s `Identity Contract`. The `Identity Registry` is managed by the issuer (or his agent) i.e. only the issuer (or his agent) can add or remove identities in the registry (note: this is the basic configuration but can be customized depending on the requirements of the token issuer in terms of administering his token). There is a specific `Identity Registry` for each security token.

- `Claim Verifier` : Is a smart contract that verifies the `claims` attached to an investor’s `Identity Contract` for the issued security token. For example, if a security token requires that `claims` are signed by a specific `claim issuer` (e.g. the entity responsible for KYC checks for this specific token) and that the investor identity should contain the KYC `claim type` (user has undergone successful KYC verification for the token considered), then the `Claim Verifier` simply checks whether the investor’s `Identity Contract` has a `claim` signed by the relevant `claim issuer` and it contains the KYC `claim type` needed. Based on the results, the contract returns a `true` or `false` value. When the `Identity Registry` makes a call to its `isVerified()` function it makes calls to the `claimIsValid()` function from the `Claim Verifier` for each `claim` that needs to be verified, and for each call, the `Claim Verifier` returns `true` or `false`. The transfer of ownership of the token is only possible if all the calls required to `claimIsValid()` return a `true` value.

- `Trusted Claim Issuers Registry`: This smart contract stores the contract addresses(identities) of all the trusted `claim issuers` for a specific security token. The `Identity Contract` of token owners (the investors) must have `claims` signed by the `claim issuers` stored in this smart contract in order to be able to hold the token. The ownership of this contract is given to the token issuer allowing him to manage this registry as per his requirements.

- `Trusted Claim Types Registry`: This smart contract stores all the trusted `claim types` for the security token. The `Identity Contract` of token owners must have `claims` of the `claim types` stored in this smart contract. The ownership of this contract is given to the token issuer allowing them to manage this registry as per their requirements.

- `Permissioned tokens`: T-REX permissioned tokens are based on a standard `ERC-20` structure but with some functions being added to it in order to ensure compliance of the transactions in the security tokens. The functions `transfer()` and `transferFrom()` are implemented in a conditional way, allowing them to proceed with a transfer only `IF` the `Transfer Manager` approves the transaction. All the functions that can be added to a standard `ERC-20` token can also be added to the T-REX permissioned tokens (`Mintable`, `Burnable`, `Pausable`, …). The permissioned tokens are allowed to be transferred only to valid counterparts (i.e. whose identity is in the token identity registry) , in order to  avoid tokens being held in wallets/identity contracts of ineligible/unauthorized investors. The T-REX standard also supports the re-issuance of security tokens in case an investor loses his/her wallet private key. A history of tokens re-issuance of is maintained on the blockchain for transparency reasons.

- `Transfer Manager`: The `Transfer Manager` is the last piece of the puzzle. It is the contract that will make the link between all the collectible data and verify the compliance of a transaction. This is the contract that `check()` for the validity of a `transfer()`. By interacting with the `Identity Registry` about the validity of `claims` in the `Identity Contracts` of the seller, the `Transfer Manager` may or may not allow the transfer of security tokens (depending on the status returned by the `Identity Registry` to the `Transfer Manager` in response to the `check()` initiated). Apart from investor identity eligibility, the `Transfer Manager` will also validate more general token (or issuer) restrictions e.g. maintaining a max investor cap or a max tokens cap (as it might be needed for certain securities in certain specific countries of distribution). The contract is modular to support the addition of multiple general compliance rules as per the requirement of the token issuer or the regulatory framework under which the token is operated.

</div>

------------------------------------------------------------------------------------------------------------------------------------------

<div id='specifications'>

## Specifications

------------------------------------------------------------------------------------------------------------------------------------------

  <div id='idContractSpec'>

### Identity Contract

#### ERC-725

Complete specifications on the [ERC-725](https://github.com/ethereum/EIPs/issues/725) standard description.

#### ERC-735

Complete specifications on the [ERC-735](https://github.com/ethereum/EIPs/issues/735) standard description.

#### ClaimHolder

The `ClaimHolder` is implementing the `ERC-735` and the `KeyHolder` contracts and add the notion of ownership

```solidity
contract ClaimHolder is KeyHolder, ERC735 {

    mapping (bytes32 => Claim) claims;
    mapping (uint256 => bytes32[]) claimsByType;
    address owner;
    
    constructor() public {
        owner = msg.sender;
    }
}    
```

- **getOwner**

Returns the address of the owner of a `claim` 

```solidity
function getOwner() public view returns(address);
```

#### KeyHolder

The `KeyHolder` is implementing the `ERC-725` contract as described by [Origin](https://github.com/OriginProtocol/origin-playground) on their identity management protocol

  </div>
  
------------------------------------------------------------------------------------------------------------------------------------------

  <div id='idRegistrySpec'>

### Identity Registry

- **registerIdentity**

Register an `Identity Contract` corresponding to a user address.<br>
Requires that the user address should be the `owner` of the `Identity Contract`. <br>
Requires that the user doesn't have an `Identity Contract` already deployed. <br>
Only the `owner` (i.e. the token issuer) can call this function. <br>

```solidity
function registerIdentity(address _user, ClaimHolder _identity);
```
Triggers `identityRegistered(_identity)` event

- **updateIdentity**

Updates an `Identity Contract` corresponding to a user address. <br>
Requires that the user address should be the `owner` of the `Identity Contract`. <br>
Requires that the user should have an `Identity Contract` already deployed that will be replaced. <br>
Only the `owner` (i.e. the token issuer) can call this function. <br>

```solidity
function updateIdentity(address _user, ClaimHolder _identity);
```
Triggers `identityUpdated(identity[_user], _identity)` event

- **deleteIdentity**

Removes an user from the `Identity Registry`. <br>
Requires that the user have an `Identity Contract` already deployed that will be deleted. <br>
Only the `owner` (i.e. the token issuer) can call this function. <br>

```solidity
function deleteIdentity(address _user);
```
Triggers `identityRemoved(identity[msg.sender])` event


- **isVerified**

This function checks whether an `Identity Contract` corresponding to the provided user address has the required `claims` or not based on the security token. <br>
return `TRUE` if the address is verified, `FALSE` if not.

```solidity
function isVerified(address _userAddress) public view returns (bool);
```

- **setClaimTypesRegistry**

Registry setter for `Trusted Claim Types Registry` <br>
Only the `owner` (i.e. the token issuer) can call this function. <br>

```solidity
function setClaimTypesRegistry(address _claimTypesRegistry);
```
Triggers `claimTypesRegistrySet(_claimTypesRegistry)` event

- **setTrustedIssuerRegistry**

Registry setter for `Trusted Claim Issuers Registry`. <br>
Only the `owner` (i.e. the token issuer) can call this function. <br>

```solidity
function setTrustedIssuerRegistry(address _trustedIssuersRegistry);
```
Triggers `trustedIssuersRegistrySet(_trustedIssuersRegistry)` event

#### Events

- **identityRegistered**

**MUST** be triggered when an `registerIdentity` was successfully called.

```solidity
event identityRegistered(ClaimHolder indexed identity);
```

- **identityRemoved**

**MUST** be triggered when `deleteIdentity` was successfully called.

```solidity
event identityRemoved(ClaimHolder indexed identity);
```

- **identityUpdated**

**MUST** be triggered when `updateIdentity` was successfully called.

```solidity
event identityUpdated(ClaimHolder indexed old_identity, ClaimHolder indexed new_identity);
```

- **claimTypesRegistrySet**

**MUST** be triggered when `setClaimTypesRegistry` was successfully called. 

```solidity
event claimTypesRegistrySet(address indexed _claimTypesRegistry);
```

- **trustedIssuersRegistrySet**

**MUST** be triggered when `setTrustedIssuerRegistry` was successfully called.

```solidity
event trustedIssuersRegistrySet(address indexed _trustedIssuersRegistry);
```

  </div>
  
------------------------------------------------------------------------------------------------------------------------------------------

  <div id='claimVerifierSpec'>
  
### Claim Verifier

- **claimIsValid**

Returns `TRUE` if the claim meets the requirements(`Trusted Claim Type issued` by a `Trusted Claim Issuer`) and `FALSE` if not. 

```solidity
function claimIsValid(ClaimHolder _identity, uint256 claimType)public constant returns (bool claimValid);
 ```
 
Triggers `ClaimValid` event if the claim meets the requirements. <br>
Triggers `ClaimInvalid` event if the claim doesn't meet the requirements. <br>

- **getRecoveredAddress**

Recovers the address of the `data` signer

```solidity
function getRecoveredAddress(bytes sig, bytes32 dataHash) public view returns (address addr);
```

#### Events

- **ClaimValid**

**COULD** be triggered `IF` the `claim` was valid.

```solidity
event ClaimValid(ClaimHolder _identity, uint256 claimType);
```

- **ClaimInvalid**

**COULD** be triggered `IF` the `claim` was invalid.

```solidity
event ClaimInvalid(ClaimHolder _identity, uint256 claimType);
```

  </div>
  
------------------------------------------------------------------------------------------------------------------------------------------

  <div id='trustedClaimIssuerRegistrySpec'>
  
### Trusted Claim Issuers Registry

- **addTrustedIssuer**

Adds the `Identity Contract` of a `Trusted Claim Issuer` corresponding to the `index` provided. <br>
Requires the `index` to be greater than zero. <br>
Requires that an `Identity Contract` doesn't already exist corresponding to the `index`. <br>
Only the owner of the Registry (i.e. the token issuer) can call this function. <br>

```solidity
function addTrustedIssuer(ClaimHolder _trustedIssuer, uint index);
```
Triggers a `trustedIssuerAdded` event.

- **removeTrustedIssuer**

Removes the `Identity Contract` of a `Trusted Claim Issuer` corresponding to the `index` provided. <br>
Requires the `index` to be greater than zero. <br>
Requires that an `Identity Contract` exists corresponding to the `index`. <br>
Only the `owner` of the `Registry` (i.e. the token issuer) can call this function. <br>

```solidity
function removeTrustedIssuer(uint index);
```
Triggers a `trustedIssuerRemoved` event.

- **getTrustedIssuers**

Function for getting all the `Trusted Claim Issuer` `indexes` stored. <br>
Returns the array of `indexes` of all the `Trusted Claim Issuer` stored. <br>
```solidity
function getTrustedIssuers() public view returns (uint[]);
```

- **getTrustedIssuer**

Function for getting the `Trusted Claim Issuer`'s `Identity Contract` address corresponding to the `index` provided. <br>
Requires the provided `index` to have an `Identity Contract` stored. <br>
Only the `owner` of the `Registry` (i.e. the token issuer) can call this function. <br>

```solidity
function getTrustedIssuer(uint index) public view returns (ClaimHolder);
```

- **updateIssuerContract**

Updates the `Identity Contract` of a `Trusted Claim Issuer` corresponding to the `index` provided. <br>
Requires the `index` to be greater than zero. <br>
Requires that an `Identity Contract` already exists corresponding to the provided `index`. <br>
Only the `owner` of the `Registry` (i.e. the token issuer) can call this function. <br>

```solidity
function updateIssuerContract(uint index, ClaimHolder _newTrustedIssuer);
```
Triggers a `trustedIssuerUpdated` event.

#### Events

- **trustedIssuerAdded**

**MUST** be triggered when `addTrustedIssuer` was successfully called.

```solidity
event trustedIssuerAdded(uint indexed index, ClaimHolder indexed trustedIssuer);
```

- **trustedIssuerRemoved**

**MUST** be triggered when `removeTrustedIssuer` was successfully called.

```solidity
event trustedIssuerRemoved(uint indexed index, ClaimHolder indexed trustedIssuer);
```

- **trustedIssuerUpdated**

**MUST** be triggered when `updateIssuerContract` was successfully called.

```solidity
event trustedIssuerUpdated(uint indexed index, ClaimHolder indexed oldTrustedIssuer, ClaimHolder indexed newTrustedIssuer);
```

  </div>

------------------------------------------------------------------------------------------------------------------------------------------

  <div id='trustedClaimTypesRegistrySpec'>

### Trusted Claim Types Registry

- **addClaimType**

Add a `Trusted Claim Type` (For example: KYC=1, AML=2). <br>
Only the `owner` of the `Registry` (i.e. the token issuer) can call this function. <br>

```solidity
function addClaimType(uint256 claimType);
```
Triggers a `claimTypeAdded` event.

- **removeClaimType**

Remove a `Trusted Claim Type` (For example: KYC=1, AML=2). <br>
Only the `owner` of the `Registry` (i.e. the token issuer) can call this function. <br>

```solidity
function removeClaimType(uint256 claimType);
```
Triggers a `claimTypeRemoved` event.

- **getClaimTypes**

Get the `Trusted Claim Types` for the `security token`
Returns an array of `Trusted Claim Types`
```solidity
function getClaimTypes() public view returns (uint256[]);
```

#### Events

- **claimTypeAdded**

**MUST** be triggered when `addClaimType` was successfully called.
```solidity
event claimTypeAdded(uint256 indexed claimType);
```

- **claimTypeRemoved**

**MUST** be triggered when `removeClaimType` was successfully called.
```solidity
event claimTypeRemoved(uint256 indexed claimType);
```

  </div>

------------------------------------------------------------------------------------------------------------------------------------------

  <div id='transferManagerSpec'>
  
### Transfer Manager

The `Transfer Manager`contract uses and overrides the functions from `Ownable` and `StandardToken` from the [ERC-20](https://github.com/OpenZeppelin/openzeppelin-solidity/tree/master/contracts/token/ERC20) standard. <br>
```solidity
contract TransferManager is Ownable, StandardToken
```
  
- **transfer**

[ERC-20](https://github.com/OpenZeppelin/openzeppelin-solidity/tree/master/contracts/token/ERC20) overridden function that include logic to check for trade validity. <br>
Require that the `msg.sender` and `to` addresses are not `frozen`. <br>
If the `to` address is not currently a `shareholder` then it MUST become one. <br>
If the `transfer` will reduce `msg.sender`'s balance to 0 then that address MUST be removed from the list of `shareholders`. <br>
Returns `true` if successful and `revert` if unsuccessful <br>

```solidity
function transfer(address _to, uint256 _value) public returns (bool);
```
  
- **transferFrom**

[ERC-20](https://github.com/OpenZeppelin/openzeppelin-solidity/tree/master/contracts/token/ERC20) overridden function that include logic to check for trade validity. <br>
Require that the `from` and `to` addresses are not `frozen`. <br>
If the `to` address is not currently a `shareholder` then it MUST become one. <br>
If the `transfer` will reduce `from`'s balance to 0 then that address MUST be removed from the list of `shareholders`. <br>
Returns `true` if successful and `revert` if unsuccessful <br>

```solidity
function transferFrom(address _from, address _to, uint256 _value) public returns (bool);
```
  
- **holderCount**

This function returns the total number of token holder addresses.<br>
Only the `owner` (i.e. the token issuer) can call this function. <br>

```solidity
function holderCount() public onlyOwner view returns (uint);
```
  
- **holderAt**

This function returns the address of the `shareholder` at a specified `index` in the holder array. <br>
Requires `index` to be smaller than `holderCount` result. <br>
Only the `owner` (i.e. the token issuer) can call this function. <br>

```solidity
function holderAt(uint256 index) public onlyOwner view returns (address);
```
  
- **updateShareholders**

If the address is not in the `shareholders` array then push it and update the `holderIndices` mapping. <br>

```solidity
function updateShareholders(address addr);
```
  
- **pruneShareholders**

If the address is in the `shareholders` array and the forthcoming `transfer` or `transferFrom` will reduce their balance to 0, then we need to remove them from the `shareholders` array.<br>
```solidity
function pruneShareholders(address addr, uint256 value);
```
  
- **cancelAndReissue**

Cancel the original address and reissue the Tokens to the replacement address. <br>
Access to this function MUST be strictly controlled. Only the `owner` (i.e. the token issuer) can call this function. <br>
The `original` address MUST be removed from the `Identity Registry`. <br>
Throw if the `original` address supplied is not a `shareholder`. <br>
Throw if the replacement address is not a `verified` address. <br>

```solidity
function cancelAndReissue(address original, address replacement);
```
Triggers `VerifiedAddressSuperseded` event.

- **isSuperseded**

Checks to see if the supplied address was `superseded`. <br>
Returns `true` if the supplied address was `superseded` by another address. <br>

```solidity
function isSuperseded(address addr) public view onlyOwner returns (bool);
```
  
- **getCurrentFor**

Gets the most recent address, given a `superseded` one. <br>
Addresses may be `superseded` multiple times, so this function needs to follow the chain of addresses until it reaches the final, verified address. <br>
Returns the verified address that ultimately holds the share. <br>

```solidity
function getCurrentFor(address addr) public view onlyOwner returns (address);
```

- **findCurrentFor**

Recursively find the most recent address given a `superseded` one. <br>
Returns the verified address that ultimately holds the share. <br>

```solidity
function findCurrentFor(address addr) internal view returns (address);
```
  
- **setAddressFrozen**

Sets an address `frozen` status for this token. <br>
Only the `owner` (i.e. the token issuer) can call this function. <br>

```solidity
function setAddressFrozen(address addr, bool freeze);
```
Triggers `AddressFrozen` event. <br>

- **setIdentityRegistry**

`Identity Registry` setter. <br>
Only the `owner` (i.e. the token issuer) can call this function. <br>

```solidity
function setIdentityRegistry(address _identityRegistry);
```
Triggers `identityRegistryAdded` event. <br>

#### Events
  
- **identityRegistryAdded**

**MUST** be triggered when `setIdentityRegistry` was successfully called.
```solidity
event identityRegistryAdded(address indexed _identityRegistry);
```
  
- **VerifiedAddressSuperseded**

**MUST** be triggered when `cancelAndReissue` was successfully called.
```solidity
event VerifiedAddressSuperseded(address indexed original, address indexed replacement, address indexed sender);
```
  
- **AddressFrozen**

**MUST** be triggered when `setAddressFrozen` was successfully called.
```solidity
event AddressFrozen(address indexed addr,bool indexed isFrozen,address indexed owner);
```
  
  
  </div>
  
------------------------------------------------------------------------------------------------------------------------------------------

  <div id='tokenSpec'>

### Token

`Token` contract is an inheritance of `Mintable` contract.

```solidity
contract Token is Mintable
```

`Mintable` contract is an inheritance of `TransferManager` contract.

```solidity
contract Mintable is TransferManager
```

So, `Token`contract is an inheritance of `TransferManager` contract with the features of `Mintable` contract, therefore the specs of both `Token` and `Mintable` contracts will be described in the following section.

- **setTokenInformation**

This function can be used to change the `name` and/or the `symbol` of the token. <br>
Only the `owner` (i.e. the token issuer) can call this function. <br>
```solidity
function setTokenInformation(string _name, string _symbol);
```
Triggers an `UpdatedTokenInformation` event.

- **mint**

Improved version of default `mint` function. Tokens can be `minted` to an address if only it is a `verified` address contained in the `Identity Registry`.<br>
Only the `owner` (i.e. the token issuer) can call this function. <br>
```solidity
function mint(address _to, uint256 _amount) external onlyOwner canMint returns (bool);
```
Triggers `Mint` event.
Triggers `Transfer` event.

- **finishMinting**

Function to notify the end of the `minting` process, when this function is called it sets `mintingFinished` at `TRUE` and turns the modifier `cannotMint()` on.
Only the `owner` (i.e. the token issuer) can call this function. <br>
```solidity
function finishMinting() external onlyOwner canMint returns (bool);
```
Triggers `MintFinished` event.

- **startMinting**

Function to notify the start of the `minting` process, when this function is called it sets `mintingFinished` at `FALSE` and turns the modifier `canMint()` on.
Only the `owner` (i.e. the token issuer) can call this function. <br>
```solidity
function startMinting() external onlyOwner cannotMint returns (bool);
```
Triggers `MintStarted` event.

#### Events 

- **UpdatedTokenInformation**  

**MUST** be triggered when `setAddressFrozen` was successfully called.
```solidity
event UpdatedTokenInformation(string newName, string newSymbol);
```

- **Mint**

**MUST** be triggered when `mint` was successfully called.
```solidity
event Mint(address indexed to, uint256 amount);
```

- **Transfer**

**MUST** be triggered when `mint` was successfully called.
```solidity
event Transfer(address indexed from, address indexed to, uint tokens);
```

- **MintStarted**

**MUST** be triggered when `startMinting` was successfully called.
```solidity
event MintStarted();
```

- **MintFinished**

**MUST** be triggered when `finishMinting` was successfully called.
```solidity
event MintFinished();
```
  
  </div>


</div>

------------------------------------------------------------------------------------------------------------------------------------------

<div id='additionalRef'>
  
## Additional References

- [White Paper of T-REX Standard](https://tokeny.com/whitepaper-t-rex-security-tokens/)
- [Slides of the ERC Identity presentation by Fabian Vogelsteller](https://www.slideshare.net/FabianVogelsteller/erc-725-identity)
- [EDDITS White Paper](https://eddits.io/wp-content/uploads/2018/03/EDDITS-Whitepaper.pdf)

</div>

------------------------------------------------------------------------------------------------------------------------------------------

<div id='developers'>
  
## Developers

The project is created with truffle. Hence all truffle commands will work.

  <div id='setup'>

### Setup

Install dependencies `npm install`.

  </div>
  <div id='runTest'>

### Run tests

`npm run test`

In case the command breaks, it may be due to node versioning issues. 

Run `npm rebuild` and then run `npm run test` again.

  </div>
</div>

---
