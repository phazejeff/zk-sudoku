# ZK Sudoku
A daily game of Sudoku with monetary stakes, fully trustless and protected by zero-knowledge (ZK) encryption, and publicly verifiable using the Ethereum blockchain.

This project was created to learn how ZK proofs work in application. If you just want to learn how to run this and what it does, head to the [Usage](#usage) section.

## Zero Knowledge Proofs

### What are zero-knowledge proofs?
The idea behind a zero-knowledge proof is that a user is able to prove to the verifier that they know the answer, without revealing the answer. The point of this project was to learn how I can *effectively use* zero-knowledge proofs, not how it works on a low-level. Do not ask me how the math behind it works, because I do not know.

The interesting thing about this type of encryption is that it is programmable. This means I can write a proof verification script with public and private inputs, then compile it into files that serve as a generator (the prover) and the verifier.

### What's the point of using them in a game of Sudoku like this?
The idea behind this was to create a daily game of Sudoku, where a user can stake some money to try to solve the puzzle. Users who solve it the fastest will receive the largest reward. I wanted this to be done in a fully trustless, transparent, and public manner, so the Ethereum blockchain was a good choice which ensured that the money would not be handled by any human and all logic would be done verifiably.

Now, this sounds good, but this also presented a problem: Once the first user solves the puzzle, what stops the next user from just looking at the blockchain data and copying the first user's answer?

This is where ZK proofs come in: A user would be able to prove to the contract that they know the answer, __without submitting the actual answer__. This is where the magic is.

### How are these proofs used?
Every ZK proof can take both public and private inputs. A public input is an input that will be known to both the prover and the verifier. A private input is an input that will __ONLY__ be known to the prover. In this code, there are 4 inputs total: 2 private and 2 public. 
The public inputs are: The initial unsolved Sudoku puzzle, and the user's Ethereum address.
The private inputs are: The final solved Sudoku puzzle, and the user's Ethereum address.

You will notice that the user's address is provided as an input twice, once as a public and once as a private input. This is not a typo; it is necessary to ensure that each proof is unique to the user and will be explained in further detail later on.

For proof generation and verification, the flow will go like this:
1. The user will solve the Sudoku puzzle
2. On the client side, they use all 4 inputs in the proof generation to create a proof. 
3. They will submit that generated proof to the smart contract, which will verify that the proof and the public inputs (The user's Ethereum address and the initial state of the puzzle) cryptographically match.

Note that the verifier smart contract does not have any knowledge of the solved puzzle in the proof, and therefore does not perform any checks on correctness. It's only job is to verify that the proof and the public inputs mathematically line up. All checks for correctness are done during the proof generation stage on the client side. A generated proof just looks like garbage, and is something like this:
```json
[
   "0x07ecee5b5912934de94ee3b7db97959a5ca6ff9966390e0607127700afc731a3",
   "0x1c8feb339ac1f8d87231131a8295e712428d3c568e4e25a37064695833ba29b4"
]
[
   [
      "0x14c75d9557dd84a1cdb06cc1fa5cf19a0d0a610c6e15ad67947c983dd5fba93c",
      "0x2b8edcf76cfd2d4e97049a2714a8aaf0e0e0d429057c5fd1342aa00d4b0f12df"
   ],
   [
      "0x2d5621b29fe8faf3d188360b3c484c066d8e85c02c1fd7d73bffa0798d55b5e5",
      "0x2e808373e6a79d2f3b315e41c5d00823db82a6080d95485d75f6b6a83b297af4"
   ]
],
[
   "0x2b49e1a74d3422f7fc67f62dfc4ad0d28a8337a79d819c3a92b300b73a28196c", 
   "0x168b6ecc315175cdb7b1cc6e73beaec6a8e4195c876856ad9dce622723de8a6b"
]
```
The user submits this to the smart contract. The smart contract already has the initial Sudoku puzzle stored, and will know the address of the user (the public inputs), so it just needs to perform the verification.

You can view the full proof generation code (called a circuit) here: [sudoku.circom](.\public\circuits\sudoku.circom)

This got compiled into a verifier smart contract that you can find [here](.\contracts\SudokuVerifier.sol). Note that I did not write this contract, this was generated using the circom circuit I wrote. I extended the `verifyProof()` function in my own contract that I did write to apply the monetary conditions of the game in the [Sudoku.sol](.\contracts\Sudoku.sol) contract.

### What does the circuit (circom) actually do?
This is where the magic happens. Any line that involves a direct check is part of the proof process. The proof cannot and will not be generated if any of these fail. Here is an example of one on [this line](.\public\circuits\sudoku.circom#L75):
```
expectedUserAddress === givenUserAddress;
```

Can you take a guess what this does?

This is making sure every proof is unique per Ethereum address, which was briefly mentioned earlier. If you have understood everything up to this point, you may be able to infer how it works. The `expectedUserAddress` is the user address as a private input, while the `givenUserAddress` is the user address as a public input. The user would need to provide their Ethereum address as both the public and private inputs, and the circuit will only provide the proof if they match. This is so that when they submit their proof to the contract, the contract can verify that this proof lines up with the `givenUserAddress` as the public input. In that way, the proof that is generated is unique only to that particular address, and no other user can copy that proof and submit it as their own, as their address would not line up with the proof.

The other checks are there just to check for 3 things: The solved Sudoku is derived from the initial one, the solved Sudoku contains only numbers from 1-9, and the solved Sudoku does follow the rules of the game (no row has a repeating number, no column has a repeating number, no 3x3 box has a repeating number).

With all of this, we now have a way for a user to generate a proof unique to them, which when submitted to the contract, will show that they solved the Sudoku puzzle, without ever submitting the actual answer to the public blockchain.

## Usage
First install all npm packages:
```
npm install --force
```

The contract is not deployed on any public blockchain. You will either need to spin up a local blockchain using [Hardhat](https://hardhat.org/) and deploy, or deploy it to the Sepolia Testnet. Make sure you update the [`CONTRACT_ADDRESS`](.\src\App.tsx#L12).
When deploying, the constructor takes 3 arguments: The initial puzzle, the minimum amount of wei a user can stake, and the amount of the prize pool a user will be rewarded with when they solve (in %).

You can then run it by just running
```
npm start
```
It should be running at http://localhost:3000

There are two types of users: The manager and the players.

The manager deploys the contract and sets a new Sudoku puzzle each day by entering a 9x9 array representing an initial puzzle, where 0s represent blank spaces, and clicking the `Submit` button on the bottom. This will only show up if your wallet is connected to the manager account. The contract has the line checking for if 24 hours has passed commented out for testing purposes, but in production this line would be uncommented.

![](https://i.imgur.com/1QGiUt2.png)

The users will have to click the `Join Next Pool` button, which will send the minimum amount of wei, to join the next pool for the upcoming puzzle. Once the manager sets a new puzzle, then all users who entered the pool will be able to attempt to solve it by filling in the blanks and clicking the `Submit Sudoku` button.

![](https://i.imgur.com/UuXbUtN.png)
