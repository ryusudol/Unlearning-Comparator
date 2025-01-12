import { useEffect, useRef } from "react";
import * as d3 from "d3";

import { DataPoint } from "./Discriminator";
import { FONT_CONFIG, STROKE_CONFIG } from "../../constants/common";
import { COLORS } from "../../constants/colors";
import { LEGEND_DATA } from "../../constants/privacyAttack";

const CONFIG = {
  WIDTH: 400,
  HEIGHT: 300,
  MARGIN: { top: 22, right: 5, bottom: 68, left: 20 },
  CIRCLE_SIZE: 3.2,
  TICK_SIZE: 4,
  LEGEND_RECT_SIZE: 15,
  THRESHOLD_LINE_WIDTH: 1.5,
  THRESHOLD_LINE_DASH_ARRAY: "4,3",
  CIRCLE_Y_OFFSET: 0.6,
  THRESHOLD_LINE_COLOR: "#FF4D4D",
} as const;

const PAYBACK = "payback";
const DEFAULT = "default";

interface Props {
  data: DataPoint[];
  threshold: number;
  setThreshold: (value: number) => void;
}

export default function DistributionPlot({
  data,
  threshold,
  setThreshold,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3
      .select(svgRef.current)
      .attr("width", CONFIG.WIDTH)
      .attr("height", CONFIG.HEIGHT);

    svg.selectAll("*").remove();

    const xScale = d3
      .scaleLinear()
      .domain([-2, 10])
      .range([CONFIG.MARGIN.left, CONFIG.WIDTH - CONFIG.MARGIN.right]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 30])
      .range([CONFIG.HEIGHT - CONFIG.MARGIN.bottom, CONFIG.MARGIN.top]);

    const grid = svg.append("g").attr("class", "grid");

    // x-axis grid
    grid
      .append("g")
      .attr("transform", `translate(0,${CONFIG.HEIGHT - CONFIG.MARGIN.bottom})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickSize(-(CONFIG.HEIGHT - CONFIG.MARGIN.top - CONFIG.MARGIN.bottom))
          .tickFormat(() => "")
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke", COLORS.GRID_COLOR)
          .attr("stroke-width", STROKE_CONFIG.LIGHT_STROKE_WIDTH)
      );

    // y-axis grid
    grid
      .append("g")
      .attr("transform", `translate(${CONFIG.MARGIN.left}, 0)`)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(7)
          .tickSize(-CONFIG.WIDTH + CONFIG.MARGIN.left + CONFIG.MARGIN.right)
          .tickFormat(() => "")
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke", COLORS.GRID_COLOR)
          .attr("stroke-width", STROKE_CONFIG.LIGHT_STROKE_WIDTH)
      );

    // x-axis
    svg
      .append("g")
      .attr("transform", `translate(0,${CONFIG.HEIGHT - CONFIG.MARGIN.bottom})`)
      .call(d3.axisBottom(xScale).ticks(6).tickSize(CONFIG.TICK_SIZE))
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke-width", STROKE_CONFIG.LIGHT_STROKE_WIDTH)
      )
      .call((g) =>
        g
          .selectAll(".tick text")
          .style("font-family", FONT_CONFIG.ROBOTO_CONDENSED)
      );

    // y-axis
    svg
      .append("g")
      .attr("transform", `translate(${CONFIG.MARGIN.left}, 0)`)
      .call(d3.axisLeft(yScale).ticks(7).tickSize(CONFIG.TICK_SIZE))
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke-width", STROKE_CONFIG.LIGHT_STROKE_WIDTH)
      )
      .call((g) =>
        g
          .selectAll(".tick text")
          .style("font-family", FONT_CONFIG.ROBOTO_CONDENSED)
      );

    svg
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.entropy))
      .attr("cy", (d, i) => {
        const binWidth = 0.25;
        const bin = Math.floor(d.entropy / binWidth);
        const pointsInBin = data.filter(
          (p) => Math.floor(p.entropy / binWidth) === bin
        );
        const paybackPoints = pointsInBin.filter((p) => p.type === PAYBACK);
        const defaultPoints = pointsInBin.filter((p) => p.type === DEFAULT);

        if (d.type === PAYBACK) {
          const position = paybackPoints.indexOf(d);
          return yScale(position + CONFIG.CIRCLE_Y_OFFSET);
        } else {
          if (defaultPoints.length > paybackPoints.length) {
            const position = defaultPoints.indexOf(d);
            if (position >= paybackPoints.length) {
              return yScale(position + CONFIG.CIRCLE_Y_OFFSET);
            } else {
              return yScale(position + CONFIG.CIRCLE_Y_OFFSET);
            }
          } else {
            const position = defaultPoints.indexOf(d);
            return yScale(position + CONFIG.CIRCLE_Y_OFFSET);
          }
        }
      })
      .attr("r", CONFIG.CIRCLE_SIZE)
      .attr("fill", (d) => {
        if (d.entropy < threshold) {
          return d.type === DEFAULT ? COLORS.LIGHT_GRAY : COLORS.DARK_GRAY;
        } else {
          return d.type === DEFAULT ? COLORS.LIGHT_BLUE : COLORS.DARK_BLUE;
        }
      })
      .attr("stroke", (d) => {
        if (d.entropy < threshold) {
          return d.type === DEFAULT ? COLORS.GRAY : "#303030";
        } else {
          return d.type === DEFAULT ? "#4a83c8" : "#152c7a";
        }
      })
      .attr("stroke-width", STROKE_CONFIG.LIGHT_STROKE_WIDTH);

    const dragLine = d3.drag().on("drag", (event) => {
      const newX = event.x;
      const newThreshold = Math.round(xScale.invert(newX) * 20) / 20;

      if (newThreshold >= -2 && newThreshold <= 10) {
        setThreshold(newThreshold);
        thresholdGroup.attr(
          "transform",
          `translate(${xScale(newThreshold)}, 0)`
        );

        svg
          .selectAll("circle")
          .data<DataPoint>(data)
          .attr("fill", (d) => {
            if (d.entropy < newThreshold) {
              return d.type === DEFAULT ? COLORS.LIGHT_GRAY : COLORS.DARK_GRAY;
            } else {
              return d.type === PAYBACK ? COLORS.DARK_BLUE : COLORS.LIGHT_BLUE;
            }
          });
      }
    });

    const thresholdGroup = svg
      .append("g")
      .attr("transform", `translate(${xScale(threshold)}, 0)`)
      .attr("cursor", "ew-resize")
      .call(dragLine as any);

    thresholdGroup
      .append("line")
      .attr("y1", CONFIG.MARGIN.top)
      .attr("y2", CONFIG.HEIGHT - CONFIG.MARGIN.bottom)
      .attr("stroke", CONFIG.THRESHOLD_LINE_COLOR)
      .attr("stroke-width", CONFIG.THRESHOLD_LINE_WIDTH)
      .attr("stroke-dasharray", CONFIG.THRESHOLD_LINE_DASH_ARRAY);

    thresholdGroup
      .append("rect")
      .attr("x", -10)
      .attr("y", CONFIG.MARGIN.top)
      .attr("width", 20)
      .attr("height", CONFIG.HEIGHT - CONFIG.MARGIN.top - CONFIG.MARGIN.bottom)
      .attr("fill", "transparent");

    thresholdGroup
      .append("text")
      .attr("y", CONFIG.MARGIN.top - 10)
      .attr("text-anchor", "middle")
      .attr("font-weight", FONT_CONFIG.LIGHT_FONT_WEIGHT)
      .attr("font-size", FONT_CONFIG.FONT_SIZE_14)
      .text(`Threshold: ${threshold.toFixed(2)}`);

    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${CONFIG.WIDTH / 2 + 10}, ${
          CONFIG.HEIGHT - CONFIG.MARGIN.bottom + 30
        })`
      );

    LEGEND_DATA.forEach((item, i) => {
      const y = Math.floor(i / 2) * 20;
      const x = item.align === "left" ? 0 : CONFIG.WIDTH - 200;

      const legendItem = legend
        .append("g")
        .attr("transform", `translate(${x}, ${y})`);

      legendItem
        .append("rect")
        .attr("width", CONFIG.LEGEND_RECT_SIZE)
        .attr("height", CONFIG.LEGEND_RECT_SIZE)
        .attr("y", 0)
        .attr("fill", item.color);

      legendItem
        .append("text")
        .attr("x", 25)
        .attr("y", CONFIG.LEGEND_RECT_SIZE / 2)
        .attr("dy", "0.35em")
        .text(item.label)
        .style("font-size", FONT_CONFIG.FONT_SIZE_12)
        .style("font-family", FONT_CONFIG.ROBOTO_CONDENSED)
        .style("font-weight", FONT_CONFIG.LIGHT_FONT_WEIGHT);
    });
  }, [data, setThreshold, threshold]);

  return <svg ref={svgRef}></svg>;
}
