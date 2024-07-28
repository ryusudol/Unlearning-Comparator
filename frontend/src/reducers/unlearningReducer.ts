import { Action, Configuration } from "../types/unlearning_config";

export const initialState = {
  method: "Fine-Tuning",
  forget_class: "0",
  epochs: 10,
  batch_size: 64,
  learning_rate: 0.002,
};

export const unlearningConfigReducer = (
  state: Configuration,
  action: Action
): Configuration => {
  switch (action.type) {
    case "UPDATE_METHOD":
      return { ...state, method: action.payload as string };
    case "UPDATE_FORGET_CLASS":
      return { ...state, forget_class: action.payload as string };
    case "UPDATE_EPOCHS":
      return { ...state, epochs: action.payload as number };
    case "UPDATE_BATCH_SIZE":
      return { ...state, batch_size: action.payload as number };
    case "UPDATE_LEARNING_RATE":
      return { ...state, learning_rate: action.payload as number };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};
