import { Experiment } from "../../types/experiments-context";
import { TRAIN } from "../../constants/common";

export const getCkaData = (
  dataset: string,
  baselineExperiment: Experiment,
  comparisonExperiment: Experiment
) => {
  const layers = baselineExperiment.cka.layers;

  const baselineCka =
    dataset === TRAIN
      ? baselineExperiment.cka.train
      : baselineExperiment.cka.test;
  const comparisonCka =
    dataset === TRAIN
      ? comparisonExperiment.cka.train
      : comparisonExperiment.cka.test;

  const baselineForgetCka = baselineCka.forget_class.map(
    (layer, idx) => layer[idx]
  );
  const baselineOtherCka = baselineCka.other_classes.map(
    (layer, idx) => layer[idx]
  );
  const comparisonForgetCka = comparisonCka.forget_class.map(
    (layer, idx) => layer[idx]
  );
  const comparisonOtherCka = comparisonCka.other_classes.map(
    (layer, idx) => layer[idx]
  );

  const ckaData = layers.map((layer, idx) => ({
    layer,
    baselineForgetCka: baselineForgetCka[idx],
    baselineOtherCka: baselineOtherCka[idx],
    comparisonForgetCka: comparisonForgetCka[idx],
    comparisonOtherCka: comparisonOtherCka[idx],
  }));

  return ckaData;
};
