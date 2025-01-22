import { useEffect, createContext, useReducer, useCallback } from "react";

import {
  Action,
  NeuralNetworkModel,
  NeuralNetworkModelContextType,
} from "../types/neural-network-model-context";
import { NEURAL_NETWORK_MODEL } from "../constants/storageKeys";
import { NEURAL_NETWORK_MODEL_ACTIONS } from "../constants/actions";

export const NeuralNetworkModelContext =
  createContext<NeuralNetworkModelContextType>({
    neuralNetworkModel: undefined,

    saveNeuralNetworkModel: (model: string) => {},
    retrieveNeuralNetworkModel: () => {},
  });

function NeuralNetworkModelReducer(
  state: NeuralNetworkModel,
  action: Action
): NeuralNetworkModel {
  switch (action.type) {
    case NEURAL_NETWORK_MODEL_ACTIONS.SAVE_NEURAL_NETWORK_MODEL:
      const model = action.payload;
      sessionStorage.setItem(
        NEURAL_NETWORK_MODEL,
        JSON.stringify({ neuralNetworkModel: model })
      );
      return { neuralNetworkModel: model };

    case NEURAL_NETWORK_MODEL_ACTIONS.RETRIEVE_NEURAL_NETWORK_MODEL:
      const retrievedNeuralNetworkModel =
        sessionStorage.getItem(NEURAL_NETWORK_MODEL);
      if (retrievedNeuralNetworkModel) {
        const parsedNeuralNetworkModel = JSON.parse(
          retrievedNeuralNetworkModel
        );
        return { neuralNetworkModel: parsedNeuralNetworkModel.dataset };
      }
      return state;

    default:
      return state;
  }
}

export default function NeuralNetworkModelContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(NeuralNetworkModelReducer, {
    neuralNetworkModel: undefined,
  });

  const handleSaveNeuralNetworkModel = useCallback((model: string) => {
    dispatch({
      type: NEURAL_NETWORK_MODEL_ACTIONS.SAVE_NEURAL_NETWORK_MODEL,
      payload: model,
    });
  }, []);

  const handleRetrieveNeuralNetworkModel = useCallback(() => {
    dispatch({
      type: NEURAL_NETWORK_MODEL_ACTIONS.RETRIEVE_NEURAL_NETWORK_MODEL,
    });
  }, []);

  useEffect(() => {
    handleRetrieveNeuralNetworkModel();
  }, [handleRetrieveNeuralNetworkModel]);

  const ctxValue: NeuralNetworkModelContextType = {
    neuralNetworkModel: state.neuralNetworkModel,

    saveNeuralNetworkModel: handleSaveNeuralNetworkModel,
    retrieveNeuralNetworkModel: handleRetrieveNeuralNetworkModel,
  };

  return (
    <NeuralNetworkModelContext.Provider value={ctxValue}>
      {children}
    </NeuralNetworkModelContext.Provider>
  );
}
