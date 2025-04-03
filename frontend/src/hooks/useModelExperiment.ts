import { useExperimentsStore } from "../stores/experimentsStore";
import { useModelDataStore } from "../stores/modelDataStore";

export const useModelAExperiment = () => {
  const experiments = useExperimentsStore((state) => state.experiments);
  const modelA = useModelDataStore((state) => state.modelA);
  return experiments[modelA];
};

export const useModelBExperiment = () => {
  const experiments = useExperimentsStore((state) => state.experiments);
  const modelB = useModelDataStore((state) => state.modelB);
  return experiments[modelB];
};
