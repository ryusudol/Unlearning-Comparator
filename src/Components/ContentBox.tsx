import React from "react";
import styles from "./ContentBox.module.css";

type PropsType = {
  children?: React.ReactNode;
  height: 20 | 25 | 45 | 50;
};

export default function ContentBox({ children, height }: PropsType) {
  const heightMode =
    height === 20
      ? "height-20"
      : height === 25
      ? "height-25"
      : height === 45
      ? "height-45"
      : "height-50";

  return (
    <section className={styles.section} id={styles[heightMode]}>
      {children}
    </section>
  );
}
