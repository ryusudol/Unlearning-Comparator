import React from "react";
import styles from "./RunButton.module.css";

interface Props {
  operationStatus: number;
}

export default function RunButton({ operationStatus }: Props) {
  return (
    <button className={styles.button}>
      {operationStatus ? "Cancel" : "Run"}
    </button>
  );
}
