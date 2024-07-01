import React from "react";
import styles from "./FileInput.module.css";

type PropsType = {
  labelName: string;
  labelFontSize?: "sm" | "md";
};

export default function FileInput({ labelName, labelFontSize }: PropsType) {
  const labelClassName =
    labelFontSize === "sm"
      ? "label-sm"
      : labelFontSize === "md"
      ? "label-md"
      : "label";

  return (
    <div>
      <span id={styles.custom} className={styles[labelClassName]}>
        {labelName}
      </span>
      <label className={styles["file-input-label"]} htmlFor={labelName}>
        Upload
      </label>
      <input type="file" id={labelName} className={styles["file-input"]} />
    </div>
  );
}
