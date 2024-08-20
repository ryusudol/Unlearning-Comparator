import { createContext, useReducer } from "react";

import {
  Baseline,
  Action,
  BaselineContextType,
} from "../types/baseline-context";

const BASELINE = "baseline";

export const BaselineContext = createContext<BaselineContextType>({
  baseline: 0,

  saveBaseline: (baseline: number) => {},
  retrieveBaseline: () => 0,
  clearBaseline: () => {},
});

function BaselineReducer(state: Baseline, action: Action): Baseline {
  switch (action.type) {
    case "SAVE_BASELINE":
      const baseline = action.payload;
      sessionStorage.setItem(BASELINE, JSON.stringify(baseline));
      return {
        ...state,
        baseline,
      };

    case "RETRIEVE_BASELINE":
      const savedBaseline = sessionStorage.getItem(BASELINE);
      if (!savedBaseline)
        return {
          ...state,
          baseline: 0,
        };
      try {
        const parsedBaseline: Baseline = JSON.parse(savedBaseline);
        return {
          ...state,
          baseline: parsedBaseline.baseline,
        };
      } catch (error) {
        console.error(error);
        return {
          ...state,
          baseline: 0,
        };
      }

    case "CLEAR_BASELINE":
      sessionStorage.removeItem(BASELINE);
      return {
        ...state,
        baseline: 0,
      };

    default:
      return state;
  }
}

export default function BaselineContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [baseline, dispatch] = useReducer(BaselineReducer, {
    baseline: 0,
  });

  function handleSaveSettings(baseline: number) {
    dispatch({ type: "SAVE_BASELINE", payload: baseline });
  }

  function handleRetrieveSettings() {
    dispatch({ type: "RETRIEVE_BASELINE" });
    return baseline.baseline;
  }

  function handleClearSettings() {
    dispatch({ type: "CLEAR_BASELINE" });
  }

  const ctxValue: BaselineContextType = {
    baseline: baseline.baseline,

    saveBaseline: handleSaveSettings,
    retrieveBaseline: handleRetrieveSettings,
    clearBaseline: handleClearSettings,
  };

  return (
    <BaselineContext.Provider value={ctxValue}>
      {children}
    </BaselineContext.Provider>
  );
}
