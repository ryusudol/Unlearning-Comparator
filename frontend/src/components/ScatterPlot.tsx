import React, {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useContext,
} from "react";
import * as d3 from "d3";

import { ForgetClassContext } from "../store/forget-class-context";
import { ExperimentsContext } from "../store/experiments-context";
import { forgetClassNames } from "../constants/forgetClassNames";
import { Mode, Prob, SelectedData } from "../views/Embeddings";
import { API_URL } from "../constants/common";
import { renderTooltip } from "../util";

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
const hoveredStrokeWidth = 2;

const UNLEARNING_TARGET = "Unlearning Target";
const UNLEARNING_FAILED = "Unlearning Failed";

interface Props {
  mode: Mode;
  data: SelectedData;
  viewMode: "All Instances" | "Unlearning Target" | "Unlearning Failed";
  onHover: (imgIdxOrNull: number | null, source?: Mode) => void;
  hoveredImgIdx: number | null;
}

const ScatterPlot = React.memo(
  forwardRef(({ mode, data, viewMode, onHover, hoveredImgIdx }: Props, ref) => {
    const { experiments } = useContext(ExperimentsContext);
    const { forgetClass } = useContext(ForgetClassContext);
    console.log(data);

    const fetchControllerRef = useRef<AbortController | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, undefined>>();
    const tooltipRef = useRef<HTMLDivElement | null>(null);
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
        new Set(Object.values(experiments).map((experiment) => experiment.fc)),
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

      return d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d[1] as number) as [number, number])
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

    const handleMouseEnter = useCallback(
      (event: MouseEvent, d: (number | Prob)[]): void => {
        const element = event.currentTarget as Element;

        onHover(d[4] as number, mode);

        if (containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();

          const tooltipXSize = 365;
          const tooltipYSize = 250;
          let xPosTooltip = event.clientX - containerRect.left + 10;
          let yPosTooltip = event.clientY - containerRect.top + 10;

          if (xPosTooltip + tooltipXSize > containerRect.width)
            xPosTooltip =
              event.clientX - containerRect.left - tooltipXSize - 10;
          if (yPosTooltip + tooltipYSize > containerRect.height)
            yPosTooltip = event.clientY - containerRect.top - tooltipYSize - 10;

          const controller = new AbortController();
          if (fetchControllerRef.current) {
            fetchControllerRef.current.abort();
          }
          fetchControllerRef.current = controller;

          const index = d[4];
          fetch(`${API_URL}/image/cifar10/${index}`)
            .then((response) => response.blob())
            .then((blob) => {
              if (controller.signal.aborted) return;
              const imageUrl = URL.createObjectURL(blob);
              if (tooltipRef.current) {
                tooltipRef.current.style.display = "block";
                tooltipRef.current.style.left = `${xPosTooltip}px`;
                tooltipRef.current.style.top = `${yPosTooltip}px`;
                const tooltipHtml = renderTooltip(
                  tooltipXSize,
                  tooltipYSize,
                  imageUrl,
                  d
                );
                console.log(tooltipHtml);
                tooltipRef.current.innerHTML = tooltipHtml;
              }
            })
            .catch((err) => {
              if (err.name === "AbortError") return;
            });
        }

        d3.select(element as Element)
          .attr("stroke", "black")
          .attr("stroke-width", hoveredStrokeWidth)
          .raise();
      },
      [mode, onHover]
    );

    const handleMouseLeave = useCallback(
      (event: MouseEvent, d: (number | Prob)[]): void => {
        if (tooltipRef.current) tooltipRef.current.style.display = "none";

        onHover(null);

        if (fetchControllerRef.current) {
          fetchControllerRef.current.abort();
          fetchControllerRef.current = null;
        }

        const element = event.currentTarget as Element;
        if (!element) return;

        const selection = d3.select(element);

        if (element.tagName === "circle") {
          selection
            .attr("stroke", null)
            .attr("stroke-width", null)
            .style("opacity", defaultCircleOpacity);
        } else if (element.tagName === "path") {
          const color = d3.color(z(d[3] as number));
          selection
            .attr("stroke", color ? color.darker().toString() : "black")
            .attr("stroke-width", XStrokeWidth)
            .style("opacity", defaultCrossOpacity);
        }
      },
      [onHover, z]
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
              `translate(${x(d[0] as number)},${y(d[1] as number)}) rotate(45)`
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

      if (hoveredImgIdx !== null) {
        if (circlesRef.current) {
          circlesRef.current
            .filter((d) => d[4] === hoveredImgIdx)
            .attr("stroke", "black")
            .attr("stroke-width", hoveredStrokeWidth)
            .raise();
        }
        if (crossesRef.current) {
          crossesRef.current
            .filter((d) => d[4] === hoveredImgIdx)
            .attr("stroke", "black")
            .attr("stroke-width", hoveredStrokeWidth)
            .raise();
        }

        let selectedElement: SVGCircleElement | SVGPathElement | null = null;
        if (circlesRef.current) {
          selectedElement = circlesRef.current
            .filter((d) => d[4] === hoveredImgIdx)
            .node() as SVGCircleElement;
        }
        if (!selectedElement && crossesRef.current) {
          selectedElement = crossesRef.current
            .filter((d) => d[4] === hoveredImgIdx)
            .node() as SVGPathElement;
        }

        if (selectedElement && containerRef.current) {
          const elementRect = selectedElement.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();

          const tooltipXSize = 365;
          const tooltipYSize = 265;
          let xPosTooltip = elementRect.left - containerRect.left + 10;
          let yPosTooltip = elementRect.top - containerRect.top + 10;

          if (xPosTooltip + tooltipXSize > containerRect.width)
            xPosTooltip =
              elementRect.left - containerRect.left - tooltipXSize - 10;
          if (yPosTooltip + tooltipYSize > containerRect.height)
            yPosTooltip =
              elementRect.top - containerRect.top - tooltipYSize - 10;

          const datum = data.find((d) => d[4] === hoveredImgIdx);
          if (datum) {
            const controller = new AbortController();
            const index = datum[4];
            fetch(`${API_URL}/image/cifar10/${index}`)
              .then((response) => response.blob())
              .then((blob) => {
                if (controller.signal.aborted) return;
                const imageUrl = URL.createObjectURL(blob);
                if (tooltipRef.current) {
                  tooltipRef.current.style.display = "block";
                  tooltipRef.current.style.left = `${xPosTooltip}px`;
                  tooltipRef.current.style.top = `${yPosTooltip}px`;
                  tooltipRef.current.innerHTML = renderTooltip(
                    tooltipXSize,
                    tooltipYSize,
                    imageUrl,
                    datum
                  );
                }
              })
              .catch((error) => {
                if (error.name === "AbortError") return;
              });
            return () => {
              controller.abort();
            };
          }
        }
      } else {
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "none";
        }
      }
    }, [hoveredImgIdx, data, z]);

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
            zIndex: 30,
          }}
          className="shadow-xl"
        ></div>
      </div>
    );
  })
);

export default ScatterPlot;
