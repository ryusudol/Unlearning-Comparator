import React from "react";

import "./SelectInput.css";

type PropsType = {
  labelName: string;
  optionData: string[];
  labelFontSize?: "sm" | "md";
};

export default function SelectInput({
  labelName,
  optionData,
  labelFontSize,
}: PropsType) {
  const labelClassName =
    labelFontSize === "sm"
      ? "label-sm"
      : labelFontSize === "md"
      ? "label-md"
      : "label";

  return (
    <div className="select">
      <label className={labelClassName} htmlFor={labelName}>
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
