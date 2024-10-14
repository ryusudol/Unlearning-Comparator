import { useMemo, useContext } from "react";
import * as d3 from "d3";

import { forgetClassNames } from "../constants/forgetClassNames";
import { ForgetClassContext } from "../store/forget-class-context";

const MARGIN = { top: 10, right: 10, bottom: 46, left: 46 };

type Props = {
  length: number;
  data: { x: string; y: string; value: number }[];
};

export default function Heatmap({ length, data }: Props) {
  const { forgetClass } = useContext(ForgetClassContext);

  const boundsWidth = length - MARGIN.right - MARGIN.left;
  const boundsHeight = length - MARGIN.top - MARGIN.bottom;
  const allValues = data.map((d) => d.value);

  const xScale = useMemo(() => {
    return d3.scaleBand().range([0, boundsWidth]).domain(forgetClassNames);
  }, [boundsWidth]);

  const yScale = useMemo(() => {
    return d3.scaleBand().range([boundsHeight, 0]).domain(forgetClassNames);
  }, [boundsHeight]);

  const [min, max] = d3.extent(allValues);

  if (min === undefined || max === undefined) {
    return null;
  }

  const colorScale = d3
    .scaleSequential()
    .interpolator(d3.interpolateViridis)
    .domain([min, max]);

  const allRects = data.map((d, i) => {
    return (
      <rect
        key={i}
        x={xScale(d.x)}
        y={yScale(d.y)}
        width={xScale.bandwidth()}
        height={yScale.bandwidth()}
        fill={colorScale(d.value)}
      />
    );
  });

  const xLabels = forgetClassNames.map((name, i) => {
    const xPos = xScale(name) ?? 0;
    const isForgetClass = forgetClass === name;
    return (
      <text
        key={i}
        x={
          isForgetClass
            ? xPos + xScale.bandwidth() - 3
            : xPos + xScale.bandwidth()
        }
        y={boundsHeight + 10}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={isForgetClass ? "24px" : "10px"}
        transform={
          isForgetClass
            ? ""
            : `rotate(-90, ${xPos + xScale.bandwidth() / 2}, ${
                boundsHeight + 10
              })`
        }
        style={{ fill: isForgetClass ? "#000000" : "#64758B" }}
        fontWeight={isForgetClass ? 700 : 400}
      >
        {isForgetClass ? "×" : name}
      </text>
    );
  });

  const yLabels = forgetClassNames.map((name, i) => {
    const yPos = yScale(name) ?? 0;
    const isForgetClass = forgetClass === name;
    return (
      <text
        key={i}
        x={-1.5}
        y={yPos + yScale.bandwidth() / 2}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={isForgetClass ? "24px" : "10px"}
        style={{ fill: isForgetClass ? "#000000" : "#64758B" }}
        fontWeight={isForgetClass ? 700 : 400}
      >
        {isForgetClass ? "×" : name}
      </text>
    );
  });

  return (
    <div className="-mt-[10px]">
      <svg width={length} height={length}>
        <g
          width={boundsWidth}
          height={boundsHeight}
          transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
        >
          {allRects}
          {xLabels}
          {yLabels}
        </g>
      </svg>
    </div>
  );
}
