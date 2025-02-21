import React, {
  useEffect,
  createContext,
  useReducer,
  useCallback,
} from "react";

import {
  RunningIndex,
  RunningIndexContextType,
  Action,
} from "../types/running-index-context";
import { RUNNING_INDEX } from "../constants/storageKeys";
import { RUNNING_INDEX_ACTIONS } from "../constants/actions";

const initialState: RunningIndex = {
  runningIndex: 0,
};

export const RunningIndexContext = createContext<RunningIndexContextType>({
  ...initialState,

  updateRunningIndex: (runningIndex: number) => {},
  retrieveRunningIndex: () => {},
});

function RunningIndexReducer(
  state: RunningIndex,
  action: Action
): RunningIndex {
  switch (action.type) {
    case RUNNING_INDEX_ACTIONS.UPDATE_RUNNING_INDEX: {
      const runningIndex = action.payload;
      if (state.runningIndex === runningIndex) {
        return state;
      }
      sessionStorage.setItem(RUNNING_INDEX, JSON.stringify({ runningIndex }));
      return { runningIndex };
    }

    case RUNNING_INDEX_ACTIONS.RETRIEVE_RUNNING_INDEX: {
      const retrievedRunningIndex = sessionStorage.getItem(RUNNING_INDEX);
      if (retrievedRunningIndex) {
        const parsedRunningIndex = JSON.parse(retrievedRunningIndex);
        return { runningIndex: parsedRunningIndex.runningIndex };
      }
      return state;
    }

    default: {
      return state;
    }
  }
}

export default function RunningIndexContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(RunningIndexReducer, initialState);

  const handleUpdateRunningIndex = useCallback((runningIndex: number) => {
    dispatch({
      type: RUNNING_INDEX_ACTIONS.UPDATE_RUNNING_INDEX,
      payload: runningIndex,
    });
  }, []);

  const handleRetrieveRunningIndex = useCallback(() => {
    dispatch({ type: RUNNING_INDEX_ACTIONS.RETRIEVE_RUNNING_INDEX });
  }, []);

  useEffect(() => {
    handleRetrieveRunningIndex();
  }, [handleRetrieveRunningIndex]);

  const ctxValue: RunningIndexContextType = {
    runningIndex: state.runningIndex,

    updateRunningIndex: handleUpdateRunningIndex,
    retrieveRunningIndex: handleRetrieveRunningIndex,
  };

  return (
    <RunningIndexContext.Provider value={ctxValue}>
      {children}
    </RunningIndexContext.Provider>
  );
}
