import React from "react";

import styles from "./Input.module.css";
import { Action } from "../types/training_config";

type PropsType = {
  labelName: string;
  value: string | number | undefined;
  setStateString?: (data: string) => void;
  setStateNumber?: (data: number) => void;
  dispatch?: (action: Action) => void;
  optionData?: string[];
  type: "select" | "number";
  disabled?: boolean;
};

export default function Input({
  labelName,
  value,
  setStateString,
  setStateNumber,
  dispatch,
  optionData,
  type,
  disabled,
}: PropsType) {
  const handleChange = (
    e:
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLInputElement>
  ) => {
    const { id, value } = e.currentTarget;
    if (setStateString) setStateString(value);
    else if (setStateNumber) setStateNumber(+value);
    else if (dispatch)
      dispatch({
        type: `UPDATE_${id.toUpperCase().replace(" ", "_")}`,
        payload:
          id === "Epochs" ||
          id === "Batch Size" ||
          id === "Learning Rate" ||
          id === "Seed"
            ? +value
            : value,
      });
  };

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={labelName}>
        {labelName}
      </label>
      {type === "select" ? (
        <select
          onChange={handleChange}
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
          id={labelName}
          onChange={handleChange}
          className={styles.input}
          type="number"
          value={value === 0 ? undefined : value}
          placeholder="Please enter a value"
        />
      )}
    </div>
  );
}
