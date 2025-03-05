import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import * as d3 from "d3";

import {
  useModelAExperiment,
  useModelBExperiment,
} from "../../stores/experimentsStore";
import { CIFAR_10_CLASSES, FONT_CONFIG } from "../../constants/common";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { useModelDataStore } from "../../stores/modelDataStore";
import { calculateZoom } from "../../utils/util";
import { extractBubbleChartData } from "../../utils/data/experiments";
import { COLORS } from "../../constants/colors";

const CONFIG = {
  WIDTH: 260,
  HEIGHT: 250,
  MIN_BUBBLE_SIZE: 1,
  MAX_BUBBLE_SIZE: 90,
  MIN_VALUE_TO_DISPLAY: 0.002,
  CELL_SIZE: 20,
  CELL_ROUNDEDNESS: 4,
  MARGIN: {
    top: 8,
    right: 4,
    bottom: 48,
    left: 64,
  },
} as const;

interface Props {
  mode: "A" | "B";
  modelType: string;
  datasetMode: string;
  hoveredY: number | null;
  onHover: (y: number | null) => void;
  showYAxis?: boolean;
}

function BubbleChart({
  mode,
  modelType,
  datasetMode,
  hoveredY,
  onHover,
  showYAxis = true,
}: Props) {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelA = useModelDataStore((state) => state.modelA);
  const modelB = useModelDataStore((state) => state.modelB);
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
  const isModelA = mode === "A";
  const experiment = isModelA ? modelAExperiment : modelBExperiment;

  const handleMouseOut = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      setTooltip((prev) => ({
        ...prev,
        display: false,
      }));
      onHover(null);
    },
    [onHover]
  );

  useEffect(() => {
    if (!experiment || !svgRef.current) return;

    const data = extractBubbleChartData(datasetMode, experiment);

    const width = CONFIG.WIDTH - CONFIG.MARGIN.left - CONFIG.MARGIN.right;
    const height = CONFIG.HEIGHT - CONFIG.MARGIN.top - CONFIG.MARGIN.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", CONFIG.WIDTH)
      .attr("height", CONFIG.HEIGHT)
      .append("g")
      .attr(
        "transform",
        `translate(${CONFIG.MARGIN.left},${CONFIG.MARGIN.top})`
      );

    const xScale = d3.scaleLinear().domain([-0.5, 9.5]).range([0, width]);
    const cellGap = 1;
    const rectSize = xScale(1) - xScale(0) - cellGap;

    const yScale = d3.scaleLinear().domain([-0.5, 9.5]).range([0, height]);

    const colorScale = d3
      .scaleSequential((t) => d3.interpolateGreys(0.05 + 0.95 * t))
      .domain([0, 1]);

    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(d3.range(0, 10))
      .tickSize(0)
      .tickFormat((d) =>
        d === forgetClass
          ? CIFAR_10_CLASSES[d as number] + " (X)"
          : CIFAR_10_CLASSES[d as number]
      );

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
        g.select(".domain").remove();
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
          g.select(".domain").remove();
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
          g.select(".domain").remove();
          g.selectAll(".tick text").remove();
        });
    }

    const cellGroup = svg
      .selectAll("g.cell")
      .data(data)
      .join("g")
      .attr("class", "cell");

    cellGroup.each(function (d: any) {
      const xCenter = xScale(d.x);
      const yCenter = yScale(d.y);

      const x0 = xCenter - rectSize / 2;
      const x1 = xCenter + rectSize / 2;
      const y0 = yCenter - rectSize / 2;
      const y1 = yCenter + rectSize / 2;

      d3.select(this)
        .append("path")
        .attr("d", `M ${x0},${y0} L ${x1},${y0} L ${x1},${y1} Z`)
        .attr("fill", colorScale(d.conf));

      d3.select(this)
        .append("path")
        .attr("d", `M ${x0},${y0} L ${x1},${y1} L ${x0},${y1} Z`)
        .attr("fill", colorScale(d.label));

      d3.select(this)
        .append("rect")
        .attr("class", "cell-border")
        .attr("x", x0)
        .attr("y", y0)
        .attr("width", rectSize)
        .attr("height", rectSize)
        .attr("fill", "none")
        .attr("pointer-events", "all");
    });

    cellGroup
      .on("mouseover", function (event: any, d: any) {
        event.stopPropagation();

        d3.select(this)
          .select(".cell-border")
          .attr("stroke", "black")
          .attr("stroke-width", 1);

        const rect = (
          d3.select(this).select(".cell-border").node() as HTMLElement
        ).getBoundingClientRect();

        if (!rect) return;

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
      .on("mouseout", function (event: any) {
        d3.select(this)
          .select(".cell-border")
          .attr("stroke", null)
          .attr("stroke-width", null);

        handleMouseOut(event);
      });

    // svg
    //   .selectAll("rect")
    //   .data(data)
    //   .join("rect")
    //   .attr("x", (d) => xScale(d.x) - CONFIG.CELL_SIZE / 2)
    //   .attr("y", (d) => yScale(d.y) - CONFIG.CELL_SIZE / 2)
    //   .attr("width", rectSize)
    //   .attr("height", rectSize)
    //   .attr("fill", (d) => colorScale(d.conf))
    //   .on("mouseover", (event, d: any) => {
    //     event.stopPropagation();

    //     d3.select(event.target).attr("stroke", "black").attr("stroke-width", 1);

    //     const rect = event.target.getBoundingClientRect();
    //     const tooltipWidth = tooltipRef.current?.offsetWidth || 100;

    //     const rightSpace = window.innerWidth - rect.right;
    //     const leftSpace = rect.left;

    //     let xPos =
    //       rightSpace >= tooltipWidth + 20
    //         ? (rect.right + 10) / zoom
    //         : (leftSpace - tooltipWidth - 10) / zoom;

    //     let yPos = (rect.top + rect.height / 2) / zoom;

    //     setTooltip({
    //       display: true,
    //       x: xPos,
    //       y: yPos,
    //       content: {
    //         groundTruth: d.y,
    //         prediction: d.x,
    //         label: d.label,
    //         conf: d.conf,
    //       },
    //     });

    //     svg
    //       .selectAll(".x-axis .tick text")
    //       .style("font-weight", (t: any) =>
    //         t === d.x ? "bold" : FONT_CONFIG.LIGHT_FONT_WEIGHT
    //       );

    //     onHover(d.y);
    //   })
    //   .on("mouseout", (event) => {
    //     d3.select(event.target).attr("stroke", null);
    //     handleMouseOut(event);
    //   });
  }, [
    datasetMode,
    experiment,
    forgetClass,
    handleMouseOut,
    onHover,
    showYAxis,
    zoom,
  ]);

  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .selectAll(".y-axis .tick text")
      .style("font-weight", (t: any) =>
        t === hoveredY ? "bold" : FONT_CONFIG.LIGHT_FONT_WEIGHT
      );
  }, [hoveredY]);

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
        <span className="absolute top-[calc(42%-8px)] left-2.5 -rotate-90 text-nowrap -mx-7 text-xs">
          True Class
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
              <span>True Class</span>:{" "}
              <span className="font-semibold">
                {CIFAR_10_CLASSES[tooltip.content.groundTruth]}
              </span>
            </div>
            <div>
              <span>Predicted Class</span>:{" "}
              <span className="font-semibold">
                {CIFAR_10_CLASSES[tooltip.content.prediction]}
              </span>
            </div>
            <div>
              <span
                style={{ color: isModelA ? COLORS.EMERALD : COLORS.PURPLE }}
              >
                Proportion:{" "}
              </span>
              <span className="font-semibold">
                {tooltip.content.label.toFixed(3)}
              </span>
            </div>
            <div>
              <span
                style={{ color: isModelA ? COLORS.EMERALD : COLORS.PURPLE }}
              >
                Avg. Confidence:{" "}
              </span>
              <span className="font-semibold">
                {tooltip.content.conf.toFixed(3)}
              </span>
            </div>
          </div>,
          document.body
        )}
      <div className="flex flex-col items-center gap-0.5 absolute -bottom-[18px] translate-x-[calc(50%-36px)] text-[13px] leading-3">
        {isModelA ? (
          <>
            <span style={{ color: COLORS.EMERALD }}>
              Model A ({modelType}, {modelA})
            </span>
            <span>Predicted Class</span>
          </>
        ) : (
          <>
            <span style={{ color: COLORS.PURPLE }}>
              Model B ({modelType}, {modelB})
            </span>
            <span>Predicted Class</span>
          </>
        )}
      </div>
    </div>
  );
}

export default React.memo(BubbleChart);
