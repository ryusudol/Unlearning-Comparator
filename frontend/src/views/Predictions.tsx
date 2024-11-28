import { useState, useContext } from "react";
import * as d3 from "d3";

import DatasetModeSelector from "../components/DatasetModeSelector";
import BubbleChart from "../components/BubbleChart";
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
  const [hoveredY, setHoveredY] = useState<number | null>(null);

  const allSelected = baseline !== "" && comparison !== "";
  const selectedFCExist = selectedForgetClasses.length !== 0;

  return (
    <section
      style={{ height }}
      className="w-[510px] p-1 flex flex-col border-[1px] border-solid transition-all z-10 relative"
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
          <div className="flex items-center relative ml-2">
            <BubbleChart
              mode="Baseline"
              datasetMode={datasetMode}
              hoveredY={hoveredY}
              onHover={(y) => setHoveredY(y)}
              onHoverEnd={() => setHoveredY(null)}
            />
            <BubbleChart
              mode="Comparison"
              datasetMode={datasetMode}
              showYAxis={false}
              hoveredY={hoveredY}
              onHover={(y) => setHoveredY(y)}
              onHoverEnd={() => setHoveredY(null)}
            />
          </div>
        )
      ) : (
        <div className="w-full h-full flex justify-center items-center text-[15px] text-gray-500">
          Select the target forget class first.
        </div>
      )}
      <BubbleChartLegend />
    </section>
  );
}

function BubbleChartLegend() {
  return (
    <div className="flex items-center absolute top-1.5 left-1/2 -translate-x-[58%] gap-3 text-[#666666]">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-5">
          <div className="w-1 h-1 rounded-full bg-[#666666]" />
          <div className="w-2 h-2 rounded-full bg-[#666666]" />
          <div className="w-3 h-3 rounded-full bg-[#666666]" />
        </div>
        <div className="text-nowrap flex items-center gap-2">
          <span className="text-[9px]">
            <span className="font-semibold">Less</span> Frequent
          </span>
          <span className="text-[9px]">
            <span className="font-semibold">More</span> Frequent
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center relative top-0.5">
        <ColorBar />
        <div className="text-nowrap flex items-center gap-2">
          <span className="text-[9px]">
            <span className="font-semibold">Less</span> Confident
          </span>
          <span className="text-[9px]">
            <span className="font-semibold">More</span> Confident
          </span>
        </div>
      </div>
    </div>
  );
}

const ColorBar = () => {
  const steps = 10;
  const colors = Array.from({ length: steps }, (_, i) => {
    const percent = (i / (steps - 1)) * 100;
    const color = d3.interpolateWarm(i / (steps - 1));
    return `${color} ${percent}%`;
  });

  const gradient = `linear-gradient(to right, ${colors.join(", ")})`;

  return <div className="w-16 h-2" style={{ background: gradient }} />;
};
