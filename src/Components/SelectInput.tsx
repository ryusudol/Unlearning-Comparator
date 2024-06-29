import React from "react";

import "./SelectInput.css";

type PropsType = {
  labelName: string;
  optionData: string[];
  labelFontSize?: "sm";
};

export default function SelectInput({ labelName, optionData }: PropsType) {
  return (
    <div className="select">
      <label className="label" htmlFor={labelName}>
        {labelName}
      </label>
      <select name={labelName}>
        {optionData.map((data) => (
          <option value={data}>{data}</option>
        ))}
      </select>
    </div>
  );
}
