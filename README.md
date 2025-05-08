# Smart Wallet Sub Accounts Demo

This demo showcases how to implement Smart Wallet Sub Accounts with Spend Limits to enable popup-less transactions.

## Features

- Smart Wallet integration with Coinbase Wallet
- Sub Account creation with automatic spend limits
- Popup-less transaction execution
- Message signing with Sub Accounts
- Transaction history tracking

## Key Concepts

### Sub Accounts

Sub Accounts allow you to create wallet accounts that are directly embedded in your application. These accounts are linked to the user's main Smart Wallet through an onchain relationship.

### Spend Limits

Spend Limits enable third-party signers to spend assets (native and ERC-20 tokens) from a user's Smart Wallet without requiring additional authentication for each transaction, creating a seamless user experience.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Connect your Smart Wallet using the "Sign in" button
2. A Sub Account will be automatically created
3. Use the interface to send ETH transactions or sign messages without requiring additional authentication
4. View your transaction history

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- wagmi (React Hooks for Ethereum)
- viem (TypeScript Interface for Ethereum)
- Coinbase Smart Wallet
