import { useState, useContext } from "react";

import DatasetModeSelector from "../components/DatasetModeSelector";
import BubbleChart from "../components/BubbleChart";
import BubbleChartLegend from "../components/BubbleChartLegend";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ForgetClassContext } from "../store/forget-class-context";
import {
  Target02Icon,
  ArrowExpandIcon,
  ArrowShrinkIcon,
} from "../components/UI/icons";

export const TRAINING = "training";
export const TEST = "test";
export const BUBBLE = "bubble";
export const LABEL_HEATMAP = "label-heatmap";
export const CONFIDENCE_HEATMAP = "confidence-heatmap";

export type ChartModeType = "bubble" | "label-heatmap" | "confidence-heatmap";
export type HeatmapData = { x: string; y: string; value: number }[];

interface Props {
  height: number;
  isExpanded: boolean;
  onExpansionClick: () => void;
}

export default function Predictions({
  height,
  isExpanded,
  onExpansionClick,
}: Props) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);
  const { selectedForgetClasses } = useContext(ForgetClassContext);

  const [datasetMode, setDatasetMode] = useState(TRAINING);

  const allSelected = baseline !== "" && comparison !== "";
  const selectedFCExist = selectedForgetClasses.length !== 0;
  const unexpandedStyle = { height };
  const expandedStyle = {
    height: `${height * 2}px`,
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
  };

  return (
    <section
      style={isExpanded ? expandedStyle : unexpandedStyle}
      className={`px-[5px] py-0.5 flex flex-col border-[1px] border-solid transition-all z-10 bg-white absolute ${
        isExpanded ? `w-[880px] right-0 top-[19px]` : `w-[440px] top-[282px]`
      }`}
    >
      <div className="flex justify-between">
        <div className="flex items-center">
          <div className="flex items-center mr-2">
            <Target02Icon />
            <h5 className="font-semibold ml-1 text-lg">Predictions</h5>
          </div>
          {allSelected && (
            <div className="flex items-center">
              {isExpanded ? (
                <div
                  onClick={onExpansionClick}
                  className="flex items-center cursor-pointer border-[1px] border-[#585858] rounded-sm pl-1 pr-[5px] py-[1px] transition hover:bg-gray-200"
                >
                  <ArrowShrinkIcon className="cursor-pointer scale-90 hover:bg-gray-200 rounded-sm" />
                  <span className="text-xs">Collapse View</span>
                </div>
              ) : (
                <div
                  onClick={onExpansionClick}
                  className="flex items-center cursor-pointer border-[1px] border-[#585858] rounded-sm pl-1 pr-[5px] py-[1px] transition hover:bg-gray-200"
                >
                  <ArrowExpandIcon className="scale-[80%] mr-0.5" />
                  <span className="text-xs">Expand View</span>
                </div>
              )}
            </div>
          )}
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
            <BubbleChart
              mode="Baseline"
              datasetMode={datasetMode}
              isExpanded={isExpanded}
            />
            <BubbleChart
              mode="Comparison"
              datasetMode={datasetMode}
              isExpanded={isExpanded}
              showYAxis={false}
            />
            <BubbleChartLegend isExpanded={isExpanded} />
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
