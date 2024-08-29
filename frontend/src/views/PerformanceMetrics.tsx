import styles from "./PerformanceMetrics.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import CustomBarChart from "../components/CustomBarChart";
import { TABLEAU10 } from "../constants/tableau10";

export default function PerformanceMetrics() {
  return (
    <section className={styles["performance-metrics"]}>
      <Title title="Performance Metrics" />
      <ContentBox height={253}>
        <div className={styles.wrapper}>
          <div className={styles["barchart-row"]}>
            <p className={styles.category}>Retrain</p>
            <CustomBarChart
              title="Training Accuracy"
              dataKey="training"
              color={TABLEAU10[0]}
            />
            <CustomBarChart
              title="Test Accuracy"
              dataKey="test"
              color={TABLEAU10[1]}
            />
          </div>
          <div className={styles["barchart-row"]}>
            <p className={styles.category}>Unlearning</p>
            <CustomBarChart
              title="Training Accuracy"
              dataKey="training"
              color={TABLEAU10[0]}
            />
            <CustomBarChart
              title="Test Accuracy"
              dataKey="test"
              color={TABLEAU10[1]}
            />
          </div>
        </div>
      </ContentBox>
    </section>
  );
}
