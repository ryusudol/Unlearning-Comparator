import { useContext } from "react";
import styles from "./Explanation.module.css";

import { RetrainingConfigContext } from "../../store/retraining-config-context";
import { UnlearningConfigContext } from "../../store/unlearning-config-context";

interface Props {
  mode: "r" | "u";
}

export default function RunningExplanation({ mode }: Props) {
  const { epochs: retrainedEpochs, forgetClass: retrainedForgetClass } =
    useContext(RetrainingConfigContext);
  const {
    method: unlearningMethod,
    epochs: unlearningEpochs,
    forgetClass: unlearningForgetClass,
  } = useContext(UnlearningConfigContext);

  return (
    <p className={styles.explanation}>
      <p>
        <span className={styles.bold}>Method</span>
        <span>{`: ${mode === "r" ? "Retrain" : unlearningMethod}`}</span>
      </p>
      <p>
        <span className={styles.bold}>Forget Class</span>
        <span>{`: ${
          mode === "r" ? retrainedForgetClass : unlearningForgetClass
        }`}</span>
      </p>
      <p>
        <span className={styles.bold}>Epochs</span>
        <span>{`: ${mode === "r" ? retrainedEpochs : unlearningEpochs}`}</span>
      </p>
    </p>
  );
}
