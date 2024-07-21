import React from "react";

import styles from "./Input.module.css";

type PropsType = {
  labelName: string;
  optionData?: string[];
  type: "select" | "number" | "file";
};

export default function Input({ labelName, optionData, type }: PropsType) {
  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={labelName}>
        {labelName}
      </label>
      {type === "select" ? (
        <select className={styles.input} id={labelName}>
          {optionData!.map((data) => (
            <option className={styles.option} value={data}>
              {data}
            </option>
          ))}
        </select>
      ) : type === "number" ? (
        <input
          className={styles.input}
          type="number"
          placeholder="Please enter a value"
        />
      ) : (
        <input className={styles.input} type="file" />
      )}
    </div>
  );
}
