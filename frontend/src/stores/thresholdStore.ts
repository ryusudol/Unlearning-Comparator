import { create } from "zustand";

interface ThresholdState {
  strategyThresholds: {
    A: number[];
    B: number[];
  };
  initializeThresholds: (isMetricEntropy: boolean) => void;
  setStrategyThresholds: (mode: "A" | "B", thresholds: number[]) => void;
}

export const useThresholdStore = create<ThresholdState>((set) => ({
  strategyThresholds: {
    A: [1.25, 0, 0, 0],
    B: [1.25, 0, 0, 0],
  },
  initializeThresholds: (isMetricEntropy: boolean) =>
    set(() => ({
      strategyThresholds: {
        A: [isMetricEntropy ? 1.25 : 3.75, 0, 0, 0],
        B: [isMetricEntropy ? 1.25 : 3.75, 0, 0, 0],
      },
    })),
  setStrategyThresholds: (mode, thresholds) =>
    set((state) => ({
      strategyThresholds: {
        ...state.strategyThresholds,
        [mode]: thresholds,
      },
    })),
}));
