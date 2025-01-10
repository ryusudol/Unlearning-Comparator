import { UnlearningStatus } from "../../types/experiments";

export function getCurrentProgress(status: UnlearningStatus) {
  return status.is_unlearning && status.progress === "Idle"
    ? "Unlearning"
    : !status.is_unlearning
    ? "Idle"
    : status.progress;
}

export function getCompletedSteps(progress: string, status: UnlearningStatus) {
  if (
    (progress === "Unlearning" &&
      status.current_epoch !== status.total_epochs) ||
    (progress === "Unlearning" && status.is_unlearning)
  ) {
    return [1];
  } else if (progress.includes("Evaluating")) {
    return [1, 2];
  } else if (progress.includes("UMAP") || progress.includes("CKA")) {
    return [1, 2, 3];
  } else {
    return [1, 2, 3];
  }
}
