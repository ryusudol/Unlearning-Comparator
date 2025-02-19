import { useState } from "react";

import View from "../components/View";
import Title from "../components/Title";
// import DatasetModeSelector from "../components/DatasetModeSelector";
import BubbleChart from "../components/Predictions/BubbleChart";
import Indicator from "../components/Indicator";
import { useForgetClass } from "../hooks/useForgetClass";
import { useModelSelection } from "../hooks/useModelSelection";
import { ViewProps } from "../types/common";
import { ShortArrow, LongArrow } from "../components/UI/icons";
import { TRAIN } from "../constants/common";
import { bubbleColorScale } from "../constants/colors";

export default function Predictions({ width, height }: ViewProps) {
  const { areAllModelsSelected } = useModelSelection();
  const { forgetClassExist } = useForgetClass();

  const [datasetMode, setDatasetMode] = useState(TRAIN);
  const [hoveredY, setHoveredY] = useState<number | null>(null);

  return (
    <View width={width} height={height}>
      <div className="flex justify-between">
        <Title title="Prediction" customClass="bottom-[2px] right-[1px]" />
        {/* {forgetClassExist && areAllModelsSelected && (
          <DatasetModeSelector onValueChange={setDatasetMode} />
        )} */}
      </div>
      {forgetClassExist ? (
        !areAllModelsSelected ? (
          <Indicator about="BaselineComparison" />
        ) : (
          <div className="flex items-center relative ml-1.5 top-5">
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
        <Indicator about="ForgetClass" />
      )}
      {areAllModelsSelected && forgetClassExist && <BubbleChartLegend />}
    </View>
  );
}

//Components
function BubbleChartLegend() {
  return (
    <div className="flex items-center absolute top-1.5 left-1/2 -translate-x-[50%] gap-11 text-[#666666]">
      <div
        className="grid grid-cols-3 gap-x-2 place-items-center relative left-2.5 text-[10px]"
        style={{ gridTemplateRows: "18px 14px" }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[#666666]" />
        <div className="w-3 h-3 rounded-full bg-[#666666]" />
        <div className="w-[18px] h-[18px] rounded-full bg-[#666666]" />
        <span>Less</span>
        <ShortArrow />
        <span>More</span>
        <span className="absolute top-[27px] text-[13px]">Frequent</span>
      </div>
      <div className="flex flex-col items-center gap-[2px] relative top-0.5">
        <ColorBar />
        <div className="text-nowrap flex items-center gap-2 text-[10px]">
          <span>Less</span>
          <LongArrow />
          <span>More</span>
        </div>
        <span className="absolute top-[25px] text-[13px]">Confident</span>
      </div>
    </div>
  );
}

function ColorBar() {
  const gradient = `linear-gradient(to right, ${bubbleColorScale.join(", ")})`;

  return (
    <div className="relative w-[110px] h-3">
      <div
        className="absolute w-full h-full"
        style={{ background: gradient }}
      />
      <div className="absolute -bottom-[4.5px] left-0.5">
        <span className="text-[10px] text-black">0</span>
      </div>
      <div className="absolute -bottom-[4.5px] right-0.5">
        <span className="text-[10px] text-white">1</span>
      </div>
    </div>
  );
}
