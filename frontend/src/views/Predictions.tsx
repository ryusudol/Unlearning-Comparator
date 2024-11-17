import { useState, useContext } from "react";
import * as d3 from "d3";

import BubbleChart from "../components/BubbleChart";
import PredictionChart from "../components/PredictionChart";
import HeatmapLegend from "../components/HeatmapLegend";
import BubbleLegend from "../components/BubbleLegend";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ForgetClassContext } from "../store/forget-class-context";
import { RadioGroup, RadioGroupItem } from "../components/UI/radio-group";
import { Label } from "../components/UI/label";
import {
  Target02Icon,
  ChartBubble02Icon,
  RectangularIcon,
  ArrowExpandIcon,
  ArrowShrinkIcon,
} from "../components/UI/icons";

export const TRAINING = "training";
export const TEST = "test";
export const BUBBLE = "bubble";
export const LABEL_HEATMAP = "label-heatmap";
export const CONFIDENCE_HEATMAP = "confidence-heatmap";
const sizeScale = d3.scaleSqrt().domain([0, 100]).range([0, 12.5]).nice();

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
  const [chartMode, setChartMode] = useState<ChartModeType>(LABEL_HEATMAP);

  const expandedStyle = {
    height: `${height * 2}px`,
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
  };
  const unexpandedStyle = { height: `${height}px` };

  const allSelected = baseline !== "" && comparison !== "";
  const selectedFCExist = selectedForgetClasses.length !== 0;

  return (
    <section
      style={isExpanded ? expandedStyle : unexpandedStyle}
      className={`px-[5px] py-0.5 flex flex-col border-[1px] border-solid transition-all z-10 bg-white absolute ${
        isExpanded ? `w-[980px] right-0 top-[19px]` : `w-[490px] top-[308px]`
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
              <ChartBubble02Icon
                onClick={() => setChartMode(BUBBLE)}
                className={`cursor-pointer scale-90 ${
                  chartMode === BUBBLE ? "text-black" : "text-gray-400"
                }`}
              />
              <div
                onClick={() => setChartMode(LABEL_HEATMAP)}
                className={`relative cursor-pointer ${
                  chartMode === LABEL_HEATMAP ? "text-black" : "text-gray-400"
                }`}
              >
                <RectangularIcon
                  className={`rotate-90 scale-90 ${
                    chartMode === LABEL_HEATMAP ? "text-black" : "text-gray-400"
                  }`}
                />
                <span className="absolute text-[9px] top-[1px] right-[5.7px]">
                  R
                </span>
              </div>
              <div
                onClick={() => setChartMode(CONFIDENCE_HEATMAP)}
                className={`relative cursor-pointer mr-3 ${
                  chartMode === CONFIDENCE_HEATMAP
                    ? "text-black"
                    : "text-gray-400"
                }`}
              >
                <RectangularIcon
                  className={`rotate-90 scale-90 ${
                    chartMode === CONFIDENCE_HEATMAP
                      ? "text-black"
                      : "text-gray-400"
                  }`}
                />
                <span className="absolute text-[9px] top-[1px] right-[5.5px]">
                  C
                </span>
              </div>
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
        {allSelected && (
          <div className="flex items-center">
            <span className="text-xs font-light mr-2">Dataset:</span>
            <RadioGroup
              onValueChange={setDatasetMode}
              className="flex"
              defaultValue={TRAINING}
            >
              <div className="flex items-center space-x-[2px]">
                <RadioGroupItem value={TRAINING} id={TRAINING} />
                <Label className="text-xs font-light" htmlFor={TRAINING}>
                  Training
                </Label>
              </div>
              <div className="flex items-center space-x-[2px]">
                <RadioGroupItem value={TEST} id={TEST} />
                <Label className="text-xs font-light" htmlFor={TEST}>
                  Test
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </div>
      {/* Charts */}
      {selectedFCExist ? (
        !allSelected ? (
          <div className="w-full h-full flex justify-center items-center text-[15px] text-gray-500">
            Select both Baseline and Comparison.
          </div>
        ) : (
          <div
            className={`flex justify-start items-center ${
              isExpanded ? "mt-2" : "mt-0"
            }`}
          >
            {chartMode !== BUBBLE && (
              <span
                className={`font-extralight -rotate-90 text-nowrap -ml-6 -mr-9 ${
                  isExpanded ? "text-base" : "text-[13px]"
                }`}
              >
                Ground Truth
              </span>
            )}
            {chartMode === BUBBLE && (
              <>
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
              </>
            )}
            {chartMode !== BUBBLE && (
              <>
                <PredictionChart
                  mode="Baseline"
                  datasetMode={datasetMode}
                  chartMode={chartMode}
                  isExpanded={isExpanded}
                />
                <PredictionChart
                  mode="Comparison"
                  datasetMode={datasetMode}
                  chartMode={chartMode}
                  isExpanded={isExpanded}
                />
              </>
            )}
            {/* Legend */}
            {chartMode === BUBBLE ? (
              <div
                className={`flex flex-col items-center ${
                  isExpanded ? "ml-3" : "ml-1"
                }`}
              >
                {/* <BubbleLegend scale={sizeScale} />
                <img src="/bubble-legend.png" alt="bubble legend img" /> */}
              </div>
            ) : (
              <HeatmapLegend isExpanded={isExpanded} />
            )}
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
