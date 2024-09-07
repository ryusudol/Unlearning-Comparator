import { useContext } from "react";
import styles from "./ConfigSelector.module.css";

import { RunningStatusContext } from "../../store/running-status-context";

interface Props {
  mode: number;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function ConfigSelector({ mode, onClick }: Props) {
  const { isRunning } = useContext(RunningStatusContext);

  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.button} ${mode === 0 && styles.selected}`}
        onClick={onClick}
        id="0"
        disabled={isRunning}
      >
        Training
      </button>
      <div
        className={`${styles["first-arrow"]} ${
          mode === 0 ? styles.white : styles.grey
        }`}
      />
      <button
        className={`${styles.button} ${mode === 1 && styles.selected}`}
        onClick={onClick}
        id="1"
        disabled={isRunning}
      >
        <span>Unlearning</span>
      </button>
      <div
        className={`${styles["second-arrow"]} ${
          mode === 1 ? styles.white : styles.grey
        }`}
      />
      <button
        className={`${styles.button} ${mode === 2 && styles.selected}`}
        onClick={onClick}
        id="2"
        disabled={isRunning}
      >
        <span>Defense</span>
      </button>
    </div>
  );
}
