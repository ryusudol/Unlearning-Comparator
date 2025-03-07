import { create } from "zustand";

import { ENTROPY, UNLEARN } from "../constants/common";
import { THRESHOLD_STRATEGIES } from "../constants/privacyAttack";

type AttackState = {
  metric: string;
  direction: string;
  strategy: string;
  worstCaseModel: "A" | "B" | null;
  setMetric: (metric: string) => void;
  setDirection: (direction: string) => void;
  setStrategy: (strategy: string) => void;
  setWorstCaseModel: (model: "A" | "B") => void;
};

export const useAttackStateStore = create<AttackState>((set, get) => ({
  metric: ENTROPY,
  direction: UNLEARN,
  strategy: THRESHOLD_STRATEGIES[0].strategy,
  worstCaseModel: null,
  setMetric: (metric: string) => set({ metric }),
  setDirection: (direction: string) => set({ direction }),
  setStrategy: (strategy: string) => set({ strategy }),
  setWorstCaseModel: (model: "A" | "B") => set({ worstCaseModel: model }),
}));
