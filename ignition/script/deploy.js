const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const SimpleSwap = await hre.ethers.getContractFactory("SimpleSwap");

    const tokenA = "0xDIRECCION_TOKEN_A";
    const tokenB = "0xDIRECCION_TOKEN_B";

    const simpleSwap = await SimpleSwap.deploy(tokenA, tokenB);
    await simpleSwap.deployed();

    console.log("SimpleSwap deployed to:", simpleSwap.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
