import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import * as d3 from "d3";

import {
  CIFAR_10_CLASSES,
  STROKE_CONFIG,
  FONT_CONFIG,
} from "../../constants/common";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { useModelDataStore } from "../../stores/modelDataStore";
import { calculateZoom } from "../../utils/util";
import {
  useModelAExperiment,
  useModelBExperiment,
} from "../../stores/experimentsStore";
import { extractBubbleChartData } from "../../utils/data/experiments";
import { COLORS, bubbleColorScale } from "../../constants/colors";

const CONFIG = {
  WIDTH: 252,
  HEIGHT: 230,
  MIN_BUBBLE_SIZE: 1,
  MAX_BUBBLE_SIZE: 90,
  MIN_VALUE_TO_DISPLAY: 0.002,
  CELL_SIZE: 20,
  CELL_ROUNDEDNESS: 4,
} as const;

type ModeType = "Baseline" | "Comparison";

interface Props {
  mode: ModeType;
  modelType: string;
  datasetMode: string;
  hoveredY: number | null;
  onHover: (y: number) => void;
  onHoverEnd: () => void;
  showYAxis?: boolean;
}

export default function BubbleChart({
  mode,
  modelType,
  datasetMode,
  hoveredY,
  onHover,
  onHoverEnd,
  showYAxis = true,
}: Props) {
  const { forgetClass } = useForgetClassStore();
  const { modelA, modelB } = useModelDataStore();
  const modelAExperiment = useModelAExperiment();
  const modelBExperiment = useModelBExperiment();

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

  const zoom = calculateZoom();
  const isBaseline = mode === "Baseline";
  const experiment = isBaseline ? modelAExperiment : modelBExperiment;

  const handleMouseOut = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      setTooltip((prev) => ({
        ...prev,
        display: false,
      }));
      onHoverEnd();
    },
    [onHoverEnd]
  );

  useEffect(() => {
    if (!experiment || !svgRef.current) return;

    const data = extractBubbleChartData(datasetMode, experiment);

    const margin = {
      top: 8,
      right: 4,
      bottom: 38,
      left: 64,
    };
    const width = CONFIG.WIDTH - margin.left - margin.right;
    const height = CONFIG.HEIGHT - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", CONFIG.WIDTH)
      .attr("height", CONFIG.HEIGHT)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([-0.5, 9.5]).range([0, width]);

    const yScale = d3.scaleLinear().domain([-0.5, 9.5]).range([0, height]);

    const colorScale = d3
      .scaleQuantize<string>()
      .domain([0, 1])
      .range(bubbleColorScale);

    const sizeScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([CONFIG.MIN_BUBBLE_SIZE, CONFIG.MAX_BUBBLE_SIZE]);

    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(d3.range(0, 10))
      .tickSize(0)
      .tickFormat((d) => CIFAR_10_CLASSES[d as number]);

    const yAxis = d3
      .axisLeft(yScale)
      .tickValues(d3.range(0, 10))
      .tickSize(0)
      .tickPadding(0)
      .tickFormat((d) =>
        d === forgetClass
          ? CIFAR_10_CLASSES[d as number] + " (X)"
          : CIFAR_10_CLASSES[d as number]
      );

    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .call((g) => {
        g.select(".domain")
          .attr("stroke", COLORS.BLACK)
          .attr("stroke-width", STROKE_CONFIG.LIGHT_STROKE_WIDTH);
        g.selectAll(".tick text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end")
          .style("font-family", FONT_CONFIG.ROBOTO_CONDENSED)
          .style("font-weight", FONT_CONFIG.LIGHT_FONT_WEIGHT)
          .attr("dx", "-.3em")
          .attr("dy", ".4em");
      });

    if (showYAxis) {
      svg
        .append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .call((g) => {
          g.select(".domain")
            .attr("stroke", COLORS.BLACK)
            .attr("stroke-width", STROKE_CONFIG.LIGHT_STROKE_WIDTH);
          g.selectAll(".tick text")
            .attr("dx", "-.5em")
            .style("font-family", FONT_CONFIG.ROBOTO_CONDENSED);
        });
    } else {
      svg
        .append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .call((g) => {
          g.select(".domain")
            .attr("stroke", COLORS.BLACK)
            .attr("stroke-width", STROKE_CONFIG.LIGHT_STROKE_WIDTH);
          g.selectAll(".tick text")
            .style("font-family", FONT_CONFIG.ROBOTO_CONDENSED)
            .remove();
        });
    }

    svg
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => xScale(d.x) - CONFIG.CELL_SIZE / 2)
      .attr("y", (d) => yScale(d.y) - CONFIG.CELL_SIZE / 2)
      .attr("width", CONFIG.CELL_SIZE)
      .attr("height", CONFIG.CELL_SIZE)
      .attr("rx", CONFIG.CELL_ROUNDEDNESS)
      .attr("ry", CONFIG.CELL_ROUNDEDNESS)
      .attr("fill", "transparent")
      .on("mouseover", (event, d: any) => {
        event.stopPropagation();

        d3.select(event.target).attr("fill", "rgba(128, 128, 128, 0.2)");

        const rect = event.target.getBoundingClientRect();
        const tooltipWidth = tooltipRef.current?.offsetWidth || 100;

        const rightSpace = window.innerWidth - rect.right;
        const leftSpace = rect.left;

        let xPos =
          rightSpace >= tooltipWidth + 20
            ? (rect.right + 10) / zoom
            : (leftSpace - tooltipWidth - 10) / zoom;

        let yPos = (rect.top + rect.height / 2) / zoom;

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

        svg
          .selectAll(".x-axis .tick text")
          .style("font-weight", (t: any) =>
            t === d.x ? "bold" : FONT_CONFIG.LIGHT_FONT_WEIGHT
          );

        onHover(d.y);
      })
      .on("mouseout", (event) => {
        d3.select(event.target).attr("fill", "transparent");
        handleMouseOut(event);
      });

    svg
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", (d) =>
        d.label >= CONFIG.MIN_VALUE_TO_DISPLAY
          ? Math.sqrt(sizeScale(d.label))
          : 0
      )
      .attr("fill", (d) => colorScale(d.conf))
      .attr("opacity", 0.7)
      .style("pointer-events", "none");

    if (!svgRef.current) return;

    d3.select(svgRef.current)
      .selectAll(".y-axis .tick text")
      .style("font-weight", (t: any) => {
        return t === hoveredY ? "bold" : FONT_CONFIG.LIGHT_FONT_WEIGHT;
      });
  }, [
    datasetMode,
    experiment,
    forgetClass,
    handleMouseOut,
    hoveredY,
    onHover,
    showYAxis,
    zoom,
  ]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (svgRef.current && tooltip.display) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const isOutside =
          event.clientX < svgRect.left ||
          event.clientX > svgRect.right ||
          event.clientY < svgRect.top ||
          event.clientY > svgRect.bottom;

        if (isOutside) {
          handleMouseOut(event);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseOut, tooltip.display]);

  if (!experiment) return null;

  return (
    <div
      className={`flex flex-col items-center relative ${
        showYAxis ? "z-10" : "right-[56px] z-0"
      }`}
    >
      {showYAxis && (
        <span className="absolute top-[42%] left-1 -rotate-90 text-nowrap -mx-7 text-xs">
          Ground Truth
        </span>
      )}
      <svg ref={svgRef}></svg>
      {tooltip.display &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`w-auto h-auto bg-white px-1.5 py-1 whitespace-nowrap rounded-lg text-[#333] text-sm z-10 border border-border/50 shadow-xl transition-all duration-500 ease-in-out ${
              tooltip.display ? "opacity-100" : "opacity-0"
            }`}
            style={{
              position: "fixed",
              left: tooltip.x,
              top: tooltip.y,
              transform: "translateY(-50%)",
              pointerEvents: "none",
              zIndex: 10,
              zoom,
            }}
          >
            <div>
              <span>Ground Truth</span>:{" "}
              <span className="font-semibold">
                {CIFAR_10_CLASSES[tooltip.content.groundTruth]}
              </span>
            </div>
            <div>
              <span>Prediction</span>:{" "}
              <span className="font-semibold">
                {CIFAR_10_CLASSES[tooltip.content.prediction]}
              </span>
            </div>
            <div>
              <span>Proportion</span>:{" "}
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
          </div>,
          document.body
        )}
      <div className="flex flex-col items-center absolute -bottom-3.5 translate-x-[calc(50%-12px)] text-xs leading-3">
        {isBaseline ? (
          <>
            <span>
              <span style={{ color: COLORS.EMERALD }}>Model A </span>
              Prediction
            </span>
            <span style={{ color: COLORS.EMERALD }}>
              ({modelType}, {modelA})
            </span>
          </>
        ) : (
          <>
            <span>
              <span style={{ color: COLORS.PURPLE }}>Model B </span>
              Prediction
            </span>
            <span style={{ color: COLORS.PURPLE }}>
              ({modelType}, {modelB})
            </span>
          </>
        )}
      </div>
    </div>
  );
}
