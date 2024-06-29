import React from "react";
import styles from "./Title.module.css";

type PropsType = {
  title: string;
};

export default function Title({ title }: PropsType) {
  return <p className={styles.title}>{title}</p>;
}
