type Prediction = {
  [key: string]: number;
};

export type GroundTruthDistribution = {
  [key: string]: Prediction;
};

export type Data = {
  id: string;
  forget_class: number;
  phase: string;
  // initial_checkpoint: string;
  method: string;
  epochs: number | string;
  batch_size: number | string;
  learning_rate: number | string;
  seed: number;
  unlearn_accuracy: number;
  remain_accuracy: number;
  test_unlearn_accuracy: number;
  test_remain_accuracy: number;
  RTE: number | string;
  train_label_distribution: GroundTruthDistribution;
  train_confidence_distribution: GroundTruthDistribution;
  test_label_distribution: GroundTruthDistribution;
  test_confidence_distribution: GroundTruthDistribution;
};
