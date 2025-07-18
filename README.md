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

<img width="719" height="665" alt="Captura de Pantalla 2025-07-18 a la(s) 01 13 14" src="https://github.com/user-attachments/assets/29229dac-035d-4733-9a10-38cce07c483a" />

<img width="835" height="790" alt="Captura de Pantalla 2025-07-18 a la(s) 01 34 50" src="https://github.com/user-attachments/assets/103779e2-c5a0-45e7-90e2-6c0215c3d93d" />


6. Future Improvements 🛠️

✅ Integrate test faucet UI for easier token acquisition.
✅ Display liquidity pool statistics.
✅ Add input validation and slippage protection in the swap UI.
✅ Implement transaction status notifications.

7. Author ✍️
Gera Fernández
Ethereum Developer - ETH KIPU  2025

8. License 📄
This project is licensed under the MIT License.


