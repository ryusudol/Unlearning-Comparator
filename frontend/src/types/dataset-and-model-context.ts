import { DATASET_AND_MODEL_ACTIONS } from "../constants/actions";

export interface DatasetAndModel {
  dataset: string | undefined;
  neuralNetworkModel: string | undefined;
}

export interface DatasetAndModelContextType extends DatasetAndModel {
  saveDataset: (dataset: string) => void;
  saveNeuralNetworkModel: (model: string) => void;
  retrieveDatasetAndModel: () => void;
}

export type Action =
  | { type: typeof DATASET_AND_MODEL_ACTIONS.SAVE_DATASET; payload: string }
  | {
      type: typeof DATASET_AND_MODEL_ACTIONS.SAVE_NEURAL_NETWORK_MODEL;
      payload: string;
    }
  | { type: typeof DATASET_AND_MODEL_ACTIONS.RETRIEVE_DATASET_AND_MODEL };
