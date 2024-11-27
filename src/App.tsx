import Web3, { Contract } from 'web3';
import { generateProof } from './utils/generateProof';
import SudokuVerifier from './artifacts/contracts/Sudoku.sol/SudokuVerifier.json'

let web3;
let account;
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

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

function getContract() {
  web3 = new Web3(window.ethereum);
  const contract = new Contract(SudokuVerifier.abi, CONTRACT_ADDRESS, web3);
  return contract;
}

async function getCurrentSudoku() {
  const contract = getContract();
  let sudoku: Number[][] = [[]];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      sudoku[i].push(await contract.methods.currentSudoku(i, j).call());
    }
    sudoku.push([]);
  }
  sudoku.pop();
  return sudoku;
}

getCurrentSudoku().then(console.log);
function App() {
  return (
    <div>
      <button onClick={connectWallet}>Connect Wallet</button>
    </div>
  );
}

export default App;
