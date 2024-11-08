import { UnlearningStatus } from "./settings";

export interface RunningStatus {
  isRunning: boolean;
  status: UnlearningStatus;
}

export interface RunningStatusContextType extends RunningStatus {
  updateIsRunning: (isRunning: boolean) => void;
  initStatus: () => void;
  retrieveStatus: () => void;
  updateStatus: (status: UnlearningStatus) => void;
}

export type Action =
  | { type: "UPDATE_IS_RUNNING"; payload: boolean }
  | { type: "INIT_STATUS" }
  | { type: "RETRIEVE_STATUS" }
  | { type: "UPDATE_STATUS"; payload: UnlearningStatus };
