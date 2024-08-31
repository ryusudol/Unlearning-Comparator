import { createContext, useReducer } from "react";

import {
  RunningStatus,
  RunningStatusContextType,
  Action,
} from "../types/running-status-context";

const RUNNING_STATUS = "running-status";

export const RunningStatusContext = createContext<RunningStatusContextType>({
  isRunning: false,
  indicator: "",
  status: undefined,

  saveRunningStatus: () => {},
  retrieveRunningStatus: () => {
    return {} as RunningStatus;
  },
  clearRunningStatus: () => {},
});

function runningStatusReducer(
  state: RunningStatus,
  action: Action
): RunningStatus {
  switch (action.type) {
    case "SAVE_RUNNING_STATUS":
      const status = action.payload;
      sessionStorage.setItem(RUNNING_STATUS, JSON.stringify(status));
      return {
        ...state,
        isRunning: status.isRunning,
        indicator: status.indicator,
        status: status.status,
      };

    case "RETRIEVE_RUNNING_STATUS":
      const savedStatus = sessionStorage.getItem(RUNNING_STATUS);
      if (!savedStatus)
        return {
          ...state,
          isRunning: false,
          indicator: "",
          status: undefined,
        };
      try {
        const parsedStatus: RunningStatus = JSON.parse(savedStatus);
        return {
          ...state,
          isRunning: parsedStatus.isRunning,
          indicator: parsedStatus.indicator,
          status: parsedStatus.status,
        };
      } catch (error) {
        // TODO: context 파일들 catch 구문 수정하기
        console.error(error);
        return {
          ...state,
          isRunning: false,
          indicator: "",
          status: undefined,
        };
      }

    case "CLEAR_RUNNING_STATUS":
      sessionStorage.removeItem(RUNNING_STATUS);
      return {
        ...state,
        isRunning: false,
        indicator: "",
        status: undefined,
      };

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

  function handleSaveRunningStatus(status: RunningStatus) {
    dispatch({ type: "SAVE_RUNNING_STATUS", payload: status });
  }

  const handleRetrieveRunningStatus = function handleretrieveRetrainingSvgs() {
    dispatch({ type: "RETRIEVE_RUNNING_STATUS" });
    return runningStatus;
  };

  function handleClearRunningStatus() {
    dispatch({ type: "CLEAR_RUNNING_STATUS" });
  }

  const ctxValue: RunningStatusContextType = {
    isRunning: runningStatus.isRunning,
    indicator: runningStatus.indicator,
    status: runningStatus.status,

    saveRunningStatus: handleSaveRunningStatus,
    retrieveRunningStatus: handleRetrieveRunningStatus,
    clearRunningStatus: handleClearRunningStatus,
  };

  return (
    <RunningStatusContext.Provider value={ctxValue}>
      {children}
    </RunningStatusContext.Provider>
  );
}
