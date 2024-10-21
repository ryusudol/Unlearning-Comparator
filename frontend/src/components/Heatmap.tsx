import { useMemo, useContext, useState, useRef } from "react";
import * as d3 from "d3";

import { ChartModeType } from "../views/Predictions";
import { forgetClassNames } from "../constants/forgetClassNames";
import { ForgetClassContext } from "../store/forget-class-context";
import { ModeType } from "./PredictionChart";

const MARGIN = { top: 10, right: 10, bottom: 52, left: 52 };
const fontColor = "#64758B";
const fontSize = 11;

const WINDOW_OFFSET = 20;
const TOOLTIP_WIDTH = 100;
const TOOLTIP_OFFSET = 10;

type Props = {
  mode: ModeType;
  length: number;
  chartMode: Exclude<ChartModeType, "bubble">;
  data: { x: string; y: string; value: number }[];
};

export default function Heatmap({ mode, length, chartMode, data }: Props) {
  const { forgetClass } = useContext(ForgetClassContext);

  const [tooltip, setTooltip] = useState({
    display: false,
    x: 0,
    y: 0,
    content: {
      groundTruth: "",
      prediction: "",
      value: 0,
    },
  });

  const tooltipRef = useRef<HTMLDivElement>(null);

  const boundsWidth = length - MARGIN.right - MARGIN.left;
  const boundsHeight = length - MARGIN.top - MARGIN.bottom;
  const allValues = data.map((d) => d.value);
  const valueName = chartMode === "label-heatmap" ? "Ratio" : "Confidence";

  const xScale = useMemo(() => {
    return d3.scaleBand().range([0, boundsWidth]).domain(forgetClassNames);
  }, [boundsWidth]);

  const yScale = useMemo(() => {
    return d3.scaleBand().range([0, boundsHeight]).domain(forgetClassNames);
  }, [boundsHeight]);

  const [min, max] = d3.extent(allValues);

  if (min === undefined || max === undefined) {
    return null;
  }

  const colorScale = d3
    .scaleSequential()
    .interpolator(d3.interpolateViridis)
    .domain([min, max]);

  const handleMouseEnter = (
    event: React.MouseEvent<SVGRectElement, MouseEvent>,
    d: { x: string; y: string; value: number }
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const tooltipWidth = tooltipRef.current?.offsetWidth || TOOLTIP_WIDTH;
    let xPos = rect.right + TOOLTIP_OFFSET;
    let yPos = rect.top + rect.height / 2;

    if (xPos + tooltipWidth > window.innerWidth - WINDOW_OFFSET)
      xPos = rect.left - tooltipWidth;

    setTooltip({
      display: true,
      x: xPos,
      y: yPos,
      content: {
        groundTruth: d.y,
        prediction: d.x,
        value: d.value,
      },
    });
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({
      ...prev,
      display: false,
    }));
  };

  const allRects = data.map((d, i) => {
    return (
      <rect
        key={i}
        x={xScale(d.x)}
        y={yScale(d.y)}
        width={xScale.bandwidth()}
        height={yScale.bandwidth()}
        fill={colorScale(d.value)}
        onMouseEnter={(event) => handleMouseEnter(event, d)}
        onMouseLeave={handleMouseLeave}
      />
    );
  });

  const xLabels = forgetClassNames.map((name, i) => {
    const xPos = xScale(name) ?? 0;
    const isForgetClass = forgetClassNames[forgetClass] === name;
    return (
      <text
        key={i}
        x={xPos + xScale.bandwidth() - 8}
        y={boundsHeight + 6}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={fontSize}
        fill={fontColor}
        transform={`rotate(-45, ${xPos + xScale.bandwidth() / 2}, ${
          boundsHeight + 6
        })`}
      >
        {isForgetClass ? name + " (X)" : name}
      </text>
    );
  });

  const yLabels = forgetClassNames.map((name, i) => {
    const yPos = yScale(name) ?? 0;
    const isForgetClass = forgetClassNames[forgetClass] === name;
    return (
      <text
        key={i}
        x={-4}
        y={yPos + yScale.bandwidth() / 2}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={fontSize}
        fill={fontColor}
      >
        {isForgetClass ? name + " (X)" : name}
      </text>
    );
  });

  return (
    <div className="-mt-[10px]" style={{ position: "relative" }}>
      <svg width={length} height={length}>
        <g
          width={boundsWidth}
          height={boundsHeight}
          transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
        >
          {allRects}
          {xLabels}
          {mode === "Baseline" && yLabels}
        </g>
      </svg>
      {tooltip.display && (
        <div
          ref={tooltipRef}
          className={`w-auto h-auto bg-white px-1.5 py-1 whitespace-nowrap rounded-lg text-[#333] text-sm z-10 border border-border/50 shadow-xl transition-all duration-500 ease-in-out ${
            tooltip.display ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        >
          <div>
            <span className="font-semibold">Ground Truth</span>:{" "}
            {tooltip.content.groundTruth}
          </div>
          <div>
            <span className="font-semibold">Prediction</span>:{" "}
            {tooltip.content.prediction}
          </div>
          <div>
            <span className="font-semibold">{valueName}</span>:{" "}
            {tooltip.content.value}
          </div>
        </div>
      )}
    </div>
  );
}
