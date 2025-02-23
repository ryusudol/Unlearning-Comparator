export default function DualMetricsLegend() {
  return (
    <div className="w-[408px] flex items-center gap-1 relative bottom-0.5 mr-3">
      <div className="w-full px-2">
        <h3 className="text-xs text-gray-800 font-medium">Accuracy Metrics</h3>
        <div className="relative h-[15px]">
          <div
            className="w-full h-full relative"
            style={{
              background:
                "linear-gradient(to right, #f7fcf5, #e5f5e0, #c7e9c0, #a1d99b, #74c476, #41ab5d, #238b45, #006d2c, #00441b)",
            }}
          >
            <span className="absolute left-2 text-[10px] text-gray-700 top-1/2 -translate-y-1/2">
              Worst
            </span>
            <span className="absolute right-2 text-[10px] text-white top-1/2 -translate-y-1/2">
              Best
            </span>
          </div>
        </div>
      </div>
      <div className="w-full px-2">
        <h3 className="text-xs text-gray-800 font-medium">Utility Metrics</h3>
        <div className="relative h-[15px]">
          <div
            className="w-full h-full relative"
            style={{
              background:
                "linear-gradient(to right, #f7fbff, #deebf7, #c6dbef, #9ecae1, #6baed6, #4292c6, #2171b5, #08519c, #08306b)",
            }}
          >
            <span className="absolute left-2 text-[10px] text-gray-700 top-1/2 -translate-y-1/2">
              Worst
            </span>
            <span className="absolute right-2 text-[10px] text-white top-1/2 -translate-y-1/2">
              Best
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
