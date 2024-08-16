import { createContext, useReducer } from "react";

import {
  Configuration,
  Action,
  ConfigurationContextType,
} from "../types/retrain-config-context";

const RETRAINING_CONFIG = "retraining-config";

export const RetrainingConfigContext = createContext<ConfigurationContextType>({
  epochs: 0,
  learningRate: 0,
  batchSize: 0,
  forgetClass: "0",

  saveRetrainingConfig: (config: Configuration) => {},
  retrieveRetrainingConfig: () => ({
    epochs: 0,
    learningRate: 0,
    batchSize: 0,
    forgetClass: "0",
  }),
  clearRetrainingConfig: () => {},
});

function retrainingConfigReducer(
  state: Configuration,
  action: Action
): Configuration {
  switch (action.type) {
    case "SAVE_RETRAINING_CONFIG":
      const config = action.payload;
      sessionStorage.setItem(RETRAINING_CONFIG, JSON.stringify(config));
      return {
        ...state,
        epochs: config.epochs,
        learningRate: config.learningRate,
        batchSize: config.batchSize,
        forgetClass: config.forgetClass,
      };

    case "RETRIEVE_RETRAINING_CONFIG":
      const savedSettings = sessionStorage.getItem(RETRAINING_CONFIG);
      if (!savedSettings)
        return {
          ...state,
          epochs: 0,
          learningRate: 0,
          batchSize: 0,
          forgetClass: "0",
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
          forgetClass: "0",
        };
      }

    case "CLEAR_RETRAINING_CONFIG":
      sessionStorage.removeItem(RETRAINING_CONFIG);
      return {
        ...state,
        epochs: 0,
        learningRate: 0,
        batchSize: 0,
        forgetClass: "0",
      };

    default:
      return state;
  }
}

export default function RetrainingConfigContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, dispatch] = useReducer(retrainingConfigReducer, {
    epochs: 0,
    learningRate: 0,
    batchSize: 0,
    forgetClass: "0",
  });

  function handleSaveSettings(config: Configuration) {
    dispatch({ type: "SAVE_RETRAINING_CONFIG", payload: config });
  }

  function handleRetrieveSettings() {
    dispatch({ type: "RETRIEVE_RETRAINING_CONFIG" });
    return {
      epochs: config.epochs,
      learningRate: config.learningRate,
      batchSize: config.batchSize,
      forgetClass: config.forgetClass,
    };
  }

  function handleClearSettings() {
    dispatch({ type: "CLEAR_RETRAINING_CONFIG" });
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
    <RetrainingConfigContext.Provider value={ctxValue}>
      {children}
    </RetrainingConfigContext.Provider>
  );
}
