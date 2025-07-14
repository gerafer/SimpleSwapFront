// frontend/src/App.tsx
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import SimpleSwapABI from './abi/SimpleSwapABI.json';
import TokenABI from './abi/TokenABI.json';

const simpleSwapAddress = '0x1041569CC41B3fEA2B352eC67C5E15274544d04f';
const tokenAAddress = '0xB451546C1e6A46B597821E4D6d565AAb07e1aE9b';
const tokenBAddress = '0x7A35C3fB9896e2E859186c20ac3F8050f35Ec87B';

function App() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string>('');
  const [tokenABalance, setTokenABalance] = useState<string>('0');
  const [tokenBBalance, setTokenBBalance] = useState<string>('0');

  // Inputs independientes para swaps
  const [amountInAtoB, setAmountInAtoB] = useState<string>('0.1');
  const [amountInBtoA, setAmountInBtoA] = useState<string>('0.1');

  const [swapLoadingAtoB, setSwapLoadingAtoB] = useState(false);
  const [swapLoadingBtoA, setSwapLoadingBtoA] = useState(false);

  // Estados para agregar liquidez
  const [amountALiquidity, setAmountALiquidity] = useState<string>('1');
  const [amountBLiquidity, setAmountBLiquidity] = useState<string>('1');
  const [loadingLiquidity, setLoadingLiquidity] = useState(false);

  // Estado para mostrar precio
  const [priceAB, setPriceAB] = useState<string>('0');

  useEffect(() => {
    if (window.ethereum) {
      const prov = new ethers.BrowserProvider(window.ethereum);
      setProvider(prov);
    } else {
      alert('MetaMask no está instalado');
    }
  }, []);

  // Carga balances y precio
  const loadBalances = async (address: string) => {
    if (!provider) return;
    const tokenAContract = new ethers.Contract(tokenAAddress, TokenABI, provider);
    const tokenBContract = new ethers.Contract(tokenBAddress, TokenABI, provider);

    const balanceA = await tokenAContract.balanceOf(address);
    const balanceB = await tokenBContract.balanceOf(address);

    setTokenABalance(ethers.formatEther(balanceA));
    setTokenBBalance(ethers.formatEther(balanceB));

    try {
      const simpleSwapContract = new ethers.Contract(simpleSwapAddress, SimpleSwapABI, provider);
      const price = await simpleSwapContract.getPrice(tokenAAddress, tokenBAddress);
      setPriceAB(ethers.formatEther(price));
    } catch {
      setPriceAB('0');
    }
  };

  const connectWallet = async () => {
    if (!provider) return alert('MetaMask no está instalado');
    try {
      await provider.send('eth_requestAccounts', []);
      const signerTmp = await provider.getSigner();
      setSigner(signerTmp);
      const address = await signerTmp.getAddress();
      setAccount(address);
      await loadBalances(address);
    } catch (error) {
      console.error(error);
      alert('Error conectando la billetera');
    }
  };

  const addLiquidity = async () => {
    if (!signer) return alert('Conectá la billetera primero');
    setLoadingLiquidity(true);
    try {
      const simpleSwapContract = new ethers.Contract(simpleSwapAddress, SimpleSwapABI, signer);
      const tokenAContract = new ethers.Contract(tokenAAddress, TokenABI, signer);
      const tokenBContract = new ethers.Contract(tokenBAddress, TokenABI, signer);

      const amountAWei = ethers.parseEther(amountALiquidity);
      const amountBWei = ethers.parseEther(amountBLiquidity);

      let tx = await tokenAContract.approve(simpleSwapAddress, amountAWei);
      await tx.wait();

      tx = await tokenBContract.approve(simpleSwapAddress, amountBWei);
      await tx.wait();

      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

      tx = await simpleSwapContract.addLiquidity(
        tokenAAddress,
        tokenBAddress,
        amountAWei,
        amountBWei,
        0,
        0,
        account,
        deadline
      );
      await tx.wait();

      alert('Liquidez agregada correctamente!');
      await loadBalances(account);
    } catch (error) {
      console.error(error);
      alert('Error al agregar liquidez');
    }
    setLoadingLiquidity(false);
  };

  const swapAToB = async () => {
    if (!signer) return alert('Conectá la billetera primero');
    setSwapLoadingAtoB(true);
    try {
      const simpleSwapContract = new ethers.Contract(simpleSwapAddress, SimpleSwapABI, signer);
      const amountInWei = ethers.parseEther(amountInAtoB);

      const tokenAContract = new ethers.Contract(tokenAAddress, TokenABI, signer);
      const approvalTx = await tokenAContract.approve(simpleSwapAddress, amountInWei);
      await approvalTx.wait();

      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

      const tx = await simpleSwapContract.swapExactTokensForTokens(
        amountInWei,
        0,
        [tokenAAddress, tokenBAddress],
        account,
        deadline
      );
      await tx.wait();

      alert('Swap Token A → Token B realizado con éxito!');
      await loadBalances(account);
    } catch (error) {
      console.error(error);
      alert('Error haciendo el swap Token A → Token B');
    }
    setSwapLoadingAtoB(false);
  };

  const swapBToA = async () => {
    if (!signer) return alert('Conectá la billetera primero');
    setSwapLoadingBtoA(true);
    try {
      const simpleSwapContract = new ethers.Contract(simpleSwapAddress, SimpleSwapABI, signer);
      const amountInWei = ethers.parseEther(amountInBtoA);

      const tokenBContract = new ethers.Contract(tokenBAddress, TokenABI, signer);
      const approvalTx = await tokenBContract.approve(simpleSwapAddress, amountInWei);
      await approvalTx.wait();

      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

      const tx = await simpleSwapContract.swapExactTokensForTokens(
        amountInWei,
        0,
        [tokenBAddress, tokenAAddress],
        account,
        deadline
      );
      await tx.wait();

      alert('Swap Token B → Token A realizado con éxito!');
      await loadBalances(account);
    } catch (error) {
      console.error(error);
      alert('Error haciendo el swap Token B → Token A');
    }
    setSwapLoadingBtoA(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20, fontFamily: 'Arial' }}>
      <h2>SimpleSwap Frontend</h2>
      {!account ? (
        <button onClick={connectWallet}>Conectar MetaMask</button>
      ) : (
        <>
          <p><strong>Cuenta conectada:</strong> {account}</p>
          <p><strong>Saldo Token A:</strong> {tokenABalance}</p>
          <p><strong>Saldo Token B:</strong> {tokenBBalance}</p>
          <p><strong>Precio Token A en Token B:</strong> {priceAB}</p>

          <hr />
          <h3>Agregar Liquidez</h3>
          <div>
            <label>Token A: </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amountALiquidity}
              onChange={(e) => setAmountALiquidity(e.target.value)}
              disabled={loadingLiquidity}
            />
          </div>
          <div>
            <label>Token B: </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amountBLiquidity}
              onChange={(e) => setAmountBLiquidity(e.target.value)}
              disabled={loadingLiquidity}
            />
          </div>
          <button onClick={addLiquidity} disabled={loadingLiquidity}>
            {loadingLiquidity ? 'Procesando...' : 'Agregar Liquidez'}
          </button>

          <hr />
          <h3>Swap Token A a Token B</h3>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amountInAtoB}
            onChange={(e) => setAmountInAtoB(e.target.value)}
            disabled={swapLoadingAtoB}
          />
          <button onClick={swapAToB} disabled={swapLoadingAtoB}>
            {swapLoadingAtoB ? 'Procesando...' : 'Swap A → B'}
          </button>

          <hr />
          <h3>Swap Token B a Token A</h3>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amountInBtoA}
            onChange={(e) => setAmountInBtoA(e.target.value)}
            disabled={swapLoadingBtoA}
          />
          <button onClick={swapBToA} disabled={swapLoadingBtoA}>
            {swapLoadingBtoA ? 'Procesando...' : 'Swap B → A'}
          </button>
        </>
      )}
    </div>
  );
}

export default App;





