# SimpleSwap Frontend

This is the frontend application to interact with the SimpleSwap smart contract developed in Module 3 of the Ethereum Developer course.

## Features

- Connect with MetaMask (Ethereum wallet)
- View balances of Token A and Token B
- View price of Token A in terms of Token B
- Add liquidity to the SimpleSwap pool
- Perform swaps from Token A to Token B and vice versa

## Technologies

- React with TypeScript
- Vite as bundler and development server
- Ethers.js for smart contract interaction

## Available Scripts

- `npm run dev`: Starts the development server locally.
- `npm run build`: Builds the optimized production version.
- `npm run preview`: Preview the built production version locally.
- `npm run deploy`: Deploys the dist folder to GitHub Pages.

## Local Setup Instructions

1. Clone the repository
2. Navigate to the frontend folder
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start the app at http://localhost:5173
5. Connect MetaMask to interact with the contract

## Test Coverage

This project uses [`solidity-coverage`](https://github.com/sc-forks/solidity-coverage) to measure test coverage on smart contracts.

To generate the local coverage report:

```bash
npx hardhat coverage
open coverage/index.html
This will allow you to visualize which functions and lines are covered by your tests.

Deployed URL
The app is deployed and accessible at:

https://gerafer.github.io/SimpleSwapFront/

Note
There is currently a warning related to tsconfig.json, but the app works properly for the main features.

Author
Gera Fernández

License
MIT License
