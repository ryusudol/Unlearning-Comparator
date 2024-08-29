export interface OverviewItem {
  forgetClass: string;
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
}

export interface Overview {
  overview: OverviewItem[];
}

export interface OverviewContextType extends Overview {
  saveOverview: (overview: Overview) => void;
  retrieveOverview: () => Overview;
  clearOverview: () => void;
}

export type Action =
  | { type: "SAVE_OVERVIEW"; payload: Overview }
  | { type: "RETRIEVE_OVERVIEW" }
  | { type: "CLEAR_OVERVIEW" };
