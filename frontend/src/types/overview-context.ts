export interface OverviewItem {
  forget_class: string;
  training: string;
  unlearning: string;
  defense: string;
  epochs: number;
  learning_rate: number;
  batch_size: number;
  ua: number;
  ra: number;
  tua: number;
  tra: number;
  rte: number;
  train_class_accuracies: { [key: string]: string };
  test_class_accuracies: { [key: string]: string };
}

export interface OverviewList {
  overview: OverviewItem[];
}

export interface OverviewContextType extends OverviewList {
  saveOverview: (overview: OverviewList) => void;
  retrieveOverview: () => void;
  deleteLastOverviewItem: () => void;
  clearOverview: () => void;
}

export type Action =
  | { type: "SAVE_OVERVIEW"; payload: OverviewList }
  | { type: "RETRIEVE_OVERVIEW" }
  | { type: "DELETE_LAST_OVERVIEW_ITEM" }
  | { type: "CLEAR_OVERVIEW" };
