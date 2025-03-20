// Configuration Data
export interface UnlearningConfigurationData {
  method: string;
  forget_class: number;
  epochs: number;
  learning_rate: number;
  batch_size: number;
  base_weights: string;
}

// Status
export interface ClassAccuracies {
  [key: string]: number;
}

export interface UnlearningStatus {
  is_unlearning: boolean;
  progress: string;
  recent_id: string | null;
  current_epoch: number;
  total_epochs: number;
  current_unlearn_loss: number;
  current_unlearn_accuracy: number;
  p_training_loss: number;
  p_training_accuracy: number;
  p_test_loss: number;
  p_test_accuracy: number;
  method: string;
  estimated_time_remaining: number;
  elapsed_time: number;
  completed_steps: number[];
  learning_rate?: number;
  batch_size?: number;
}

// others
export interface Action {
  type: string;
  payload: string | number;
}

export type PerformanceMetrics = {
  [key: string]: d3.ScaleLinear<number, number, never>;
};
