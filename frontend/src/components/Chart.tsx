import React, {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
  useCallback,
} from "react";
import * as d3 from "d3";

const dotSize = 2.5;
const minZoom = 0.6;
const maxZoom = 32;

interface Props {
  data: number[][];
  width: number;
  height: number;
}

const Chart = React.memo(
  forwardRef(({ data, width, height }: Props, ref) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, undefined>>();
    const svgSelectionRef =
      useRef<d3.Selection<SVGSVGElement, undefined, null, undefined>>();

    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d[0]) as [number, number])
      .nice()
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d[1]) as [number, number])
      .nice()
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

    useEffect(() => {
      const chart = () => {
        const svg = d3
          .create<SVGSVGElement>("svg")
          .attr("viewBox", [0, 0, width, height])
          .attr("width", width)
          .attr("height", height)
          .attr("preserveAspectRatio", "xMidYMid meet");

        const gMain = svg.append("g");

        const rect = gMain
          .append("rect")
          .attr("width", width)
          .attr("height", height)
          .style("fill", "none")
          .style("pointer-events", "all")
          .style("cursor", "grab")
          .on("mousedown", () => rect.style("cursor", "grabbing"))
          .on("mousemove", () => rect.style("cursor", "grab"));

        const gDot = gMain.append("g");

        const dots = gDot
          .selectAll("circle")
          .data(data as [number, number, number][])
          .join("circle")
          .attr("cx", (d) => x(d[0]))
          .attr("cy", (d) => y(d[1]))
          .attr("r", dotSize)
          .attr("fill", (d) => z(d[2]))
          .style("cursor", "pointer")
          .on("mouseenter", function () {
            d3.select(this).style("cursor", "pointer");
            console.log("dot enter");
          })
          .on("mouseleave", function () {
            d3.select(this).style("cursor", "default");
            console.log("dot leave");
          });

        const gx = gMain.append("g");
        const gy = gMain.append("g");

        function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, undefined>) {
          const transform = event.transform;
          gMain.attr("transform", transform.toString());
          dots.attr("r", dotSize / transform.k);
          const zx = transform.rescaleX(x).interpolate(d3.interpolateRound);
          const zy = transform.rescaleY(y).interpolate(d3.interpolateRound);
          gx.call(xAxis, zx);
          gy.call(yAxis, zy);
        }

        const zoom = d3
          .zoom<SVGSVGElement, undefined>()
          .scaleExtent([minZoom, maxZoom])
          .on("zoom", zoomed);

        zoomRef.current = zoom;

        svg.call(zoom);

        svgSelectionRef.current = svg;

        return svg.node() as SVGSVGElement;
      };

      const svg = chart();

      if (svgRef.current) {
        svgRef.current.appendChild(svg);
      }

      const currentSvgRef = svgRef.current;

      return () => {
        if (currentSvgRef) {
          currentSvgRef.innerHTML = "";
        }
      };
    }, [data, width, height, x, y, z, xAxis, yAxis]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (zoomRef.current && svgSelectionRef.current) {
          svgSelectionRef.current
            .select("rect")
            .transition()
            .duration(750)
            .call(zoomRef.current.transform as any, d3.zoomIdentity);
        }
      },
    }));

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
  })
);

export default Chart;
