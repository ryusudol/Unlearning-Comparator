import { createContext, useReducer, useCallback, useEffect } from "react";

import { UnlearningStatus } from "../types/settings";
import {
  RunningStatus,
  RunningStatusContextType,
  Action,
} from "../types/running-status-context";

const RUNNING_STATUS = "running-status";
const initialStatus: UnlearningStatus = {
  is_unlearning: false,
  progress: "Idle",
  recent_id: null,
  current_epoch: 0,
  total_epochs: 0,
  current_unlearn_loss: 0,
  current_unlearn_accuracy: 0,
  p_training_loss: 0,
  p_training_accuracy: 0,
  p_test_loss: 0,
  p_test_accuracy: 0,
  method: "",
  estimated_time_remaining: 0,
};

export const RunningStatusContext = createContext<RunningStatusContextType>({
  isRunning: false,
  status: initialStatus,
  activeStep: 0,
  completedSteps: [],

  updateIsRunning: () => {},
  initStatus: () => {},
  retrieveStatus: () => {},
  updateStatus: (status: UnlearningStatus) => {},
  updateActiveStep: (step: number) => {},
});

function runningStatusReducer(
  state: RunningStatus,
  action: Action
): RunningStatus {
  switch (action.type) {
    case "UPDATE_IS_RUNNING":
      const isRunning = action.payload;
      sessionStorage.setItem(
        RUNNING_STATUS,
        JSON.stringify({ ...state, isRunning })
      );
      return { ...state, isRunning };

    case "INIT_STATUS":
      const initializedStatus = {
        ...state,
        status: initialStatus,
        completedSteps: [],
      };
      sessionStorage.setItem(RUNNING_STATUS, JSON.stringify(initializedStatus));
      return initializedStatus;

    case "RETRIEVE_STATUS":
      const savedStatus = sessionStorage.getItem(RUNNING_STATUS);
      if (savedStatus) {
        const parsedStatus: RunningStatus = JSON.parse(savedStatus);
        sessionStorage.setItem(RUNNING_STATUS, JSON.stringify(parsedStatus));
        return parsedStatus;
      }
      return state;

    case "UPDATE_STATUS":
      const status = action.payload;
      const progress =
        status.is_unlearning && status.progress === "Idle"
          ? "Unlearning"
          : !status.is_unlearning
          ? "Idle"
          : status.progress;
      let completedSteps: number[] = [];
      if (
        (progress === "Unlearning" &&
          status.current_epoch !== status.total_epochs) ||
        (progress === "Unlearning" && status.is_unlearning)
      ) {
        completedSteps = [1];
      } else if (progress.includes("Evaluating")) {
        completedSteps = [1, 2];
      } else if (progress.includes("UMAP") || progress.includes("CKA")) {
        completedSteps = [1, 2, 3];
      } else {
        completedSteps = [1, 2, 3];
      }

      const updatedStatus = {
        ...state,
        status: { ...status, progress },
        completedSteps,
      };
      sessionStorage.setItem(RUNNING_STATUS, JSON.stringify(updatedStatus));
      return updatedStatus;

    case "UPDATE_ACTIVE_STEP":
      const step = action.payload;
      const updatedActiveStep = { ...state, activeStep: step };
      sessionStorage.setItem(RUNNING_STATUS, JSON.stringify(updatedActiveStep));
      return updatedActiveStep;

    default:
      return state;
  }
}

export default function RunningStatusContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [runningStatus, dispatch] = useReducer(runningStatusReducer, {
    isRunning: false,
    status: initialStatus,
    activeStep: 0,
    completedSteps: [],
  });

  const handleUpdateIsRunning = useCallback((isRunning: boolean) => {
    dispatch({ type: "UPDATE_IS_RUNNING", payload: isRunning });
  }, []);

  const handleInitStatus = useCallback(() => {
    dispatch({ type: "INIT_STATUS" });
  }, []);

  const handleRetrieveStatus = useCallback(() => {
    dispatch({ type: "RETRIEVE_STATUS" });
  }, []);

  const handleUpdateStatus = useCallback((status: UnlearningStatus) => {
    dispatch({ type: "UPDATE_STATUS", payload: status });
  }, []);

  const handleUpdateActiveStep = useCallback((step: number) => {
    dispatch({ type: "UPDATE_ACTIVE_STEP", payload: step });
  }, []);

  useEffect(() => {
    handleRetrieveStatus();
  }, [handleRetrieveStatus]);

  const ctxValue: RunningStatusContextType = {
    isRunning: runningStatus.isRunning,
    status: runningStatus.status,
    activeStep: runningStatus.activeStep,
    completedSteps: runningStatus.completedSteps,

    updateIsRunning: handleUpdateIsRunning,
    initStatus: handleInitStatus,
    retrieveStatus: handleRetrieveStatus,
    updateStatus: handleUpdateStatus,
    updateActiveStep: handleUpdateActiveStep,
  };

  return (
    <RunningStatusContext.Provider value={ctxValue}>
      {children}
    </RunningStatusContext.Provider>
  );
}
