export interface ClassAccuracies {
  [key: string]: number;
}

export interface Status {
  is_training: boolean;
  current_epoch: number;
  total_epochs: number;
  current_loss: number;
  best_loss: number;
  current_accuracy: number;
  best_accuracy: number;
  test_loss: number;
  test_accuracy: number;
  train_class_accuracies: ClassAccuracies;
  test_class_accuracies: ClassAccuracies;
  estimated_time_remaining: number;
}

export interface Configuration {
  model: string;
  dataset: string;
  epochs: number;
  batch_size: number;
  learning_rate: number;
  seed: number;
}

export interface Action {
  type: string;
  payload: string | number;
}

export interface Props {
  isRunning: number;
  setIsRunning: (val: number) => void;
  setTrainedModels: (models: string[]) => void;
}

export type Timer = ReturnType<typeof setInterval> | undefined;
