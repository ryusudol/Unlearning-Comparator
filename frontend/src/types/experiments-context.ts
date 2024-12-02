import { ExperimentData } from "./data";

export type Experiments = { [key: string]: ExperimentData };

export interface Context {
  experiments: Experiments;
  baselineExperiment: ExperimentData | undefined;
  comparisonExperiment: ExperimentData | undefined;
  isExperimentLoading: boolean;
}

export interface ContextType extends Context {
  addExperiment: (experiment: ExperimentData) => void;
  saveExperiments: (experiments: Experiments) => void;
  retrieveExperiments: () => void;
  deleteExperiment: (id: string) => void;
  setIsExperimentsLoading: (loading: boolean) => void;
}

export type Action =
  | { type: "ADD_EXPERIMENT"; payload: ExperimentData }
  | { type: "SAVE_EXPERIMENTS"; payload: Experiments }
  | { type: "RETRIEVE_EXPERIMENTS" }
  | { type: "DELETE_EXPERIMENT"; payload: string }
  | { type: "SET_IS_EXPERIMENTS_LOADING"; payload: boolean };
