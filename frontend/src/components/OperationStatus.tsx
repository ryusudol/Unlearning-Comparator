import { useState } from "react";
import styles from "./OperationStatus.module.css";

import ProgressBar from "../components/UI/ProgressBar";
import { getAccuracies } from "../util";
import {
  TrainingStatus,
  UnlearningStatus,
  DefenseStatus,
} from "../types/settings";

const MODES: Mode[] = ["Test", "Train"];
let prevETA: number, ETA: number | undefined;

type Mode = "Test" | "Train";
type Identifier = "training" | "unlearning" | "defense";
interface Props {
  identifier: Identifier;
  indicator: string;
  status: TrainingStatus | UnlearningStatus | DefenseStatus | undefined;
}

export default function OperationStatus({
  identifier,
  indicator,
  status,
}: Props) {
  const [selectedMode, setSelectedMode] = useState<Mode>(MODES[0]);

  const handleModeSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMode(e.currentTarget.value as Mode);
  };

  const { isTraining, accuracies } = getAccuracies(
    selectedMode,
    identifier,
    status
  );

  if (status && status.estimated_time_remaining && status.current_epoch === 1) {
    prevETA = status.estimated_time_remaining;
    ETA = status.estimated_time_remaining;
  } else if (
    status &&
    status.estimated_time_remaining &&
    status.current_epoch > 1
  ) {
    ETA = prevETA;
  } else {
    ETA = undefined;
  }

  return (
    <div className={styles["status-wrapper"]}>
      <div className={styles.header}>
        <span className={styles.status}>{indicator}</span>
        <select
          onChange={handleModeSelection}
          className={styles["class-accuracy-selector"]}
        >
          {MODES.map((mode, idx) => (
            <option key={idx} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.content}>
        {status && status.current_epoch >= 1 && (
          <div className={styles["status-detail-wrapper"]}>
            <span className={styles["status-detail"]}>
              Epoch: {status.current_epoch}/{status.total_epochs}
            </span>
            <span className={styles["status-detail"]}>
              Current Loss: {status.current_loss.toFixed(3)}
            </span>
            <span className={styles["status-detail"]}>
              Current Accuracy: {status.current_accuracy.toFixed(3)}
            </span>
            {isTraining ? (
              <span className={styles["status-detail"]}>
                Best Loss: {(status as TrainingStatus).best_loss.toFixed(3)}
              </span>
            ) : (
              <span className={styles["status-detail"]}>
                Test Loss: {(status as UnlearningStatus).test_loss.toFixed(3)}
              </span>
            )}
            {isTraining ? (
              <span className={styles["status-detail"]}>
                Best Accuracy:{" "}
                {(status as TrainingStatus).best_accuracy.toFixed(3)}
              </span>
            ) : (
              <span className={styles["status-detail"]}>
                Test Accuracy:{" "}
                {(status as UnlearningStatus).test_accuracy.toFixed(3)}
              </span>
            )}
            <span className={styles["status-detail"]}>
              ETA: {status.estimated_time_remaining!.toFixed(2)}s
            </span>
            <ProgressBar eta={ETA} />
          </div>
        )}
        <div className={styles["class-accuracies"]}>
          {accuracies.length !== 0 &&
            accuracies.map((acc, idx) => (
              <span key={idx} className={styles.accuracy}>
                Class {idx}: {acc.toFixed(1)}%
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
