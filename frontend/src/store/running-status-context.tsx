import { createContext, useReducer, useCallback, useEffect } from "react";

import { RUNNING_STATUS_ACTIONS } from "../constants/actions";
import { RUNNING_STATUS } from "../constants/storageKeys";
import { UnlearningStatus } from "../types/experiments";
import {
  RunningStatus,
  RunningStatusContextType,
  Action,
  UpdateStatusPayload,
} from "../types/running-status-context";

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
  completed_steps: [],
  learning_rate: 0,
  batch_size: 0,
};

const initialRunningStatus: RunningStatus = {
  isRunning: false,
  statuses: Array.from({ length: 10 }, () => []),
  activeStep: 0,
  totalExperimentsCount: 0,
};

export const RunningStatusContext = createContext<RunningStatusContextType>({
  isRunning: false,
  statuses: Array.from({ length: 10 }, () => []),
  activeStep: 0,
  totalExperimentsCount: 0,

  updateIsRunning: () => {},
  initStatus: (forgetClass: number, count: number) => {},
  retrieveStatus: () => {},
  updateStatus: (payload: UpdateStatusPayload) => {},
  updateActiveStep: (step: number) => {},
});

function runningStatusReducer(
  state: RunningStatus,
  action: Action
): RunningStatus {
  switch (action.type) {
    case RUNNING_STATUS_ACTIONS.UPDATE_IS_RUNNING: {
      const isRunning = action.payload;
      const newState = { ...state, isRunning };
      sessionStorage.setItem(RUNNING_STATUS, JSON.stringify(newState));
      return newState;
    }

    case RUNNING_STATUS_ACTIONS.INIT_STATUS: {
      const { forgetClass, count } = action.payload;
      const newStatuses = [...state.statuses];
      newStatuses[forgetClass] = Array.from({ length: count }, () => ({
        ...initialStatus,
      }));
      const newState = {
        ...state,
        statuses: newStatuses,
        totalExperimentsCount: count,
      };
      sessionStorage.setItem(RUNNING_STATUS, JSON.stringify(newState));
      return newState;
    }

    case RUNNING_STATUS_ACTIONS.RETRIEVE_STATUS: {
      const savedStatus = sessionStorage.getItem(RUNNING_STATUS);
      if (savedStatus) {
        const parsedStatus: RunningStatus = JSON.parse(savedStatus);
        sessionStorage.setItem(RUNNING_STATUS, JSON.stringify(parsedStatus));
        return parsedStatus;
      }
      return state;
    }

    case RUNNING_STATUS_ACTIONS.UPDATE_STATUS: {
      const {
        status,
        forgetClass,
        experimentIndex,
        progress,
        elapsedTime,
        completedSteps,
        learningRate,
        batchSize,
      } = action.payload;

      const classStatuses = state.statuses[forgetClass] || [];

      if (experimentIndex < 0 || experimentIndex >= classStatuses.length) {
        return state;
      }

      const currentStatus = classStatuses[experimentIndex];

      const newStatus: UnlearningStatus = {
        ...currentStatus,
        ...status,
        progress,
        elapsed_time: elapsedTime,
        completed_steps: completedSteps,
        learning_rate: learningRate,
        batch_size: batchSize,
      };

      const { elapsed_time: _, ...oldWithoutTime } = currentStatus;
      const { elapsed_time: __, ...newWithoutTime } = newStatus;
      if (JSON.stringify(oldWithoutTime) === JSON.stringify(newWithoutTime)) {
        return state;
      }

      const updatedClassStatuses = [...classStatuses];
      updatedClassStatuses[experimentIndex] = newStatus;

      const newStatuses = [...state.statuses];
      newStatuses[forgetClass] = updatedClassStatuses;
      const newState = {
        ...state,
        statuses: newStatuses,
      };

      sessionStorage.setItem(RUNNING_STATUS, JSON.stringify(newState));
      return newState;
    }

    case RUNNING_STATUS_ACTIONS.UPDATE_ACTIVE_STEP: {
      const step = action.payload;
      const newState = { ...state, activeStep: step };
      sessionStorage.setItem(RUNNING_STATUS, JSON.stringify(newState));
      return newState;
    }

    default:
      return state;
  }
}

export default function RunningStatusContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [runningStatus, dispatch] = useReducer(
    runningStatusReducer,
    initialRunningStatus
  );

  const handleUpdateIsRunning = useCallback((isRunning: boolean) => {
    dispatch({
      type: RUNNING_STATUS_ACTIONS.UPDATE_IS_RUNNING,
      payload: isRunning,
    });
  }, []);

  const handleInitStatus = useCallback((forgetClass: number, count: number) => {
    dispatch({
      type: RUNNING_STATUS_ACTIONS.INIT_STATUS,
      payload: { forgetClass, count },
    });
  }, []);

  const handleRetrieveStatus = useCallback(() => {
    dispatch({ type: RUNNING_STATUS_ACTIONS.RETRIEVE_STATUS });
  }, []);

  const handleUpdateStatus = useCallback((payload: UpdateStatusPayload) => {
    dispatch({ type: RUNNING_STATUS_ACTIONS.UPDATE_STATUS, payload });
  }, []);

  const handleUpdateActiveStep = useCallback((step: number) => {
    dispatch({
      type: RUNNING_STATUS_ACTIONS.UPDATE_ACTIVE_STEP,
      payload: step,
    });
  }, []);

  useEffect(() => {
    handleRetrieveStatus();
  }, [handleRetrieveStatus]);

  const ctxValue: RunningStatusContextType = {
    isRunning: runningStatus.isRunning,
    statuses: runningStatus.statuses,
    activeStep: runningStatus.activeStep,
    totalExperimentsCount: runningStatus.totalExperimentsCount,

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
