import { useState } from "react";

import Subtitle from "../components/Subtitle";
import DatasetModeSelector from "../components/DatasetModeSelector";
import BubbleChart from "../components/Predictions/BubbleChart";
import Indicator from "../components/Indicator";
import { useForgetClassStore } from "../stores/forgetClassStore";
import { useModelDataStore } from "../stores/modelDataStore";
import { Arrow } from "../components/UI/icons";
import { TRAIN } from "../constants/common";
import { bubbleColorScale } from "../constants/colors";
import {
  useModelAExperiment,
  useModelBExperiment,
} from "../stores/experimentsStore";

export default function PredictionMatrix() {
  const { forgetClass } = useForgetClassStore();
  const { modelA, modelB } = useModelDataStore();
  const modelAExperiment = useModelAExperiment();
  const modelBExperiment = useModelBExperiment();

  const [selectedDataset, setSelectedDataset] = useState(TRAIN);
  const [hoveredY, setHoveredY] = useState<number | null>(null);

  const areAllModelsSelected = modelA !== "" && modelB !== "";
  const forgetClassExist = forgetClass !== -1;

  return (
    <div className="mb-2">
      <div className="flex justify-between">
        <Subtitle title="Prediction Matrix" />
        {forgetClassExist && areAllModelsSelected && (
          <DatasetModeSelector
            dataset={selectedDataset}
            onValueChange={setSelectedDataset}
          />
        )}
      </div>
      {forgetClassExist ? (
        !areAllModelsSelected ? (
          <Indicator about="BaselineComparison" />
        ) : (
          <div className="flex flex-col pt-2 pb-6 border rounded-md">
            <BubbleChartLegend />
            <div className="flex items-center relative left-2">
              {modelAExperiment && (
                <BubbleChart
                  mode="Baseline"
                  modelType={modelAExperiment.Type}
                  datasetMode={selectedDataset}
                  hoveredY={hoveredY}
                  onHover={(y) => setHoveredY(y)}
                  onHoverEnd={() => setHoveredY(null)}
                />
              )}
              {modelBExperiment && (
                <BubbleChart
                  mode="Comparison"
                  modelType={modelBExperiment.Type}
                  datasetMode={selectedDataset}
                  showYAxis={false}
                  hoveredY={hoveredY}
                  onHover={(y) => setHoveredY(y)}
                  onHoverEnd={() => setHoveredY(null)}
                />
              )}
            </div>
          </div>
        )
      ) : (
        <Indicator about="ForgetClass" />
      )}
    </div>
  );
}

function BubbleChartLegend() {
  const gradient = `linear-gradient(to right, ${bubbleColorScale.join(", ")})`;

  return (
    <div className="flex justify-center items-center gap-11 text-[#666666]">
      <div className="grid grid-cols-3 gap-y-1.5 place-items-center relative left-4 text-[10px] grid-rows-[18px_14px]">
        <div className="w-1.5 h-1.5 rounded-full bg-[#666666]" />
        <div className="w-4 h-4 rounded-full bg-[#666666]" />
        <div className="w-6 h-6 rounded-full bg-[#666666]" />
        <span>Less Frequent</span>
        <Arrow className="mx-1.5" />
        <span>More Frequent</span>
      </div>
      <div className="flex flex-col items-center gap-y-1.5 relative top-0.5 left-1">
        <div className="relative w-[148px] h-3.5">
          <div
            className="absolute w-full h-full"
            style={{ background: gradient }}
          />
          <div className="absolute -bottom-[3px] left-1">
            <span className="text-[10px] text-black">0</span>
          </div>
          <div className="absolute -bottom-[3px] right-1">
            <span className="text-[10px] text-white">1</span>
          </div>
        </div>
        <div className="text-nowrap flex items-center gap-2 text-[10px]">
          <span>Less Confident</span>
          <Arrow />
          <span>More Confident</span>
        </div>
      </div>
    </div>
  );
}
