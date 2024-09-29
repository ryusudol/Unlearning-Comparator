import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

interface Props {
  data: number[][];
  width: number;
  height: number;
}

const ChartComponent = ({ data, width, height }: Props) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const k = height / width;

  const x = d3.scaleLinear().domain([-4.5, 4.5]).range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([-4.5 * k, 4.5 * k])
    .range([height, 0]);

  const z = d3
    .scaleOrdinal<number, string>()
    .domain(data.map((d) => d[2]))
    .range(d3.schemeCategory10);

  const xAxis = useCallback(
    (
      g: d3.Selection<SVGGElement, undefined, null, undefined>,
      x: d3.ScaleLinear<number, number>
    ) =>
      g
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisTop(x).ticks(0))
        .call((g) => g.select(".domain").attr("display", "none")),
    [height]
  );

  const yAxis = useCallback(
    (
      g: d3.Selection<SVGGElement, undefined, null, undefined>,
      y: d3.ScaleLinear<number, number>
    ) =>
      g
        .call(d3.axisRight(y).ticks(0))
        .call((g) => g.select(".domain").attr("display", "none")),
    []
  );

  const grid = useCallback(
    (
      g: d3.Selection<SVGGElement, undefined, null, undefined>,
      x: d3.ScaleLinear<number, number>,
      y: d3.ScaleLinear<number, number>
    ) =>
      g
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
        .call((g) =>
          g
            .selectAll(".x")
            .data(x.ticks(12))
            .join(
              (enter) =>
                enter.append("line").attr("class", "x").attr("y2", height),
              (update) => update,
              (exit) => exit.remove()
            )
            .attr("x1", (d) => 0.5 + x(d))
            .attr("x2", (d) => 0.5 + x(d))
        )
        .call((g) =>
          g
            .selectAll(".y")
            .data(y.ticks(12 * k))
            .join(
              (enter) =>
                enter.append("line").attr("class", "y").attr("x2", width),
              (update) => update,
              (exit) => exit.remove()
            )
            .attr("y1", (d) => 0.5 + y(d))
            .attr("y2", (d) => 0.5 + y(d))
        ),
    [height, k, width]
  );

  useEffect(() => {
    const chart = () => {
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 32])
        .on("zoom", zoomed);

      const svgElement = d3
        .create("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .attr("preserveAspectRatio", "xMidYMid meet");

      const gGrid = svgElement.append("g");

      const gDot = svgElement
        .append("g")
        .attr("fill", "none")
        .attr("stroke-linecap", "round");

      gDot
        .selectAll("path")
        .data(data as [number, number, number][])
        .join("path")
        .attr("d", (d) => `M${x(d[0])},${y(d[1])}h0`)
        .attr("stroke", (d) => z(d[2]));

      const gx = svgElement.append("g");
      const gy = svgElement.append("g");

      const svg = d3
        .select(svgElement.node() as SVGSVGElement)
        .call(zoom)
        .call(zoom.transform, d3.zoomIdentity);

      function zoomed({ transform }: { transform: d3.ZoomTransform }) {
        const zx = transform.rescaleX(x).interpolate(d3.interpolateRound);
        const zy = transform.rescaleY(y).interpolate(d3.interpolateRound);
        gDot
          .attr("transform", transform.toString())
          .attr("stroke-width", 5 / transform.k);
        gx.call(xAxis, zx);
        gy.call(yAxis, zy);
        gGrid.call(grid, zx, zy);
      }

      return Object.assign(svg.node() as SVGSVGElement, {
        reset() {
          svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        },
      });
    };

    const svgElement = chart();

    if (svgRef.current) {
      svgRef.current.appendChild(svgElement);
    }

    const currentSvgRef = svgRef.current;

    return () => {
      if (currentSvgRef) {
        currentSvgRef.innerHTML = "";
      }
    };
  }, [data, width, height, x, y, z, xAxis, yAxis, grid]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <svg ref={svgRef} style={{ width: "100%", height: "100%" }}></svg>
    </div>
  );
};

export default ChartComponent;
