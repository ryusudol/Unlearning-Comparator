export interface Context {
  baseline: string;
  comparison: string;
}

export interface ContextType extends Context {
  saveBaseline: (baseline: string) => void;
  saveComparison: (comparison: string) => void;
  retrieveContext: () => void;
  clearContext: () => void;
}

export type Action =
  | { type: "SAVE_BASELINE"; payload: string }
  | { type: "SAVE_COMPARISON"; payload: string }
  | { type: "RETRIEVE_CONTEXT" }
  | { type: "CLEAR_CONTEXT" };
