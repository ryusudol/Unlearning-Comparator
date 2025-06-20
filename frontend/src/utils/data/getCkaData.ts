import { Experiment } from "../../types/data";
import { TRAIN } from "../../constants/common";
import { COMPARE_ORIGINAL, COMPARE_RETRAIN } from "../../components/common/CompareModeSelector";

export const getCkaData = (
  dataset: string,
  modelAExperiment: Experiment,
  modelBExperiment: Experiment,
  compareMode: string = COMPARE_ORIGINAL
) => {
  const layers = modelAExperiment.cka.layers;

  // Choose between original similarity or retrain similarity
  const modelACkaSource = compareMode === COMPARE_RETRAIN && modelAExperiment.cka_retrain 
    ? modelAExperiment.cka_retrain 
    : modelAExperiment.cka;
  const modelBCkaSource = compareMode === COMPARE_RETRAIN && modelBExperiment.cka_retrain 
    ? modelBExperiment.cka_retrain 
    : modelBExperiment.cka;

  const modelACka =
    dataset === TRAIN ? modelACkaSource.train : modelACkaSource.test;
  const modelBCka =
    dataset === TRAIN ? modelBCkaSource.train : modelBCkaSource.test;

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
