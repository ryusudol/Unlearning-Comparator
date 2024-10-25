import BubbleChart from "../components/BubbleChart";
import Heatmap from "../components/Heatmap";
import { BUBBLE, ChartModeType } from "../views/Predictions";

export type ModeType = "Baseline" | "Comparison";
type HeatmapData = { x: string; y: string; value: number }[];

interface Props {
  mode: ModeType;
  id: string;
  data: HeatmapData;
  chartMode: ChartModeType;
  isExpanded: boolean;
}

export default function PredictionChart({
  mode,
  id,
  data,
  chartMode,
  isExpanded,
}: Props) {
  const fontSize = isExpanded ? "16px" : "13px";

  return (
    <div
      className={`-mt-1.5 ${
        chartMode !== BUBBLE && mode === "Comparison" ? "-ml-14" : ""
      }`}
    >
      {chartMode === BUBBLE ? (
        <BubbleChart mode={mode} id={id} isExpanded={isExpanded} />
      ) : (
        <div className="flex flex-col items-center">
          <div className="flex items-center ml-[42px]">
            <span className="text-[17px] text-nowrap">
              {mode} Model {id !== "" ? `(${id})` : ""}
            </span>
          </div>
          <div
            className={`flex flex-col items-center ${
              mode === "Baseline" ? "z-10" : ""
            }`}
          >
            <Heatmap
              mode={mode}
              length={250}
              chartMode={chartMode as Exclude<ChartModeType, "bubble">}
              data={data}
            />
            <span
              style={{ fontSize }}
              className="absolute font-extralight bottom-0 ml-14"
            >
              Prediction
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
