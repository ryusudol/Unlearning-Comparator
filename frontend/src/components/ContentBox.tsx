import React from "react";
import styles from "./ContentBox.module.css";

type PropsType = {
  children?: React.ReactNode;
  height: number;
};

export default function ContentBox({ children, height }: PropsType) {
  return (
    <div className={styles.box} style={{ height: `${height}px` }}>
      {children}
    </div>
  );
}
