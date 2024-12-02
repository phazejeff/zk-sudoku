import React, { FormEvent, useState } from "react";

type NewSudokuProps = {
    onSubmit: (arg0: string) => void;
}

const NewSudoku: React.FC<NewSudokuProps> = ({onSubmit}) => {
  const [text, setText] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(text);
  };

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: "center", padding: "20px" }}>
      <h2><b>Manager:</b> New Sudoku</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Put a 9x9 sudoku here (0s represent empty)"
        style={{
          width: "90%",
          height: "200px",
          fontSize: "16px",
          padding: "10px",
          marginBottom: "10px",
        }}
      />
      <br />
      <button type="submit" style={{ fontSize: "16px", padding: "10px 20px" }}>
        Submit
      </button>
    </form>
  );
};

export default NewSudoku;
