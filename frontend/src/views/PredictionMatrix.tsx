import { useState } from "react";

import Subtitle from "../components/Subtitle";
import DatasetModeSelector from "../components/DatasetModeSelector";
import BubbleChart from "../components/Predictions/BubbleChart";
import Indicator from "../components/Indicator";
import {
  useModelAExperiment,
  useModelBExperiment,
} from "../stores/experimentsStore";
import { useForgetClassStore } from "../stores/forgetClassStore";
import { useModelDataStore } from "../stores/modelDataStore";
import { Arrow } from "../components/UI/icons";
import { TRAIN } from "../constants/common";
import { bubbleColorScale } from "../constants/colors";

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
    <div>
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
          <div className="flex flex-col relative bottom-2.5">
            <BubbleChartLegend />
            <div className="flex items-center">
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
    <div className="flex justify-center items-center gap-11 text-[#666666] mb-1">
      <div className="grid grid-cols-[1fr,auto,1fr] gap-y-1.5 place-items-center text-[11px] grid-rows-[18px_14px] relative left-6">
        <div className="w-1 h-1 rounded-full bg-[#666666]" />
        <div className="w-[13px] h-[13px] rounded-full bg-[#666666]" />
        <div className="w-[18px] h-[18px] rounded-full bg-[#666666]" />
        <p className="flex flex-col relative top-1">
          <span className="text-sm relative top-1">Small</span>
          <span className="text-[10px]">Proportion</span>
        </p>
        <Arrow className="mx-4" />
        <p className="flex flex-col relative top-1 left-1.5">
          <span className="text-sm relative top-1">Large</span>
          <span className="text-[10px]">Proportion</span>
        </p>
      </div>
      <div className="flex flex-col items-center gap-y-1.5 relative left-[34px]">
        <div className="relative top-2 w-[156px] h-3.5">
          <div
            className="absolute w-full h-full"
            style={{ background: gradient }}
          />
          <div className="absolute -bottom-[3px] left-1">
            <span className="text-[10px] text-white">0</span>
          </div>
          <div className="absolute -bottom-[3px] right-1">
            <span className="text-[10px] text-white">1</span>
          </div>
        </div>
        <div className="text-nowrap flex items-center gap-2.5 text-[11px]">
          <p className="flex flex-col relative top-1">
            <span className="text-sm relative top-1">Low</span>
            <span className="text-[10px]">Confidence</span>
          </p>
          <Arrow className="mx-2" />
          <p className="flex flex-col relative top-1 left-0.5">
            <span className="text-sm relative top-1">High</span>
            <span className="text-[10px]">Confidence</span>
          </p>
        </div>
      </div>
    </div>
  );
}
