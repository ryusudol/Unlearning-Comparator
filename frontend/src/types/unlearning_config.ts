export interface Status {
  is_unlearning: boolean;
  progress: number;
  current_epoch: number;
  total_epochs: number;
  current_loss: number;
  best_loss: number;
  current_accuracy: number;
  best_accuracy: number;
  estimated_time_remaining: number;
  forget_class: number;
}

export interface Configuration {
  method: string;
  forget_class: string;
  epochs: number;
  batch_size: number;
  learning_rate: number;
}

export interface Action {
  type: string;
  payload: string | number;
}

export interface Props {
  operationStatus: number;
  setOperationStatus: (val: number) => void;
  trainedModels: string[];
}

export type Timer = ReturnType<typeof setInterval> | undefined;
