import { useState, useCallback } from "react";

import Subtitle from "../components/Subtitle";
import DatasetModeSelector from "../components/DatasetModeSelector";
import CorrelationMatrix from "../components/Predictions/CorrelationMatrix";
import PredictionMatrixLegend from "../components/Predictions/PredictionMatrixLegend";
import Indicator from "../components/Indicator";
import {
  useModelAExperiment,
  useModelBExperiment,
} from "../stores/experimentsStore";
import { useForgetClassStore } from "../stores/forgetClassStore";
import { useModelDataStore } from "../stores/modelDataStore";
import { TRAIN } from "../constants/common";

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

  const handleHover = useCallback((y: number | null) => setHoveredY(y), []);

  return (
    <div className="h-[341px]">
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
              {modelAExperiment && (
                <CorrelationMatrix
                  mode="A"
                  modelType={modelAExperiment.Type}
                  datasetMode={selectedDataset}
                  hoveredY={hoveredY}
                  onHover={handleHover}
                />
              )}
              {modelBExperiment && (
                <CorrelationMatrix
                  mode="B"
                  modelType={modelBExperiment.Type}
                  datasetMode={selectedDataset}
                  showYAxis={false}
                  hoveredY={hoveredY}
                  onHover={handleHover}
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
