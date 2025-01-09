import { createContext, useReducer, useCallback, useEffect } from "react";

import { UnlearningStatus } from "../types/experiments";
import {
  RunningStatus,
  RunningStatusContextType,
  Action,
  UpdateStatusPayload,
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
  elapsed_time: 0,
};

export const RunningStatusContext = createContext<RunningStatusContextType>({
  isRunning: false,
  status: [],
  activeStep: 0,
  completedSteps: [],

  updateIsRunning: () => {},
  initStatus: (forgetClass: number) => {},
  retrieveStatus: () => {},
  updateStatus: (payload: UpdateStatusPayload) => {},
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
      const forgetClass = action.payload;
      const newStatus = [...state.status];
      newStatus[forgetClass] = initialStatus;
      const initializedStatus = {
        ...state,
        status: newStatus,
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
      const { status, forgetClass: fgClass, elapsedTime } = action.payload;
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

      const updatedStatusArray = [...state.status];
      updatedStatusArray[fgClass] = {
        ...status,
        progress,
        elapsed_time: elapsedTime,
      };
      const updatedStatus = {
        ...state,
        status: updatedStatusArray,
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
    status: Array(10).fill(initialStatus),
    activeStep: 0,
    completedSteps: [],
  });

  const handleUpdateIsRunning = useCallback((isRunning: boolean) => {
    dispatch({ type: "UPDATE_IS_RUNNING", payload: isRunning });
  }, []);

  const handleInitStatus = useCallback((forgetClass: number) => {
    dispatch({ type: "INIT_STATUS", payload: forgetClass });
  }, []);

  const handleRetrieveStatus = useCallback(() => {
    dispatch({ type: "RETRIEVE_STATUS" });
  }, []);

  const handleUpdateStatus = useCallback((payload: UpdateStatusPayload) => {
    dispatch({ type: "UPDATE_STATUS", payload });
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
