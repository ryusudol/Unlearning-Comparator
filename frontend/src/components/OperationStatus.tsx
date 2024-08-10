import styles from "./OperationStatus.module.css";

import { TrainingStatus, UnlearningStatus } from "../types/settings";

interface Props {
  indicator: string;
  status: TrainingStatus | UnlearningStatus | undefined;
}

export default function OperationStatus({ indicator, status }: Props) {
  return (
    <div className={styles["status-wrapper"]}>
      <span className={styles.status}>{indicator}</span>
      {status && status.current_epoch >= 1 ? (
        <div className={styles["status-detail-wrapper"]}>
          <span className={styles["status-detail"]}>
            Epoch: {status.current_epoch}/{status.total_epochs}
          </span>
          <span className={styles["status-detail"]}>
            Current Loss: {status.current_loss.toFixed(3)}
          </span>
          <span className={styles["status-detail"]}>
            Best Loss: {status.best_loss.toFixed(3)}
          </span>
          <span className={styles["status-detail"]}>
            Current Accuracy: {status.current_accuracy.toFixed(3)}
          </span>
          <span className={styles["status-detail"]}>
            Best Accuracy: {status.best_accuracy.toFixed(3)}
          </span>
          <span className={styles["status-detail"]}>
            ETA: {status.estimated_time_remaining.toFixed(2)}s
          </span>
        </div>
      ) : null}
    </div>
  );
}
