import { ethers } from "ethers";
import SimpleSwapABI from "./abi/SimpleSwapABI.json";

const contractAddress = "TU_CONTRACT_ADDRESS_EN_SEPOLIA"; // remplaza con tu dirección

export async function connectContract() {
    if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, SimpleSwapABI, signer);
        return contract;
    } else {
        alert("Instala Metamask para usar esta app");
    }
}

export async function getTotalLiquidity() {
    const contract = await connectContract();
    const liquidity = await contract.totalLiquidity();
    return liquidity.toString();
}

export async function getPrice(tokenA, tokenB) {
    const contract = await connectContract();
    const price = await contract.getPrice(tokenA, tokenB);
    return price.toString();
}
