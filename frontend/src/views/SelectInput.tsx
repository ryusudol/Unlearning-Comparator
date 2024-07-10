import React from "react";

import styles from "./SelectInput.module.css";

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
    <div className={styles.select}>
      <label className={styles[labelClassName]} htmlFor={labelName}>
        {labelName}
      </label>
      <select className={styles.input} id={labelName}>
        {optionData.map((data) => (
          <option value={data}>{data}</option>
        ))}
      </select>
    </div>
  );
}
