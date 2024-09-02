import { useContext } from "react";
import styles from "./PerformanceMetrics.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import SubTitle from "../components/SubTitle";
import CustomBarChart from "../components/CustomBarChart";
import { TABLEAU10 } from "../constants/tableau10";
import { retrainedData } from "../constants/gt";
import { BaselineContext } from "../store/baseline-context";
import { OverviewContext } from "../store/overview-context";
import { SelectedIDContext } from "../store/selected-id-context";

interface Props {
  height: number;
}

export default function PerformanceMetrics({ height }: Props) {
  const { baseline } = useContext(BaselineContext);
  const { overview } = useContext(OverviewContext);
  const { selectedID } = useContext(SelectedIDContext);

  const currRetrainedData = retrainedData[baseline];
  const currOverview = overview.filter(
    (item) => item.forget_class === baseline.toString()
  );
  const currOverviewItem = currOverview[selectedID];

  return (
    <section className={styles["performance-metrics"]}>
      <Title title="Performance Metrics" />
      <ContentBox height={height}>
        <div className={styles.wrapper}>
          <div className={styles.subtitles}>
            <SubTitle subtitle="Training Accuracies" fontSize={13} />
            <SubTitle subtitle="Test Accuracies" fontSize={13} />
          </div>
          <div className={styles["barchart-row"]}>
            <p className={styles.category}>Retrain</p>
            <CustomBarChart
              data={currRetrainedData.train_class_accuracies}
              dataKey="training"
              color={TABLEAU10[0]}
            />
            <div style={{ width: "10px" }} />
            <CustomBarChart
              data={currRetrainedData.test_class_accuracies}
              dataKey="test"
              color={TABLEAU10[1]}
            />
          </div>
          <div className={styles["barchart-row"]}>
            <p className={styles.category}>Unlearning</p>
            <CustomBarChart
              data={
                currOverviewItem ? currOverviewItem.train_class_accuracies : []
              }
              dataKey="training"
              color={TABLEAU10[0]}
            />
            <div style={{ width: "10px" }} />
            <CustomBarChart
              data={
                currOverviewItem ? currOverviewItem.test_class_accuracies : []
              }
              dataKey="test"
              color={TABLEAU10[1]}
            />
          </div>
        </div>
      </ContentBox>
    </section>
  );
}
