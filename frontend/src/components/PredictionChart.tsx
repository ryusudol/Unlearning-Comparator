import { useContext } from "react";

import Heatmap from "../components/Heatmap";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ExperimentsContext } from "../store/experiments-context";
import { extractHeatmapData } from "../utils/data/experiments";
import { CircleIcon, TriangleIcon } from "./UI/icons";
import { ChartModeType } from "../views/Predictions";

export type ModeType = "Baseline" | "Comparison";
type HeatmapData = { x: string; y: string; value: number }[];

interface Props {
  mode: ModeType;
  datasetMode: string;
  chartMode: Exclude<ChartModeType, "bubble">;
  isExpanded: boolean;
}

export default function PredictionChart({
  mode,
  datasetMode,
  chartMode,
  isExpanded,
}: Props) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);
  const { baselineExperiment, comparisonExperiment } =
    useContext(ExperimentsContext);

  const fontSize = isExpanded ? "16px" : "13px";
  const isBaseline = mode === "Baseline";
  const id = isBaseline ? baseline : comparison;

  const distributionData: HeatmapData = extractHeatmapData(
    datasetMode,
    chartMode,
    isBaseline ? baselineExperiment : comparisonExperiment
  );

  return (
    <div
      className={`-mt-1.5 ${
        mode === "Comparison" ? (isExpanded ? "-ml-16" : "-ml-14") : ""
      }`}
    >
      <div className="flex flex-col items-center">
        <div className="flex items-center ml-[42px]">
          {isBaseline ? (
            <CircleIcon className="w-3 h-3" />
          ) : (
            <TriangleIcon className="w-3 h-3" />
          )}
          <span className="text-[15px] text-nowrap ml-1">
            {mode} Model {id !== "" ? `(${id})` : ""}
          </span>
        </div>
        <div
          className={`flex flex-col items-center ${isBaseline ? "z-10" : ""}`}
        >
          <Heatmap
            mode={mode}
            isExpanded={isExpanded}
            chartMode={chartMode}
            data={distributionData}
          />
          <span
            style={{ fontSize, bottom: isExpanded ? 8 : 0 }}
            className="absolute font-extralight bottom-0 ml-14"
          >
            Prediction
          </span>
        </div>
      </div>
    </div>
  );
}
