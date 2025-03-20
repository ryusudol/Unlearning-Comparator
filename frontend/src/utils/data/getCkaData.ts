import { Experiment } from "../../types/data";
import { TRAIN } from "../../constants/common";

export const getCkaData = (
  dataset: string,
  modelAExperiment: Experiment,
  modelBExperiment: Experiment
) => {
  const layers = modelAExperiment.cka.layers;

  const modelACka =
    dataset === TRAIN ? modelAExperiment.cka.train : modelAExperiment.cka.test;
  const modelBCka =
    dataset === TRAIN ? modelBExperiment.cka.train : modelBExperiment.cka.test;

  const modelAForgetCka = modelACka.forget_class.map(
    (layer, idx) => layer[idx]
  );
  const modelAOtherCka = modelACka.other_classes.map(
    (layer, idx) => layer[idx]
  );
  const modelBForgetCka = modelBCka.forget_class.map(
    (layer, idx) => layer[idx]
  );
  const modelBOtherCka = modelBCka.other_classes.map(
    (layer, idx) => layer[idx]
  );

  const ckaData = layers.map((layer, idx) => ({
    layer,
    modelAForgetCka: modelAForgetCka[idx],
    modelAOtherCka: modelAOtherCka[idx],
    modelBForgetCka: modelBForgetCka[idx],
    modelBOtherCka: modelBOtherCka[idx],
  }));

  return ckaData;
};
