export interface RunningStatus {
  isRunning: boolean;
}

export interface RunningStatusContextType extends RunningStatus {
  updateIsRunning: (isRunning: boolean) => void;
}

export type Action = { type: "UPDATE_IS_RUNNING"; payload: boolean };
