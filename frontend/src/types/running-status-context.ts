import { UnlearningStatus } from "./experiments";

export type UpdateStatusPayload = {
  status: UnlearningStatus;
  forgetClass: number;
  progress: string;
  elapsedTime: number;
  completedSteps: number[];
};

export interface RunningStatus {
  isRunning: boolean;
  status: UnlearningStatus[];
  activeStep: number;
}

export interface RunningStatusContextType extends RunningStatus {
  updateIsRunning: (isRunning: boolean) => void;
  initStatus: (forgetClass: number) => void;
  retrieveStatus: () => void;
  updateStatus: (payload: UpdateStatusPayload) => void;
  updateActiveStep: (step: number) => void;
}

export type Action =
  | { type: "UPDATE_IS_RUNNING"; payload: boolean }
  | { type: "INIT_STATUS"; payload: number }
  | { type: "RETRIEVE_STATUS" }
  | { type: "UPDATE_STATUS"; payload: UpdateStatusPayload }
  | { type: "UPDATE_ACTIVE_STEP"; payload: number };
