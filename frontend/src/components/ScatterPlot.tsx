import React, {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useContext,
  useCallback,
} from "react";
import { createRoot, Root } from "react-dom/client";
import * as d3 from "d3";

import Tooltip from "./EmbeddingTooltip";
import { API_URL } from "../constants/common";
import { ForgetClassContext } from "../store/forget-class-context";
import { Mode, Prob, SelectedData, HovereInstance } from "../views/Embeddings";

const CONFIG = {
  width: 630,
  height: 630,
  dotSize: 4,
  minZoom: 0.6,
  maxZoom: 32,
  XSizeDivider: 0.4,
  XStrokeWidth: 1,
  crossSize: 4,
  loweredOpacity: 0.1,
  hoveredStrokeWidth: 2,
  paddingRatio: 0.01,
  tooltipXSize: 460,
  tooltipYSize: 320,
  defaultCrossOpacity: 0.85,
  defaultCircleOpacity: 0.6,
} as const;
const BLACK = "black";
const UNLEARNING_TARGET = "Unlearning Target";
const UNLEARNING_FAILED = "Unlearning Failed";

interface Props {
  mode: Mode;
  data: SelectedData;
  viewMode: "All Instances" | "Unlearning Target" | "Unlearning Failed";
  onHover: (imgIdxOrNull: number | null, source?: Mode, prob?: Prob) => void;
  hoveredInstance: HovereInstance | null;
}

const ScatterPlot = React.memo(
  forwardRef(
    ({ mode, data, viewMode, onHover, hoveredInstance }: Props, ref) => {
      const { forgetClass } = useContext(ForgetClassContext);

      const svgRef = useRef<SVGSVGElement | null>(null);
      const containerRef = useRef<HTMLDivElement | null>(null);
      const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, undefined>>();
      const tooltipRef = useRef<HTMLDivElement | null>(null);
      const rootRef = useRef<Root | null>(null);
      const fetchControllerRef = useRef<AbortController | null>(null);
      const circlesRef = useRef<d3.Selection<
        SVGCircleElement,
        (number | Prob)[],
        SVGGElement,
        undefined
      > | null>(null);
      const crossesRef = useRef<d3.Selection<
        SVGPathElement,
        (number | Prob)[],
        SVGGElement,
        undefined
      > | null>(null);
      const gMainRef = useRef<d3.Selection<
        SVGGElement,
        unknown,
        null,
        undefined
      > | null>(null);

      const x = useMemo(() => {
        if (data.length === 0) {
          return d3.scaleLinear().domain([0, 1]).range([0, CONFIG.width]);
        }

        return d3
          .scaleLinear()
          .domain(d3.extent(data, (d) => d[0] as number) as [number, number])
          .nice()
          .range([0, CONFIG.width]);
      }, [data]);

      const y = useMemo(() => {
        if (data.length === 0) {
          return d3.scaleLinear().domain([0, 1]).range([CONFIG.height, 0]);
        }

        const [min, max] = d3.extent(data, (d) => d[1] as number) as [
          number,
          number
        ];
        const padding = (max - min) * CONFIG.paddingRatio;

        return d3
          .scaleLinear()
          .domain([min - padding, max + padding])
          .nice()
          .range([CONFIG.height, 0]);
      }, [data]);

      const z = useMemo(
        () =>
          d3
            .scaleOrdinal<number, string>()
            .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
            .range(d3.schemeTableau10),
        []
      );

      const handleZoom = useCallback(
        (transform: d3.ZoomTransform) => {
          if (gMainRef.current) {
            gMainRef.current.attr("transform", transform.toString());

            if (circlesRef.current) {
              circlesRef.current.attr("r", CONFIG.dotSize / transform.k);
            }

            if (crossesRef.current) {
              crossesRef.current.attr("transform", (d) => {
                const xPos = x(d[0] as number);
                const yPos = y(d[1] as number);
                const scale = 1 / transform.k;
                return `translate(${xPos},${yPos}) scale(${scale}) rotate(45)`;
              });
            }
          }
        },
        [x, y]
      );

      useEffect(() => {
        if (!svgRef.current) return;

        const svg = svgRef.current;

        const zoom = d3
          .zoom<SVGSVGElement, undefined>()
          .scaleExtent([CONFIG.minZoom, CONFIG.maxZoom])
          .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, undefined>) => {
            handleZoom(event.transform);
          });

        zoomRef.current = zoom;
        d3.select<SVGSVGElement, undefined>(svg).call(zoom);

        return () => {
          d3.select(svg).on(".zoom", null);
        };
      }, [handleZoom]);

      const resetZoom = () => {
        if (zoomRef.current && svgRef.current) {
          d3.select(svgRef.current)
            .transition()
            .duration(750)
            .call(zoomRef.current.transform as any, d3.zoomIdentity);
        }
      };

      useEffect(() => {
        return () => {
          if (tooltipRef.current) {
            tooltipRef.current.remove();
          }
        };
      }, []);

      const showTooltip = (
        event: MouseEvent,
        data: (number | Prob)[],
        content: JSX.Element
      ) => {
        if (!containerRef.current) return;

        if (tooltipRef.current) {
          rootRef.current?.unmount();
          tooltipRef.current.remove();
        }

        const containerRect = containerRef.current.getBoundingClientRect();
        let xPos = event.clientX - containerRect.left + 10;
        let yPos = event.clientY - containerRect.top + 10;

        if (xPos + CONFIG.tooltipXSize > containerRect.width) {
          xPos = event.clientX - containerRect.left - CONFIG.tooltipXSize - 10;
          if (xPos < 0) {
            xPos = 0;
          }
        }

        if (yPos + CONFIG.tooltipYSize > containerRect.height) {
          yPos = event.clientY - containerRect.top - CONFIG.tooltipYSize - 10;
          if (yPos < 0) {
            yPos = 0;
          }
        }

        const tooltipDiv = document.createElement("div");
        tooltipDiv.style.position = "absolute";
        tooltipDiv.style.left = `${xPos}px`;
        tooltipDiv.style.top = `${yPos}px`;
        tooltipDiv.style.pointerEvents = "none";
        tooltipDiv.style.backgroundColor = "white";
        tooltipDiv.style.padding = "5px";
        tooltipDiv.style.border = "1px solid rgba(0, 0, 0, 0.25)";
        tooltipDiv.style.borderRadius = "4px";
        tooltipDiv.style.zIndex = "30";
        tooltipDiv.className = "shadow-xl";

        containerRef.current.appendChild(tooltipDiv);
        tooltipRef.current = tooltipDiv;

        rootRef.current = createRoot(tooltipDiv);
        rootRef.current.render(content);
      };

      const hideTooltip = useCallback(() => {
        if (tooltipRef.current) {
          rootRef.current?.unmount();
          tooltipRef.current.remove();
          tooltipRef.current = null;
          rootRef.current = null;
        }
      }, []);

      const handleTooltip = useCallback(
        async (event: MouseEvent, data: (number | Prob)[]) => {
          if (fetchControllerRef.current) {
            fetchControllerRef.current.abort();
          }

          const controller = new AbortController();
          fetchControllerRef.current = controller;

          try {
            const response = await fetch(
              `${API_URL}/image/cifar10/${data[4]}`,
              {
                signal: controller.signal,
              }
            );

            if (!response.ok) throw new Error("Failed to fetch image");

            const blob = await response.blob();
            if (controller.signal.aborted) return;

            const prob = data[5] as Prob;
            const imageUrl = URL.createObjectURL(blob);

            const barChartData =
              mode === "Baseline"
                ? {
                    baseline: Array.from({ length: 10 }, (_, idx) => ({
                      class: idx,
                      value: Number(prob[idx] || 0),
                    })),
                    comparison: Array.from({ length: 10 }, (_, idx) => ({
                      class: idx,
                      value: Number(
                        hoveredInstance?.comparisonProb?.[idx] || 0
                      ),
                    })),
                  }
                : {
                    baseline: Array.from({ length: 10 }, (_, idx) => ({
                      class: idx,
                      value: Number(hoveredInstance?.baselineProb?.[idx] || 0),
                    })),
                    comparison: Array.from({ length: 10 }, (_, idx) => ({
                      class: idx,
                      value: Number(prob[idx] || 0),
                    })),
                  };

            const tooltipContent = (
              <Tooltip
                width={CONFIG.tooltipXSize}
                height={CONFIG.tooltipYSize}
                imageUrl={imageUrl}
                data={data}
                barChartData={barChartData}
              />
            );

            showTooltip(event, data, tooltipContent);

            return () => {
              URL.revokeObjectURL(imageUrl);
            };
          } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return;
            console.error("Failed to fetch tooltip data:", err);
          }
        },
        [hoveredInstance?.baselineProb, hoveredInstance?.comparisonProb, mode]
      );

      useEffect(() => {
        return () => {
          if (fetchControllerRef.current) {
            fetchControllerRef.current.abort();
          }
        };
      }, []);

      const handleClick = useCallback(
        (event: MouseEvent, d: (number | Prob)[]) => {
          onHover(d[4] as number, mode, d[5] as Prob);
          handleTooltip(event, d);
        },
        [handleTooltip, mode, onHover]
      );

      const handleMouseEnter = useCallback(
        (event: MouseEvent, d: (number | Prob)[]) => {
          onHover(d[4] as number, mode);
          const element = event.currentTarget as Element;
          d3.select(element)
            .attr("stroke", BLACK)
            .attr("stroke-width", CONFIG.hoveredStrokeWidth)
            .raise();
        },
        [mode, onHover]
      );

      const handleMouseLeave = useCallback(
        (event: MouseEvent) => {
          onHover(null, mode);
          hideTooltip();
          const element = event.currentTarget as Element;
          const selection = d3.select(element);

          if (element.tagName === "circle") {
            selection
              .attr("stroke", null)
              .attr("stroke-width", null)
              .style("opacity", CONFIG.defaultCircleOpacity);
          } else {
            const colorStr = z((selection.datum() as any)[3]);
            const color = d3.color(colorStr);
            selection
              .attr("stroke", color ? color.darker().toString() : BLACK)
              .attr("stroke-width", CONFIG.XStrokeWidth)
              .style("opacity", CONFIG.defaultCrossOpacity);
          }
        },
        [hideTooltip, mode, onHover, z]
      );

      useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3
          .select(svgRef.current)
          .attr("viewBox", [0, 0, CONFIG.width, CONFIG.height])
          .attr("width", CONFIG.width)
          .attr("height", CONFIG.height)
          .attr("preserveAspectRatio", "xMidYMid meet");

        const gMain = svg.append("g");
        gMainRef.current = gMain;

        gMain
          .append("rect")
          .attr("width", CONFIG.width)
          .attr("height", CONFIG.height)
          .style("fill", "none")
          .style("pointer-events", "all");

        const gDot = gMain.append("g");

        const circles = gDot
          .selectAll<SVGCircleElement, (number | Prob)[]>("circle")
          .data(data.filter((d) => d[2] !== forgetClass))
          .join("circle")
          .attr("cx", (d) => x(d[0] as number))
          .attr("cy", (d) => y(d[1] as number))
          .attr("r", CONFIG.dotSize)
          .attr("fill", (d) => z(d[3] as number))
          .style("cursor", "pointer")
          .style("opacity", CONFIG.defaultCircleOpacity)
          .style("vector-effect", "non-scaling-stroke");

        const crosses = gDot
          .selectAll<SVGPathElement, (number | Prob)[]>("path")
          .data(data.filter((d) => d[2] === forgetClass))
          .join("path")
          .attr(
            "transform",
            (d) =>
              `translate(${x(d[0] as number)},${y(d[1] as number)}) rotate(45)`
          )
          .attr(
            "d",
            d3
              .symbol()
              .type(d3.symbolCross)
              .size(Math.pow(CONFIG.crossSize / CONFIG.XSizeDivider, 2))
          )
          .attr("fill", (d) => z(d[3] as number))
          .attr("stroke", (d) => {
            const color = d3.color(z(d[3] as number));
            return color ? color.darker().darker().toString() : "black";
          })
          .attr("stroke-width", CONFIG.XStrokeWidth)
          .style("cursor", "pointer")
          .style("opacity", CONFIG.defaultCrossOpacity);

        circles
          .on("click", handleClick)
          .on("mouseenter", handleMouseEnter)
          .on("mouseleave", handleMouseLeave);

        crosses
          .on("click", handleClick)
          .on("mouseenter", handleMouseEnter)
          .on("mouseleave", handleMouseLeave);

        circlesRef.current = circles;
        crossesRef.current = crosses;

        return () => {
          if (circlesRef.current) {
            circlesRef.current
              .on("click", null)
              .on("mouseenter", null)
              .on("mouseleave", null);
          }
          if (crossesRef.current) {
            crossesRef.current
              .on("click", null)
              .on("mouseenter", null)
              .on("mouseleave", null);
          }
        };
      }, [
        data,
        forgetClass,
        handleClick,
        handleMouseEnter,
        handleMouseLeave,
        x,
        y,
        z,
      ]);

      useImperativeHandle(ref, () => ({
        reset: resetZoom,
        getInstancePosition: (imgIdx: number) => {
          const datum = data.find((d) => d[4] === imgIdx);
          if (datum && svgRef.current) {
            const svgElement = svgRef.current;
            const point = svgElement.createSVGPoint();

            const svgX = x(datum[0] as number);
            const svgY = y(datum[1] as number);

            point.x = svgX;
            point.y = svgY;

            const ctm = svgElement.getScreenCTM();
            if (ctm) {
              const transformedPoint = point.matrixTransform(ctm);
              return {
                x: transformedPoint.x,
                y: transformedPoint.y,
              };
            }
          }
          return null;
        },
      }));

      useEffect(() => {
        if (!circlesRef.current && !crossesRef.current) return;

        const updateOpacity = (selection: d3.Selection<any, any, any, any>) => {
          selection
            .style("opacity", (d: any) => {
              const dataCondition =
                d[2] !== forgetClass && viewMode === UNLEARNING_TARGET;
              const classCondition =
                d[3] !== forgetClass && viewMode === UNLEARNING_FAILED;

              if (dataCondition || classCondition) return CONFIG.loweredOpacity;
              return selection.node()?.tagName === "circle"
                ? CONFIG.defaultCircleOpacity
                : CONFIG.defaultCrossOpacity;
            })
            .style("pointer-events", (d: any) => {
              const dataCondition =
                d[2] !== forgetClass && viewMode === UNLEARNING_TARGET;
              const classCondition =
                d[3] !== forgetClass && viewMode === UNLEARNING_FAILED;

              return dataCondition || classCondition ? "none" : "auto";
            });
        };

        if (circlesRef.current) {
          updateOpacity(circlesRef.current);
        }
        if (crossesRef.current) {
          updateOpacity(crossesRef.current);
        }
      }, [forgetClass, viewMode]);

      return (
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />
        </div>
      );
    }
  )
);

export default ScatterPlot;
