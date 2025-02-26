import { useState } from "react";

import Subtitle from "../components/Subtitle";
import Indicator from "../components/Indicator";
import LineChart from "../components/Correlations/LineChart";
import DatasetModeSelector from "../components/DatasetModeSelector";
import { useModelDataStore } from "../stores/modelDataStore";
import { useForgetClassStore } from "../stores/forgetClassStore";
import { TRAIN } from "../constants/common";

export default function LayerWiseSimilarity() {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelA = useModelDataStore((state) => state.modelA);
  const modelB = useModelDataStore((state) => state.modelB);

  const [selectedDataset, setSelectedDataset] = useState(TRAIN);

  const areAllModelsSelected = modelA !== "" && modelB !== "";
  const forgetClassExist = forgetClass !== -1;

  return (
    <div>
      <div className="flex justify-between">
        <Subtitle title="Layer-Wise Similarity" />
        {forgetClassExist && areAllModelsSelected && (
          <DatasetModeSelector
            dataset={selectedDataset}
            onValueChange={setSelectedDataset}
          />
        )}
      </div>
      {forgetClassExist ? (
        areAllModelsSelected ? (
          <LineChart dataset={selectedDataset} />
        ) : (
          <Indicator about="BaselineComparison" />
        )
      ) : (
        <Indicator about="ForgetClass" />
      )}
    </div>
  );
}
