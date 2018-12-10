# T-REX : Token for Regulated EXchanges



<p align="center">
  <img src="./docs/img/T-REX.png" width="150" title="t-rex">
</p>

## Table of contents

- [Abstract](#abstract)
- [Motivation](#motivation)
  - [Constraints for Tokenized Securities](#constraints)
  - [Necessity of Permissioned Tokens](#permissioned)
  - [On-chain identity management](#onchainID)


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

In our opinion, only permissioned tokens are suitable to issue security tokens because there cannot be a total, uncontrolled, freedom of the transaction in such instruments and, investors need to comply with a number of criteria - either by regulation or imposed by the issuer himself in order to be eligible for holding the tokens. The main technical difference between standard ERC-20 tokens and T-REX permissioned tokens resides in the transfer function of T-REX tokens being made conditional, the condition for a transaction to be executed being that the transfer manager approves it according to the governance criteria defined for the the token in question. However, despite this modification of the transfer function of the token, it is to be highlighted that, because the token structure is based on the ERC-20 standard, it remains fully compatible with with it and all the available exchanges and tools based on ERC-20 tokens. 

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

## How it works
T-rex protocol implements ERC-20 methods transfer() and transferFrom() with an additional check to determine whether or not a transfer should be allowed to proceed. The check is done over the identity contracts of both the sender and receiver of tokens. It is checked that whether the investors' identity contracts have the required claims in them as required by the security token. The same check is also extended to minting of tokens. In simple words, an investor's identity contract will have the required claims if only the investor is regulated(verified) based on security token's regulatory rules. For more details have a look at the T-REX Whitepaper.

## Components
For compliant trading of tokens, the trade has to validated in terms of regulated identities. We do that using the following components.
<br>
<br>
<p align="center">
  <img src="docs/img/components.png" width="850" title="identity">
</p>
<br>

There are 3 main components:

* Security Token
* Identity
* Registry

The claim verifier is the main actor that interconnects the 3 components and plays the major role of a trade validator.

### Security Token

The transfer manager contract in this component adds extra functionality over the standard ERC20 token like overriding the transfer functions with a check, maintaining token holders and reissuance of tokens. 

#### Features
* The Security token is a basic ERC20 token with overriden transfer() and transferFrom() methods to make it trade complaint. In the transfer functions we check for the validity of the buyer and seller of the tokens based on ERC725 and ERC735 management of claims. If both the buyer and the seller are regulated identities based on the token's regulation rules, then the transfer is allowed to proceed. 

* The token also has an overriden mint function that only sends tokens to an address if that address has a valid identity based on regulation rules of the security token. This might be important if issuance of tokens involves minting.

* The token is made compliant with Delaware General Corporate Law, [Title 8](https://legis.delaware.gov/json/BillDetail/GenerateHtmlDocument?legislationId=25730&legislationTypeId=1&docTypeId=2&legislationName=SB69). For that it has the following key functions- 
  * setAddressFrozen(): Freezing addresses to stop token transfers.
  * Update and Prune shareholders: Maintains the holders of the security tokens. 
  * Cancel and Reissue: Allows the contract owner to cancel the tokens in an holder's address in case the holder has lost access to the private key and reissue the tokens to a new regulated address.
  * Get holders count: Important function as there are limits on the number of shareholders as per regulations.

### Identity

The identity contract is the core of the T-rex protocol. It leverages the ERC725 and ERC735 standards to make identity management of addresses as seamless as possible. Every investor or claim issuer has to deploy an identity contract to have an identity in the ecosystem.

The identity contract is basically two things: Key holder and a Claim holder. Keys and claims can be added, removed and updated. There are also execute and approve functions that act as a proxy to execute certain transactions.
<br>
<br>
<p align="center">
  <img src="docs/img/identity.png" width="350" title="identity">
</p>
<br>

* Keys: An identity contract acts as holder of keys having varying roles:
  * MANAGEMENT keys, which can manage the identity
  * ACTION keys, which perform actions in this identities name (signing, logins, transactions, etc.)
  * CLAIM signer keys, used to sign claims on other identities which need to be revocable.
  * ENCRYPTION keys, used to encrypt data e.g. hold in claims. 

  Depending on the role of an address, there needs to be a specific key type in the identity contract. For example, a claim issuer that signs a particular claim must have a claim signer key in its identity contract. To execute a transfer of ether, an address needs to have an action key in its identity contract.

* Claims: Claims in an identity contract are the proof of an identity. They are added upon succesful verification of an user and the user uses this as a proof that he/she is a verified(regulated) user. Claims can be signed by a 3rd party(claim issuers) or self-attested. It has the following structure:-

  * Type: The verification method used. For example, KYC, AML, Facebook/google OAUTH etc.
  * Scheme: The signing scheme used. For example, ECDSA.
  * Issuer: The identity contract address of the claim signer. The signers identity contract must contain claim signer key(which signs the claim data) for the claim to be valid.
  * Signature: This is the signature generated by the claim issuer upon succesfull verification of an address. For example, once a user has undergone succesfull KYC checks by the claim issuer, the claim issuer signs a raw data containing the user's identity address, the verification type used and some verified data using the claim signer key in its identity contract.
  * data: Some verified data. For example, can be user's name, address and age in an hashed form.
  * URI: Links to methods used for verification which happens off chain.

* Execute(): Executes an action on other contracts, or itself, or a transfer of ether.
* Approve(): Approves an execution or claim addition.

### Registry 

The registry component contains all the identity contracts of investors and claim issuers. It also stores the claim types (Verification methods like KYC, AML) used by the security token to regulate investors.
<br>
<p align="center">
  <img src="docs/img/registry.png" width="450" title="registry">
</p>
<br>

* Identity registry: This contract stores all the identity contracts of the investors involved. The identity contract for an investor is stored corresponding to his/her ethereum address. the registry ensures that the owner of identity contract being added is the investor himself. This is a key feature as ownership of an identity contract cannot be transferred and no one else can use your deployed identity contract taking advantage of the verified claims to gain access into the ecosystem. 
Some key features of identity registry:- 
  * Identity contract can be added, removed or updated but the access is strictly controlled to the owner.
  * isVerified(address): This function takes in address and checks whether the address' identity contract has the verified and signed claim based on security token regulation requirements. If this function returns true, then that address can be a valid security token holder. 

* Trusted Issuers Registry: This contract stores all the identity contracts of claim issuers trusted by the security token. This means that the claims in the identity contracts of the investors must have been signed by one of the claim issuers in this registry for the claims to be considered valid. Claim issuers can be added, removed, updated but access is strictly controlled.

* Claim Types registry: This contract stores the trusted verification methods the security token supports. For example, if the values 2 and 3 are stored in this registry where 2 means KYC and 3 means AML, the verified claims in the investor's identity contract must have claim types 2 or 3, i.e. the investor must have undergone KYC or AML checks. Claim types can be added, removed, updated but access is strictly controlled. 

* Claim Verifier: This contract checks for validity of the claims in an investor's identity contract. This is done by 4 following steps:
  1. Fetch trusted claim issuers.
  2. Fetch trusted claim Types.
  3. Fetch investor's identity contract.
  4. Check whether the investor's identity contract contains claims of claim Types from step 2 and is signed by a claim issuer from step 1.

# Developers

The project is created with truffle. Hence all truffle commands will work.

## Setup

Install dependencies `npm install`.

## Run tests

`npm run test`

In case the command breaks, it may be due to node versioning issues. 

Run `npm rebuild` and then run `npm run test` again.
