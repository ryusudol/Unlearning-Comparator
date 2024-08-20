import React from "react";
import styles from "./PredefinedInput.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

interface Props {
  mode: 0 | 1;
  handleMethodSelection?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  optionData?: string[];
  disabled?: boolean;
}

export default function PredefinedInput({
  mode,
  handleMethodSelection,
  optionData,
  disabled,
}: Props) {
  return (
    <div className={styles.mode}>
      <div className={styles["label-wrapper"]}>
        <FontAwesomeIcon
          className={styles[disabled ? "icon-disabled" : "icon"]}
          icon={mode ? faCircle : faCircleCheck}
        />
        <label className={styles[disabled ? "label-disabled" : "label"]}>
          Predefined {optionData ? "Method" : "Setting"}
        </label>
      </div>
      {optionData && (
        <select
          name="method"
          onChange={handleMethodSelection}
          className={styles["predefined-select"]}
          disabled={disabled}
        >
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
