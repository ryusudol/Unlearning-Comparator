import {
  TrainingStatus,
  UnlearningStatus,
  DefenseStatus,
} from "./types/settings";

export function getAccuracies(
  selectedMode: "Test" | "Train",
  identifier: "training" | "unlearning" | "defense",
  status: TrainingStatus | UnlearningStatus | DefenseStatus | undefined
) {
  const isTraining = identifier === "training";
  const isUnlearning = identifier === "unlearning";

  let accuracies: number[] = [];

  if (selectedMode === "Test") {
    if (
      isTraining &&
      status &&
      (status as TrainingStatus).test_class_accuracies &&
      !Array.isArray((status as TrainingStatus).test_class_accuracies)
    ) {
      for (let key in (status as TrainingStatus).test_class_accuracies)
        accuracies.push((status as TrainingStatus).test_class_accuracies[key]);
    } else if (
      isUnlearning &&
      status &&
      (status as UnlearningStatus).test_class_accuracies &&
      !Array.isArray((status as UnlearningStatus).test_class_accuracies)
    ) {
      for (let key in (status as UnlearningStatus).test_class_accuracies)
        accuracies.push(
          (status as UnlearningStatus).test_class_accuracies![key]
        );
    }
  } else {
    if (
      isTraining &&
      status &&
      (status as TrainingStatus).train_class_accuracies &&
      !Array.isArray((status as TrainingStatus).train_class_accuracies)
    ) {
      for (let key in (status as TrainingStatus).train_class_accuracies)
        accuracies.push((status as TrainingStatus).train_class_accuracies[key]);
    } else if (
      isUnlearning &&
      status &&
      (status as UnlearningStatus).train_class_accuracies &&
      !Array.isArray((status as UnlearningStatus).train_class_accuracies)
    ) {
      for (let key in (status as UnlearningStatus).train_class_accuracies)
        accuracies.push(
          (status as UnlearningStatus).train_class_accuracies[key]
        );
    }
  }

  return { isTraining, isUnlearning, accuracies };
}

export function getDefaultUnlearningConfig(method: string) {
  let epochs, learning_rate;

  if (method === "ft") {
    epochs = 10;
    learning_rate = -2;
  } else if (method === "rl") {
    epochs = 3;
    learning_rate = -2;
  } else if (method === "ga") {
    epochs = 3;
    learning_rate = -4;
  } else {
    epochs = 30;
    learning_rate = -2;
  }

  return { epochs, learning_rate };
}

export const hexToRgba = (hex: string, opacity: number) => {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
