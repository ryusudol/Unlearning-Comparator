import { useContext } from "react";
import styles from "./Explanation.module.css";

import retrainedData from "../../constants/result_GT_1.json";
import { OverviewContext } from "../../store/overview-context";
import { SelectedIDContext } from "../../store/selected-id-context";
import { BaselineContext } from "../../store/baseline-context";

interface Props {
  mode: "r" | "u";
}

export default function RunningExplanation({ mode }: Props) {
  const { overview } = useContext(OverviewContext);
  const { selectedID } = useContext(SelectedIDContext);
  const { baseline } = useContext(BaselineContext);

  const overviewItem = overview[selectedID - 1];
  const unlearnMethod = overviewItem?.unlearn.includes("Custom")
    ? `${overviewItem?.unlearn.slice(0, 20)}...`
    : overviewItem?.unlearn;

  return (
    <div className={styles.explanation}>
      <p>
        <span className={styles.bold}>Method</span>
        <span>{`: ${mode === "r" ? "Retrain" : unlearnMethod}`}</span>
      </p>
      <p>
        <span className={styles.bold}>Forget Class</span>
        <span>: {baseline}</span>
      </p>
      <p>
        <span className={styles.bold}>Epochs</span>
        <span>{`: ${
          mode === "r" ? retrainedData.unlearning.epochs : overviewItem?.epochs
        }`}</span>
      </p>
    </div>
  );
}
