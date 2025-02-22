import { useState } from "react";

import Subtitle from "../components/Subtitle";
import Indicator from "../components/Indicator";
import LineChart from "../components/Correlations/LineChart";
import DatasetModeSelector from "../components/DatasetModeSelector";
import { useModelDataStore } from "../stores/modelDataStore";
import { useForgetClassStore } from "../stores/forgetClassStore";
import { TRAIN } from "../constants/common";

export default function LayerWiseSimilarity() {
  const { forgetClass } = useForgetClassStore();
  const { modelA, modelB } = useModelDataStore();

  const [dataset, setDataset] = useState(TRAIN);

  const areAllModelsSelected = modelA !== "" && modelB !== "";
  const forgetClassExist = forgetClass !== -1;

  return (
    <>
      <div className="flex justify-between">
        <Subtitle title="Layer-Wise Similarity" />
        {forgetClassExist && areAllModelsSelected && (
          <DatasetModeSelector onValueChange={setDataset} />
        )}
      </div>
      {forgetClassExist ? (
        areAllModelsSelected ? (
          <div className="border rounded-md">
            <LineChart dataset={dataset} />
          </div>
        ) : (
          <Indicator about="BaselineComparison" />
        )
      ) : (
        <Indicator about="ForgetClass" />
      )}
    </>
  );
}
