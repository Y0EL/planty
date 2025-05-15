# PlantyNFT Contract - Integration with VeBetterPassport

This document provides comprehensive documentation for the PlantyNFT contract that integrates with the VeBetterPassport system to create NFTs for users based on their passport verification status.

## Overview

PlantyNFT is an ERC721 NFT contract that issues NFTs to users who have a valid passport in the VeBetterPassport system. The NFTs have different tiers based on the user's participation score in the DAO ecosystem.

### Key Features

- **Passport Integration**: NFTs can only be minted to addresses with a valid passport or whitelisted status
- **Tiered NFTs**: Different NFT tiers (BRONZE, SILVER, GOLD, PLATINUM) based on participation score
- **Upgradeability**: The contract is upgradeable using the UUPS pattern
- **Role-Based Access**: Multiple roles for different administrative actions
- **Batch Minting**: Support for batch minting to multiple users

## Contract Structure

The PlantyNFT contract inherits from several OpenZeppelin contracts:

- `ERC721Upgradeable`: Base NFT functionality
- `ERC721EnumerableUpgradeable`: Enumeration of tokens
- `ERC721URIStorageUpgradeable`: Custom token URIs
- `AccessControlUpgradeable`: Role-based access control
- `ReentrancyGuardUpgradeable`: Protection against reentrancy attacks
- `UUPSUpgradeable`: Upgradeable contract pattern

## Roles

- `DEFAULT_ADMIN_ROLE`: Can grant and revoke all roles
- `ADMIN_ROLE`: General admin functions
- `MINTER_ROLE`: Can mint NFTs to users
- `UPGRADER_ROLE`: Can upgrade the contract
- `URI_SETTER_ROLE`: Can set token URIs and base URI

## NFT Tiers

NFTs are assigned a tier based on the user's participation score in the VeBetterPassport system:

- **BRONZE**: Default tier, or score < 1000
- **SILVER**: Score ≥ 1000
- **GOLD**: Score ≥ 5000
- **PLATINUM**: Score ≥ 10000

## Deployment Process

### Prerequisites

1. VeBetterPassport contract already deployed
2. VeBetterPassport address stored in the `.env` file as `PASSPORT_CONTRACT`

### Deployment Steps

1. Ensure you have the correct VeChain testnet configuration in your `hardhat.config.ts`
2. Run the deployment script:

```bash
yarn deploy:planty-nft:testnet
```

3. The script will:
   - Deploy the PlantyNFT implementation contract
   - Provide instructions for initializing the contract
   - Update the config with relevant addresses

4. After deployment, verify the contract on the blockchain explorer:

```bash
npx hardhat verify --network vechain_testnet <CONTRACT_ADDRESS>
```

### Post-Deployment Setup

Once deployed, you'll need to:

1. Call the `initialize` function with appropriate parameters
2. Grant `MINTER_ROLE` to addresses that should be allowed to mint NFTs
3. Set up any additional configuration as needed

## Minting NFTs

### Minting to a Single User

```typescript
// Connect to the contract
const plantyNFT = await ethers.getContractAt("PlantyNFT", contractAddress);

// Mint to a user with a valid passport
await plantyNFT.mintForPassportHolder(userAddress);

// Mint to a whitelisted user
await plantyNFT.mintForWhitelistedUser(userAddress);
```

### Batch Minting

For minting to multiple users at once, use the `batchMintForWhitelistedUsers` function:

```typescript
// Array of user addresses
const userAddresses = [
  "0x1234...",
  "0x5678...",
  // ...
];

// Batch mint to all whitelisted users
await plantyNFT.batchMintForWhitelistedUsers(userAddresses);
```

You can also use the provided script to mint to multiple addresses:

```bash
yarn mint:planty-nft:testnet
```

Make sure to edit the script first to include the addresses you want to mint to.

## Upgrading NFT Tiers

When a user's participation score increases, their NFT tier can be upgraded:

```typescript
// Upgrade a specific token's tier
await plantyNFT.upgradeTier(tokenId);
```

## Passport Integration

The contract interfaces with VeBetterPassport to:

1. Verify a user's personhood status via `isPerson()`
2. Check whitelist status via `isWhitelisted()`
3. Get participation scores via `userTotalScore()`

## Security Considerations

- The contract uses `nonReentrant` modifiers for critical functions
- Role-based access control limits who can perform administrative actions
- Checks ensure NFTs can only be minted to valid addresses
- The contract can be upgraded to address potential vulnerabilities

## Technical Notes

- The contract implements all required ERC721 interfaces
- Token IDs are assigned sequentially starting from 0
- Each address can only receive one NFT
- The contract maintains a mapping of which addresses have received NFTs

## Production Deployment Checklist

Before deploying to production:

1. ✅ Ensure the VeBetterPassport contract is properly deployed and configured
2. ✅ Set a secure and permanent base URI for token metadata
3. ✅ Only grant roles to trusted addresses
4. ✅ Test the minting process with a small set of addresses first
5. ✅ Verify the contract code on the blockchain explorer

## Example Addresses (Testnet)

- VeBetterPassport: `0xd93a1c3aebf0e7ce2969f6ae3007cab3c8addd46` (from .env file)
- PlantyNFT: [Address will be generated after deployment]

## License

MIT License 