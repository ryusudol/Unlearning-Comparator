import { useEffect, useRef } from "react";
import * as d3 from "d3";

import { DataPoint } from "../views/PrivacyAttack";

const MARGIN = { top: 22, right: 4, bottom: 80, left: 4 };
const LEGEND_DATA = [
  { label: "denied loan / would default", color: "#808080", align: "left" },
  { label: "granted loan / defaults", color: "#60a5fa", align: "right" },
  { label: "denied loan / would pay back", color: "#404040", align: "left" },
  { label: "granted loan / pays back", color: "#1e40af", align: "right" },
];

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
  const width = 480;
  const height = 250;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const xScale = d3
      .scaleLinear()
      .domain([-2, 10])
      .range([MARGIN.left, width - MARGIN.right]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 30])
      .range([height - MARGIN.bottom, MARGIN.top]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - MARGIN.bottom})`)
      .call(d3.axisBottom(xScale).ticks(6));

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
        const defaultPoints = pointsInBin.filter((p) => p.type === "default");
        const paybackPoints = pointsInBin.filter((p) => p.type === "payback");

        const lessPoints =
          defaultPoints.length <= paybackPoints.length
            ? defaultPoints
            : paybackPoints;
        const morePoints =
          defaultPoints.length > paybackPoints.length
            ? defaultPoints
            : paybackPoints;

        if (
          (d.type === "default" &&
            defaultPoints.length <= paybackPoints.length) ||
          (d.type === "payback" && paybackPoints.length < defaultPoints.length)
        ) {
          const position = lessPoints.indexOf(d);
          return yScale(position + 1);
        } else {
          const position = morePoints.indexOf(d) + lessPoints.length;
          return yScale(position + 1);
        }
      })
      .attr("r", 2.5)
      .attr("fill", (d) => {
        if (d.entropy < threshold) {
          return d.type === "default" ? "#808080" : "#404040";
        } else {
          return d.type === "default" ? "#60a5fa" : "#1e40af";
        }
      });

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
              return d.type === "default" ? "#808080" : "#404040";
            } else {
              return d.type === "payback" ? "#1e40af" : "#60a5fa";
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
      .attr("y1", MARGIN.top)
      .attr("y2", height - MARGIN.bottom)
      .attr("stroke", "black")
      .attr("stroke-width", 2);

    thresholdGroup
      .append("rect")
      .attr("x", -10)
      .attr("y", MARGIN.top)
      .attr("width", 20)
      .attr("height", height - MARGIN.top - MARGIN.bottom)
      .attr("fill", "transparent");

    thresholdGroup
      .append("text")
      .attr("y", MARGIN.top - 10)
      .attr("text-anchor", "middle")
      .attr("font-weight", 300)
      .text(`Threshold: ${threshold.toFixed(2)}`);

    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width / 2 + 10}, ${height - MARGIN.bottom + 30})`
      );

    const legendHeight = 20;

    LEGEND_DATA.forEach((item, i) => {
      const y = Math.floor(i / 2) * legendHeight;
      const x = item.align === "left" ? 0 : width - 200;

      const legendItem = legend
        .append("g")
        .attr("transform", `translate(${x}, ${y})`);

      legendItem
        .append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("y", 0)
        .attr("fill", item.color);

      legendItem
        .append("text")
        .attr("x", 25)
        .attr("y", 15 / 2)
        .attr("dy", "0.35em")
        .text(item.label)
        .style("font-size", "12px")
        .style("font-family", "Roboto, sans-serif")
        .style("font-weight", "300");
    });
  }, [data, setThreshold, threshold]);

  return <svg ref={svgRef}></svg>;
}
