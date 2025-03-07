import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CIFAR_10_CLASSES } from "../constants/common";

type ForgetClassState = {
  forgetClass: number;
  selectedForgetClasses: number[];
  saveForgetClass: (forgetClass: string | number) => void;
  addSelectedForgetClass: (forgetClass: string) => void;
  deleteSelectedForgetClass: (forgetClass: string) => void;
};

export const useForgetClassStore = create<ForgetClassState>()(
  persist(
    (set, get) => ({
      forgetClass: -1,
      selectedForgetClasses: [],

      saveForgetClass: (forgetClass) =>
        set({
          forgetClass:
            typeof forgetClass === "string"
              ? CIFAR_10_CLASSES.indexOf(forgetClass)
              : forgetClass,
        }),

      addSelectedForgetClass: (forgetClass) => {
        const target = CIFAR_10_CLASSES.indexOf(forgetClass);
        if (!get().selectedForgetClasses.includes(target)) {
          set({
            selectedForgetClasses: [...get().selectedForgetClasses, target],
          });
        }
      },

      deleteSelectedForgetClass: (forgetClass) => {
        const target = CIFAR_10_CLASSES.indexOf(forgetClass);
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
