import React from "react";
import styles from "./SubTitle.module.css";

type PropsType = {
  subtitle: string;
};

export default function SubTitle({ subtitle }: PropsType) {
  return <p className={styles.subtitle}>{subtitle}</p>;
}
