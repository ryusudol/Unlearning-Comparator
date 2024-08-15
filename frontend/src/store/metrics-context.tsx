import { createContext, useReducer } from "react";

import { Metrics, Action, MetricsContextType } from "../types/metrics-context";

const METRICS = "metrics";

export const MetricsContext = createContext<MetricsContextType>({
  ua: 0,
  ra: 0,
  ta: 0,
  rte: 0,
  avg: 0,

  saveMetrics: (metrics: Metrics) => {},
  retrieveMetrics: () => ({
    ua: 0,
    ra: 0,
    ta: 0,
    rte: 0,
    avg: 0,
  }),
  clearMetrics: () => {},
});

function metricsReducer(state: Metrics, action: Action): Metrics {
  switch (action.type) {
    case "SAVE_METRICS":
      const metrics = action.payload;
      sessionStorage.setItem(METRICS, JSON.stringify(metrics));
      return {
        ...state,
        ua: metrics.ua,
        ra: metrics.ra,
        ta: metrics.ta,
        rte: metrics.rte,
        avg: metrics.avg,
      };

    case "RETRIEVE_METRICS":
      const savedMetrics = sessionStorage.getItem(METRICS);
      if (!savedMetrics)
        return { ...state, ua: 0, ra: 0, ta: 0, rte: 0, avg: 0 };
      try {
        const parsedMetrics: Metrics = JSON.parse(savedMetrics);
        return {
          ...state,
          ua: parsedMetrics.ua,
          ra: parsedMetrics.ra,
          ta: parsedMetrics.ta,
          rte: parsedMetrics.rte,
          avg: parsedMetrics.avg,
        };
      } catch (error) {
        console.error(error);
        return { ...state, ua: 0, ra: 0, ta: 0, rte: 0, avg: 0 };
      }

    case "CLEAR_METRICS":
      sessionStorage.removeItem(METRICS);
      return { ...state, ua: 0, ra: 0, ta: 0, rte: 0, avg: 0 };

    default:
      return state;
  }
}

export default function MetricsContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [metrics, dispatch] = useReducer(metricsReducer, {
    ua: 0,
    ra: 0,
    ta: 0,
    rte: 0,
    avg: 0,
  });

  function handleSaveMetrics(metrics: Metrics) {
    dispatch({ type: "SAVE_METRICS", payload: metrics });
  }

  function handleRetrieveMetrics() {
    dispatch({ type: "RETRIEVE_METRICS" });
    return {
      ua: metrics.ua,
      ra: metrics.ra,
      ta: metrics.ta,
      rte: metrics.rte,
      avg: metrics.avg,
    };
  }

  function handleClearMetrics() {
    dispatch({ type: "CLEAR_METRICS" });
  }

  const ctxValue = {
    ua: metrics.ua,
    ra: metrics.ra,
    ta: metrics.ta,
    rte: metrics.rte,
    avg: metrics.avg,

    saveMetrics: handleSaveMetrics,
    retrieveMetrics: handleRetrieveMetrics,
    clearMetrics: handleClearMetrics,
  };

  return (
    <MetricsContext.Provider value={ctxValue}>
      {children}
    </MetricsContext.Provider>
  );
}
