import {
  useEffect,
  createContext,
  useReducer,
  useCallback,
  useMemo,
} from "react";

import { EXPERIMENTS } from "../constants/storageKeys";
import { EXPERIMENTS_ACTIONS } from "../constants/actions";
import { ExperimentData } from "../types/data";
import { useModelDataStore } from "./modelDataStore";
import {
  Action,
  Context,
  ContextType,
  Experiments,
} from "../types/experiments-context";

export const ExperimentsContext = createContext<ContextType>({
  experiments: {},
  baselineExperiment: undefined,
  comparisonExperiment: undefined,
  isExperimentLoading: false,

  addExperiment: (experiment: ExperimentData, tempIdx?: number) => {},
  updateExperiment: (experiment: ExperimentData, idx: number) => {},
  saveExperiments: (experiments: Experiments) => {},
  retrieveExperiments: () => {},
  deleteExperiment: (id: string) => {},
  setIsExperimentsLoading: (loading: boolean) => {},
});

function ExperimentsReducer(state: Context, action: Action): Context {
  switch (action.type) {
    case EXPERIMENTS_ACTIONS.ADD_EXPERIMENT: {
      const { experiment, tempIdx } = action.payload;
      const { points, ...experimentWithoutPoints } = experiment;
      const newExperiments =
        tempIdx !== undefined
          ? {
              ...state.experiments,
              [tempIdx]: experimentWithoutPoints,
            }
          : {
              ...state.experiments,
              [experiment.ID]: experimentWithoutPoints,
            };
      const result = { ...state, experiments: newExperiments };
      sessionStorage.setItem(EXPERIMENTS, JSON.stringify(result));
      return result;
    }

    case EXPERIMENTS_ACTIONS.UPDATE_EXPERIMENT: {
      const { experiment, idx } = action.payload;
      const { [idx]: removedExperiment, ...remainingExperiments } =
        state.experiments;
      const updatedExperiments = {
        ...remainingExperiments,
        [experiment.ID]: experiment,
      };
      const result = { ...state, experiments: updatedExperiments };
      sessionStorage.setItem(EXPERIMENTS, JSON.stringify(result));
      return result;
    }

    case EXPERIMENTS_ACTIONS.SAVE_EXPERIMENTS: {
      const experiments = action.payload;
      const result = { ...state, experiments };
      sessionStorage.setItem(EXPERIMENTS, JSON.stringify(result));
      return result;
    }

    case EXPERIMENTS_ACTIONS.RETRIEVE_EXPERIMENTS: {
      const savedExperiments = sessionStorage.getItem(EXPERIMENTS);
      let result = {
        ...state,
        isExperimentLoading: false,
      };

      if (savedExperiments) {
        const parsedExperiments: Context = JSON.parse(savedExperiments);
        result = {
          ...parsedExperiments,
          isExperimentLoading: false,
        };
      }
      return result;
    }

    case EXPERIMENTS_ACTIONS.DELETE_EXPERIMENT: {
      const id = action.payload;
      const { [id]: targetExperiment, ...remainingExperiments } =
        state.experiments;
      const result = {
        ...state,
        experiments: remainingExperiments,
      };
      sessionStorage.setItem(EXPERIMENTS, JSON.stringify(result));
      return result;
    }

    case EXPERIMENTS_ACTIONS.SET_IS_EXPERIMENTS_LOADING: {
      return { ...state, isExperimentLoading: action.payload };
    }

    default:
      return state;
  }
}

export default function ExperimentsContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { modelA, modelB } = useModelDataStore();

  const [experimentsContext, dispatch] = useReducer(ExperimentsReducer, {
    experiments: {},
    baselineExperiment: undefined,
    comparisonExperiment: undefined,
    isExperimentLoading: false,
  });

  const baselineExperiment = useMemo(() => {
    return experimentsContext.experiments[modelA];
  }, [experimentsContext.experiments, modelA]);

  const comparisonExperiment = useMemo(() => {
    return experimentsContext.experiments[modelB];
  }, [experimentsContext.experiments, modelB]);

  const handleAddExperiment = useCallback(
    (experiment: ExperimentData, tempIdx?: number) => {
      dispatch({
        type: EXPERIMENTS_ACTIONS.ADD_EXPERIMENT,
        payload: { experiment, tempIdx },
      });
    },
    []
  );

  const handleUpdateExperiment = useCallback(
    (experiment: ExperimentData, idx: number) => {
      dispatch({
        type: EXPERIMENTS_ACTIONS.UPDATE_EXPERIMENT,
        payload: { experiment, idx },
      });
    },
    []
  );

  const handleSaveExperiments = useCallback((experiments: Experiments) => {
    dispatch({
      type: EXPERIMENTS_ACTIONS.SAVE_EXPERIMENTS,
      payload: experiments,
    });
  }, []);

  const handleRetrieveExperiments = useCallback(() => {
    dispatch({ type: EXPERIMENTS_ACTIONS.RETRIEVE_EXPERIMENTS });
  }, []);

  const handleDeleteExperiment = useCallback((id: string) => {
    dispatch({ type: EXPERIMENTS_ACTIONS.DELETE_EXPERIMENT, payload: id });
  }, []);

  const handleSetIsExperimentsLoading = useCallback((loading: boolean) => {
    dispatch({
      type: EXPERIMENTS_ACTIONS.SET_IS_EXPERIMENTS_LOADING,
      payload: loading,
    });
  }, []);

  useEffect(() => {
    handleRetrieveExperiments();
  }, [handleRetrieveExperiments]);

  const ctxValue: ContextType = {
    experiments: experimentsContext.experiments,
    baselineExperiment,
    comparisonExperiment,
    isExperimentLoading: experimentsContext.isExperimentLoading,

    addExperiment: handleAddExperiment,
    updateExperiment: handleUpdateExperiment,
    saveExperiments: handleSaveExperiments,
    retrieveExperiments: handleRetrieveExperiments,
    deleteExperiment: handleDeleteExperiment,
    setIsExperimentsLoading: handleSetIsExperimentsLoading,
  };

  return (
    <ExperimentsContext.Provider value={ctxValue}>
      {children}
    </ExperimentsContext.Provider>
  );
}
