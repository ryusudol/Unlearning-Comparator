import React from "react";
import styles from "./PerformanceOverview.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";

const getColorForValue = (value: string, isPercentage: boolean) => {
  let numValue = isPercentage ? parseFloat(value) : parseFloat(value) * 100;

  if (numValue >= 95) return "#a1d76a";
  if (numValue >= 90) return "#d9ef8b";
  if (numValue >= 85) return "#f7f7f7";
  if (numValue >= 80) return "#fde0ef";
  if (numValue >= 75) return "#f1b6da";
  return "#e9a3c9";
};

const TableCell = ({ value }: { value: string }) => {
  const style = {
    backgroundColor: getColorForValue(value, value.includes("%")),
  };

  return <div style={style}>{value}</div>;
};

export default function PerformanceOverview() {
  return (
    <section className={styles["performance-overview"]}>
      <Title title="Performance Overview" />
      <ContentBox height={253}>
        <div className={styles.table}>
          <div className={styles["table-header"]}>
            <div>Index</div>
            <div>Model</div>
            <div>Dataset</div>
            <div>Unlearn</div>
            <div>Defense</div>
            <div>Epoch</div>
            <div>LR</div>
            <div>Batch</div>
            <div>UA</div>
            <div>RA</div>
            <div>TA</div>
            <div>MIA</div>
            <div>Avg. Gap</div>
            <div>RTE</div>
          </div>
          <div className={styles["table-row"]}>
            <div>1</div>
            <div>ResNet-18</div>
            <div>CIFAR-10</div>
            <div>Retrain</div>
            <div>Defense X</div>
            <div>100</div>
            <div>0.01</div>
            <div>32</div>
            <TableCell value="95%" />
            <TableCell value="92%" />
            <TableCell value="90%" />
            <TableCell value="82%" />
            <TableCell value="3.95" />
            <TableCell value="0.05" />
          </div>
          <div className={styles["table-row"]}>
            <div>2</div>
            <div>ResNet-34</div>
            <div>VggFace</div>
            <div>Gradient-Ascent</div>
            <div>Defense Y</div>
            <div>150</div>
            <div>0.005</div>
            <div>64</div>
            <TableCell value="97%" />
            <TableCell value="94%" />
            <TableCell value="93%" />
            <TableCell value="82%" />
            <TableCell value="2.17" />
            <TableCell value="0.03" />
          </div>
        </div>
      </ContentBox>
    </section>
  );
}
