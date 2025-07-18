# SimpleSwap Frontend: A Full-Stack Decentralized Application

## 1. Project Overview 📜

This repository contains the frontend implementation of **SimpleSwap**, a decentralized exchange interface built for **Module 3 of the Ethereum Developer KIPU Program**. The frontend interacts with a custom Automated Market Maker (AMM) smart contract deployed on the **Sepolia testnet**, providing a clean, reactive, and accessible user experience for swapping and liquidity provisioning between Token A and Token B.

The project focuses on building a **usable, production-ready DApp interface** while reinforcing key concepts in wallet connection, contract interaction, and DeFi UI workflows.

---

## 2. Frontend Architecture 🖥️

The frontend uses **React, Vite, and Ethers.js v6**, offering:

- **Wallet Connection**: Secure MetaMask integration, auto-detecting network/account changes.
- **Token Balances**: Live retrieval of Token A and Token B balances.
- **Price Viewer**: Real-time Token A/Token B price retrieval from the SimpleSwap smart contract.
- **Liquidity Provision**: Add liquidity to the pool directly from the UI.
- **Token Swaps**: Execute Token A ↔️ Token B swaps with dynamic quoting.
- **Clean Component Structure**:
  - `ConnectButton.tsx`: Handles wallet connection.
  - `PriceViewer.tsx`: Displays live price.
  - `SwapUI.tsx`: User interface for swaps.
  - `LiquidityUI.tsx`: Interface for adding liquidity.

---

## 3. Technology Stack ⚙️

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Blockchain Interaction**: Ethers.js v6
- **Smart Contract Backend**: Hardhat (external repo)
- **Testing**: Vitest & Hardhat for contract-level testing
- **Deployment**: GitHub Pages

---

## 4. Live Deployment 🚀

The frontend is live and publicly accessible:

🌐 [https://gerafer.github.io/SimpleSwapFront/](https://gerafer.github.io/SimpleSwapFront/)

Connect your MetaMask wallet (set to **Sepolia**) to test swaps, view balances, and add liquidity directly on-chain.

---

## 5. Test Coverage 🧪

The associated smart contracts have **95%+ coverage** using `solidity-coverage`.

To generate local coverage reports (optional for contributors):
```bash
npx hardhat coverage
open coverage/index.html

