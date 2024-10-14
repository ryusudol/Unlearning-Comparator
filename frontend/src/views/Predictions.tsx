import { useContext } from "react";
import * as d3 from "d3";

import BubbleLegend from "../components/BubbleLegend";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  Target02Icon,
  ZoomInAreaIcon,
  ChartBubble02Icon,
  RectangularIcon,
  NeuralNetworkIcon,
  GitCompareIcon,
  ArrowExpandIcon,
  ArrowUpRight01Icon,
} from "../components/ui/icons";

const sizeScale = d3.scaleSqrt().domain([0, 100]).range([0, 12.5]).nice();

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

  const expandedStyle = { height: `${height * 2}px` };
  const unexpandedStyle = { height: `${height}px` };

  return (
    <section
      style={isExpanded ? expandedStyle : unexpandedStyle}
      className={`px-[5px] py-0.5 flex flex-col border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] transition-all z-10 bg-white absolute ${
        isExpanded ? `w-[960px] right-0` : `w-[480px]`
      }`}
    >
      <div className="flex justify-between">
        <div className="flex items-center">
          {/* Title */}
          <div className="flex items-center mr-2">
            <Target02Icon />
            <h5 className="font-semibold ml-[3px]">Predictions</h5>
          </div>
          {/* Icons */}
          <div className="flex items-center">
            <ChartBubble02Icon className="cursor-pointer scale-90" />
            <div className="relative cursor-pointer ml-[1px]">
              <RectangularIcon className="rotate-90 scale-90" />
              <span className="absolute text-[9px] top-[1px] right-[6px]">
                L
              </span>
            </div>
            <div className="relative cursor-pointer mx-[1px]">
              <RectangularIcon className="rotate-90 scale-90" />
              <span className="absolute text-[9px] top-[1px] right-[5.5px]">
                C
              </span>
            </div>
            <ZoomInAreaIcon className="cursor-pointer scale-90" />
          </div>
        </div>
        {/* Dataset Selector */}
        <div className="flex items-center">
          <span className="text-xs font-light mr-2">Dataset:</span>
          <RadioGroup className="flex" defaultValue="training">
            <div className="flex items-center space-x-[2px]">
              <RadioGroupItem value="training" id="training" />
              <Label className="text-xs font-light" htmlFor="training">
                Training
              </Label>
            </div>
            <div className="flex items-center space-x-[2px]">
              <RadioGroupItem value="test" id="test" />
              <Label className="text-xs font-light" htmlFor="test">
                Test
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      {/* Charts */}
      <div
        className={`flex justify-start items-center ${
          isExpanded ? "mt-2" : "mt-0"
        }`}
      >
        <span
          className={`font-extralight -rotate-90 -mr-5 -ml-4 ${
            isExpanded ? "text-base" : "text-[11px]"
          }`}
        >
          Ground Truth
        </span>
        {/* Bubble Chart 1 */}
        <div className="flex flex-col items-center -mt-[3px] mr-2">
          <div className="flex items-center ml-4">
            <NeuralNetworkIcon className="mr-[3px]" />
            <span className="text-[15px]">Baseline Model ({baseline})</span>
          </div>
          <img
            src="/bubble.png"
            alt="bubble chart img"
            style={{
              height: isExpanded ? "420px" : "195px",
              marginRight: isExpanded ? "10px" : "0",
            }}
          />
          <span
            style={{ fontSize: isExpanded ? "16px" : "11px" }}
            className="text-[11px] font-extralight -mt-[5px]"
          >
            Prediction
          </span>
        </div>
        {/* Bubble Chart 2 */}
        <div className="flex flex-col items-center -mt-[3px]">
          <div className="flex items-center ml-4">
            <GitCompareIcon className="mr-[3px]" />
            <span className="text-[15px]">Comparison Model ({comparison})</span>
          </div>
          <img
            src="/bubble.png"
            alt="bubble chart img"
            style={{ height: isExpanded ? "390px" : "195px" }}
          />
          <span
            style={{ fontSize: isExpanded ? "16px" : "11px" }}
            className="text-[11px] font-extralight -mt-[5px]"
          >
            Prediction
          </span>
        </div>
        {/* Legend */}
        <div
          className={`flex flex-col items-center ${
            isExpanded ? "ml-3" : "ml-1"
          }`}
        >
          <BubbleLegend scale={sizeScale} />
          <img src="/bubble-legend.png" alt="bubble legend img" />
        </div>
      </div>
      <div
        onClick={onExpansionClick}
        className="absolute left-1 bottom-1 border-[1px] border-gray-400 rounded-md cursor-pointer transition hover:bg-[#F1F1F0]"
      >
        {isExpanded ? (
          <ArrowUpRight01Icon />
        ) : (
          <ArrowExpandIcon className="scale-75" />
        )}
      </div>
    </section>
  );
}
