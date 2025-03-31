import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DATASETS, NEURAL_NETWORK_MODELS } from "../constants/common";

type BaseConfigState = {
  dataset: string;
  neuralNetworkModel: string;
  setDataset: (dataset: string) => void;
  setNeuralNetworkModel: (neuralNetworkModel: string) => void;
};

export const useBaseConfigStore = create<BaseConfigState>()(
  persist(
    (set) => ({
      dataset: DATASETS[0],
      neuralNetworkModel: NEURAL_NETWORK_MODELS[0],
      setDataset: (dataset) => set({ dataset }),
      setNeuralNetworkModel: (neuralNetworkModel) =>
        set({ neuralNetworkModel }),
    }),
    {
      name: "config",
      storage: {
        getItem: (key) => {
          const value = sessionStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: (key, value) =>
          sessionStorage.setItem(key, JSON.stringify(value)),
        removeItem: (key) => sessionStorage.removeItem(key),
      },
    }
  )
);
