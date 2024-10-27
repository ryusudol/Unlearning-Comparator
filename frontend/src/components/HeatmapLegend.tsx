import { useRef, useEffect } from "react";
import * as d3 from "d3";

const margin = { top: 10, right: 30, bottom: 10, left: 0 };

export default function HeatmapLegend({ isExpanded }: { isExpanded: boolean }) {
  const legendRef = useRef<SVGSVGElement>(null);

  const width = isExpanded ? 12 : 8;
  const height = isExpanded ? 430 : 188;

  useEffect(() => {
    if (legendRef.current) {
      d3.select(legendRef.current).selectAll("*").remove();

      const svg = d3
        .select(legendRef.current)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

      const defs = svg.append("defs");
      const linearGradient = defs
        .append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");

      const stops = d3.range(0, 1.01, 0.01).map((t) => ({
        offset: `${t * 100}%`,
        color: d3.interpolateViridis(t),
      }));

      linearGradient
        .selectAll("stop")
        .data(stops)
        .enter()
        .append("stop")
        .attr("offset", (d) => d.offset)
        .attr("stop-color", (d) => d.color);

      svg
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width)
        .attr("height", height)
        .style("fill", "url(#legend-gradient)");

      const legendScale = d3
        .scaleLinear()
        .domain([0, 1])
        .range([height + margin.top, margin.top]);

      const legendAxis = d3
        .axisRight(legendScale)
        .ticks(5)
        .tickFormat(d3.format(".1f"))
        .tickSize(4)
        .tickPadding(6);

      svg
        .append("g")
        .attr("class", "legend-axis")
        .attr("transform", `translate(${width + margin.left}, 0)`)
        .call(legendAxis)
        .select(".domain")
        .remove();

      svg
        .selectAll(".legend-axis text")
        .style("font-size", "8px")
        .style("overflow", "visible");
    }
  }, [height, width]);

  return (
    <svg
      className={`${isExpanded ? "mb-[31px]" : "mb-[32.5px]"} -ml-1`}
      ref={legendRef}
      width={width + margin.left + margin.right}
      height={height + margin.top + margin.bottom}
    ></svg>
  );
}
