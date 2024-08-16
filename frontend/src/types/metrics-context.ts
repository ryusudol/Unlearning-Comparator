export interface Metrics {
  ua: number;
  ra: number;
  ta: number;
  rte: number;
  avg: number;
}

export interface MetricsContextType extends Metrics {
  saveMetrics: (metrics: Metrics) => void;
  retrieveMetrics: () => Metrics;
  clearMetrics: () => void;
}

export type Action =
  | { type: "SAVE_METRICS"; payload: Metrics }
  | { type: "RETRIEVE_METRICS" }
  | { type: "CLEAR_METRICS" };
