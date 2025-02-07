import React, {
  useEffect,
  createContext,
  useReducer,
  useCallback,
} from "react";

import {
  DatasetAndModel,
  DatasetAndModelContextType,
  Action,
} from "../types/dataset-and-model-context";
import { DATASET_AND_MODEL } from "../constants/storageKeys";
import { DATASET_AND_MODEL_ACTIONS } from "../constants/actions";

const initialState: DatasetAndModel = {
  dataset: undefined,
  neuralNetworkModel: undefined,
};

export const DatasetAndModelContext = createContext<DatasetAndModelContextType>(
  {
    ...initialState,

    saveDataset: (dataset: string) => {},
    saveNeuralNetworkModel: (model: string) => {},
    retrieveDatasetAndModel: () => {},
  }
);

function CombinedReducer(
  state: DatasetAndModel,
  action: Action
): DatasetAndModel {
  switch (action.type) {
    case DATASET_AND_MODEL_ACTIONS.SAVE_DATASET: {
      const dataset = action.payload;
      sessionStorage.setItem(DATASET_AND_MODEL, JSON.stringify({ dataset }));
      return { ...state, dataset };
    }

    case DATASET_AND_MODEL_ACTIONS.SAVE_NEURAL_NETWORK_MODEL: {
      const model = action.payload;
      sessionStorage.setItem(
        DATASET_AND_MODEL,
        JSON.stringify({ neuralNetworkModel: model })
      );
      return { ...state, neuralNetworkModel: model };
    }

    case DATASET_AND_MODEL_ACTIONS.RETRIEVE_DATASET_AND_MODEL: {
      const retrievedDatasetAndModel =
        sessionStorage.getItem(DATASET_AND_MODEL);
      if (retrievedDatasetAndModel) {
        const parsedDatasetAndModel = JSON.parse(retrievedDatasetAndModel);
        return {
          ...state,
          dataset: parsedDatasetAndModel.dataset,
          neuralNetworkModel: parsedDatasetAndModel.neuralNetworkModel,
        };
      }
      return state;
    }

    default: {
      return state;
    }
  }
}

export default function CombinedContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(CombinedReducer, initialState);

  const handleSaveDataset = useCallback((dataset: string) => {
    dispatch({
      type: DATASET_AND_MODEL_ACTIONS.SAVE_DATASET,
      payload: dataset,
    });
  }, []);

  const handleSaveNeuralNetworkModel = useCallback((model: string) => {
    dispatch({
      type: DATASET_AND_MODEL_ACTIONS.SAVE_NEURAL_NETWORK_MODEL,
      payload: model,
    });
  }, []);

  const handleRetrieveDatasetAndModel = useCallback(() => {
    dispatch({ type: DATASET_AND_MODEL_ACTIONS.RETRIEVE_DATASET_AND_MODEL });
  }, []);

  useEffect(() => {
    handleRetrieveDatasetAndModel();
  }, [handleRetrieveDatasetAndModel]);

  const ctxValue: DatasetAndModelContextType = {
    dataset: state.dataset,
    neuralNetworkModel: state.neuralNetworkModel,

    saveDataset: handleSaveDataset,
    saveNeuralNetworkModel: handleSaveNeuralNetworkModel,
    retrieveDatasetAndModel: handleRetrieveDatasetAndModel,
  };

  return (
    <DatasetAndModelContext.Provider value={ctxValue}>
      {children}
    </DatasetAndModelContext.Provider>
  );
}
