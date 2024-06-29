import React from "react";
import "./ManualInput.css";

type PropsType = {
  labelName: string;
  type: "number" | "file";
};

function NumberInput({ labelName, type }: PropsType) {
  return (
    <div className="select">
      <label htmlFor={labelName}>{labelName}</label>
      <input type={type} />
    </div>
  );
}

export default NumberInput;
