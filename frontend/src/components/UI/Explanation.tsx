import { useContext } from "react";
import styles from "./Explanation.module.css";

import { OverviewContext } from "../../store/overview-context";
import { SelectedIDContext } from "../../store/selected-id-context";

interface Props {
  mode: "r" | "u";
}

export default function RunningExplanation({ mode }: Props) {
  const { overview } = useContext(OverviewContext);
  const { selectedID } = useContext(SelectedIDContext);

  return (
    <div className={styles.explanation}>
      <p>
        <span className={styles.bold}>Method</span>
        <span>{`: ${
          mode === "r" ? "Retrain" : overview[selectedID]?.unlearn
        }`}</span>
      </p>
      <p>
        <span className={styles.bold}>Forget Class</span>
        <span>: {overview[selectedID]?.forget_class}</span>
      </p>
      <p>
        <span className={styles.bold}>Epochs</span>
        {/* TODO: Retrain일 때 Epoch 값 수정하기 */}
        <span>{`: ${mode === "r" ? 30 : overview[selectedID]?.epochs}`}</span>
      </p>
    </div>
  );
}
