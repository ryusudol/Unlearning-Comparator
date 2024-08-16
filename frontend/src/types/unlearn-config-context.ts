export interface Configuration {
  method: string;
  trainedModel: string;
  epochs: number;
  learningRate: number;
  batchSize: number;
  forgetClass: string;
}

export interface ConfigurationContextType extends Configuration {
  saveUnlearningConfig: (config: Configuration) => void;
  retrieveUnlearningConfig: () => Configuration;
  clearUnlearningConfig: () => void;
}

export type Action =
  | { type: "SAVE_UNLEARNING_CONFIG"; payload: Configuration }
  | { type: "RETRIEVE_UNLEARNING_CONFIG" }
  | { type: "CLEAR_UNLEARNING_CONFIG" };
