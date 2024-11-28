// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./SudokuVerifier.sol"; // Import generated verifier contract

contract SudokuVerifier is Verifier {

    mapping(address => bool) public solved;
    address[] private solvedArr;
    address private manager;

    uint[9][9] public currentSudoku;
    uint public timePublished;
    uint public minimum;
    uint public prizePercentage;

    mapping(address => bool) public currentPool;
    address[] private currentPoolArr;
    mapping(address => bool) public nextPool;
    address[] private nextPoolArr;

    uint public currentPoolAmount;
    uint public nextPoolAmount;

    constructor(uint[9][9] memory _sudoku, uint _minimum, uint _prizePercentage) {
        manager = msg.sender;
        currentSudoku = _sudoku;
        timePublished = block.timestamp;
        minimum = _minimum;
        prizePercentage = _prizePercentage;
    }

    function submitSolution(
        uint[2] memory _a,
        uint[2][2] memory _b,
        uint[2] memory _c
    ) public returns (bool) {
        require(!solved[msg.sender], "User already solved this sudoku.");
        require(currentPool[msg.sender], "User not in current pool.");

        uint[82] memory pubSignals = getPubSignals();
        bool isVerified = verifyProof(_a, _b, _c, pubSignals);
        if (isVerified) {
            solved[msg.sender] = true;
            solvedArr.push(msg.sender);
            uint amount = getCurrentPrize();
            currentPoolAmount -= amount;
            payable(msg.sender).transfer(amount);
        }
        return isVerified;
    }

    function getPubSignals() view private returns (uint[82] memory) {
        uint[82] memory pubSignals;
        for (uint i = 0; i < 9; i++) {
            for (uint j = 0; j < 9; j++) {
                pubSignals[9 * i + j] = currentSudoku[i][j];
            }
        }
        pubSignals[81] = uint256(uint160(msg.sender));
        return pubSignals;
    }

    function newSudoku(uint[9][9] memory _sudoku) public {
        require(msg.sender == manager, "Only manager can call this function.");
        // require(block.timestamp >= timePublished + 1 days, "Can only set a new sudoku every 24 hours.");
        currentSudoku = _sudoku;
        timePublished = block.timestamp;
        resetSolved();
    }

    function resetSolved() private {
        for (uint i = 0; i < solvedArr.length; i++) {
            solved[solvedArr[i]] = false;
        }
        delete solvedArr;

        for (uint i = 0; i < currentPoolArr.length; i++) {
            currentPool[currentPoolArr[i]] = false;
        }
        for (uint i = 0; i < nextPoolArr.length; i++) {
            nextPool[nextPoolArr[i]] = false;
            currentPool[nextPoolArr[i]] = true;
        }
        currentPoolArr = nextPoolArr;
        delete nextPoolArr;

        payable(manager).transfer(currentPoolAmount);
        currentPoolAmount = nextPoolAmount;
        nextPoolAmount = 0;
    }

    function enterNextPool() public payable returns (bool) {
        require(!nextPool[msg.sender], "Already registered!");
        require(msg.value >= minimum, "Must send at least the minimum amount!");
        nextPoolArr.push(msg.sender);
        nextPool[msg.sender] = true;
        nextPoolAmount += msg.value;
        return true;
    }

    function getCurrentPrize() public view returns (uint) {
        return currentPoolAmount * prizePercentage / 100;
    }
}