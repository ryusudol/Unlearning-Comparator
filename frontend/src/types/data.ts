export type ClassAccuracies = {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  7: number;
  8: number;
  9: number;
};

type Prediction = {
  [key: string]: number;
};

export type GroundTruthDistribution = {
  [key: string]: Prediction;
};

type Similarity = {
  forget_class: number[][];
  other_classes: number[][];
};

type SimilarityType = {
  layers: string[];
  train: Similarity;
  test: Similarity;
};

type DetailedResult = {
  index: number;
  ground_truth: number;
  original_index: number;
  predicted_class: number;
  is_forget: boolean;
  umap_embedding: number[];
  logit: number[];
};

export type Data = {
  id: string;
  forget_class: number;
  phase: string;
  init_id: string; // TODO: 지워야 할 수도
  method: string;
  epochs: number | string;
  batch_size: number | string;
  learning_rate: number | string;
  unlearn_accuracy: number;
  remain_accuracy: number;
  test_unlearn_accuracy: number;
  test_remain_accuracy: number;
  RTE: number;
  train_class_accuracies: ClassAccuracies;
  test_class_accuracies: ClassAccuracies;
  train_label_distribution: GroundTruthDistribution;
  train_confidence_distribution: GroundTruthDistribution;
  test_label_distribution: GroundTruthDistribution;
  test_confidence_distribution: GroundTruthDistribution;
  similarity: SimilarityType;
  detailed_results: DetailedResult[];
};
