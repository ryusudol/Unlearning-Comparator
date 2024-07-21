import React from "react";
import styles from "./PerformanceMetrics.module.css";

import Title from "../views/Title";
import ContentBox from "../views/ContentBox";

export default function PerformanceMetrics() {
  return (
    <section className={styles.section}>
      <Title title="Performance Metrics" />
      <ContentBox height={430}>
        <div className={styles.wrapper}></div>
      </ContentBox>
    </section>
  );
}
