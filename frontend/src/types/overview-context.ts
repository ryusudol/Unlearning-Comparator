export interface OverviewItem {
  forget_class: string;
  model: string;
  dataset: string;
  training: string;
  unlearning: string;
  defense: string;
  epochs: number;
  learning_rate: number;
  batch_size: number;
  ua: number;
  ra: number;
  ta: number;
  mia: number;
  avg_gap: number;
  rte: number;
  train_class_accuracies: { [key: string]: string };
  test_class_accuracies: { [key: string]: string };
  unlearn_svgs: string[];
  retrain_svgs: string[];
}

export interface Overview {
  overview: OverviewItem[];
}

export interface OverviewContextType extends Overview {
  saveOverview: (overview: Overview) => void;
  retrieveOverview: () => void;
  deleteLastOverviewItem: () => void;
  clearOverview: () => void;
}

export type Action =
  | { type: "SAVE_OVERVIEW"; payload: Overview }
  | { type: "RETRIEVE_OVERVIEW" }
  | { type: "DELETE_LAST_OVERVIEW_ITEM" }
  | { type: "CLEAR_OVERVIEW" };
