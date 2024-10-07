import React, {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
  useMemo,
} from "react";
import * as d3 from "d3";

import { classNames } from "../views/Embeddings";

const API_URL = "http://localhost:8000";
const dotSize = 3;
const minZoom = 0.6;
const maxZoom = 32;
const width = 630;
const height = 630;
const XSizeDivider = 0.75;
const XStrokeWidth = 3.5;
const crossSize = 3.5;
const defaultOpacity = 0.7;
const loweredOpacity = 0.1;

interface Props {
  data: number[][];
  toggleOptions: boolean[];
}

const Chart = React.memo(
  forwardRef(({ data, toggleOptions }: Props, ref) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, undefined>>();
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const svgSelectionRef =
      useRef<d3.Selection<SVGSVGElement, undefined, null, undefined>>();
    const circlesRef = useRef<d3.Selection<
      SVGCircleElement,
      number[],
      SVGGElement,
      unknown
    > | null>(null);
    const crossesRef = useRef<d3.Selection<
      SVGGElement,
      number[],
      SVGGElement,
      unknown
    > | null>(null);

    const x = useMemo(
      () =>
        d3
          .scaleLinear()
          .domain(d3.extent(data, (d) => d[0]) as [number, number])
          .nice()
          .range([0, width]),
      [data]
    );

    const y = useMemo(
      () =>
        d3
          .scaleLinear()
          .domain(d3.extent(data, (d) => d[1]) as [number, number])
          .nice()
          .range([height, 0]),
      [data]
    );

    const z = useMemo(
      () =>
        d3
          .scaleOrdinal<number, string>()
          .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
          .range(d3.schemeTableau10),
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

        const circles = gDot
          .selectAll<SVGCircleElement, number[]>("circle")
          .data(data.filter((d) => d[2] !== d[5]))
          .join("circle")
          .attr("cx", (d) => x(d[0]))
          .attr("cy", (d) => y(d[1]))
          .attr("r", dotSize)
          .attr("fill", (d) => z(d[3]))
          .style("cursor", "pointer");

        const crosses = gDot
          .selectAll<SVGGElement, number[]>("g")
          .data(data.filter((d) => d[2] === d[5]))
          .join("g")
          .attr("transform", (d) => `translate(${x(d[0])},${y(d[1])})`)
          .each(function (d) {
            const pos = crossSize / XSizeDivider;

            d3.select(this)
              .append("line")
              .attr("x1", -pos)
              .attr("y1", -pos)
              .attr("x2", pos)
              .attr("y2", pos)
              .attr("stroke", z(d[3]))
              .attr("stroke-width", XStrokeWidth);

            d3.select(this)
              .append("line")
              .attr("x1", -pos)
              .attr("y1", pos)
              .attr("x2", pos)
              .attr("y2", -pos)
              .attr("stroke", z(d[3]))
              .attr("stroke-width", XStrokeWidth);
          })
          .style("cursor", "pointer");

        circlesRef.current = circles;
        crossesRef.current = crosses;

        function handleMouseEnter(event: any, d: number[]) {
          if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const tooltipSize = 140;
            let xPos = event.clientX - containerRect.left + 10;
            let yPos = event.clientY - containerRect.top + 10;

            if (xPos + tooltipSize > containerRect.width)
              xPos = event.clientX - containerRect.left - tooltipSize - 10;
            if (yPos + tooltipSize > containerRect.height)
              yPos = event.clientY - containerRect.top - tooltipSize - 10;

            const index = d[4];
            fetch(`${API_URL}/image/cifar10/${index}`)
              .then((response) => response.blob())
              .then((blob) => {
                const imageUrl = URL.createObjectURL(blob);
                if (tooltipRef.current) {
                  tooltipRef.current.style.display = "block";
                  tooltipRef.current.style.left = `${xPos}px`;
                  tooltipRef.current.style.top = `${yPos}px`;
                  tooltipRef.current.innerHTML = `
                    <div style="display: flex; justify-content: center;">
                      <img src="${imageUrl}" alt="cifar-10 image" width="140" height="140" />
                    </div>
                    <div style="font-size: 12px; margin-top: 4px">Ground Truth: ${
                      d[2]
                    } (${classNames[d[2]]})</div>
                    <div style="font-size: 12px;">Prediction: ${d[3]} (${
                    classNames[d[3]]
                  })</div>
                  `;
                }
              });
          }
        }

        function handleMouseLeave(this: SVGElement) {
          d3.select(this).style("cursor", "grab");
          if (tooltipRef.current) {
            tooltipRef.current.style.display = "none";
          }
        }

        circles
          .on("mouseenter", handleMouseEnter)
          .on("mouseleave", handleMouseLeave);

        crosses
          .on("mouseenter", handleMouseEnter)
          .on("mouseleave", handleMouseLeave);

        function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, undefined>) {
          const transform = event.transform;
          gMain.attr("transform", transform.toString());

          circles.attr("r", dotSize / transform.k);

          crosses.attr("transform", (d) => {
            const xPos = x(d[0]);
            const yPos = y(d[1]);
            const scale = 1 / transform.k;
            return `translate(${xPos},${yPos}) scale(${scale})`;
          });
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
    }, [data, x, y, z]);

    useEffect(() => {
      const updateOpacity = () => {
        if (circlesRef.current) {
          circlesRef.current.style("opacity", (d: any) => {
            const dataCondition =
              (d[2] === d[5] && !toggleOptions[0]) ||
              (d[2] !== d[5] && !toggleOptions[1]);
            const classCondition =
              (d[3] === d[5] && !toggleOptions[2]) ||
              (d[3] !== d[5] && !toggleOptions[3]);

            if (dataCondition || classCondition) return loweredOpacity;
            return defaultOpacity;
          });
        }

        if (crossesRef.current) {
          crossesRef.current.style("opacity", (d: any) => {
            const dataCondition =
              (d[2] === d[5] && !toggleOptions[0]) ||
              (d[2] !== d[5] && !toggleOptions[1]);
            const classCondition =
              (d[3] === d[5] && !toggleOptions[2]) ||
              (d[3] !== d[5] && !toggleOptions[3]);

            if (dataCondition || classCondition) return loweredOpacity;
            return defaultOpacity;
          });
        }
      };

      updateOpacity();
    }, [toggleOptions]);

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
            border: "1px solid rgba(0, 0, 0, 0.25)",
            borderRadius: "4px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.25)",
          }}
        ></div>
      </div>
    );
  })
);

export default Chart;
