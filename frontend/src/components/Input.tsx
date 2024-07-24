import React from "react";

import styles from "./Input.module.css";

type PropsType = {
  labelName: string;
  value: string | number | undefined;
  setStateString?: (data: string) => void;
  setStateNumber?: (data: number) => void;
  optionData?: string[];
  type: "select" | "number";
  disabled?: boolean;
};

export default function Input({
  labelName,
  value,
  setStateString,
  setStateNumber,
  optionData,
  type,
  disabled,
}: PropsType) {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.currentTarget.value;
    if (setStateString) setStateString(selectedValue);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enteredValue = e.currentTarget.value;
    if (setStateNumber) setStateNumber(+enteredValue);
  };

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={labelName}>
        {labelName}
      </label>
      {type === "select" ? (
        <select
          onChange={handleSelectChange}
          className={styles.input}
          id={labelName}
          value={value}
          disabled={disabled}
        >
          {optionData!.map((data, idx) => (
            <option key={idx} className={styles.option} value={data}>
              {data}
            </option>
          ))}
        </select>
      ) : (
        <input
          onChange={handleNumberChange}
          className={styles.input}
          type="number"
          value={value === 0 ? undefined : value}
          placeholder="Please enter a value"
        />
      )}
    </div>
  );
}
