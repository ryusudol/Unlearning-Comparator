import { NEURAL_NETWORK_MODEL_ACTIONS } from "../constants/actions";

export interface NeuralNetworkModel {
  neuralNetworkModel: string | undefined;
}

export interface NeuralNetworkModelContextType extends NeuralNetworkModel {
  saveNeuralNetworkModel: (model: string) => void;
  retrieveNeuralNetworkModel: () => void;
}

export type Action =
  | {
      type: typeof NEURAL_NETWORK_MODEL_ACTIONS.SAVE_NEURAL_NETWORK_MODEL;
      payload: string;
    }
  | { type: typeof NEURAL_NETWORK_MODEL_ACTIONS.RETRIEVE_NEURAL_NETWORK_MODEL };
