import { useContext, useEffect, useRef } from "react";
import * as d3 from "d3";

import { CircleIcon, TriangleIcon } from "./UI/icons";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ForgetClassContext } from "../store/forget-class-context";
import { ExperimentsContext } from "../store/experiments-context";
import { extractBubbleChartData } from "../utils/data/experiments";
import { forgetClassNames } from "../constants/forgetClassNames";

const TOTAL_SIZE = 225;
const MIN_BUBBLE_SIZE = 10;
const MAX_BUBBLE_SIZE = 58;

type ModeType = "Baseline" | "Comparison";

interface Props {
  mode: ModeType;
  datasetMode: string;
  showYAxis?: boolean;
}

export default function BubbleChart({
  mode,
  datasetMode,
  showYAxis = true,
}: Props) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);
  const { forgetClass } = useContext(ForgetClassContext);
  const { baselineExperiment, comparisonExperiment } =
    useContext(ExperimentsContext);

  const svgRef = useRef<SVGSVGElement>(null);

  const isBaseline = mode === "Baseline";
  const id = isBaseline ? baseline : comparison;
  const experiment = isBaseline ? baselineExperiment : comparisonExperiment;

  useEffect(() => {
    if (!experiment || !svgRef.current) return;

    const data = extractBubbleChartData(datasetMode, experiment);

    const margin = {
      top: 22,
      right: 0,
      bottom: 44,
      left: 64,
    };
    const width = TOTAL_SIZE - margin.left - margin.right;
    const height = TOTAL_SIZE - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", TOTAL_SIZE)
      .attr("height", TOTAL_SIZE)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([-0.5, 9.5]).range([0, width]);

    const yScale = d3.scaleLinear().domain([-0.5, 9.5]).range([0, height]);

    const colorScale = d3
      .scaleSequential()
      .domain([0, 1])
      .interpolator(d3.interpolateViridis);

    const sizeScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([MIN_BUBBLE_SIZE, MAX_BUBBLE_SIZE]);

    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(d3.range(0, 10))
      .tickSize(0)
      .tickFormat((d) => forgetClassNames[d as number]);

    const yAxis = d3
      .axisLeft(yScale)
      .tickValues(d3.range(0, 10))
      .tickSize(0)
      .tickPadding(0)
      .tickFormat((d) =>
        d === forgetClass
          ? forgetClassNames[d as number] + "(X)"
          : forgetClassNames[d as number]
      );

    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .call((g) => {
        g.select(".domain").attr("stroke", "#000").attr("stroke-width", 1);
        g.selectAll(".tick text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end")
          .style("font-family", "Roboto Condensed")
          .attr("dx", "-.8em")
          .attr("dy", ".15em");
      });

    if (showYAxis) {
      svg
        .append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .call((g) => {
          g.select(".domain").attr("stroke", "#000").attr("stroke-width", 1);
          g.selectAll(".tick text")
            .attr("dx", "-.5em")
            .style("font-family", "Roboto Condensed");
        });
    } else {
      svg
        .append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .call((g) => {
          g.select(".domain").attr("stroke", "#000").attr("stroke-width", 1);
          g.selectAll(".tick text").remove();
        });
    }

    svg
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", (d) => (d.label === 0 ? 0 : Math.sqrt(sizeScale(d.label))))
      .attr("fill", (d) => colorScale(d.conf))
      .attr("opacity", 0.7)
      .append("title")
      .text(
        (d) => `Label: ${d.label.toFixed(2)}\nConfidence: ${d.conf.toFixed(2)}`
      );
  }, [datasetMode, experiment, forgetClass, showYAxis]);

  if (!experiment) return null;

  return (
    <div
      className={`flex flex-col items-center relative z-10 ${
        !showYAxis && "right-[54px] z-0"
      }`}
    >
      <div
        className={`flex items-center text-[15px] text-nowrap absolute ${
          isBaseline ? "left-[90px]" : "left-[78px]"
        }`}
      >
        {isBaseline ? (
          <CircleIcon className="w-3 h-3 mr-1" />
        ) : (
          <TriangleIcon className="w-3 h-3 mr-1" />
        )}
        <span>
          {mode} ({id})
        </span>
      </div>
      {showYAxis && (
        <span className="absolute top-[40%] left-0 font-extralight -rotate-90 text-nowrap -mx-7 text-[13px]">
          Ground Truth
        </span>
      )}
      <svg ref={svgRef}></svg>
      <span className="absolute -bottom-1 left-[calc(50%+10px)] font-extralight text-[13px]">
        Prediction
      </span>
    </div>
  );
}
