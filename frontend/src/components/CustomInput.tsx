import React from "react";
import styles from "./CustomInput.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

interface Props {
  mode: 0 | 1;
  customFile: File | undefined;
  handleCustomFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export default function CustomInput({
  mode,
  customFile,
  handleCustomFileUpload,
  disabled,
}: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles["label-wrapper"]}>
        <FontAwesomeIcon
          className={styles[disabled ? "icon-disabled" : "icon"]}
          icon={mode ? faCircleCheck : faCircle}
        />
        <span className={styles[disabled ? "label-disabled" : "label"]}>
          Custom Model
        </span>
      </div>
      <div>
        <label htmlFor="custom-training">
          {customFile ? (
            <div className={styles[disabled ? "upload-disabled" : "upload"]}>
              <span>{customFile.name}</span>
            </div>
          ) : (
            <div className={styles[disabled ? "upload-disabled" : "upload"]}>
              Click to upload
            </div>
          )}
        </label>
        <input
          onChange={handleCustomFileUpload}
          className={styles["file-input"]}
          type="file"
          id="custom-training"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
