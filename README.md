# T-REX : Token for Regulated EXchanges

![GitHub](https://img.shields.io/github/license/TokenySolutions/T-REX?color=green) 
![GitHub release (latest by date)](https://img.shields.io/github/v/release/TokenySolutions/T-REX)
![GitHub Workflow Status (branch)](https://img.shields.io/github/actions/workflow/status/TokenySolutions/T-REX/publish-release.yml)
![GitHub repo size](https://img.shields.io/github/repo-size/TokenySolutions/T-REX)
![GitHub Release Date](https://img.shields.io/github/release-date/TokenySolutions/T-REX)

----

<div style="padding: 16px;">
   <a href="https://tokeny.com/wp-content/uploads/2023/04/Tokeny_TREX-v4_SC_Audit_Report.pdf" target="_blank">
       <img src="https://hacken.io/wp-content/uploads/2023/02/ColorWBTypeSmartContractAuditBackFilled.png" alt="Proofed by Hacken - Smart contract audit" style="width: 258px; height: 100px;">
   </a>
</div>

----

The following document describes the technical details of the T-REX standard. <br>
The T-REX standard was developed to provide a fully compliant environment for the issuance and use of tokenized securities. <br>
The project is fully described in the T-REX White Paper available [here](https://tokeny.com/wp-content/uploads/2020/05/Whitepaper-T-REX-Security-Tokens-V3.pdf) <br>

----

<br><br>

<p align="center">
  <a href="https://tokeny.com/wp-content/uploads/2020/05/Whitepaper-T-REX-Security-Tokens-V3.pdf">
  <img src="./docs/img/T-REX.png" width="150" title="t-rex">
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
  - [T-REX token](#trexDoc)
- [Additional References](#additionalRef)
- [Developers](#developers)
  - [Setup](#setup)
  - [Run Tests](#runTest)
  
------------------------------------------------------------------------------------------------------------------------------------------

<div id='abstract'>

## Abstract

Following the emergence of Bitcoin and other so-called crypto-currencies, the last years have seen through a wave of ICOs (Initial Coins Offerings), leveraging on the DLT technology underpinning most cryptocurrencies to support the issuance of other types of instruments. This wave has seen mainly the issuance of utility tokens in a completely unregulated environment. More recently, we have seen a new type of tokens emerging in the form of security (or investment) tokens which, in essence - and a number of regulators have started to confirm that - should be assimilated to securities i.e. equivalents to traditional securities but which are issued, maintained and transferred on a DLT infrastructure. One of the most important features that security tokens bear is, contrary to utility tokens, the fact that existing securities laws and practices should be considered as applying to them and, among others, all requirements in terms of KYC and AML regulations which, essentially, aim at controlling who holds a security and transacts in it in order to detect and prevent money-laundering, terrorism financing and other illegal or fraudulent activities.

The main goal of the T-REX standard is to create a set of global tools, fully based on blockchain technologies, to allow frictionless and compliant issuance and use of tokenized securities on a peer to peer basis or through marketplaces but in full compliance with regulations and issuers requirements, by embedding controls mechanisms in the tokens themselves. With T-REX, we are implementing a “Compliance by Design” approach where it is simply impossible for an investor to buy a security without being compliant. The regulator itself can verify the compliance of the Issuer through the auditing of the smart contracts that support the Security Token life cycle.

The management of compliant transactions through T-REX backed permission tokens will be based on 3 main pillars creating a decentralized Validator: 

- A blockchain based identity management system, allowing the creation of a globally accessible identity for every stakeholder; 
- A set of claims, as described in the [ERC-734](https://github.com/ethereum/EIPs/issues/734) and [ERC-735](https://github.com/ethereum/EIPs/issues/735) standards.
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

- `claim` : For more details about `claims` and `claim` related issues (`claim topic`, `claim issuer`, ...), take a look at [ERC-735](https://github.com/ethereum/EIPs/issues/735)

- `keys` : For more details about `keys`and `keys` related issues, take a look at [ERC-734](https://github.com/ethereum/EIPs/issues/734)

- `Identity Contract` : This is a smart contract deployed by a user to record and manage his identity on blockchain. In the context of T-REX, investor’s (but also the issuer’s and issuer’s provider’s) identities are used to interact with the security token (obviously, this onchain identity is also to be used for other activities where the identification of the identity holder might be relevant) . The identity holds `keys` and `claims`. The identity contract is based on the ERC-734 and ERC-735 standards and it includes all the necessary functions to manage `keys` and `claims` related to that specific identity. The `Identity Contract` is not linked to a specific token and it only needs to be deployed once by each user. It can then be used for whatever purpose where the use of an onchain identity might be relevant).

- `Identity Registry` : This smart contract stores the identity addresses of all the authorized investors in the issuer’s security token i.e. all identities of investors who have been authorized to hold and transact in the token after having gone through the appropriate KYC and eligibility checks. It is actually a dynamic whitelist of identities for a specific token. It also contains a function called `isVerified()` which returns a status based on the validity of `claims` (as per the security token requirements) in the user’s `Identity Contract`. The `Identity Registry` is managed by the issuer (or his agent) i.e. only the issuer (or his agent) can add or remove identities in the registry (note: this is the basic configuration but can be customized depending on the requirements of the token issuer in terms of administering his token). There is a specific `Identity Registry` for each security token.

- `Trusted Claim Issuers Registry`: This smart contract stores the contract addresses(identities) of all the trusted `claim issuers` for a specific security token. The `Identity Contract` of token owners (the investors) must have `claims` signed by the `claim issuers` stored in this smart contract in order to be able to hold the token. The ownership of this contract is given to the token issuer allowing him to manage this registry as per his requirements.

- `Trusted Claim Topics Registry`: This smart contract stores all the trusted `claim topics` for the security token. The `Identity Contract` of token owners must have `claims` of the `claim topics` stored in this smart contract. The ownership of this contract is given to the token issuer allowing them to manage this registry as per their requirements.

- `Compliance`: The `Compliance` contract is the contract that will verify the regulatory compliance of a transaction following
 pre-set rules defined by the legal paperwork related to the security token. Apart from investor identity
  eligibility, the `Compliance` will validate more general restrictions e.g. maintaining a max investor cap or a
   max tokens cap (as it might be needed for certain securities in certain specific countries of distribution). The contract is modular to support the addition of multiple general compliance rules as per the requirement of the token issuer or the regulatory framework under which the token is operated.
  
- `Permissioned tokens`: T-REX permissioned tokens are based on a standard `ERC-20` structure but with some functions
 being added to it in order to ensure compliance of the transactions in the security tokens. The functions `transfer
 ()` and `transferFrom()` are implemented in a conditional way, allowing them to proceed with a transfer only **IF** the transaction is compliant with the rules set in the `Compliance` contract **AND IF** the receiver is eligible
  to receive tokens, i.e. the receiver's wallet is registered in the `Identity Registry` and his/her ONCHAINID
   contains the necessary claims as listed in the `Claim Topics Registry` emitted by the right claim issuers as
    listed in the `Trusted Issuers Registry`.
  The T-REX standard also supports the re-issuance of security tokens in case an investor loses his/her wallet private key. A history of tokens re-issuance is maintained on the blockchain for transparency reasons.

</div>

------------------------------------------------------------------------------------------------------------------------------------------

<div id='specifications'>

## Specifications

------------------------------------------------------------------------------------------------------------------------------------------

  <div id='idContractSpec'>

### Identity Contract

check the documentation of [onchainID](https://docs.onchainid.com/)

  </div>
  
------------------------------------------------------------------------------------------------------------------------------------------

  <div id='trexDoc'>

### T-REX Contracts

check the documentation of [T-REX](https://docs.tokeny.com/docs/smart-contracts)

------------------------------------------------------------------------------------------------------------------------------------------

<div id='additionalRef'>
  
## Additional References

- [Understand Token Transfers on T-REX](https://github.com/TokenySolutions/T-REX/blob/master/docs/README.md)
- [White Paper of T-REX Standard](https://tokeny.com/wp-content/uploads/2020/05/Whitepaper-T-REX-Security-Tokens-V3.pdf)
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

`npm test`

  </div>
</div>

---
