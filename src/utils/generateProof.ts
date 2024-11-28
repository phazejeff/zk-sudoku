import * as snarkjs from "snarkjs";

const WASM_FILE = "/circuits/sudoku.wasm"
const ZKEY_FILE = "/circuits/sudoku.zkey"
const VERFICATION_KEY_FILE = "/circuits/sudoku.vkey.json"

/**
 * 
 * @param unsolved_grid 9x9 initial starting sudoku
 * @param solved_grid 9x9 completed sudoku, derived from start
 * @param userAddress user's ethereum address, converted into a number
 * @returns 
 */
export async function generateProof(unsolved_grid: number[][], solved_grid: number[][], userAddress: string) {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        {
            unsolved_grid: unsolved_grid, 
            solved_grid: solved_grid,
            expectedUserAddress: userAddress,
            givenUserAddress: userAddress
        }, 
        WASM_FILE, 
        ZKEY_FILE
    );

    const res = await verifyProof(proof, publicSignals);

    const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
    const paramsFull = JSON.parse("[" + calldata + "]");
    const params = paramsFull.slice(0, 3);
    return {valid: res, params: params};
}

async function verifyProof(proof: snarkjs.Groth16Proof, publicSignals: snarkjs.PublicSignals) {
    const key_file = await fetch(VERFICATION_KEY_FILE);
    const vKey = await key_file.json();

    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    return res;
}

// const unsolved_grid = [
//     [5, 3, 0, 0, 7, 0, 0, 0, 0],
//     [6, 0, 0, 1, 9, 5, 0, 0, 0],
//     [0, 9, 8, 0, 0, 0, 0, 6, 0],
//     [8, 0, 0, 0, 6, 0, 0, 0, 3],
//     [4, 0, 0, 8, 0, 3, 0, 0, 1],
//     [7, 0, 0, 0, 2, 0, 0, 0, 6],
//     [0, 6, 0, 0, 0, 0, 2, 8, 0],
//     [0, 0, 0, 4, 1, 9, 0, 0, 5],
//     [0, 0, 0, 0, 8, 0, 0, 7, 9]
//   ];
// const solved_grid = [
//     [5, 3, 4, 6, 7, 8, 9, 1, 2],
//     [6, 7, 2, 1, 9, 5, 3, 4, 8],
//     [1, 9, 8, 3, 4, 2, 5, 6, 7],
//     [8, 5, 9, 7, 6, 1, 4, 2, 3],
//     [4, 2, 6, 8, 5, 3, 7, 9, 1],
//     [7, 1, 3, 9, 2, 4, 8, 5, 6],
//     [9, 6, 1, 5, 3, 7, 2, 8, 4],
//     [2, 8, 7, 4, 1, 9, 6, 3, 5],
//     [3, 4, 5, 2, 8, 6, 1, 7, 9]
//   ];

//   const userAddress = BigInt("0x5B38Da6a701c568545dCfcB03FcB875f56beddC4").toString();

// generateProof(unsolved_grid, solved_grid, userAddress).then((out) => {
//     console.log(out.params);
//     process.exit(0);
// });