import Web3, { Contract, Numbers } from 'web3';
import { generateProof } from './utils/generateProof';
import SudokuVerifier from './artifacts/contracts/Sudoku.sol/SudokuVerifier.json'
import Sudoku from './components/Sudoku';
import JoinButton from './components/JoinButton'
import { useEffect, useState } from 'react';

let web3 = new Web3(window.ethereum);
let account: string;
const CONTRACT_ADDRESS = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";
let contract = new Contract(SudokuVerifier.abi, CONTRACT_ADDRESS, web3);

async function connectWallet() {
  if (window.ethereum) {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const accounts = await web3.eth.getAccounts();
    account = accounts[0];
    console.log('Connected Account:', account);
  } else {
    alert('Please install MetaMask!');
  }
}

async function getCurrentSudoku() {
  let sudoku: number[][] = [[]];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      sudoku[i].push(Number(await contract.methods.currentSudoku(i, j).call()));
    }
    sudoku.push([]);
  }
  sudoku.pop();
  return sudoku;
}

async function hasSolved(): Promise<boolean> {
  return (await contract.methods.solved(account).call());
}

async function inCurrentPool(): Promise<boolean> {
  return (await contract.methods.currentPool(account).call());
}

async function inNextPool(): Promise<boolean> {
  return (await contract.methods.nextPool(account).call());
}

async function getCurrentPool(): Promise<Numbers> {
  return (await contract.methods.currentPoolAmount().call());
}

async function getNextPool(): Promise<Numbers> {
  return (await contract.methods.nextPoolAmount().call());
}

async function getCurrentPrize(): Promise<Numbers> {
  return (await contract.methods.getCurrentPrize().call());
}

async function joinNextPool() {
  const joined = await contract.methods.enterNextPool().send({
    from: account,
    value: web3.utils.toWei("1", "ether")
  });
  return joined
}

async function handleSubmit(submittedGrid: number[][]) {
  const initialGrid = await getCurrentSudoku();
  const userAddress = BigInt(account).toString();
  const proof = await generateProof(initialGrid, submittedGrid, userAddress);
  if (!proof.valid) {
    return false;
  }

  const valid = await contract.methods.submitSolution(...proof.params).send({
    from: account
  });
  return valid;
}

function App() {
  connectWallet()
  const [grid, setGrid] = useState<number[][]>();
  const [connectedAcc, setConnectedAcc] = useState<string>();
  const [hasSolvedBool, setHasSolvedBool] = useState<boolean>();
  const [inCurrentPoolBool, setInCurrentPoolBool] = useState<boolean>();
  const [inNextPoolBool, setInNextPoolBool] = useState<boolean>();
  const [currentPoolAmount, setCurrentPoolAmount] = useState<Numbers>();
  const [nextPoolAmount, setNextPoolAmount] = useState<Numbers>();
  const [currentPrizeAmount, setCurrentPrizeAmount] = useState<Numbers>();

  useEffect(() => {
    const updateVars = async () => {
      setConnectedAcc(account);
      setHasSolvedBool(await hasSolved());
      setGrid(await getCurrentSudoku());
      setInCurrentPoolBool(await inCurrentPool());
      setInNextPoolBool(await inNextPool());
      setCurrentPoolAmount(await getCurrentPool());
      setNextPoolAmount(await getNextPool());
      setCurrentPrizeAmount(await getCurrentPrize());
    }

    const connect = async () => {
      await connectWallet();
      await updateVars();
    }
    connect();

    web3.currentProvider?.on("accountsChanged", async () => {
      await updateVars();
    });

    const interval = setInterval(updateVars, 3000);

    return () => {
      web3.currentProvider?.removeListener('block', () => {});
      clearInterval(interval);
    }
  }, []);

  let disabled = false;
  let buttonText = 'Submit Sudoku';
  let buttonColor = '#4CAF50';
  let cursor = 'pointer';
  if (hasSolvedBool) {
    disabled = true;
    buttonText = 'Already Solved!';
    buttonColor = '#fc2222';
    cursor = 'not-allowed';
  }
  if (!inCurrentPoolBool) {
    disabled = true;
    buttonText = 'Not in current pool!';
    buttonColor = '#fc2222';
    cursor = 'not-allowed';
  }

  return (
    <div>   
      <center><p>Connected Account: {connectedAcc}</p></center>
      <center><h1>Current Prize: {web3.utils.fromWei(currentPrizeAmount as Numbers, "ether")} ETH</h1></center>
      {grid ? <Sudoku grid={grid} onSubmit={handleSubmit} buttonText={buttonText} disabled={disabled} buttonColor={buttonColor} cursor={cursor} /> : <center><p>Loading sudoku...</p></center>}
      {!inNextPoolBool ? <JoinButton onSubmit={joinNextPool} /> : <center><h4>You are in the next pool!</h4></center>}
      <center><h3>Next Pool: {web3.utils.fromWei(nextPoolAmount as Numbers, "ether")} ETH</h3></center>
    </div>
  );
}

export default App;
