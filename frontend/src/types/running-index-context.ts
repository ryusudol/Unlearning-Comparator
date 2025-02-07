import { RUNNING_INDEX_ACTIONS } from "../constants/actions";

export interface RunningIndex {
  runningIndex: number;
}

export interface RunningIndexContextType extends RunningIndex {
  updateRunningIndex: (runningIndex: number) => void;
  retrieveRunningIndex: () => void;
}

export type Action =
  | {
      type: typeof RUNNING_INDEX_ACTIONS.UPDATE_RUNNING_INDEX;
      payload: number;
    }
  | {
      type: typeof RUNNING_INDEX_ACTIONS.RETRIEVE_RUNNING_INDEX;
    };
