import { UnlearningStatus } from "./settings";

export interface RunningStatus {
  isRunning: boolean;
  status: UnlearningStatus;
  activeStep: number;
  completedSteps: number[];
}

export interface RunningStatusContextType extends RunningStatus {
  updateIsRunning: (isRunning: boolean) => void;
  initStatus: () => void;
  retrieveStatus: () => void;
  updateStatus: (status: UnlearningStatus) => void;
  updateActiveStep: (step: number) => void;
}

export type Action =
  | { type: "UPDATE_IS_RUNNING"; payload: boolean }
  | { type: "INIT_STATUS" }
  | { type: "RETRIEVE_STATUS" }
  | { type: "UPDATE_STATUS"; payload: UnlearningStatus }
  | { type: "UPDATE_ACTIVE_STEP"; payload: number };
