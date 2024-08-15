import { createContext, useReducer } from "react";

import {
  Configuration,
  Action,
  ConfigurationContextType,
} from "../types/retrain-config-context";

const RETRAINING_CONFIG = "retraining-config";

export const RetrainConfigContext = createContext<ConfigurationContextType>({
  epochs: 0,
  learningRate: 0,
  batchSize: 0,
  forgetClass: "0",

  saveRetrainingConfig: (config: Configuration) => {},
  retrieveRetrainingConfig: () => ({
    epochs: 0,
    learningRate: 0,
    batchSize: 0,
    forgetClass: "-1",
  }),
  clearRetrainingConfig: () => {},
});

function ConfigReducer(state: Configuration, action: Action): Configuration {
  switch (action.type) {
    case "SAVE_SETTINGS":
      const config = action.payload;
      sessionStorage.setItem(RETRAINING_CONFIG, JSON.stringify(config));
      return {
        ...state,
        epochs: config.epochs,
        learningRate: config.learningRate,
        batchSize: config.batchSize,
        forgetClass: config.forgetClass,
      };

    case "RETRIEVE_SETTINGS":
      const savedSettings = sessionStorage.getItem(RETRAINING_CONFIG);
      if (!savedSettings)
        return {
          ...state,
          epochs: 0,
          learningRate: 0,
          batchSize: 0,
          forgetClass: "-1",
        };
      try {
        const parsedSettings: Configuration = JSON.parse(savedSettings);
        return {
          ...state,
          epochs: parsedSettings.epochs,
          learningRate: parsedSettings.learningRate,
          batchSize: parsedSettings.batchSize,
          forgetClass: parsedSettings.forgetClass,
        };
      } catch (error) {
        console.error(error);
        return {
          ...state,
          epochs: 0,
          learningRate: 0,
          batchSize: 0,
          forgetClass: "-1",
        };
      }

    case "CLEAR_SETTINGS":
      sessionStorage.removeItem(RETRAINING_CONFIG);
      return {
        ...state,
        epochs: 0,
        learningRate: 0,
        batchSize: 0,
        forgetClass: "-1",
      };

    default:
      return state;
  }
}

export default function SettingsContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, dispatch] = useReducer(ConfigReducer, {
    epochs: 0,
    learningRate: 0,
    batchSize: 0,
    forgetClass: "",
  });

  function handleSaveSettings(config: Configuration) {
    dispatch({ type: "SAVE_SETTINGS", payload: config });
  }

  function handleRetrieveSettings() {
    dispatch({ type: "RETRIEVE_SETTINGS" });
    return {
      epochs: config.epochs,
      learningRate: config.learningRate,
      batchSize: config.batchSize,
      forgetClass: config.forgetClass,
    };
  }

  function handleClearSettings() {
    dispatch({ type: "CLEAR_SETTINGS" });
  }

  const ctxValue: ConfigurationContextType = {
    epochs: config.epochs,
    learningRate: config.learningRate,
    batchSize: config.batchSize,
    forgetClass: config.forgetClass,

    saveRetrainingConfig: handleSaveSettings,
    retrieveRetrainingConfig: handleRetrieveSettings,
    clearRetrainingConfig: handleClearSettings,
  };

  return (
    <RetrainConfigContext.Provider value={ctxValue}>
      {children}
    </RetrainConfigContext.Provider>
  );
}
