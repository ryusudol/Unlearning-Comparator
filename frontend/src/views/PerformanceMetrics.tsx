import styles from "./PerformanceMetrics.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import CustomBarChart from "../components/CustomBarChart";
import { TABLEAU10 } from "../constants/tableau10";

interface Props {
  height: number;
}

export default function PerformanceMetrics({ height }: Props) {
  return (
    <section className={styles["performance-metrics"]}>
      <Title title="Performance Metrics" />
      <ContentBox height={height}>
        <div className={styles.wrapper}>
          <div className={styles["barchart-row"]}>
            <p className={styles.category}>Retrain</p>
            <CustomBarChart
              title="Training Accuracy"
              dataKey="training"
              color={TABLEAU10[0]}
              barWidth={6}
            />
            <CustomBarChart
              title="Test Accuracy"
              dataKey="test"
              color={TABLEAU10[1]}
              barWidth={6}
            />
          </div>
          <div className={styles["barchart-row"]}>
            <p className={styles.category}>Unlearning</p>
            <CustomBarChart
              title="Training Accuracy"
              dataKey="training"
              color={TABLEAU10[0]}
              barWidth={6}
            />
            <CustomBarChart
              title="Test Accuracy"
              dataKey="test"
              color={TABLEAU10[1]}
              barWidth={6}
            />
          </div>
        </div>
      </ContentBox>
    </section>
  );
}
