import { useContext } from "react";
import styles from "./Explanation.module.css";

import { retrainedData } from "../../constants/gt";
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

  const overviewItem = overview[selectedID];
  const unlearnMethod = overviewItem?.unlearning.includes("Custom")
    ? `${overviewItem?.unlearning.slice(0, 20)}...`
    : overviewItem?.unlearning;

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
          mode === "r"
            ? retrainedData[baseline].unlearning.epochs
            : overviewItem?.epochs
        }`}</span>
      </p>
    </div>
  );
}
