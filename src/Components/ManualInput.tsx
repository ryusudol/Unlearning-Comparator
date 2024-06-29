import React from "react";
import styles from "./ManualInput.module.css";

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
    <div className={styles.select}>
      <label className={styles[labelClassName]} htmlFor={labelName}>
        {labelName}
      </label>
      <input type={type} id={labelName} />
    </div>
  );
}
