import {
  useEffect,
  createContext,
  useReducer,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { ExperimentData } from "../types/data";
import { BaselineComparisonContext } from "./baseline-comparison-context";
import {
  Action,
  Context,
  ContextType,
  Experiments,
} from "../types/experiments-context";

const EXPERIMENTS = "experiments";

export const ExperimentsContext = createContext<ContextType>({
  experiments: {},
  baselineExperiment: undefined,
  comparisonExperiment: undefined,
  isExperimentLoading: false,

  addExperiment: (experiment: ExperimentData) => {},
  saveExperiments: (experiments: Experiments) => {},
  retrieveExperiments: () => {},
  deleteExperiment: (id: string) => {},
  setIsExperimentsLoading: (loading: boolean) => {},
});

function ExperimentsReducer(state: Context, action: Action): Context {
  switch (action.type) {
    case "ADD_EXPERIMENT":
      const experiment = action.payload;
      const newExperiments = {
        ...state.experiments,
        [experiment.id]: experiment,
      };
      sessionStorage.setItem(
        EXPERIMENTS,
        JSON.stringify({ ...state, experiments: newExperiments })
      );
      return { ...state, experiments: newExperiments };

    case "SAVE_EXPERIMENTS":
      const experiments = action.payload;
      sessionStorage.setItem(
        EXPERIMENTS,
        JSON.stringify({ ...state, experiments })
      );
      return { ...state, experiments };

    case "RETRIEVE_EXPERIMENTS":
      const savedExperimentsContext = sessionStorage.getItem(EXPERIMENTS);
      if (savedExperimentsContext) {
        const parsedExperimentsContext: Context = JSON.parse(
          savedExperimentsContext
        );
        return {
          ...parsedExperimentsContext,
          isExperimentLoading: false,
        };
      }
      return {
        ...state,
        isExperimentLoading: false,
      };

    case "DELETE_EXPERIMENT":
      const id = action.payload;
      const { [id]: deletedExperiment, ...remainingExperiments } =
        state.experiments;
      sessionStorage.setItem(
        EXPERIMENTS,
        JSON.stringify({ ...state, experiments: remainingExperiments })
      );
      return { ...state, experiments: remainingExperiments };

    case "SET_IS_EXPERIMENTS_LOADING":
      return { ...state, isExperimentLoading: action.payload };

    default:
      return state;
  }
}

export default function ExperimentsContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);

  const [experimentsContext, dispatch] = useReducer(ExperimentsReducer, {
    experiments: {},
    baselineExperiment: undefined,
    comparisonExperiment: undefined,
    isExperimentLoading: false,
  });

  const baselineExperiment = useMemo(() => {
    return experimentsContext.experiments[baseline];
  }, [baseline, experimentsContext.experiments]);

  const comparisonExperiment = useMemo(() => {
    return experimentsContext.experiments[comparison];
  }, [comparison, experimentsContext.experiments]);

  const handleAddExperiment = useCallback((experiment: ExperimentData) => {
    dispatch({ type: "ADD_EXPERIMENT", payload: experiment });
  }, []);

  const handleSaveExperiments = useCallback((experiments: Experiments) => {
    dispatch({ type: "SAVE_EXPERIMENTS", payload: experiments });
  }, []);

  const handleRetrieveExperiments = useCallback(() => {
    dispatch({ type: "RETRIEVE_EXPERIMENTS" });
  }, []);

  const handleDeleteExperiment = useCallback((id: string) => {
    dispatch({ type: "DELETE_EXPERIMENT", payload: id });
  }, []);

  const handleSetIsExperimentsLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_IS_EXPERIMENTS_LOADING", payload: loading });
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
