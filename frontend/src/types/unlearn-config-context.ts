export interface Configuration {
  method: string;
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
  | { type: "SAVE_SETTINGS"; payload: Configuration }
  | { type: "RETRIEVE_SETTINGS" }
  | { type: "CLEAR_SETTINGS" };
