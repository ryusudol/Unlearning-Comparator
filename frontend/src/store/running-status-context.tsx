import { createContext, useReducer, useCallback } from "react";

import {
  RunningStatus,
  RunningStatusContextType,
  Action,
} from "../types/running-status-context";

export const RunningStatusContext = createContext<RunningStatusContextType>({
  isRunning: false,

  updateIsRunning: () => {},
});

function runningStatusReducer(
  state: RunningStatus,
  action: Action
): RunningStatus {
  switch (action.type) {
    case "UPDATE_IS_RUNNING":
      const isRunning = action.payload;
      sessionStorage.setItem("running-status", JSON.stringify({ isRunning }));
      return { isRunning };

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
  });

  const handleUpdateIsRunning = useCallback((isRunning: boolean) => {
    dispatch({ type: "UPDATE_IS_RUNNING", payload: isRunning });
  }, []);

  const ctxValue: RunningStatusContextType = {
    isRunning: runningStatus.isRunning,

    updateIsRunning: handleUpdateIsRunning,
  };

  return (
    <RunningStatusContext.Provider value={ctxValue}>
      {children}
    </RunningStatusContext.Provider>
  );
}
