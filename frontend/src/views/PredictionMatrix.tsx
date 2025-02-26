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
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelA = useModelDataStore((state) => state.modelA);
  const modelB = useModelDataStore((state) => state.modelB);
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
          <div className="flex flex-col pt-2 pb-6">
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
    <div className="flex justify-center items-center gap-11 text-[#666666] relative left-5">
      <div className="grid grid-cols-[1fr,auto,1fr] gap-y-1.5 place-items-center relative left-8 text-[11px] grid-rows-[18px_14px]">
        <div className="w-1.5 h-1.5 rounded-full bg-[#666666]" />
        <div className="w-3 h-3 rounded-full bg-[#666666]" />
        <div className="w-[18px] h-[18px] rounded-full bg-[#666666]" />
        <span className="text-nowrap">Lower Proportion</span>
        <Arrow className="mx-1.5" />
        <span className="text-nowrap">Higher Proportion</span>
      </div>
      <div className="flex flex-col items-center gap-y-1.5 relative top-0.5 right-2">
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
        <div className="text-nowrap flex items-center gap-1.5 text-[11px]">
          <span>Lower Confidence</span>
          <Arrow />
          <span>Higher Confidence</span>
        </div>
      </div>
    </div>
  );
}
