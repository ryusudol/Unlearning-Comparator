import * as d3 from "d3";

const CONFIG = {
  COLOR_TEMPERATURE_LOW: 0.03,
  COLOR_TEMPERATURE_HIGH: 0.77,
} as const;

export default function DualMetricsLegend() {
  const greenScale = d3
    .scaleSequential((t) =>
      d3.interpolateGreens(
        CONFIG.COLOR_TEMPERATURE_LOW + CONFIG.COLOR_TEMPERATURE_HIGH * t
      )
    )
    .domain([0, 1]);
  const accuracyGradient = `linear-gradient(to right, ${greenScale(
    0
  )} 0%, ${greenScale(1)} 100%)`;

  const blueScale = d3
    .scaleSequential((t) =>
      d3.interpolateBlues(
        CONFIG.COLOR_TEMPERATURE_LOW + CONFIG.COLOR_TEMPERATURE_HIGH * t
      )
    )
    .domain([0, 1]);
  const efficiencyGradient = `linear-gradient(to right, ${blueScale(
    0
  )} 0%, ${blueScale(1)} 100%)`;

  const orangeScale = d3
    .scaleSequential((t) =>
      d3.interpolateOranges(
        CONFIG.COLOR_TEMPERATURE_LOW + CONFIG.COLOR_TEMPERATURE_HIGH * t
      )
    )
    .domain([0, 1]);
  const forgettingQualityGradient = `linear-gradient(to right, ${orangeScale(
    0
  )} 0%, ${orangeScale(1)} 100%)`;

  return (
    <div className="w-[530px] flex items-center gap-2 relative bottom-0.5 right-0">
      <div className="w-full">
        <h3 className="text-xs text-gray-800 font-medium">Accuracy</h3>
        <div className="relative h-[15px]">
          <div
            className="w-full h-full relative"
            style={{ background: accuracyGradient }}
          >
            <span className="absolute left-1 text-[10px] text-gray-700 top-2 -translate-y-1/2">
              Worst
            </span>
            <span className="absolute right-1 text-[10px] text-white top-2 -translate-y-1/2">
              Best
            </span>
          </div>
        </div>
      </div>
      <div className="w-full">
        <h3 className="text-xs text-gray-800 font-medium">Efficiency</h3>
        <div className="relative h-[15px]">
          <div
            className="w-full h-full relative"
            style={{ background: efficiencyGradient }}
          >
            <span className="absolute left-1 text-[10px] text-gray-700 top-2 -translate-y-1/2">
              Worst
            </span>
            <span className="absolute right-1 text-[10px] text-white top-2 -translate-y-1/2">
              Best
            </span>
          </div>
        </div>
      </div>
      <div className="w-full">
        <h3 className="text-xs text-gray-800 font-medium">
          Forgetting Quality
        </h3>
        <div className="relative h-[15px]">
          <div
            className="w-full h-full relative"
            style={{ background: forgettingQualityGradient }}
          >
            <span className="absolute left-1 text-[10px] text-gray-700 top-2 -translate-y-1/2">
              0
            </span>
            <span className="absolute right-1 text-[10px] text-white top-2 -translate-y-1/2">
              1
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
