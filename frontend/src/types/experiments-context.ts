import { ExperimentData } from "./data";

export type Experiments = { [key: string]: ExperimentData };
type AddExperimentPayload = {
  experiment: ExperimentData;
  tempIdx?: number;
};

export interface Context {
  experiments: Experiments;
  baselineExperiment: ExperimentData | undefined;
  comparisonExperiment: ExperimentData | undefined;
  isExperimentLoading: boolean;
}

export interface ContextType extends Context {
  addExperiment: (experiment: ExperimentData, tempIdx?: number) => void;
  saveExperiments: (experiments: Experiments) => void;
  retrieveExperiments: () => void;
  deleteExperiment: (id: string) => void;
  setIsExperimentsLoading: (loading: boolean) => void;
}

export type Action =
  | { type: "ADD_EXPERIMENT"; payload: AddExperimentPayload }
  | { type: "SAVE_EXPERIMENTS"; payload: Experiments }
  | { type: "RETRIEVE_EXPERIMENTS" }
  | { type: "DELETE_EXPERIMENT"; payload: string }
  | { type: "SET_IS_EXPERIMENTS_LOADING"; payload: boolean };
