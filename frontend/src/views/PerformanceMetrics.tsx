import styles from "./PerformanceMetrics.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";

export default function PerformanceMetrics() {
  return (
    <section className={styles["performance-metrics"]}>
      <Title title="Performance Metrics" />
      <ContentBox height={325}>
        <div></div>
      </ContentBox>
    </section>
  );
}
