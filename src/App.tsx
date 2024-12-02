import Web3, { Contract, Numbers } from 'web3';
import { generateProof } from './utils/generateProof';
import SudokuVerifier from './artifacts/contracts/Sudoku.sol/SudokuVerifier.json'
import Sudoku from './components/Sudoku';
import JoinButton from './components/JoinButton'
import { useEffect, useState } from 'react';
import NewSudoku from './components/NewSudoku';
import { areArraysEqual } from './utils/areArraysEqual';

let web3 = new Web3(window.ethereum);
let account: string;
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
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

async function getManagerAddress(): Promise<string> {
  return (await contract.methods.manager().call());
}

async function getNextPool(): Promise<Numbers> {
  return (await contract.methods.nextPoolAmount().call());
}

async function getCurrentPrize(): Promise<Numbers> {
  return (await contract.methods.getCurrentPrize().call());
}

async function getPrizePercentage(): Promise<Numbers> {
  return (await contract.methods.prizePercentage().call());
}

async function joinNextPool() {
  try {
    await contract.methods.enterNextPool().send({
      from: account,
      value: web3.utils.toWei("1", "ether")
    });
  } catch (e) {
    alert("Joining failed.");
  }
}

async function setNextSudoku(sudoku: string) {
  sudoku = JSON.parse(sudoku);
  try {
    await contract.methods.newSudoku(sudoku).send({
      from: account
    })
  } catch (e) {
    alert("Error in contract call. Are you the manager?");
  }
  
}

async function handleSubmit(submittedGrid: number[][]) {
  const initialGrid = await getCurrentSudoku();
  const userAddress = BigInt(account).toString();
  try {
    const proof = await generateProof(initialGrid, submittedGrid, userAddress);
    if (!proof.valid) {
      alert("Invalid answer. Check your work and try again.");
    }
    try {
      const valid = await contract.methods.submitSolution(...proof.params).send({
        from: account
      });
      if (!valid) {
        alert("Contract detected invalid proof. Are you submitting from the right account?");
      }
    } catch (e) {
      alert("Error in contract call.");
    }
  } catch (e) {
    alert("Invalid answer. Please try again.")
    return
  }  
}

function App() {
  connectWallet()
  const [grid, setGrid] = useState<number[][]>();
  const [connectedAcc, setConnectedAcc] = useState<string>();
  const [hasSolvedBool, setHasSolvedBool] = useState<boolean>();
  const [inCurrentPoolBool, setInCurrentPoolBool] = useState<boolean>();
  const [inNextPoolBool, setInNextPoolBool] = useState<boolean>();
  const [currentPoolAmount, setCurrentPoolAmount] = useState<Numbers | undefined>();
  const [nextPoolAmount, setNextPoolAmount] = useState<Numbers | undefined>();
  const [currentPrizeAmount, setCurrentPrizeAmount] = useState<Numbers | undefined>();
  const [currentManagerAddress, setCurrentManagerAddress] = useState<string>();
  const [currentPrizePercentage, setCurrentPrizePercentage] = useState<Numbers>();

  useEffect(() => {
    const updateVars = async () => {
      setConnectedAcc(account);
      setHasSolvedBool(await hasSolved());
      setInCurrentPoolBool(await inCurrentPool());
      setInNextPoolBool(await inNextPool());
      setCurrentPoolAmount(await getCurrentPool());
      setNextPoolAmount(await getNextPool());
      setCurrentPrizeAmount(await getCurrentPrize());
      setCurrentManagerAddress(await getManagerAddress());
      setCurrentPrizePercentage(await getPrizePercentage());

      const newGrid = await getCurrentSudoku();
      if (!areArraysEqual(newGrid, grid)) {
        setGrid(newGrid);
      }
      
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
  }, [grid]);

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
  console.log(Number(currentPrizePercentage))
  return (
    <div>   
      <center><p>Connected Account: {connectedAcc}</p></center>
      <center><h1>Current Prize: {currentPrizeAmount ? web3.utils.fromWei(currentPrizeAmount, "ether") : 0} ETH</h1></center>
      <center><b>{currentPrizePercentage ? Number(currentPrizePercentage) : 0}% of total pool</b></center>
      <center><h3>Total Pool: {currentPoolAmount ? web3.utils.fromWei(currentPoolAmount, "ether") : 0} ETH</h3></center>
      {grid ? <Sudoku grid={grid} onSubmit={handleSubmit} buttonText={buttonText} disabled={disabled} buttonColor={buttonColor} cursor={cursor} /> : <center><p>Loading sudoku...</p></center>}
      {!inNextPoolBool ? <JoinButton onSubmit={joinNextPool} /> : <center><h4>You are in the next pool!</h4></center>}
      <center><h3>Next Pool: {nextPoolAmount ? web3.utils.fromWei(nextPoolAmount, "ether") : 0} ETH</h3></center>
      <br></br>
      {account === currentManagerAddress ? <NewSudoku onSubmit={setNextSudoku} /> : null}
    </div>
  );
}

export default App;
