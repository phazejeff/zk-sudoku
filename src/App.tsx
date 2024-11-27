import Web3 from 'web3';
import { generateProof } from './utils/generateProof';

let web3;
let account;

async function connectWallet() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const accounts = await web3.eth.getAccounts();
    account = accounts[0];
    console.log('Connected Account:', account);
  } else {
    alert('Please install MetaMask!');
  }
}

function App() {
  return (
    <div>
      <button onClick={connectWallet}>Connect Wallet</button>
    </div>
  );
}

export default App;
