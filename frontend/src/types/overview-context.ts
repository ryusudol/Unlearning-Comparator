export interface OverviewItem {
  forget_class: string;
  model: string;
  dataset: string;
  unlearn: string;
  trained_model: string;
  defense: string;
  epochs: number;
  learningRate: number;
  batchSize: number;
  ua: number;
  ra: number;
  ta: number;
  mia: number;
  avg_gap: number;
  rte: number;
  retrain_svgs: string[];
  unlearn_svgs: string[];
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
