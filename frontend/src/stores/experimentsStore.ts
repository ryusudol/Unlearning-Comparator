import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Experiments } from "../types/data";
import { ExperimentData } from "../types/data";
import { useModelDataStore } from "./modelDataStore";

type ExperimentsState = {
  experiments: Experiments;
  isExperimentLoading: boolean;
};

type Actions = {
  addExperiment: (experiment: ExperimentData, tempIdx?: number) => void;
  updateExperiment: (experiment: ExperimentData, idx: number) => void;
  saveExperiments: (experiments: Experiments) => void;
  deleteExperiment: (id: string) => void;
  setIsExperimentsLoading: (loading: boolean) => void;
};

export const useExperimentsStore = create<ExperimentsState & Actions>()(
  persist(
    (set, get) => ({
      experiments: {},
      isExperimentLoading: false,

      addExperiment: (experiment, tempIdx) => {
        const { points, ...experimentWithoutPoints } = experiment;
        const newExperiments =
          tempIdx !== undefined
            ? {
                ...get().experiments,
                [tempIdx]: experimentWithoutPoints,
              }
            : {
                ...get().experiments,
                [experiment.ID]: experimentWithoutPoints,
              };
        set({ experiments: newExperiments });
      },

      updateExperiment: (experiment, idx) => {
        const { [idx]: _, ...remainingExperiments } = get().experiments;
        set({
          experiments: {
            ...remainingExperiments,
            [experiment.ID]: experiment,
          },
        });
      },

      saveExperiments: (experiments) => set({ experiments }),

      deleteExperiment: (id) => {
        const { [id]: _, ...remainingExperiments } = get().experiments;
        set({ experiments: remainingExperiments });
      },

      setIsExperimentsLoading: (loading) =>
        set({ isExperimentLoading: loading }),
    }),
    {
      name: "experiments",
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

export const useModelAExperiment = () => {
  const { experiments } = useExperimentsStore();
  const { modelA } = useModelDataStore();
  return experiments[modelA];
};

export const useModelBExperiment = () => {
  const { experiments } = useExperimentsStore();
  const { modelB } = useModelDataStore();
  return experiments[modelB];
};

export default useExperimentsStore;
