import { TrainingStatus, UnlearningStatus } from "./settings";

export type Status = TrainingStatus | UnlearningStatus | undefined;

export interface RunningStatus {
  isRunning: boolean;
  indicator: string;
  status: Status;
}

export interface RunningStatusContextType extends RunningStatus {
  initRunningStatus: () => void;
  saveRunningStatus: (status: RunningStatus) => void;
  updateIsRunning: (isRunning: boolean) => void;
  updateIndicator: (indicator: string) => void;
  updateStatus: (status: Status) => void;
}

export type Action =
  | { type: "INIT_RUNNING_STATUS" }
  | { type: "SAVE_RUNNING_STATUS"; payload: RunningStatus }
  | { type: "UPDATE_IS_RUNNING"; payload: boolean }
  | { type: "UPDATE_INDICATOR"; payload: string }
  | { type: "UPDATE_STATUS"; payload: Status };
