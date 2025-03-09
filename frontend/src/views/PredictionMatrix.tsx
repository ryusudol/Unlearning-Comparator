import { useState, useCallback } from "react";

import Subtitle from "../components/Subtitle";
import DatasetModeSelector from "../components/DatasetModeSelector";
import BubbleMatrix from "../components/Predictions/BubbleMatrix";
import CorrelationMatrix from "../components/Predictions/CorrelationMatrix";
import PredictionMatrixLegend from "../components/Predictions/PredictionMatrixLegend";
import Indicator from "../components/Indicator";
import { useForgetClassStore } from "../stores/forgetClassStore";
import { useModelDataStore } from "../stores/modelDataStore";
import { TRAIN } from "../constants/common";
import { ChartChangeIcon } from "../components/UI/icons";
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
  const [chartMode, setChartMode] = useState<"corr" | "bubble">("corr");

  const areAllModelsSelected = modelA !== "" && modelB !== "";
  const forgetClassExist = forgetClass !== -1;
  const isChartModeCorr = chartMode === "corr";

  const handleHover = useCallback((y: number | null) => setHoveredY(y), []);

  const handleModeBtnClick = () => {
    isChartModeCorr ? setChartMode("bubble") : setChartMode("corr");
  };

  return (
    <div className="h-[341px] relative">
      <div className="absolute left-2 top-[34px] cursor-pointer p-0.5 rounded-sm bg-[#eaeaea] z-20">
        <ChartChangeIcon onClick={handleModeBtnClick} className="w-5 h-5" />
      </div>
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
            <PredictionMatrixLegend />
            <div className="flex items-center">
              {modelAExperiment &&
                (chartMode === "corr" ? (
                  <CorrelationMatrix
                    mode="A"
                    modelType={modelAExperiment.Type}
                    datasetMode={selectedDataset}
                    hoveredY={hoveredY}
                    onHover={handleHover}
                  />
                ) : (
                  <BubbleMatrix
                    mode="A"
                    modelType={modelAExperiment.Type}
                    datasetMode={selectedDataset}
                    hoveredY={hoveredY}
                    onHover={handleHover}
                  />
                ))}
              {modelBExperiment &&
                (chartMode === "corr" ? (
                  <CorrelationMatrix
                    mode="B"
                    modelType={modelBExperiment.Type}
                    datasetMode={selectedDataset}
                    showYAxis={false}
                    hoveredY={hoveredY}
                    onHover={handleHover}
                  />
                ) : (
                  <BubbleMatrix
                    mode="B"
                    modelType={modelAExperiment.Type}
                    datasetMode={selectedDataset}
                    hoveredY={hoveredY}
                    onHover={handleHover}
                    showYAxis={false}
                  />
                ))}
            </div>
          </div>
        )
      ) : (
        <Indicator about="ForgetClass" />
      )}
    </div>
  );
}
