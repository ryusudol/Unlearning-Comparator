import React from "react";
import styles from "./Button.module.css";

type PropsType = {
  buttonText: string;
};

export default function Button({ buttonText }: PropsType) {
  return <div className={styles["button-wrapper"]}>{buttonText}</div>;
}
