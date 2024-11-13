import React, {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useContext,
  useState,
} from "react";
import * as d3 from "d3";

import Tooltip from "./Tooltip";
import { ForgetClassContext } from "../store/forget-class-context";
import { ExperimentsContext } from "../store/experiments-context";
import { forgetClassNames } from "../constants/forgetClassNames";
import { Mode, Prob, SelectedData, HovereInstance } from "../views/Embeddings";
import { API_URL } from "../constants/common";

const dotSize = 4;
const minZoom = 0.6;
const maxZoom = 32;
const width = 672;
const height = 672;
const XSizeDivider = 0.4;
const XStrokeWidth = 1;
const crossSize = 4;
const loweredOpacity = 0.1;
const hoveredStrokeWidth = 2;
const paddingRatio = 0.01;
const tooltipXSize = 450;
const tooltipYSize = 320;
export const defaultCrossOpacity = 0.85;
export const defaultCircleOpacity = 0.6;

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
      const { experiments } = useContext(ExperimentsContext);
      const { forgetClass } = useContext(ForgetClassContext);

      const [tooltipContent, setTooltipContent] = useState<JSX.Element | null>(
        null
      );
      const [tooltipPosition, setTooltipPosition] = useState<{
        x: number;
        y: number;
      } | null>(null);

      const fetchControllerRef = useRef<AbortController | null>(null);
      const svgRef = useRef<SVGSVGElement | null>(null);
      const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, undefined>>();
      const containerRef = useRef<HTMLDivElement | null>(null);
      const svgSelectionRef =
        useRef<d3.Selection<SVGSVGElement, undefined, null, undefined>>();
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

      const unlearnedFCIndices = useMemo(
        () =>
          new Set(
            Object.values(experiments).map((experiment) => experiment.fc)
          ),
        [experiments]
      );

      const unlearnedFCList = useMemo(
        () => forgetClassNames.filter((_, idx) => unlearnedFCIndices.has(idx)),
        [unlearnedFCIndices]
      );

      const x = useMemo(() => {
        if (data.length === 0)
          return d3.scaleLinear().domain([0, 1]).range([0, width]);

        return d3
          .scaleLinear()
          .domain(d3.extent(data, (d) => d[0] as number) as [number, number])
          .nice()
          .range([0, width]);
      }, [data]);

      const y = useMemo(() => {
        if (data.length === 0)
          return d3.scaleLinear().domain([0, 1]).range([height, 0]);

        const [min, max] = d3.extent(data, (d) => d[1] as number) as [
          number,
          number
        ];
        const padding = (max - min) * paddingRatio;

        return d3
          .scaleLinear()
          .domain([min - padding, max + padding])
          .nice()
          .range([height, 0]);
      }, [data]);

      const z = useMemo(
        () =>
          d3
            .scaleOrdinal<number, string>()
            .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
            .range(d3.schemeTableau10),
        []
      );

      useImperativeHandle(ref, () => ({
        reset: () => {
          if (zoomRef.current && svgSelectionRef.current) {
            zoomRef.current.transform(
              svgSelectionRef.current.transition().duration(750),
              d3.zoomIdentity
            );
          }
        },
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

              const absoluteX = transformedPoint.x;
              const absoluteY = transformedPoint.y;

              return { x: absoluteX, y: absoluteY };
            }
          }
          return null;
        },
      }));

      const handleClick = useCallback(
        (event: MouseEvent, d: (number | Prob)[]) => {
          onHover(d[4] as number, mode, d[5] as Prob);

          if (fetchControllerRef.current) {
            fetchControllerRef.current.abort();
          }

          const controller = new AbortController();
          fetchControllerRef.current = controller;

          if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            let xPosTooltip = event.clientX - containerRect.left + 10;
            let yPosTooltip = event.clientY - containerRect.top + 10;

            if (xPosTooltip + tooltipXSize > containerRect.width) {
              xPosTooltip =
                event.clientX - containerRect.left - tooltipXSize - 10;
            }
            if (yPosTooltip + tooltipYSize > containerRect.height) {
              yPosTooltip =
                event.clientY - containerRect.top - tooltipYSize - 10;
            }

            setTooltipPosition({ x: xPosTooltip, y: yPosTooltip });
          }

          fetch(`${API_URL}/image/cifar10/${d[4]}`, {
            signal: controller.signal,
          })
            .then((response) => response.blob())
            .then((blob) => {
              if (controller.signal.aborted) return;

              const prob = d[5] as Prob;
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
                        value: Number(
                          hoveredInstance?.baselineProb?.[idx] || 0
                        ),
                      })),
                      comparison: Array.from({ length: 10 }, (_, idx) => ({
                        class: idx,
                        value: Number(prob[idx] || 0),
                      })),
                    };

              setTooltipContent(
                <Tooltip
                  width={tooltipXSize}
                  height={tooltipYSize}
                  imageUrl={imageUrl}
                  data={d}
                  barChartData={barChartData}
                />
              );
            })
            .catch((err) => {
              if (err.name === "AbortError") return;
            });
        },
        [
          hoveredInstance?.baselineProb,
          hoveredInstance?.comparisonProb,
          mode,
          onHover,
        ]
      );

      const handleMouseEnter = useCallback(
        (event: MouseEvent, d: (number | Prob)[]) => {
          onHover(d[4] as number, mode);
          const element = event.currentTarget as Element;
          d3.select(element)
            .attr("stroke", "black")
            .attr("stroke-width", hoveredStrokeWidth)
            .raise();
        },
        [mode, onHover]
      );

      const handleMouseLeave = useCallback(
        (event: MouseEvent) => {
          onHover(null, mode);
          const element = event.currentTarget as Element;
          const selection = d3.select(element);

          if (element.tagName === "circle") {
            selection
              .attr("stroke", null)
              .attr("stroke-width", null)
              .style("opacity", defaultCircleOpacity);
          } else {
            const color = d3.color(z((selection.datum() as any)[3]));
            selection
              .attr("stroke", color ? color.darker().toString() : "black")
              .attr("stroke-width", XStrokeWidth)
              .style("opacity", defaultCrossOpacity);
          }
        },
        [mode, onHover, z]
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

          gMain
            .append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all");

          const gDot = gMain.append("g");

          const circles = gDot
            .selectAll<SVGCircleElement, number[]>("circle")
            .data(data.filter((d) => d[2] !== forgetClass))
            .join("circle")
            .attr("cx", (d) => x(d[0] as number))
            .attr("cy", (d) => y(d[1] as number))
            .attr("r", dotSize)
            .attr("fill", (d) => z(d[3] as number))
            .style("cursor", "pointer")
            .style("opacity", defaultCircleOpacity)
            .style("vector-effect", "non-scaling-stroke");

          const crosses = gDot
            .selectAll<SVGPathElement, number[]>("path")
            .data(data.filter((d) => d[2] === forgetClass))
            .join("path")
            .attr(
              "transform",
              (d) =>
                `translate(${x(d[0] as number)},${y(
                  d[1] as number
                )}) rotate(45)`
            )
            .attr(
              "d",
              d3
                .symbol()
                .type(d3.symbolCross)
                .size(Math.pow(crossSize / XSizeDivider, 2))
            )
            .attr("fill", (d) => z(d[3] as number))
            .attr("stroke", (d) => {
              const color = d3.color(z(d[3] as number));
              return color ? color.darker().toString() : "black";
            })
            .attr("stroke-width", XStrokeWidth)
            .style("cursor", "pointer")
            .style("opacity", defaultCrossOpacity);

          circlesRef.current = circles;
          crossesRef.current = crosses;

          circles
            .on("click", handleClick)
            .on("mouseenter", handleMouseEnter)
            .on("mouseleave", handleMouseLeave);

          crosses
            .on("click", handleClick)
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
                const xPos = x(d[0] as number);
                const yPos = y(d[1] as number);
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

        if (data.length > 0) {
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
      }, [
        forgetClass,
        handleClick,
        handleMouseEnter,
        handleMouseLeave,
        mode,
        onHover,
        data,
        unlearnedFCList.length,
        x,
        y,
        z,
      ]);

      useEffect(() => {
        const updateOpacity = () => {
          if (circlesRef.current) {
            circlesRef.current
              .style("opacity", (d: any) => {
                const dataCondition =
                  d[2] !== forgetClass && viewMode === UNLEARNING_TARGET;
                const classCondition =
                  d[3] !== forgetClass && viewMode === UNLEARNING_FAILED;

                if (dataCondition || classCondition) return loweredOpacity;
                return defaultCircleOpacity;
              })
              .style("pointer-events", (d: any) => {
                const dataCondition =
                  d[2] !== forgetClass && viewMode === UNLEARNING_TARGET;
                const classCondition =
                  d[3] !== forgetClass && viewMode === UNLEARNING_FAILED;

                if (dataCondition || classCondition) return "none";
                return "auto";
              });
          }

          if (crossesRef.current) {
            crossesRef.current
              .style("opacity", (d: any) => {
                const dataCondition =
                  d[2] !== forgetClass && viewMode === UNLEARNING_TARGET;
                const classCondition =
                  d[3] !== forgetClass && viewMode === UNLEARNING_FAILED;

                if (dataCondition || classCondition) return loweredOpacity;
                return defaultCrossOpacity;
              })
              .style("pointer-events", (d: any) => {
                const dataCondition =
                  d[2] !== forgetClass && viewMode === UNLEARNING_TARGET;
                const classCondition =
                  d[3] !== forgetClass && viewMode === UNLEARNING_FAILED;

                if (dataCondition || classCondition) return "none";
                return "auto";
              });
          }
        };

        updateOpacity();
      }, [forgetClass, viewMode]);

      useEffect(() => {
        if (!circlesRef.current && !crossesRef.current) return;

        const resetStyles = () => {
          if (circlesRef.current) {
            circlesRef.current
              .attr("stroke", null)
              .attr("stroke-width", null)
              .style("opacity", defaultCircleOpacity);
          }
          if (crossesRef.current) {
            crossesRef.current
              .attr("stroke", (d) => {
                const color = d3.color(z(d[3] as number));
                return color ? color.darker().toString() : "black";
              })
              .attr("stroke-width", XStrokeWidth)
              .style("opacity", defaultCrossOpacity);
          }
        };

        resetStyles();

        if (hoveredInstance?.imgIdx !== null) {
          const applyHoverStyle = (
            selection: d3.Selection<any, any, any, any>
          ) => {
            selection
              .filter((d) => d[4] === hoveredInstance?.imgIdx)
              .attr("stroke", "black")
              .attr("stroke-width", hoveredStrokeWidth)
              .raise();
          };

          if (circlesRef.current) applyHoverStyle(circlesRef.current);
          if (crossesRef.current) applyHoverStyle(crossesRef.current);
        }
      }, [hoveredInstance, data, z]);

      useEffect(() => {
        const handleDocumentClick = (event: MouseEvent) => {
          const target = event.target as Element;
          if (!target.closest("circle") && !target.closest("path")) {
            setTooltipContent(null);
            setTooltipPosition(null);
          }
        };

        document.addEventListener("click", handleDocumentClick);
        return () => {
          document.removeEventListener("click", handleDocumentClick);
        };
      }, []);

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
          <svg ref={svgRef} style={{ width: "100%", height: "100%" }}></svg>
          {tooltipContent && tooltipPosition && (
            <div
              style={{
                position: "absolute",
                left: tooltipPosition.x,
                top: tooltipPosition.y,
                pointerEvents: "none",
                backgroundColor: "white",
                padding: "5px",
                border: "1px solid rgba(0, 0, 0, 0.25)",
                borderRadius: "4px",
                zIndex: 30,
              }}
              className="shadow-xl"
            >
              {tooltipContent}
            </div>
          )}
        </div>
      );
    }
  )
);

export default ScatterPlot;
