import * as d3 from "d3";

export default function DualMetricsLegend() {
  const steps = 7;
  const orangeColors = Array.from({ length: steps + 1 }, (_, i) =>
    d3.interpolateOranges(i / steps)
  );
  const forgettingQualityGradient = `linear-gradient(to right, ${orangeColors.join(
    ", "
  )})`;

  return (
    <div className="w-[530px] flex items-center gap-2 relative bottom-0.5 right-0">
      <div className="w-full">
        <h3 className="text-xs text-gray-800 font-medium">Accuracy</h3>
        <div className="relative h-[15px]">
          <div
            className="w-full h-full relative"
            style={{
              background:
                "linear-gradient(to right, #f7fcf5, #e5f5e0, #c7e9c0, #a1d99b, #74c476, #41ab5d, #238b45, #006d2c)",
            }}
          >
            <span className="absolute left-1 text-[10px] text-gray-700 top-1/2 -translate-y-1/2">
              Worst
            </span>
            <span className="absolute right-1 text-[10px] text-white top-1/2 -translate-y-1/2">
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
            style={{
              background:
                "linear-gradient(to right, #f7fbff, #deebf7, #c6dbef, #9ecae1, #6baed6, #4292c6, #2171b5, #08519c)",
            }}
          >
            <span className="absolute left-1 text-[10px] text-gray-700 top-1/2 -translate-y-1/2">
              Worst
            </span>
            <span className="absolute right-1 text-[10px] text-white top-1/2 -translate-y-1/2">
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
            <span className="absolute left-1 text-[10px] text-gray-700 top-1/2 -translate-y-1/2">
              Worst
            </span>
            <span className="absolute right-1 text-[10px] text-white top-1/2 -translate-y-1/2">
              Best
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
