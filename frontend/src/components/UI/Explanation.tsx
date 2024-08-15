import { useContext } from "react";
import styles from "./Explanation.module.css";

import { UnlearningConfigContext } from "../../store/unlearning-config-context";

interface Props {
  mode: "r" | "u";
}

export default function RunningExplanation({ mode }: Props) {
  const { method, epochs, forgetClass } = useContext(UnlearningConfigContext);

  return (
    <p className={styles.explanation}>
      <span className={styles.bold}>Method</span>
      <span>{`: ${mode === "r" ? "Retrain" : method}, `}</span>
      <span className={styles.bold}>Epochs</span>
      <span>{`: ${mode === "r" ? 30 : epochs}, `}</span>
      <span className={styles.bold}>Forget Class</span>
      <span>{`: ${forgetClass}`}</span>
    </p>
  );
}
