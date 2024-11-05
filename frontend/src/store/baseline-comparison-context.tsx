import { useEffect, createContext, useReducer, useCallback } from "react";

import {
  Action,
  Context,
  ContextType,
} from "../types/baseline-comparison-context";

const CONTEXT = "context";

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
    case "SAVE_BASELINE":
      const baseline = action.payload;
      sessionStorage.setItem(CONTEXT, JSON.stringify({ ...state, baseline }));
      return { ...state, baseline };

    case "SAVE_COMPARISON":
      const comparison = action.payload;
      sessionStorage.setItem(CONTEXT, JSON.stringify({ ...state, comparison }));
      return { ...state, comparison };

    case "RETRIEVE_CONTEXT":
      const savedContext = sessionStorage.getItem(CONTEXT);
      if (savedContext) {
        const parsedBaseline = JSON.parse(savedContext);
        return {
          baseline: parsedBaseline.baseline,
          comparison: parsedBaseline.comparison,
        };
      }
      return state;

    case "CLEAR_CONTEXT":
      sessionStorage.removeItem(CONTEXT);
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
    dispatch({ type: "SAVE_BASELINE", payload: baseline });
  }, []);

  const handleSaveComparison = useCallback((comparison: string) => {
    dispatch({ type: "SAVE_COMPARISON", payload: comparison });
  }, []);

  const handleRetrieveContext = useCallback(() => {
    dispatch({ type: "RETRIEVE_CONTEXT" });
  }, []);

  const handleClearContext = useCallback(() => {
    dispatch({ type: "CLEAR_CONTEXT" });
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
