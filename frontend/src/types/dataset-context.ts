import { DATASET_ACTIONS } from "../constants/actions";

export interface Dataset {
  dataset: string | undefined;
}

export interface DatasetContextType extends Dataset {
  saveDataset: (dataset: string) => void;
  retrieveDataset: () => void;
}

export type Action =
  | { type: typeof DATASET_ACTIONS.SAVE_DATASET; payload: string }
  | { type: typeof DATASET_ACTIONS.RETRIEVE_DATASET };
