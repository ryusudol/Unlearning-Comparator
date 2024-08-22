import React from "react";
import styles from "./PredefinedInput.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

interface Props {
  mode: 0 | 1;
  handleMethodSelection?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  optionData?: string[];
}

export default function PredefinedInput({
  mode,
  handleMethodSelection,
  optionData,
}: Props) {
  return (
    <div className={styles.mode}>
      <div className={styles["label-wrapper"]}>
        <FontAwesomeIcon
          className={styles.icon}
          icon={mode ? faCircle : faCircleCheck}
        />
        <label>Predefined {optionData ? "Method" : "Setting"}</label>
      </div>
      {optionData && (
        <select name="method" onChange={handleMethodSelection}>
          {optionData.map((method, idx) => (
            <option key={idx} value={method}>
              {method}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
