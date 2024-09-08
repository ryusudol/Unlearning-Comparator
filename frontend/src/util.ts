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

  if (method === "Fine-Tuning") {
    epochs = 10;
    learning_rate = 0.02;
  } else if (method === "Random-Label") {
    epochs = 3;
    learning_rate = 0.01;
  } else if (method === "Gradient-Ascent") {
    epochs = 3;
    learning_rate = 0.0001;
  } else {
    epochs = 30;
    learning_rate = 0.01;
  }

  return { epochs, learning_rate };
}

export const getColorForValue = (value: number) => {
  if (value >= 0.95) return "#a1d76a";
  if (value >= 0.9) return "#d9ef8b";
  if (value >= 0.85) return "#f7f7f7";
  if (value >= 0.8) return "#fde0ef";
  if (value >= 0.75) return "#f1b6da";
  return "#e9a3c9";
};
