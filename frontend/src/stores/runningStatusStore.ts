import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UnlearningStatus } from "../types/experiments";

const initialStatus: UnlearningStatus = {
  is_unlearning: false,
  progress: "Idle",
  recent_id: null,
  current_epoch: 0,
  total_epochs: 0,
  current_unlearn_loss: 0,
  current_unlearn_accuracy: 0,
  p_training_loss: 0,
  p_training_accuracy: 0,
  p_test_loss: 0,
  p_test_accuracy: 0,
  method: "",
  estimated_time_remaining: 0,
  elapsed_time: 0,
  completed_steps: [],
  learning_rate: 0,
  batch_size: 0,
};

type RunningStatusState = {
  isRunning: boolean;
  statuses: UnlearningStatus[][];
  activeStep: number;
  totalExperimentsCount: number;
  updateIsRunning: (isRunning: boolean) => void;
  initStatus: (forgetClass: number, count: number) => void;
  updateStatus: (payload: UpdateStatusPayload) => void;
  updateActiveStep: (step: number) => void;
};

type UpdateStatusPayload = {
  status: UnlearningStatus;
  forgetClass: number;
  experimentIndex: number;
  progress: string;
  elapsedTime: number;
  completedSteps: number[];
  learningRate?: number;
  batchSize?: number;
};

export const useRunningStatusStore = create<RunningStatusState>()(
  persist(
    (set, get) => ({
      isRunning: false,
      statuses: Array.from({ length: 10 }, () => []),
      activeStep: 0,
      totalExperimentsCount: 0,

      updateIsRunning: (isRunning) => set({ isRunning }),

      initStatus: (forgetClass, count) => {
        const newStatuses = [...get().statuses];
        newStatuses[forgetClass] = Array.from({ length: count }, () => ({
          ...initialStatus,
        }));
        set({ statuses: newStatuses, totalExperimentsCount: count });
      },

      updateStatus: ({
        status,
        forgetClass,
        experimentIndex,
        progress,
        elapsedTime,
        completedSteps,
        learningRate,
        batchSize,
      }) => {
        const classStatuses = get().statuses[forgetClass] || [];
        if (experimentIndex < 0 || experimentIndex >= classStatuses.length)
          return;

        const currentStatus = classStatuses[experimentIndex];
        const newStatus: UnlearningStatus = {
          ...currentStatus,
          ...status,
          progress,
          elapsed_time: elapsedTime,
          completed_steps: completedSteps,
          learning_rate: learningRate,
          batch_size: batchSize,
        };

        const { elapsed_time: _, ...oldWithoutTime } = currentStatus;
        const { elapsed_time: __, ...newWithoutTime } = newStatus;
        if (JSON.stringify(oldWithoutTime) === JSON.stringify(newWithoutTime))
          return;

        const updatedClassStatuses = [...classStatuses];
        updatedClassStatuses[experimentIndex] = newStatus;
        const newStatuses = [...get().statuses];
        newStatuses[forgetClass] = updatedClassStatuses;
        set({ statuses: newStatuses });
      },

      updateActiveStep: (step) => set({ activeStep: step }),
    }),
    {
      name: "running-status",
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
