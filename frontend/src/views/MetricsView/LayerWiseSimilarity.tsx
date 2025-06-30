import { useState } from "react";

import Subtitle from "../../components/common/Subtitle";
import Indicator from "../../components/common/Indicator";
import LineChart from "../../components/MetricsView/LayerwiseSimilarity/LineChart";
import DatasetModeSelector from "../../components/common/DatasetModeSelector";
import CompareModeSelector from "../../components/MetricsView/LayerwiseSimilarity/CompareModeSelector";
import { useModelDataStore } from "../../stores/modelDataStore";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { TRAIN } from "../../constants/common";
import { COMPARE_ORIGINAL } from "../../constants/layerWiseSimilarity";

export default function LayerWiseSimilarity() {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelA = useModelDataStore((state) => state.modelA);
  const modelB = useModelDataStore((state) => state.modelB);

  const [selectedDataset, setSelectedDataset] = useState(TRAIN);
  const [compareMode, setCompareMode] = useState(COMPARE_ORIGINAL);

  const areAllModelsSelected = modelA !== "" && modelB !== "";
  const forgetClassExist = forgetClass !== -1;

  return (
    <div className="h-[322.5px] relative top-1">
      <div className="flex justify-between">
        <Subtitle title="Layer-wise Similarity" className="left-0.5" />
        {forgetClassExist && areAllModelsSelected && (
          <DatasetModeSelector
            dataset={selectedDataset}
            onValueChange={setSelectedDataset}
          />
        )}
      </div>
      {forgetClassExist ? (
        areAllModelsSelected ? (
          <div className="relative bottom-[3px]">
            <div className="flex items-center justify-center gap-4 mb-1 relative left-2">
              <CompareModeSelector
                compareMode={compareMode}
                onValueChange={setCompareMode}
              />
            </div>
            <LineChart dataset={selectedDataset} compareMode={compareMode} />
          </div>
        ) : (
          <Indicator about="AB" />
        )
      ) : (
        <Indicator about="ForgetClass" />
      )}
    </div>
  );
}
