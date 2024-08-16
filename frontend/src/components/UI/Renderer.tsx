import React, { useMemo } from "react";
import * as d3 from "d3";

interface DataPoint {
  x: string;
  y: string;
  value: number;
}

interface HoveredCell {
  xLabel: string;
  yLabel: string;
  xPos: number;
  yPos: number;
  value: number;
}

interface RendererProps {
  width: number;
  height: number;
  data: DataPoint[];
  setHoveredCell: (cell: HoveredCell | null) => void;
}

const MARGIN = { top: 15, right: 100, bottom: 0, left: 135 };
const FONT_SIZE = 12;

export const Renderer: React.FC<RendererProps> = ({
  width,
  height,
  data,
  setHoveredCell,
}) => {
  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const allXGroups = useMemo(() => {
    const xSet = new Set(data.map((d) => d.x));
    return Array.from(xSet);
  }, [data]);

  const allYGroups = useMemo(() => {
    const ySet = new Set(data.map((d) => d.y));
    return Array.from(ySet);
  }, [data]);

  const [min, max] = d3.extent(data.map((d) => d.value)) as [number, number];

  const xScale = useMemo(() => {
    return d3
      .scaleBand()
      .range([0, boundsWidth])
      .domain(allXGroups)
      .padding(0.01);
  }, [allXGroups, boundsWidth]);

  const yScale = useMemo(() => {
    return d3
      .scaleBand()
      .range([0, boundsHeight])
      .domain(allYGroups)
      .padding(0.01);
  }, [allYGroups, boundsHeight]);

  const colorScale = useMemo(() => {
    return d3.scaleSequential(d3.interpolateGreys).domain([min, max]);
  }, [min, max]);

  const getContrastColor = (backgroundColor: string): string => {
    const rgb = d3.rgb(backgroundColor);
    const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return yiq >= 128 ? "black" : "white";
  };

  const allShapes = data.map((d, i) => {
    const x = xScale(d.x);
    const y = yScale(d.y);

    if (x === undefined || y === undefined) return null;

    const cellColor = colorScale(d.value);
    const textColor = getContrastColor(cellColor);

    return (
      <g key={i}>
        <rect
          onMouseEnter={() => {
            setHoveredCell({
              xLabel: d.x,
              yLabel: d.y,
              xPos: x + xScale.bandwidth() + MARGIN.left,
              yPos: y + yScale.bandwidth() / 2 + MARGIN.top,
              value: Math.round(d.value * 100) / 100,
            });
          }}
          onMouseLeave={() => setHoveredCell(null)}
          cursor="pointer"
          x={x}
          y={y}
          width={xScale.bandwidth()}
          height={yScale.bandwidth()}
          fill={cellColor}
          stroke="white"
        />
        <text
          x={x + xScale.bandwidth() / 2}
          y={y + yScale.bandwidth() / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={FONT_SIZE}
          fill={textColor}
        >
          {Math.round(d.value * 100) / 100}
        </text>
      </g>
    );
  });

  const xLabels = allXGroups.map((name, i) => {
    const x = xScale(name);
    if (x === undefined) return null;

    return (
      <text
        key={i}
        x={x + xScale.bandwidth() / 2}
        y={-10}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={FONT_SIZE}
      >
        {name}
      </text>
    );
  });

  const yLabels = allYGroups.map((name, i) => {
    const y = yScale(name);
    if (y === undefined) return null;

    return (
      <text
        key={i}
        x={-8}
        y={y + yScale.bandwidth() / 2}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={FONT_SIZE}
      >
        {name}
      </text>
    );
  });

  return (
    <svg width={width} height={height}>
      <g
        width={boundsWidth}
        height={boundsHeight}
        transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
      >
        {allShapes}
        {xLabels}
        {yLabels}
      </g>
    </svg>
  );
};
