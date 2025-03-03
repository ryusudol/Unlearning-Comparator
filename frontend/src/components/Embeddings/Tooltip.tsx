import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

import {
  CIFAR_10_CLASSES,
  FONT_CONFIG,
  STROKE_CONFIG,
} from "../../constants/common";
import { COLORS } from "../../constants/colors";
import { Prob } from "../../types/embeddings";

const CONFIG = {
  LOW_OPACITY: 0.6,
  HIGH_OPACITY: 1,
  TICK_PADDING: 5,
  BAR_HEIGHT: 9,
  BAR_GAP: 0.5,
  BAR_STROKE_WIDTH: 1,
  SELECT_CHART_FONT_SIZE: "9px",
  UNSELECT_CHART_FONT_SIZE: "8.5px",
  PATTERN_SIZE: 3,
  LEGEND_X: 11,
  LEGEND_Y: 7,
  LEGEND_X_OFFSET: 100,
  LEGEND_GAP: 58,
  LEGEND_FONT_SIZE: "10px",
  LEGEND_RECT_SIZE: 8,
  GRID_LINE_COLOR: "#f0f3f8",
  ROBOTO_CONDENSED: "Roboto Condensed",
  MARGIN: { top: 13, right: 22, bottom: 24, left: 66 },
} as const;

interface Props {
  imageUrl: string;
  data: (number | Prob)[];
  barChartData: {
    modelA: { class: number; value: number }[];
    modelB: { class: number; value: number }[];
  };
  forgetClass: number;
  isModelA: boolean;
}

export default React.memo(function Tooltip({
  imageUrl,
  data,
  barChartData,
  forgetClass,
  isModelA,
}: Props) {
  const svgRef = useRef(null);

  const legendRectColor = d3.schemeTableau10[9];
  const groundTruthIdx = Number(data[0]);
  const groundTruth = CIFAR_10_CLASSES[groundTruthIdx];
  const modelAIdx = barChartData.modelA.reduce((maxObj, currentObj) =>
    currentObj.value > maxObj.value ? currentObj : maxObj
  ).class;
  const modelAPrediction = CIFAR_10_CLASSES[modelAIdx];
  const modelBIdx = barChartData.modelB.reduce((maxObj, currentObj) =>
    currentObj.value > maxObj.value ? currentObj : maxObj
  ).class;
  const modelBPrediction = CIFAR_10_CLASSES[modelBIdx];

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 265;
    const height = 270;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    const defs = svg.append("defs");

    const pattern = defs
      .append("pattern")
      .attr("id", "stripe")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", CONFIG.PATTERN_SIZE)
      .attr("height", CONFIG.PATTERN_SIZE)
      .attr("patternTransform", "rotate(-45)");

    pattern
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", CONFIG.PATTERN_SIZE)
      .attr("stroke", COLORS.BLACK)
      .attr("stroke-width", STROKE_CONFIG.DEFAULT_STROKE_WIDTH)
      .attr("opacity", !isModelA ? CONFIG.HIGH_OPACITY : CONFIG.LOW_OPACITY);

    const legendPattern = defs
      .append("pattern")
      .attr("id", "stripe-legend")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", CONFIG.PATTERN_SIZE)
      .attr("height", CONFIG.PATTERN_SIZE)
      .attr("patternTransform", "rotate(-45)");

    legendPattern
      .append("rect")
      .attr("width", CONFIG.PATTERN_SIZE)
      .attr("height", CONFIG.PATTERN_SIZE)
      .attr("fill", legendRectColor);

    legendPattern
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", CONFIG.PATTERN_SIZE)
      .attr("stroke", COLORS.BLACK)
      .attr("stroke-width", STROKE_CONFIG.DEFAULT_STROKE_WIDTH);

    const basleineLegend = svg
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        `translate(${width - CONFIG.MARGIN.right - CONFIG.LEGEND_X_OFFSET}, 1)`
      );

    basleineLegend
      .append("rect")
      .attr("width", CONFIG.LEGEND_RECT_SIZE)
      .attr("height", CONFIG.LEGEND_RECT_SIZE)
      .attr("fill", legendRectColor)
      .attr("stroke", isModelA ? COLORS.BLACK : "none");

    basleineLegend
      .append("text")
      .attr("x", CONFIG.LEGEND_X)
      .attr("y", CONFIG.LEGEND_Y)
      .text("Model A")
      .style("fill", COLORS.BLACK)
      .style("font-size", CONFIG.LEGEND_FONT_SIZE)
      .style("font-family", CONFIG.ROBOTO_CONDENSED);

    const modelBLegend = basleineLegend
      .append("g")
      .attr("transform", `translate(${CONFIG.LEGEND_GAP}, 0)`);

    modelBLegend
      .append("rect")
      .attr("width", CONFIG.LEGEND_RECT_SIZE)
      .attr("height", CONFIG.LEGEND_RECT_SIZE)
      .attr("fill", legendRectColor);

    modelBLegend
      .append("rect")
      .attr("width", CONFIG.LEGEND_RECT_SIZE)
      .attr("height", CONFIG.LEGEND_RECT_SIZE)
      .attr("fill", "url(#stripe-legend)")
      .attr("stroke", !isModelA ? COLORS.BLACK : "none");

    modelBLegend
      .append("text")
      .attr("x", CONFIG.LEGEND_X)
      .attr("y", CONFIG.LEGEND_Y)
      .text("Model B")
      .style("fill", COLORS.BLACK)
      .style("font-size", CONFIG.LEGEND_FONT_SIZE)
      .style("font-family", CONFIG.ROBOTO_CONDENSED);

    const xScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([CONFIG.MARGIN.left, width - CONFIG.MARGIN.right]);

    const yScale = d3
      .scaleBand()
      .domain(barChartData.modelA.map((d) => CIFAR_10_CLASSES[d.class]))
      .range([CONFIG.MARGIN.top, height - CONFIG.MARGIN.bottom])
      .padding(0.2);

    const gridLines = svg.append("g").attr("class", "grid-lines");

    const xAxisTicks = d3.range(0, 1.2, 0.2);

    gridLines
      .selectAll("line")
      .data(xAxisTicks)
      .enter()
      .append("line")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", CONFIG.MARGIN.top)
      .attr("y2", height - CONFIG.MARGIN.bottom)
      .attr("stroke", CONFIG.GRID_LINE_COLOR)
      .attr("stroke-width", 1);

    const colors = d3.schemeTableau10;

    const g = svg.append("g");

    g.selectAll(".bar-modelA-group")
      .data(barChartData.modelA)
      .join("g")
      .attr("class", "bar-modelA-group")
      .each(function (d, i) {
        const g = d3.select(this);
        const barWidth = xScale(d.value) - CONFIG.MARGIN.left;
        const y = yScale(CIFAR_10_CLASSES[d.class]) ?? 0;

        g.append("rect")
          .attr("class", "bar-modelA")
          .attr("x", CONFIG.MARGIN.left)
          .attr("y", y)
          .attr("height", CONFIG.BAR_HEIGHT)
          .attr("width", barWidth)
          .attr("fill", colors[i])
          .attr("opacity", isModelA ? CONFIG.HIGH_OPACITY : CONFIG.LOW_OPACITY)
          .attr("stroke", isModelA ? COLORS.BLACK : "none")
          .attr("stroke-width", isModelA ? CONFIG.BAR_STROKE_WIDTH : 0);

        g.append("text")
          .attr("x", CONFIG.MARGIN.left + barWidth + 4)
          .attr("y", y + CONFIG.BAR_HEIGHT / 2)
          .attr("dy", "0.35em")
          .attr(
            "font-size",
            isModelA
              ? CONFIG.SELECT_CHART_FONT_SIZE
              : CONFIG.UNSELECT_CHART_FONT_SIZE
          )
          .attr("font-family", CONFIG.ROBOTO_CONDENSED)
          .attr("fill", isModelA ? COLORS.BLACK : COLORS.GRAY)
          .text(d.value);
      });

    g.selectAll(".bar-modelB-group")
      .data(barChartData.modelB)
      .join("g")
      .attr("class", "bar-modelB-group")
      .each(function (d: { class: number; value: number }, i: number) {
        const g = d3.select(this);
        const barWidth = xScale(d.value) - CONFIG.MARGIN.left;
        const y = (yScale(CIFAR_10_CLASSES[d.class]) ?? 0) + CONFIG.BAR_HEIGHT;

        g.append("rect")
          .attr("x", CONFIG.MARGIN.left)
          .attr("y", y)
          .attr("height", CONFIG.BAR_HEIGHT)
          .attr("width", barWidth)
          .attr("fill", colors[i])
          .attr("opacity", !isModelA ? CONFIG.HIGH_OPACITY : CONFIG.LOW_OPACITY)
          .attr("stroke", !isModelA ? COLORS.BLACK : "none")
          .attr("stroke-width", !isModelA ? CONFIG.BAR_STROKE_WIDTH : 0);

        g.append("rect")
          .attr("x", CONFIG.MARGIN.left)
          .attr("y", y)
          .attr("height", CONFIG.BAR_HEIGHT)
          .attr("width", barWidth)
          .attr("fill", "url(#stripe)")
          .attr("opacity", 0.5);

        g.append("text")
          .attr("x", CONFIG.MARGIN.left + barWidth + 4)
          .attr("y", y + CONFIG.BAR_HEIGHT / 2)
          .attr("dy", "0.35em")
          .attr(
            "font-size",
            !isModelA
              ? CONFIG.SELECT_CHART_FONT_SIZE
              : CONFIG.UNSELECT_CHART_FONT_SIZE
          )
          .attr("font-family", CONFIG.ROBOTO_CONDENSED)
          .attr("fill", !isModelA ? COLORS.BLACK : COLORS.GRAY)
          .text(d.value);
      });

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(5)
      .tickSize(0)
      .tickPadding(CONFIG.TICK_PADDING)
      .tickFormat((d) => d.toString());

    svg
      .append("g")
      .attr("transform", `translate(0,${height - CONFIG.MARGIN.bottom})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", FONT_CONFIG.FONT_SIZE_10)
      .style("font-weight", FONT_CONFIG.LIGHT_FONT_WEIGHT)
      .style("font-family", CONFIG.ROBOTO_CONDENSED);

    svg.select(".domain").remove();

    const yAxis = d3
      .axisLeft(yScale)
      .tickSize(0)
      .tickPadding(CONFIG.TICK_PADDING);

    svg
      .append("g")
      .attr("transform", `translate(${CONFIG.MARGIN.left},0)`)
      .call(yAxis)
      .selectAll("text")
      .style("font-size", FONT_CONFIG.FONT_SIZE_10)
      .style("font-weight", FONT_CONFIG.LIGHT_FONT_WEIGHT)
      .style("font-family", CONFIG.ROBOTO_CONDENSED)
      .text((d: any) => {
        const classIndex = CIFAR_10_CLASSES.indexOf(d);
        return classIndex === forgetClass ? `${d} (X)` : d;
      });
  }, [
    barChartData.modelA,
    barChartData.modelB,
    forgetClass,
    isModelA,
    legendRectColor,
  ]);

  return (
    <div
      style={{ width: 450, height: 274 }}
      className="flex justify-center items-center z-100"
    >
      <div className="text-sm">
        <img
          src={imageUrl}
          alt="cifar-10"
          width="180"
          height="180"
          className="mb-1.5 ml-0.5"
        />
        <div>
          <div className="mt-1">
            <span>True Class:</span>{" "}
            <span className="font-semibold">{groundTruth}</span>
          </div>
          <div className="flex flex-col">
            <p>Predicted Class</p>
            <p className="flex items-center text-nowrap">
              <span style={{ color: COLORS.EMERALD }} className="mr-0.5">
                Model A:
              </span>
              <span className="font-semibold">{modelAPrediction}</span>
            </p>
            <p className="flex items-center text-nowrap">
              <span style={{ color: COLORS.PURPLE }} className="mr-0.5">
                Model B:
              </span>
              <span className="font-semibold">{modelBPrediction}</span>
            </p>
          </div>
        </div>
      </div>
      <div>
        <svg ref={svgRef} className="w-full" />
        <p className="text-xs absolute bottom-0.5 right-[calc(26%)] translate-x-1/2">
          Confidence Score
        </p>
      </div>
    </div>
  );
});
