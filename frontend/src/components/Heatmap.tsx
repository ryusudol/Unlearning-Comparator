import React, { useMemo, useState, useRef } from "react";
import * as d3 from "d3";

import { CircleIcon, TriangleIcon } from "./UI/icons";

const MARGIN = {
  top: 0,
  right: 0,
  bottom: 58,
  left: 50,
};
const fontColor = "#64758B";
const WINDOW_OFFSET = 20;
const TOOLTIP_WIDTH = 100;
const TOOLTIP_OFFSET = 10;
const FONT_SIZE = 8;
const SIZE = 230;
const XLabelTransform = 8;
const boundsWidth = SIZE - MARGIN.right - MARGIN.left;
const boundsHeight = SIZE - MARGIN.top - MARGIN.bottom;

type ModeType = "Baseline" | "Comparison";

type Props = {
  mode: ModeType;
  data: { x: string; y: string; value: number }[];
  layers: string[];
};

export default function Heatmap({ mode, data, layers }: Props) {
  const [tooltip, setTooltip] = useState({
    display: false,
    x: 0,
    y: 0,
    content: {
      x: "",
      y: "",
      value: 0,
    },
  });

  const tooltipRef = useRef<HTMLDivElement>(null);

  const isBaseline = mode === "Baseline";
  const allValues = data.map((d) => d.value);

  const xScale = useMemo(() => {
    return d3.scaleBand().range([0, boundsWidth]).domain(layers);
  }, [layers]);

  const yScale = useMemo(() => {
    return d3.scaleBand().range([0, boundsHeight]).domain(layers);
  }, [layers]);

  const [min, max] = d3.extent(allValues);

  if (min === undefined || max === undefined) {
    return null;
  }

  const colorScale = d3
    .scaleSequential()
    .interpolator(d3.interpolateInferno)
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
        x: d.y,
        y: d.x,
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
      </g>
    );
  });

  const xLabels = layers.map((layer, i) => {
    const xPos = xScale(layer) ?? 0;
    return (
      <text
        key={i}
        x={xPos + xScale.bandwidth() - XLabelTransform}
        y={boundsHeight + 8}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={FONT_SIZE}
        fill={fontColor}
      >
        {i}
      </text>
    );
  });

  const yLabels = layers.map((layer, i) => {
    const yPos = yScale(layer) ?? 0;
    return (
      <text
        key={i}
        x={-4}
        y={yPos + yScale.bandwidth() / 2}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={FONT_SIZE}
        fill={fontColor}
      >
        {i}
      </text>
    );
  });

  return (
    <div
      className={`-mt-3 relative ${isBaseline ? "z-10" : "right-[44px] z-0"}`}
    >
      <div
        className={`flex items-center text-[15px] relative ${
          isBaseline ? "-right-[64px]" : "-right-[53px]"
        }`}
      >
        {isBaseline ? (
          <CircleIcon className="w-3 h-3 mr-1" />
        ) : (
          <TriangleIcon className="w-3 h-3 mr-1" />
        )}
        <span>{mode + " (Forget Class)"}</span>
      </div>
      {isBaseline && (
        <span className="text-nowrap absolute -left-[29px] top-[40%] -rotate-90 text-xs font-normal">
          Layers Before Unlearning
        </span>
      )}
      <svg width={SIZE} height={SIZE}>
        <g
          width={boundsWidth}
          height={boundsHeight}
          transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
        >
          {allRects}
          {xLabels}
          {isBaseline && yLabels}
          <text
            x={boundsWidth / 2}
            y={boundsHeight + 20}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={12}
            fill="#000"
          >
            Layers After Unlearning
          </text>
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
            <span>Before</span>:{" "}
            <span className="font-semibold">{tooltip.content.x}</span>
          </div>
          <div>
            <span>After</span>:{" "}
            <span className="font-semibold">{tooltip.content.y}</span>
          </div>
          <div>
            <span>Similarity</span>:{" "}
            <span className="font-semibold">{tooltip.content.value}</span>
          </div>
        </div>
      )}
    </div>
  );
}
