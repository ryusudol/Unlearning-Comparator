import { useState, useCallback } from "react";

import Subtitle from "../components/Subtitle";
import DatasetModeSelector from "../components/DatasetModeSelector";
import BubbleMatrix from "../components/Predictions/BubbleMatrix";
import BubbleMatrixLegend from "../components/Predictions/BubbleMatrixLegend";
import CorrelationMatrix from "../components/Predictions/CorrelationMatrix";
import CorrelationMatrixLegend from "../components/Predictions/CorrelationMatrixLegend";
import Indicator from "../components/Indicator";
import { useForgetClassStore } from "../stores/forgetClassStore";
import { useModelDataStore } from "../stores/modelDataStore";
import { TRAIN } from "../constants/common";
import {
  useModelAExperiment,
  useModelBExperiment,
} from "../hooks/useModelExperiment";

export interface MatrixProps {
  mode: "A" | "B";
  modelType: string;
  datasetMode: string;
  hoveredY: number | null;
  onHover: (y: number | null) => void;
  showYAxis?: boolean;
}

export default function PredictionMatrix() {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelA = useModelDataStore((state) => state.modelA);
  const modelB = useModelDataStore((state) => state.modelB);
  const modelAExperiment = useModelAExperiment();
  const modelBExperiment = useModelBExperiment();

  const [selectedDataset, setSelectedDataset] = useState(TRAIN);
  const [hoveredY, setHoveredY] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<"corr" | "bubble">("corr");

  const areAllModelsSelected = modelA !== "" && modelB !== "";
  const forgetClassExist = forgetClass !== -1;
  const isChartModeCorr = chartMode === "corr";

  const handleHover = useCallback((y: number | null) => setHoveredY(y), []);

  const handleModeBtnClick = () => {
    isChartModeCorr ? setChartMode("bubble") : setChartMode("corr");
  };

  function Matrix(props: MatrixProps) {
    return isChartModeCorr ? (
      <CorrelationMatrix {...props} />
    ) : (
      <BubbleMatrix {...props} />
    );
  }

  function MatrixLegend() {
    return isChartModeCorr ? (
      <CorrelationMatrixLegend />
    ) : (
      <BubbleMatrixLegend />
    );
  }

  return (
    <div className="h-[341px] relative">
      <div
        onClick={handleModeBtnClick}
        className="w-8 h-8 absolute left-[142px] top-[28px] cursor-pointer p-0.5 rounded-sm bg-transparent z-20"
      />
      <div className="flex justify-between">
        <Subtitle title="Prediction Matrix" className="left-0.5" />
        {forgetClassExist && areAllModelsSelected && (
          <DatasetModeSelector
            dataset={selectedDataset}
            onValueChange={setSelectedDataset}
          />
        )}
      </div>
      {forgetClassExist ? (
        !areAllModelsSelected ? (
          <Indicator about="AB" />
        ) : (
          <div className="flex flex-col relative bottom-2.5">
            <MatrixLegend />
            <div className="flex items-center">
              {modelAExperiment && (
                <Matrix
                  mode="A"
                  modelType={modelAExperiment.Type}
                  datasetMode={selectedDataset}
                  hoveredY={hoveredY}
                  onHover={handleHover}
                />
              )}
              {modelBExperiment && (
                <Matrix
                  mode="B"
                  modelType={modelBExperiment.Type}
                  datasetMode={selectedDataset}
                  hoveredY={hoveredY}
                  onHover={handleHover}
                  showYAxis={false}
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
