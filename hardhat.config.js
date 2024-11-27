require("@nomicfoundation/hardhat-toolbox");
require("hardhat-circom");
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  circom: {
    // (required) The final ptau file, relative to inputBasePath, from a Phase 1 ceremony
    ptau: "powersOfTau28_hez_final_14.ptau",
    // (required) Each object in this array refers to a separate circuit
    circuits: [{ name: "sudoku" }],
  },
};
