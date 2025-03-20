import { create } from "zustand";
import { persist } from "zustand/middleware";

type BaseConfigState = {
  dataset: string | undefined;
  neuralNetworkModel: string | undefined;
  saveDataset: (dataset: string) => void;
  saveNeuralNetworkModel: (neuralNetworkModel: string) => void;
};

export const useBaseConfigStore = create<BaseConfigState>()(
  persist(
    (set) => ({
      dataset: undefined,
      neuralNetworkModel: undefined,
      saveDataset: (dataset) => set({ dataset }),
      saveNeuralNetworkModel: (neuralNetworkModel) =>
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
