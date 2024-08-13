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
        <div>
          <div className={styles["barchart-row"]}>
            <CustomBarChart
              title="Unlearning Accuracy"
              dataKey="ua"
              color={TABLEAU10[0]}
            />
            <CustomBarChart
              title="Remaining Accuracy"
              dataKey="ra"
              color={TABLEAU10[1]}
            />
          </div>
          <div className={styles["barchart-row"]}>
            <CustomBarChart
              title="Test Accuracy"
              dataKey="ta"
              color={TABLEAU10[2]}
            />
            <CustomBarChart
              title="Run-Time Efficiency"
              dataKey="rte"
              color={TABLEAU10[3]}
            />
          </div>
        </div>
      </ContentBox>
    </section>
  );
}
