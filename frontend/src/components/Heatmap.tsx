import { useMemo, useContext, useState, useRef } from "react";
import * as d3 from "d3";

import { ChartModeType } from "../views/Predictions";
import { forgetClassNames } from "../constants/forgetClassNames";
import { ForgetClassContext } from "../store/forget-class-context";
import { ModeType } from "./PredictionChart";

const fontColor = "#64758B";
const WINDOW_OFFSET = 20;
const TOOLTIP_WIDTH = 100;
const TOOLTIP_OFFSET = 10;

type Props = {
  mode: ModeType;
  isExpanded: boolean;
  chartMode: Exclude<ChartModeType, "bubble">;
  data: { x: string; y: string; value: number }[];
};

export default function Heatmap({ mode, isExpanded, chartMode, data }: Props) {
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

  const MARGIN = {
    top: 10,
    right: 10,
    bottom: isExpanded ? 50 : 52,
    left: isExpanded ? 62 : 52,
  };
  const fontSize = isExpanded ? 13 : 11;
  const XLabelTransform = isExpanded ? 24 : 8;
  const length = isExpanded ? 490 : 250;
  const boundsWidth = length - MARGIN.right - MARGIN.left;
  const boundsHeight = length - MARGIN.top - MARGIN.bottom;
  const allValues = data.map((d) => d.value);
  const valueName =
    chartMode === "label-heatmap" ? "Proportion" : "Confidence Score";

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
    event: React.MouseEvent<SVGGElement, MouseEvent>,
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
    const textColor = d.value >= 0.75 ? "#000000" : "#FFFFFF";

    return (
      <g
        key={i}
        onMouseEnter={(event) => handleMouseEnter(event, d)}
        onMouseLeave={handleMouseLeave}
      >
        <rect
          x={xScale(d.x)}
          y={yScale(d.y)}
          width={xScale.bandwidth()}
          height={yScale.bandwidth()}
          fill={colorScale(d.value)}
        />
        {isExpanded && (
          <text
            x={(xScale(d.x) ?? 0) + xScale.bandwidth() / 2}
            y={(yScale(d.y) ?? 0) + yScale.bandwidth() / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={14}
            fill={textColor}
          >
            {d.value.toFixed(3)}
          </text>
        )}
      </g>
    );
  });

  const xLabels = forgetClassNames.map((name, i) => {
    const xPos = xScale(name) ?? 0;
    const isForgetClass = forgetClass && forgetClassNames[forgetClass] === name;
    return (
      <text
        key={i}
        x={xPos + xScale.bandwidth() - XLabelTransform}
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
    const isForgetClass = forgetClass && forgetClassNames[forgetClass] === name;
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
            <span>Ground Truth</span>:{" "}
            <span className="font-semibold">{tooltip.content.groundTruth}</span>
          </div>
          <div>
            <span>Prediction</span>:{" "}
            <span className="font-semibold">{tooltip.content.prediction}</span>
          </div>
          <div>
            <span>{valueName}</span>:{" "}
            <span className="font-semibold">{tooltip.content.value}</span>
          </div>
        </div>
      )}
    </div>
  );
}
