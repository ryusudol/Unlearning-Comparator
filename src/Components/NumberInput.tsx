import React from "react";
import styles from "./NumberInput.module.css";

type PropsType = {
  labelName: string;
  labelFontSize?: "sm" | "md";
};

export default function NumberInput({ labelName, labelFontSize }: PropsType) {
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
      <input type="number" id={labelName} />
    </div>
  );
}
