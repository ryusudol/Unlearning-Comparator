import { create } from "zustand";
import { persist } from "zustand/middleware";

type Config = {
  dataset: string | undefined;
  neuralNetworkModel: string | undefined;
};

type Actions = {
  saveDataset: (dataset: string) => void;
  saveNeuralNetworkModel: (neuralNetworkModel: string) => void;
};

export const useBaseConfigStore = create<Config & Actions>()(
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
