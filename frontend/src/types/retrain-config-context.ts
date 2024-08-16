export interface Configuration {
  epochs: number;
  learningRate: number;
  batchSize: number;
  forgetClass: string;
}

export interface ConfigurationContextType extends Configuration {
  saveRetrainingConfig: (config: Configuration) => void;
  retrieveRetrainingConfig: () => Configuration;
  clearRetrainingConfig: () => void;
}

export type Action =
  | { type: "SAVE_RETRAINING_CONFIG"; payload: Configuration }
  | { type: "RETRIEVE_RETRAINING_CONFIG" }
  | { type: "CLEAR_RETRAINING_CONFIG" };
