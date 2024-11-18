import { useState, useContext } from "react";

import DatasetModeSelector from "../components/DatasetModeSelector";
import BubbleChart from "../components/BubbleChart";
import BubbleChartLegend from "../components/BubbleChartLegend";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ForgetClassContext } from "../store/forget-class-context";
import { Target02Icon } from "../components/UI/icons";

export const TRAINING = "training";
export const TEST = "test";
export const BUBBLE = "bubble";
export const LABEL_HEATMAP = "label-heatmap";
export const CONFIDENCE_HEATMAP = "confidence-heatmap";

export type ChartModeType = "bubble" | "label-heatmap" | "confidence-heatmap";
export type HeatmapData = { x: string; y: string; value: number }[];

export default function Predictions({ height }: { height: number }) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);
  const { selectedForgetClasses } = useContext(ForgetClassContext);

  const [datasetMode, setDatasetMode] = useState(TRAINING);

  const allSelected = baseline !== "" && comparison !== "";
  const selectedFCExist = selectedForgetClasses.length !== 0;

  return (
    <section
      style={{ height }}
      className="px-[5px] py-0.5 flex flex-col border-[1px] border-solid transition-all z-10 bg-white absolute w-[440px] top-[282px]"
    >
      <div className="flex justify-between">
        <div className="flex items-center mr-2">
          <Target02Icon />
          <h5 className="font-semibold ml-1 text-lg">Predictions</h5>
        </div>
        {allSelected && <DatasetModeSelector onValueChange={setDatasetMode} />}
      </div>
      {selectedFCExist ? (
        !allSelected ? (
          <div className="w-full h-full flex justify-center items-center text-[15px] text-gray-500">
            Select both Baseline and Comparison.
          </div>
        ) : (
          <div className="flex items-center relative -top-0.5">
            <BubbleChart mode="Baseline" datasetMode={datasetMode} />
            <BubbleChart
              mode="Comparison"
              datasetMode={datasetMode}
              showYAxis={false}
            />
            <BubbleChartLegend />
          </div>
        )
      ) : (
        <div className="w-full h-full flex justify-center items-center text-[15px] text-gray-500">
          Select the target forget class first.
        </div>
      )}
    </section>
  );
}
