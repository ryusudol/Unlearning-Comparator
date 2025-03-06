import { create } from "zustand";
import { persist } from "zustand/middleware";

type RunningIndexState = {
  runningIndex: number;
  updateRunningIndex: (runningIndex: number) => void;
};

export const useRunningIndexStore = create<RunningIndexState>()(
  persist(
    (set, get) => ({
      runningIndex: 0,
      updateRunningIndex: (runningIndex) => {
        if (get().runningIndex !== runningIndex) {
          set({ runningIndex });
        }
      },
    }),
    {
      name: "running-index",
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
