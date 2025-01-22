import { useEffect, createContext, useReducer, useCallback } from "react";

import { DATASET } from "../constants/storageKeys";
import { DATASET_ACTIONS } from "../constants/actions";
import { Action, Dataset, DatasetContextType } from "../types/dataset-context";

export const DatasetContext = createContext<DatasetContextType>({
  dataset: undefined,

  saveDataset: (dataset: string) => {},
  retrieveDataset: () => {},
});

function DatasetReducer(state: Dataset, action: Action): Dataset {
  switch (action.type) {
    case DATASET_ACTIONS.SAVE_DATASET:
      const dataset = action.payload;
      sessionStorage.setItem(DATASET, JSON.stringify({ dataset }));
      return { dataset };

    case DATASET_ACTIONS.RETRIEVE_DATASET:
      const retrievedDataset = sessionStorage.getItem(DATASET);
      if (retrievedDataset) {
        const parsedDataset = JSON.parse(retrievedDataset);
        return { dataset: parsedDataset.dataset };
      }
      return state;

    default:
      return state;
  }
}

export default function DatasetContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(DatasetReducer, {
    dataset: undefined,
  });

  const handleSaveDataset = useCallback((dataset: string) => {
    dispatch({
      type: DATASET_ACTIONS.SAVE_DATASET,
      payload: dataset,
    });
  }, []);

  const handleRetrieveDataset = useCallback(() => {
    dispatch({ type: DATASET_ACTIONS.RETRIEVE_DATASET });
  }, []);

  useEffect(() => {
    handleRetrieveDataset();
  }, [handleRetrieveDataset]);

  const ctxValue: DatasetContextType = {
    dataset: state.dataset,

    saveDataset: handleSaveDataset,
    retrieveDataset: handleRetrieveDataset,
  };

  return (
    <DatasetContext.Provider value={ctxValue}>
      {children}
    </DatasetContext.Provider>
  );
}
