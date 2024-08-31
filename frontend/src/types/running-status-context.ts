import { TrainingStatus, UnlearningStatus } from "./settings";

export interface RunningStatus {
  isRunning: boolean;
  indicator: string;
  status: TrainingStatus | UnlearningStatus | undefined;
}

export interface RunningStatusContextType extends RunningStatus {
  saveRunningStatus: (status: RunningStatus) => void;
  retrieveRunningStatus: () => RunningStatus;
  clearRunningStatus: () => void;
}

export type Action =
  | { type: "SAVE_RUNNING_STATUS"; payload: RunningStatus }
  | { type: "RETRIEVE_RUNNING_STATUS" }
  | { type: "CLEAR_RUNNING_STATUS" };
