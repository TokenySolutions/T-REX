# Tokeny Demo DApp

This is a fullstack POC that demonstrates asset tokenisation using the Tokeny protocol.

## Prerequisites

Ensure you have the following installed:
- Node.js and yarn package manager
- Hardhat development environment

## Installation

1. Install dependencies:
   ```bash
   yarn
   ```

2. Start the Hardhat local node:
   ```bash
   npx hardhat node
   ```

3. Deploy required contracts from the TREX root folder:
   ```bash
   npm run deploy:hardhat
   ```

## Configuration

### Backend Setup

1. Import the Postman collection file `Tokeny.postman_collection.json`

2. Configure the admin endpoint with the following schema:
   ```json
   {
     "trexImplementationAuthority": "",
     "trexFactory": "",
     "identityImplementationAuthority": "",
     "identityFactory": "",
     "claimTopicsRegistryProxy": "",
     "trustedIssuersRegistryProxy": "",
     "identityRegistryProxy": "",
     "trustedIssuer": "",
     "claimTopic": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
   }
   ```

3. Use the exact claim topic value shown above. For other contract addresses, locate them in the deployment folder within the root directory and submit them to the backend.

### Wallet Configuration

1. Copy all wallet data from the deployment JSON file. The file structure should look like this:
   ```json
   {
     "chainId": 420420420,
     "network": "assetHub",
     "timestamp": "2025-09-16T16:09:28.673Z",
     "deployer": "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac",
     "factories": {},
     "authorities": {},
     "implementations": {},
     "suite": {},
     "testWallets": {
       "alice": {},
       "bob": {},
       "charlie": {}
     },
     "tokenInfo": {},
     "wallets": []
   }
   ```

2. **Critical Step**: Copy the `wallets` array to `backend/src/artifacts/wallet.json`. The backend will not function without this configuration.

## Usage

### MetaMask Setup

Import any of the generated wallets into MetaMask before using the DApp. When transferring assets to another wallet, ensure you register an identity for that wallet first.

### Starting the Application

Run the complete application:
```bash
yarn dev
```

## Important Notes

- The exact claim topic value must be used as specified
- Wallet configuration is mandatory for backend functionality
- Identity registration is required before asset transfers
- Ensure Hardhat node is running throughout development
- CUSTODIAL_PRIVATE_KEY is the same as in the hardhat script