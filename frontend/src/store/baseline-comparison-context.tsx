import { useEffect, createContext, useReducer, useCallback } from "react";

import { BASELINE_COMPARISON_ACTIONS } from "../constants/actions";
import { BASELINE_COMPARISON } from "../constants/storageKeys";
import {
  Action,
  Context,
  ContextType,
} from "../types/baseline-comparison-context";

export const BaselineComparisonContext = createContext<ContextType>({
  baseline: "",
  comparison: "",

  saveBaseline: (baseline: string) => {},
  saveComparison: (comparison: string) => {},
  retrieveContext: () => {},
  clearContext: () => {},
});

function BaselineReducer(state: Context, action: Action): Context {
  switch (action.type) {
    case BASELINE_COMPARISON_ACTIONS.SAVE_BASELINE:
      const baseline = action.payload;
      sessionStorage.setItem(
        BASELINE_COMPARISON,
        JSON.stringify({ ...state, baseline })
      );
      return { ...state, baseline };

    case BASELINE_COMPARISON_ACTIONS.SAVE_COMPARISON:
      const comparison = action.payload;
      sessionStorage.setItem(
        BASELINE_COMPARISON,
        JSON.stringify({ ...state, comparison })
      );
      return { ...state, comparison };

    case BASELINE_COMPARISON_ACTIONS.RETRIEVE_CONTEXT:
      const savedContext = sessionStorage.getItem(BASELINE_COMPARISON);
      if (savedContext) {
        const parsedContext = JSON.parse(savedContext);
        sessionStorage.setItem(
          BASELINE_COMPARISON,
          JSON.stringify({
            baseline: parsedContext.baseline,
            comparison: parsedContext.comparison,
          })
        );
        return {
          baseline: parsedContext.baseline,
          comparison: parsedContext.comparison,
        };
      }
      return state;

    case BASELINE_COMPARISON_ACTIONS.CLEAR_CONTEXT:
      sessionStorage.removeItem(BASELINE_COMPARISON);
      return { baseline: "", comparison: "" };

    default:
      return state;
  }
}

export default function BaselineContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [context, dispatch] = useReducer(BaselineReducer, {
    baseline: "",
    comparison: "",
  });

  const handleSaveBaseline = useCallback((baseline: string) => {
    dispatch({
      type: BASELINE_COMPARISON_ACTIONS.SAVE_BASELINE,
      payload: baseline,
    });
  }, []);

  const handleSaveComparison = useCallback((comparison: string) => {
    dispatch({
      type: BASELINE_COMPARISON_ACTIONS.SAVE_COMPARISON,
      payload: comparison,
    });
  }, []);

  const handleRetrieveContext = useCallback(() => {
    dispatch({ type: BASELINE_COMPARISON_ACTIONS.RETRIEVE_CONTEXT });
  }, []);

  const handleClearContext = useCallback(() => {
    dispatch({ type: BASELINE_COMPARISON_ACTIONS.CLEAR_CONTEXT });
  }, []);

  useEffect(() => {
    handleRetrieveContext();
  }, [handleRetrieveContext]);

  const ctxValue: ContextType = {
    baseline: context.baseline ?? "",
    comparison: context.comparison ?? "",

    saveBaseline: handleSaveBaseline,
    saveComparison: handleSaveComparison,
    retrieveContext: handleRetrieveContext,
    clearContext: handleClearContext,
  };

  return (
    <BaselineComparisonContext.Provider value={ctxValue}>
      {children}
    </BaselineComparisonContext.Provider>
  );
}
