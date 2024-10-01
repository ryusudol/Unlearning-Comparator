import * as d3 from "d3";

import BubbleLegend from "../components/BubbleLegend";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  Target02Icon,
  ZoomInAreaIcon,
  ChartBubble02Icon,
  RectangularIcon,
  NeuralNetworkIcon,
  GitCompareIcon,
} from "../components/ui/icons";

const sizeScale = d3.scaleSqrt().domain([0, 100]).range([0, 12.5]).nice();

interface Props {
  height: number;
}

export default function Predictions({ height }: Props) {
  return (
    <section
      style={{ height: `${height}px` }}
      className="w-[480px] p-[5px] flex flex-col border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]"
    >
      <div className="flex justify-between">
        <div className="flex items-center">
          <div className="flex items-center">
            <Target02Icon />
            <h5 className="font-semibold ml-[3px] mr-5">Predictions</h5>
          </div>
          <div className="flex items-center">
            <ChartBubble02Icon className="cursor-pointer scale-90" />
            <div className="relative cursor-pointer ml-[1px]">
              <RectangularIcon className="rotate-90 scale-90" />
              <span className="absolute text-[9px] top-[1.5px] right-[6px]">
                L
              </span>
            </div>
            <div className="relative cursor-pointer mx-[1px]">
              <RectangularIcon className="rotate-90 scale-90" />
              <span className="absolute text-[9px] top-[2px] right-[5.5px]">
                R
              </span>
            </div>
            <ZoomInAreaIcon className="cursor-pointer scale-90" />
          </div>
        </div>
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
      <div className="flex justify-start items-center">
        <span className="text-[11px] font-extralight -rotate-90 -mr-6 -ml-3">
          Ground Truth
        </span>
        <div
          id="baseline-bubble-chart"
          className="flex flex-col items-center -mt-1.5 mr-1"
        >
          <div className="flex items-center">
            <NeuralNetworkIcon className="mr-[3px]" />
            <span className="text-[15px]">Baseline Model (id01)</span>
          </div>
          <img src="/bubble.png" alt="bubble chart img" />
          <span className="text-[11px] font-extralight -mt-1">Prediction</span>
        </div>
        <div
          id="comparison-bubble-chart"
          className="flex flex-col items-center -mt-1.5"
        >
          <div className="flex items-center">
            <GitCompareIcon className="mr-[3px]" />
            <span className="text-[15px]">Comparison Model (id02)</span>
          </div>
          <img src="/bubble.png" alt="bubble chart img" />
          <span className="text-[11px] font-extralight -mt-1">Prediction</span>
        </div>
        <div className="flex flex-col items-center">
          <BubbleLegend scale={sizeScale} />
          <img src="/bubble-legend.png" alt="bubble legend img" />
        </div>
      </div>
    </section>
  );
}
