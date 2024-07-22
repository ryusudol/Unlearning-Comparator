import React from "react";
import styles from "./ContentBox.module.css";

type PropsType = {
  children?: React.ReactNode;
  height: number;
};

export default function ContentBox({ children, height }: PropsType) {
  return (
    <section className={styles.section} style={{ height: `${height}px` }}>
      {children}
    </section>
  );
}
