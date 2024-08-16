import styles from "./PerformanceOverview.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import { Heatmap } from "../components/UI/Heatmap";
import { HeatmapData } from "../types/archives";

let data: HeatmapData[] = [];
const xAxis = ["UA", "RA", "TA", "RTE", "Avg"];
const yAxis = ["Retrain", "U1", "U2+D1", "U3+D2", "U4", "U5"];

for (let i = 0; i < xAxis.length; i++) {
  for (let j = 0; j < yAxis.length; j++) {
    data.push({
      x: xAxis[i],
      y: yAxis[j],
      value: Math.random() * 40,
    });
  }
}

const height = yAxis.length < 4 ? 55 * yAxis.length : 220;

export default function PerformanceOverview() {
  return (
    <section className={styles["performance-overview"]}>
      <Title title="Performance Overview" />
      <ContentBox height={253}>
        <div className={styles["heatmap-wrapper"]}>
          <Heatmap width={550} height={height} data={data} />
        </div>
      </ContentBox>
    </section>
  );
}
