import { ExperimentData } from "./data";

export type Experiment = Omit<ExperimentData, "points">;

export type Experiments = { [key: string]: Experiment };

type AddExperimentPayload = {
  experiment: ExperimentData;
  tempIdx?: number;
};

type UpdateExperimentPayload = {
  experiment: ExperimentData;
  idx: number;
};

export interface Context {
  experiments: Experiments;
  baselineExperiment: Experiment | undefined;
  comparisonExperiment: Experiment | undefined;
  isExperimentLoading: boolean;
}

export interface ContextType extends Context {
  addExperiment: (experiment: ExperimentData, tempIdx?: number) => void;
  updateExperiment: (experiment: ExperimentData, idx: number) => void;
  saveExperiments: (experiments: Experiments) => void;
  retrieveExperiments: () => void;
  deleteExperiment: (id: string) => void;
  setIsExperimentsLoading: (loading: boolean) => void;
}

export type Action =
  | { type: "ADD_EXPERIMENT"; payload: AddExperimentPayload }
  | { type: "UPDATE_EXPERIMENT"; payload: UpdateExperimentPayload }
  | { type: "SAVE_EXPERIMENTS"; payload: Experiments }
  | { type: "RETRIEVE_EXPERIMENTS" }
  | { type: "DELETE_EXPERIMENT"; payload: string }
  | { type: "SET_IS_EXPERIMENTS_LOADING"; payload: boolean };
