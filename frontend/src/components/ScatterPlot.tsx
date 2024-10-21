import React, {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
  useMemo,
} from "react";
import * as d3 from "d3";

import { forgetClassNames } from "../constants/forgetClassNames";
import { basicData } from "../constants/basicData";
import { ModeType } from "./Embedding";

const API_URL = "http://localhost:8000";
const dotSize = 4;
const minZoom = 0.6;
const maxZoom = 32;
const width = 672;
const height = 672;
const XSizeDivider = 0.4;
const XStrokeWidth = 1;
const crossSize = 4;
const defaultCrossOpacity = 0.85;
const defaultCircleOpacity = 0.6;
const loweredOpacity = 0.1;

interface Props {
  mode: ModeType;
  data: number[][] | undefined;
  viewMode: "ALL" | "Unlearning Target" | "Unlearning Failed";
}

const ScatterPlot = React.memo(
  forwardRef(({ mode, data, viewMode }: Props, ref) => {
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
      d3.BaseType | SVGPathElement,
      number[],
      SVGGElement,
      undefined
    > | null>(null);

    const unlearnedFCIndices = new Set(
      basicData.map((item) => item.forget_class)
    );
    const unlearnedFCList = forgetClassNames.filter((_, idx) =>
      unlearnedFCIndices.has(idx)
    );

    const processedData = useMemo(() => data || [], [data]);

    const x = useMemo(() => {
      if (processedData.length === 0) {
        return d3.scaleLinear().domain([0, 1]).range([0, width]);
      }
      return d3
        .scaleLinear()
        .domain(d3.extent(processedData, (d) => d[0]) as [number, number])
        .nice()
        .range([0, width]);
    }, [processedData]);

    const y = useMemo(() => {
      if (processedData.length === 0) {
        return d3.scaleLinear().domain([0, 1]).range([height, 0]);
      }
      return d3
        .scaleLinear()
        .domain(d3.extent(processedData, (d) => d[1]) as [number, number])
        .nice()
        .range([height, 0]);
    }, [processedData]);

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
          .data(processedData.filter((d) => d[2] !== d[5]))
          .join("circle")
          .attr("cx", (d) => x(d[0]))
          .attr("cy", (d) => y(d[1]))
          .attr("r", dotSize)
          .attr("fill", (d) => z(d[3]))
          .style("cursor", "pointer");

        const crosses = gDot
          .selectAll("path")
          .data(processedData.filter((d) => d[2] === d[5]))
          .join("path")
          .attr(
            "transform",
            (d) => `translate(${x(d[0])},${y(d[1])}) rotate(45)`
          )
          .attr(
            "d",
            d3
              .symbol()
              .type(d3.symbolCross)
              .size(Math.pow(crossSize / XSizeDivider, 2))
          )
          .attr("fill", (d) => z(d[3]))
          .attr("stroke", (d) => {
            const color = d3.color(z(d[3]));
            return color ? color.darker().toString() : "black";
          })
          .attr("stroke-width", XStrokeWidth)
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
                    <div style="font-size: 14px; margin-top: 4px">
                      <span style="font-weight: 500;">Ground Truth</span>: ${
                        forgetClassNames[d[2]]
                      }</div>
                    <div style="font-size: 14px;">
                      <span style="font-weight: 500;">Prediction</span>: ${
                        forgetClassNames[d[3]]
                      }</div>
                  `;
                }
              });
          }
        }

        function handleMouseLeave(event: Event, d: number[]) {
          if (event.currentTarget)
            d3.select(event.currentTarget as Element).style("cursor", "grab");

          if (tooltipRef.current) tooltipRef.current.style.display = "none";
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

          if (circlesRef.current) {
            circlesRef.current.attr("r", dotSize / transform.k);
          }

          if (crossesRef.current) {
            crossesRef.current.attr("transform", (d) => {
              const xPos = x(d[0]);
              const yPos = y(d[1]);
              const scale = 1 / transform.k;
              return `translate(${xPos},${yPos}) scale(${scale}) rotate(45)`;
            });
          }
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

      if (svgRef.current) {
        svgRef.current.innerHTML = "";
      }

      if (processedData.length > 0) {
        const svg = chart();
        if (svgRef.current) {
          svgRef.current.appendChild(svg);
        }
      } else {
        if (svgRef.current) {
          d3.select(svgRef.current)
            .append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "gray")
            .style("font-size", "15px")
            .text(
              `${
                unlearnedFCList.length > 0 ? "S" : "Run Unlearning and s"
              }elect the ${mode} from above.`
            );
        }
      }

      const currentSvgRef = svgRef.current;

      return () => {
        if (currentSvgRef) {
          currentSvgRef.innerHTML = "";
        }
      };
    }, [mode, processedData, unlearnedFCList.length, x, y, z]);

    useEffect(() => {
      const updateOpacity = () => {
        if (circlesRef.current) {
          circlesRef.current.style("opacity", (d: any) => {
            // 2: original
            // 3: predicted
            // 5: forget
            const dataCondition =
              // (d[2] === d[5] && !toggleOptions[0]) ||
              d[2] !== d[5] && viewMode === "Unlearning Target";
            const classCondition =
              // (d[3] === d[5] && !toggleOptions[2]) ||
              d[3] !== d[5] && viewMode === "Unlearning Failed";

            if (dataCondition || classCondition) return loweredOpacity;
            return defaultCircleOpacity;
          });
        }

        if (crossesRef.current) {
          crossesRef.current.style("opacity", (d: any) => {
            const dataCondition =
              // (d[2] === d[5] && !toggleOptions[0]) ||
              d[2] !== d[5] && viewMode === "Unlearning Target";
            const classCondition =
              // (d[3] === d[5] && !toggleOptions[2]) ||
              d[3] !== d[5] && viewMode === "Unlearning Failed";

            if (dataCondition || classCondition) return loweredOpacity;
            return defaultCrossOpacity;
          });
        }
      };

      updateOpacity();
    }, [viewMode]);

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
          }}
          className="shadow-xl"
        ></div>
      </div>
    );
  })
);

export default ScatterPlot;
