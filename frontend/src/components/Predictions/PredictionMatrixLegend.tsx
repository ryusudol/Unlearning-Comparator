import * as d3 from "d3";

import { Arrow } from "../UI/icons";

export default function PredictionMatrixLegend() {
  const colorScale = d3
    .scaleSequential((t) => d3.interpolateGreys(0.05 + 0.95 * t))
    .domain([0, 1]);
  const numStops = 10;
  const bubbleColorScale = Array.from({ length: numStops }, (_, i) =>
    colorScale(i / (numStops - 1))
  );
  const gradient = `linear-gradient(to right, ${bubbleColorScale.join(", ")})`;

  return (
    <div className="flex justify-center items-center gap-11 text-[#666666] mb-1">
      <div className="grid grid-cols-[1fr,auto,1fr] gap-y-1.5 place-items-center text-[11px] grid-rows-[18px_14px] relative left-[35px]">
        <div className="w-1 h-1 rounded-full bg-[#666666]" />
        <div className="w-[13px] h-[13px] rounded-full bg-[#666666]" />
        <div className="w-[18px] h-[18px] rounded-full bg-[#666666]" />
        <p className="flex flex-col items-center relative top-1">
          <span className="text-base relative top-1">Small</span>
          <span className="text-xs">Proportion</span>
        </p>
        <Arrow className="mx-4" />
        <p className="flex flex-col items-center relative top-1">
          <span className="text-base relative top-1">Large</span>
          <span className="text-xs">Proportion</span>
        </p>
      </div>

      <div className="flex flex-col items-center gap-y-1.5 relative top-0.5 left-4">
        <div className="relative top-2 w-[156px] h-3.5">
          <div
            className="w-full h-full relative top-1"
            style={{ background: gradient }}
          />
          <div className="absolute -bottom-[7.5px] left-1">
            <span className="text-[10px] text-black">0</span>
          </div>
          <div className="absolute -bottom-[7.5px] right-1">
            <span className="text-[10px] text-white">1</span>
          </div>
        </div>
        <div className="text-nowrap flex items-center gap-0 text-[11px]">
          <p className="flex flex-col items-start relative top-1 left-2">
            <span className="text-base relative top-1">Low</span>
            <span className="text-xs">Confidence</span>
          </p>
          <Arrow className="mx-2" />
          <p className="flex flex-col items-end relative top-1 right-2">
            <span className="text-base relative top-1">High</span>
            <span className="text-xs">Confidence</span>
          </p>
        </div>
      </div>
    </div>
  );
}
