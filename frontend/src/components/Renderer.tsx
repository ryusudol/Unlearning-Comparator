import { useMemo } from "react";
import * as d3 from "d3";

import { RendererProps } from "../types/archives";

const MARGIN = { top: 15, right: 100, bottom: 15, left: 135 };

export const Renderer = ({
  width,
  height,
  data,
  setHoveredCell,
}: RendererProps) => {
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

  const [min = 0, max = 0] = d3.extent(data.map((d) => d.value));

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

  const luminanceScale = d3.scaleLinear().domain([min, max]).range([0.2, 0.9]);

  const allShapes = data.map((d, i) => {
    const x = xScale(d.x);
    const y = yScale(d.y);

    if (d.value === null || !x || !y) return null;

    const luminance = luminanceScale(d.value);
    const cellColor = d3.interpolateGreys(luminance);

    return (
      <rect
        key={i}
        onMouseEnter={() => {
          setHoveredCell({
            xLabel: d.x,
            yLabel: d.y,
            xPos: x + xScale.bandwidth() + MARGIN.left,
            yPos: y + xScale.bandwidth() / 2 + MARGIN.top,
            value: Math.round(d.value * 100) / 100,
          });
        }}
        onMouseLeave={() => setHoveredCell(null)}
        cursor="pointer"
        r={4}
        x={xScale(d.x)}
        y={yScale(d.y)}
        width={xScale.bandwidth()}
        height={yScale.bandwidth()}
        opacity={1}
        fill={cellColor}
        stroke="white"
      />
    );
  });

  const xLabels = allXGroups.map((name, i) => {
    const x = xScale(name);

    if (!x) return null;

    return (
      <text
        key={i}
        x={x + xScale.bandwidth() / 2}
        y={-8}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={10}
      >
        {name}
      </text>
    );
  });

  const yLabels = allYGroups.reverse().map((name, i) => {
    const y = yScale(name);

    if (!y) return null;

    return (
      <text
        key={i}
        x={-5}
        y={y + yScale.bandwidth() / 2}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={10}
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
