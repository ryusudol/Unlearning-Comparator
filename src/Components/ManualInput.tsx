import React from "react";
import "./ManualInput.css";

type PropsType = {
  labelName: string;
  type: "number" | "file";
  labelFontSize?: "sm" | "md";
};

export default function NumberInput({
  labelName,
  type,
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
      <input type={type} name={labelName} />
    </div>
  );
}
