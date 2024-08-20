export interface Baseline {
  baseline: number;
}

export interface BaselineContextType extends Baseline {
  saveBaseline: (baseline: number) => void;
  retrieveBaseline: () => number;
  clearBaseline: () => void;
}

export type Action =
  | { type: "SAVE_BASELINE"; payload: number }
  | { type: "RETRIEVE_BASELINE" }
  | { type: "CLEAR_BASELINE" };
