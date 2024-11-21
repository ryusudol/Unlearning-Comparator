import { useState, useContext, useEffect, useRef } from "react";
import * as d3 from "d3";

import { NeuralNetworkIcon } from "./UI/icons";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ForgetClassContext } from "../store/forget-class-context";
import { ExperimentsContext } from "../store/experiments-context";
import { extractBubbleChartData } from "../utils/data/experiments";
import { forgetClassNames } from "../constants/forgetClassNames";

const TOTAL_SIZE = 255;
const MIN_BUBBLE_SIZE = 1;
const MAX_BUBBLE_SIZE = 90;

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

  const [tooltip, setTooltip] = useState({
    display: false,
    x: 0,
    y: 0,
    content: {
      groundTruth: 0,
      prediction: 0,
      label: 0,
      conf: 0,
    },
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isBaseline = mode === "Baseline";
  const id = isBaseline ? baseline : comparison;
  const symbolStyle = isBaseline
    ? "mr-1 text-blue-500"
    : "mr-1 text-orange-500";
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
      .interpolator(d3.interpolateWarm);

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
          ? forgetClassNames[d as number] + " (X)"
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
      .on("mouseenter", (event, d: any) => {
        const rect = event.target.getBoundingClientRect();
        const tooltipWidth = tooltipRef.current?.offsetWidth || 100;

        let xPos = rect.right + 10;
        let yPos = rect.top + rect.height / 2;

        if (xPos + tooltipWidth > window.innerWidth - 20) {
          xPos = rect.left - tooltipWidth;
        }

        setTooltip({
          display: true,
          x: xPos,
          y: yPos,
          content: {
            groundTruth: d.y,
            prediction: d.x,
            label: d.label,
            conf: d.conf,
          },
        });
      })
      .on("mouseleave", () => {
        setTooltip((prev) => ({
          ...prev,
          display: false,
        }));
      });
  }, [datasetMode, experiment, forgetClass, showYAxis]);

  if (!experiment) return null;

  return (
    <div
      className={`flex flex-col items-center relative ${
        showYAxis ? "z-10" : "right-[48px] z-0"
      }`}
    >
      <div
        className={`flex items-center text-[15px] text-nowrap absolute left-1/2 -translate-x-[22%]`}
      >
        <NeuralNetworkIcon className={symbolStyle} />
        <span>
          {mode} ({id})
        </span>
      </div>
      {showYAxis && (
        <span className="absolute top-[42%] left-1 -rotate-90 text-nowrap -mx-7 text-xs">
          Ground Truth
        </span>
      )}
      <svg ref={svgRef}></svg>
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
            <span className="font-semibold">
              {forgetClassNames[tooltip.content.groundTruth]}
            </span>
          </div>
          <div>
            <span>Prediction</span>:{" "}
            <span className="font-semibold">
              {forgetClassNames[tooltip.content.prediction]}
            </span>
          </div>
          <div>
            <span>Label</span>:{" "}
            <span className="font-semibold">
              {tooltip.content.label.toFixed(3)}
            </span>
          </div>
          <div>
            <span>Confidence</span>:{" "}
            <span className="font-semibold">
              {tooltip.content.conf.toFixed(3)}
            </span>
          </div>
        </div>
      )}
      <span className="absolute -bottom-0.5 left-1/2 text-xs">Prediction</span>
    </div>
  );
}
