import React, {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
  useCallback,
} from "react";
import * as d3 from "d3";

const API_URL = "http://localhost:8000";
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
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, undefined>>();
    const svgSelectionRef =
      useRef<d3.Selection<SVGSVGElement, undefined, null, undefined>>();
    const containerRef = useRef<HTMLDivElement | null>(null);

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
          .data(data)
          .join("circle")
          .attr("cx", (d) => x(d[0]))
          .attr("cy", (d) => y(d[1]))
          .attr("r", dotSize)
          .attr("fill", (d) => z(d[2]))
          .style("cursor", "pointer")
          .on("mouseenter", function (event, d) {
            if (containerRef.current) {
              const containerRect =
                containerRef.current.getBoundingClientRect();
              const tooltipWidth = 112;
              const tooltipHeight = 112;
              let xPos = event.clientX - containerRect.left + 10;
              let yPos = event.clientY - containerRect.top + 10;

              if (xPos + tooltipWidth > containerRect.width)
                xPos = event.clientX - containerRect.left - tooltipWidth - 10;
              if (yPos + tooltipHeight > containerRect.height)
                yPos = event.clientY - containerRect.top - tooltipHeight - 10;

              const index = d[3];
              fetch(`${API_URL}/image/cifar10/${index}`)
                .then((response) => response.blob())
                .then((blob) => {
                  const imageUrl = URL.createObjectURL(blob);
                  if (tooltipRef.current) {
                    tooltipRef.current.style.display = "block";
                    tooltipRef.current.style.left = `${xPos}px`;
                    tooltipRef.current.style.top = `${yPos}px`;
                    tooltipRef.current.innerHTML = `<img src="${imageUrl}" width="100" height="100" />`;
                  }
                });
            }
          })
          .on("mouseleave", function () {
            d3.select(this).style("cursor", "grab");
            if (tooltipRef.current) {
              tooltipRef.current.style.display = "none";
            }
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
          zoomRef.current.transform(
            svgSelectionRef.current.transition().duration(750),
            d3.zoomIdentity
          );
        }
      },
    }));

    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <svg ref={svgRef} style={{ width: "100%", height: "100%" }}></svg>
        <div
          ref={tooltipRef}
          style={{
            position: "absolute",
            display: "none",
            pointerEvents: "none",
            backgroundColor: "white",
            padding: "5px",
            border: "1px solid black",
          }}
        ></div>
      </div>
    );
  })
);

export default Chart;
