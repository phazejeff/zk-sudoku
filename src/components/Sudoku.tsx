import React, { useState } from "react";

type SudokuProps = {
    grid: number[][];
    onCellChange?: (row: number, col: number, value: number) => void;
    onSubmit?: (grid: number[][]) => void;
    buttonText: string;
    disabled: boolean;
    buttonColor: string;
    cursor: string
}

const Sudoku: React.FC<SudokuProps> = ({ grid = [], onSubmit, buttonText, disabled, buttonColor, cursor }) => {
  // Create a state to track editable cells
  const [editableGrid, setEditableGrid] = useState<number[][]>(() => 
    grid.map(row => [...row])
  );

  // Handle cell value change
  const handleCellChange = (rowIndex: number, cellIndex: number, value: string) => {
    // Convert input to number, default to 0 if invalid
    const numValue = parseInt(value) || 0;
    
    // Ensure the value is between 0 and 9
    const sanitizedValue = Math.max(0, Math.min(9, numValue));
    
    // Create a copy of the grid to update
    const newGrid = [...editableGrid];
    newGrid[rowIndex] = [...newGrid[rowIndex]];
    newGrid[rowIndex][cellIndex] = sanitizedValue;
    
    // Update local state
    setEditableGrid(newGrid);
  };

  // Handle submit button click
  const handleSubmit = () => {
    // Call the onSubmit prop with the current grid state
    onSubmit?.(editableGrid);
  };

  // If grid is undefined or empty, render a placeholder
  if (!grid || grid.length === 0) {
    return (
      <div className="text-center text-gray-500 p-4">
        No Sudoku grid available
      </div>
    );
  }

  return (
    <div>
      <table 
        style={{ 
          border: "2px solid black", 
          borderCollapse: "collapse", 
          textAlign: "center",
          margin: "auto" 
        }}
      >
        <tbody>
          {editableGrid.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              style={{
                borderTop: (rowIndex % 3 === 0) ? "2px solid black" : "1px solid #ccc",
                borderBottom: (rowIndex + 1) % 3 === 0 ? "2px solid black" : "1px solid #ccc"
              }}
            >
              {row.map((cell, cellIndex) => {
                const isPrefilledCell = grid[rowIndex][cellIndex] !== 0;
                
                return (
                  <td 
                    key={cellIndex} 
                    style={{ 
                      width: "40px", 
                      height: "40px", 
                      border: "1px solid #ccc",
                      borderLeft: (cellIndex % 3 === 0) ? "2px solid black" : "1px solid #ccc",
                      borderRight: (cellIndex + 1) % 3 === 0 ? "2px solid black" : "1px solid #ccc",
                      padding: "2px"
                    }}
                  >
                    {isPrefilledCell ? (
                      <div 
                        style={{ 
                          width: "100%", 
                          height: "100%", 
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontWeight: "bold",
                          backgroundColor: "#e0e0e0"
                        }}
                      >
                        {cell}
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="1"
                        max="9"
                        style={{
                          width: "95%",
                          height: "95%",
                          textAlign: "center",
                          border: "none",
                          backgroundColor: "#f0f0f0"
                        }}
                        value={cell === 0 ? "" : cell}
                        onChange={(e) => handleCellChange(rowIndex, cellIndex, e.target.value)}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button 
          onClick={handleSubmit}
          style={{
            padding: "10px 20px",
            backgroundColor: buttonColor,
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: cursor,
          }}
          disabled={disabled}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

export default Sudoku;