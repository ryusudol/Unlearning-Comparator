import { create } from "zustand";
import { persist } from "zustand/middleware";

type ModelState = {
  modelA: string;
  modelB: string;
  saveModelA: (modelA: string) => void;
  saveModelB: (modelB: string) => void;
};

export const useModelDataStore = create<ModelState>()(
  persist(
    (set) => ({
      modelA: "",
      modelB: "",
      saveModelA: (modelA) => set({ modelA }),
      saveModelB: (modelB) => set({ modelB }),
    }),
    {
      name: "models",
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
