import { createContext, useReducer, useCallback } from "react";

import {
  RunningStatus,
  RunningStatusContextType,
  Action,
  Status,
} from "../types/running-status-context";

const RUNNING_STATUS = "running-status";

export const RunningStatusContext = createContext<RunningStatusContextType>({
  isRunning: false,
  indicator: "",
  status: undefined,

  initRunningStatus: () => {},
  saveRunningStatus: () => {},
  updateIsRunning: () => {},
  updateIndicator: () => {},
  updateStatus: () => {},
});

function runningStatusReducer(
  state: RunningStatus,
  action: Action
): RunningStatus {
  switch (action.type) {
    case "INIT_RUNNING_STATUS":
      sessionStorage.setItem(
        RUNNING_STATUS,
        JSON.stringify({
          isRunning: false,
          indicator: "",
          status: undefined,
        })
      );
      return {
        isRunning: false,
        indicator: "",
        status: undefined,
      };

    case "SAVE_RUNNING_STATUS":
      const runningStatus = action.payload;
      sessionStorage.setItem(RUNNING_STATUS, JSON.stringify(runningStatus));
      return {
        isRunning: runningStatus.isRunning,
        indicator: runningStatus.indicator,
        status: runningStatus.status,
      };

    case "UPDATE_IS_RUNNING":
      const isRunning = action.payload;
      sessionStorage.setItem(
        RUNNING_STATUS,
        JSON.stringify({ ...state, isRunning })
      );
      return { ...state, isRunning };

    case "UPDATE_INDICATOR":
      const indicator = action.payload;
      sessionStorage.setItem(
        RUNNING_STATUS,
        JSON.stringify({ ...state, indicator })
      );
      return { ...state, indicator };

    case "UPDATE_STATUS":
      const status = action.payload;
      sessionStorage.setItem(
        RUNNING_STATUS,
        JSON.stringify({ ...state, status })
      );
      return { ...state, status };

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
    indicator: "",
    status: undefined,
  });

  const handleInitRunningStatus = useCallback(() => {
    dispatch({ type: "INIT_RUNNING_STATUS" });
  }, []);

  const handleSaveRunningStatus = useCallback(
    (runningStatus: RunningStatus) => {
      dispatch({ type: "SAVE_RUNNING_STATUS", payload: runningStatus });
    },
    []
  );

  const handleUpdateIsRunning = useCallback((isRunning: boolean) => {
    dispatch({ type: "UPDATE_IS_RUNNING", payload: isRunning });
  }, []);

  const handleUpdateIndicator = useCallback((indicator: string) => {
    dispatch({ type: "UPDATE_INDICATOR", payload: indicator });
  }, []);

  const handleUpdateStatus = useCallback((status: Status) => {
    dispatch({ type: "UPDATE_STATUS", payload: status });
  }, []);

  const ctxValue: RunningStatusContextType = {
    isRunning: runningStatus.isRunning,
    indicator: runningStatus.indicator,
    status: runningStatus.status,

    initRunningStatus: handleInitRunningStatus,
    saveRunningStatus: handleSaveRunningStatus,
    updateIsRunning: handleUpdateIsRunning,
    updateIndicator: handleUpdateIndicator,
    updateStatus: handleUpdateStatus,
  };

  return (
    <RunningStatusContext.Provider value={ctxValue}>
      {children}
    </RunningStatusContext.Provider>
  );
}
