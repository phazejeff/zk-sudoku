pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom";

// Helper template to check if a value is within a specified range
template ValueInBounds() {
    signal input value;
    signal input min;
    signal input max;
    signal output result;

    component boundCheck = AND();
    component lowerBound = GreaterEqThan(4);
    component upperBound = LessEqThan(4);

    lowerBound.in[0] <== value;
    lowerBound.in[1] <== min;

    upperBound.in[0] <== value;
    upperBound.in[1] <== max;

    boundCheck.a <== lowerBound.out;
    boundCheck.b <== upperBound.out;
    result <== boundCheck.out;
}

// Template to ensure all unique elements in an array
template UniqueElements() {
    var SIZE = 9;
    signal input elements[SIZE];

    component uniqueCheck[SIZE][SIZE];
    
    // Create comparison matrix
    for (var i = 0; i < SIZE; i++) {
        for (var j = 0; j < SIZE; j++) {
            uniqueCheck[i][j] = IsEqual();
            uniqueCheck[i][j].in[0] <== elements[i];
            uniqueCheck[i][j].in[1] <== (i == j) ? 0 : elements[j];
            uniqueCheck[i][j].out === 0;
        }
    }
}

// Template to check if a grid cell is consistent
template CellConsistency() {
    signal input unsolved;
    signal input solved;
    signal output out;

    component isZero = IsZero();
    component isEqual = IsEqual();

    isZero.in <== unsolved;
    isEqual.in[0] <== unsolved;
    isEqual.in[1] <== solved;

    // if isZero || (!isZero && isEqual)
    out <== isZero.out + (1 - isZero.out) * isEqual.out;
}

// Main Sudoku verification circuit
template SudokuVerifier() {
    var SIZE = 9;
    var SUBSIZE = 3;

    signal input unsolved_grid[SIZE][SIZE];
    signal input givenUserAddress;

    // Private inputs
    signal input solved_grid[SIZE][SIZE];
    signal input expectedUserAddress;

    expectedUserAddress === givenUserAddress;

    // Value bounds checkers
    component solvedBoundsCheck[SIZE][SIZE];
    component unsolvedBoundsCheck[SIZE][SIZE];

    // Validators for rows, columns, and submatrices
    component rowValidators[SIZE];
    component colValidators[SIZE];
    component submatrixValidators[SIZE];

    // Grid consistency checkers
    component gridConsistency[SIZE][SIZE];

    // Initialize validators
    for (var i = 0; i < SIZE; i++) {
        rowValidators[i] = UniqueElements();
        colValidators[i] = UniqueElements();
        submatrixValidators[i] = UniqueElements();

        for (var j = 0; j < SIZE; j++) {
            // Bounds checking
            solvedBoundsCheck[i][j] = ValueInBounds();
            solvedBoundsCheck[i][j].value <== solved_grid[i][j];
            solvedBoundsCheck[i][j].min <== 1;
            solvedBoundsCheck[i][j].max <== SIZE;
            solvedBoundsCheck[i][j].result === 1;

            unsolvedBoundsCheck[i][j] = ValueInBounds();
            unsolvedBoundsCheck[i][j].value <== unsolved_grid[i][j];
            unsolvedBoundsCheck[i][j].min <== 0;
            unsolvedBoundsCheck[i][j].max <== SIZE;
            unsolvedBoundsCheck[i][j].result === 1;

            // Grid consistency checks
            gridConsistency[i][j] = CellConsistency();
            gridConsistency[i][j].unsolved <== unsolved_grid[i][j];
            gridConsistency[i][j].solved <== solved_grid[i][j];
            gridConsistency[i][j].out === 1;
        }
    }

    // Check row uniqueness
    for (var i = 0; i < SIZE; i++) {
        for (var j = 0; j < SIZE; j++) {
            rowValidators[i].elements[j] <== solved_grid[i][j];
        }
    }

    // Check column uniqueness
    for (var i = 0; i < SIZE; i++) {
        for (var j = 0; j < SIZE; j++) {
            colValidators[i].elements[j] <== solved_grid[j][i];
        }
    }

    // Check submatrix uniqueness
    var validatorIndex = 0;
    for (var i = 0; i < SIZE; i += SUBSIZE) {
        for (var j = 0; j < SIZE; j += SUBSIZE) {
            for (var k = 0; k < SUBSIZE; k++) {
                for (var l = 0; l < SUBSIZE; l++) {
                    submatrixValidators[validatorIndex].elements[k*SUBSIZE + l] <== solved_grid[i + k][j + l];
                }
            }
            validatorIndex++;
        }
    }
}

component main {public [unsolved_grid, givenUserAddress]} = SudokuVerifier();