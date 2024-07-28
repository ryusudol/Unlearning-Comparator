import { Action, Configuration } from "../types/training_config";

export const initialState = {
  model: "ResNet-18",
  dataset: "CIFAR-10",
  epochs: 10,
  batch_size: 64,
  learning_rate: 0.002,
  seed: 42,
};

export const configurationReducer = (
  state: Configuration,
  action: Action
): Configuration => {
  switch (action.type) {
    case "UPDATE_MODEL":
      return { ...state, model: action.payload as string };
    case "UPDATE_DATASET":
      return { ...state, dataset: action.payload as string };
    case "UPDATE_EPOCHS":
      return { ...state, epochs: action.payload as number };
    case "UPDATE_BATCH_SIZE":
      return { ...state, batch_size: action.payload as number };
    case "UPDATE_LEARNING_RATE":
      return { ...state, learning_rate: action.payload as number };
    case "UPDATE_SEED":
      return { ...state, seed: action.payload as number };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};
