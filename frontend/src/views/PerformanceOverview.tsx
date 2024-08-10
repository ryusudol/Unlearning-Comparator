import styles from "./PerformanceOverview.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import { Heatmap } from "../components/UI/Heatmap";
import { HeatmapData } from "../types/archives";

let data: HeatmapData[] = [];
const xAxis = ["UA", "RA", "TA", "RTE", "Avg", "Retrain"];
const yAxis = ["U1", "U2+D1", "U3+D2"];

for (let i = 0; i < 6; i++) {
  for (let j = 0; j < 3; j++) {
    data.push({
      x: xAxis[i],
      y: yAxis[j],
      value: Math.random() * 40,
    });
  }
}

export default function PerformanceOverview() {
  return (
    <section className={styles["performance-overview"]}>
      <Title title="Performance Overview" />
      <ContentBox height={253}>
        <div className={styles["heatmap-wrapper"]}>
          <Heatmap width={460} height={140} data={data} />
        </div>
      </ContentBox>
    </section>
  );
}
