// Status
export interface ClassAccuracies {
  [key: string]: number;
}

export interface UnlearningStatus {
  is_unlearning: boolean;
  progress: number;
  current_epoch: number;
  total_epochs: number;
  current_loss: number;
  current_accuracy: number;
  test_loss: number;
  test_accuracy: number;
  train_class_accuracies: ClassAccuracies;
  test_class_accuracies: ClassAccuracies | null;
  estimated_time_remaining: number | undefined;
  forget_class: number;
}

// Temporarily created
export interface DefenseStatus {
  is_defensing: boolean;
  progress: number;
  current_epoch: number;
  total_epochs: number;
  current_loss: number;
  best_loss: number;
  current_accuracy: number;
  best_accuracy: number;
  estimated_time_remaining: number | undefined;
  forget_class: number;
}

// Configuration Data
export interface UnlearningConfigurationData {
  method: string;
  forget_class: number;
  epochs: number;
  learning_rate: number;
  batch_size: number;
}

export interface DefenseConfigurationData {
  method: string;
  param1: string;
  param2: number;
  param3: number;
}

// etc
export interface Action {
  type: string;
  payload: string | number;
}
