import React from "react";

type JoinButtonProps = {
    onSubmit?: () => void;
}

const JoinButton: React.FC<JoinButtonProps> = ({onSubmit}) => {
    return (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button 
          onClick={onSubmit}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Join Next Pool
        </button>
      </div>
    ); 
}

export default JoinButton;