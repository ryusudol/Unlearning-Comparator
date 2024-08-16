import { createContext, useReducer } from "react";

import {
  Configuration,
  Action,
  ConfigurationContextType,
} from "../types/unlearn-config-context";

const UNLEARNING_CONFIG = "unlearning-config";

export const UnlearningConfigContext = createContext<ConfigurationContextType>({
  method: "Fine-Tuning",
  trainedModel: "",
  epochs: 0,
  learningRate: 0,
  batchSize: 0,
  forgetClass: "0",

  saveUnlearningConfig: (config: Configuration) => {},
  retrieveUnlearningConfig: () => ({
    method: "Fine-Tuning",
    trainedModel: "",
    epochs: 0,
    learningRate: 0,
    batchSize: 0,
    forgetClass: "-1",
  }),
  clearUnlearningConfig: () => {},
});

function ConfigReducer(state: Configuration, action: Action): Configuration {
  switch (action.type) {
    case "SAVE_UNLEARNING_CONFIG":
      const config = action.payload;
      sessionStorage.setItem(UNLEARNING_CONFIG, JSON.stringify(config));
      return {
        ...state,
        method: config.method,
        trainedModel: config.trainedModel,
        epochs: config.epochs,
        learningRate: config.learningRate,
        batchSize: config.batchSize,
        forgetClass: config.forgetClass,
      };

    case "RETRIEVE_UNLEARNING_CONFIG":
      const savedSettings = sessionStorage.getItem(UNLEARNING_CONFIG);
      if (!savedSettings)
        return {
          ...state,
          method: "Fine-Tuning",
          trainedModel: "",
          epochs: 0,
          learningRate: 0,
          batchSize: 0,
          forgetClass: "-1",
        };
      try {
        const parsedConfig: Configuration = JSON.parse(savedSettings);
        return {
          ...state,
          method: parsedConfig.method,
          trainedModel: parsedConfig.trainedModel,
          epochs: parsedConfig.epochs,
          learningRate: parsedConfig.learningRate,
          batchSize: parsedConfig.batchSize,
          forgetClass: parsedConfig.forgetClass,
        };
      } catch (error) {
        console.error(error);
        return {
          ...state,
          method: "Fine-Tuning",
          trainedModel: "",
          epochs: 0,
          learningRate: 0,
          batchSize: 0,
          forgetClass: "-1",
        };
      }

    case "CLEAR_UNLEARNING_CONFIG":
      sessionStorage.removeItem(UNLEARNING_CONFIG);
      return {
        ...state,
        method: "Fine-Tuning",
        trainedModel: "",
        epochs: 0,
        learningRate: 0,
        batchSize: 0,
        forgetClass: "-1",
      };

    default:
      return state;
  }
}

export default function UnlearningConfigContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, dispatch] = useReducer(ConfigReducer, {
    method: "Fine-Tuning",
    trainedModel: "",
    epochs: 0,
    learningRate: 0,
    batchSize: 0,
    forgetClass: "",
  });

  function handleSaveSettings(config: Configuration) {
    dispatch({ type: "SAVE_UNLEARNING_CONFIG", payload: config });
  }

  function handleRetrieveSettings() {
    dispatch({ type: "RETRIEVE_UNLEARNING_CONFIG" });
    return {
      method: config.method,
      trainedModel: "",
      epochs: config.epochs,
      learningRate: config.learningRate,
      batchSize: config.batchSize,
      forgetClass: config.forgetClass,
    };
  }

  function handleClearSettings() {
    dispatch({ type: "CLEAR_UNLEARNING_CONFIG" });
  }

  const ctxValue: ConfigurationContextType = {
    method: config.method,
    trainedModel: config.trainedModel,
    epochs: config.epochs,
    learningRate: config.learningRate,
    batchSize: config.batchSize,
    forgetClass: config.forgetClass,

    saveUnlearningConfig: handleSaveSettings,
    retrieveUnlearningConfig: handleRetrieveSettings,
    clearUnlearningConfig: handleClearSettings,
  };

  return (
    <UnlearningConfigContext.Provider value={ctxValue}>
      {children}
    </UnlearningConfigContext.Provider>
  );
}
