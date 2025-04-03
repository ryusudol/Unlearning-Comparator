import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CIFAR_10_CLASSES, FASHION_MNIST_CLASSES } from "../constants/common";
import { useBaseConfigStore } from "./baseConfigStore";

type ForgetClassState = {
  forgetClass: number;
  selectedForgetClasses: number[];
  saveForgetClass: (forgetClass: string | number) => void;
  addSelectedForgetClass: (forgetClass: string) => void;
  deleteSelectedForgetClass: (forgetClass: string) => void;
};

const getClassesForDataset = () => {
  const dataset = useBaseConfigStore.getState().dataset;
  return dataset === "CIFAR-10" ? CIFAR_10_CLASSES : FASHION_MNIST_CLASSES;
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
