import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useBaseConfigStore } from "./baseConfigStore";
import { CIFAR_10_CLASSES, FACE_DATASET_CLASSES } from "../constants/common";

type ForgetClassState = {
  forgetClass: number;
  selectedForgetClasses: number[];
  saveForgetClass: (forgetClass: string | number) => void;
  addSelectedForgetClass: (forgetClass: string) => void;
  deleteSelectedForgetClass: (forgetClass: string) => void;
  initSelectedForgetClass: () => void;
};

const getClassesForDataset = () => {
  const dataset = useBaseConfigStore.getState().dataset;
  switch (dataset) {
    case "FaceDataset":
      return FACE_DATASET_CLASSES;
    case "CIFAR-10":
    default:
      return CIFAR_10_CLASSES;
  }
};

export const useForgetClassStore = create<ForgetClassState>()(
  persist(
    (set, get) => ({
      forgetClass: -1,
      selectedForgetClasses: [],

      saveForgetClass: (forgetClass) => {
        const classes = getClassesForDataset();

        set({
          forgetClass:
            typeof forgetClass === "string"
              ? classes.indexOf(forgetClass)
              : forgetClass,
        });
      },

      addSelectedForgetClass: (forgetClass) => {
        const classes = getClassesForDataset();

        const target = classes.indexOf(forgetClass);
        if (!get().selectedForgetClasses.includes(target)) {
          set({
            selectedForgetClasses: [...get().selectedForgetClasses, target],
          });
        }
      },

      deleteSelectedForgetClass: (forgetClass) => {
        const classes = getClassesForDataset();

        const target = classes.indexOf(forgetClass);
        set({
          selectedForgetClasses: get().selectedForgetClasses.filter(
            (item) => item !== target
          ),
        });
      },

      initSelectedForgetClass: () => {
        set({ selectedForgetClasses: [] });
      },
    }),
    {
      name: "forgetclass",
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
