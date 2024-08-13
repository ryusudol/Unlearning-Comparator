import styles from "./PerformanceMetrics.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import CustomBarChart from "../components/CustomBarChart";

export default function PerformanceMetrics() {
  return (
    <section className={styles["performance-metrics"]}>
      <Title title="Performance Metrics" />
      <ContentBox height={253}>
        <div className={styles["barchart-row"]}>
          <div>
            <CustomBarChart dataKey="ua" color="4E79A7" />
            <CustomBarChart dataKey="ra" color="F28E2B" />
          </div>
          <div>
            <CustomBarChart dataKey="ta" color="E15759" />
            <CustomBarChart dataKey="rte" color="76B7B2" />
          </div>
        </div>
      </ContentBox>
    </section>
  );
}
