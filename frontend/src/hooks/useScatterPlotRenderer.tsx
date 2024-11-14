import { useRef, useEffect } from "react";
import * as d3 from "d3";
import { SelectedData, Prob } from "../views/Embeddings";

interface RendererConfig {
  width: number;
  height: number;
  dotSize: number;
  crossSize: number;
  XSizeDivider: number;
  XStrokeWidth: number;
  defaultCircleOpacity: number;
  defaultCrossOpacity: number;
}

interface RendererHandlers {
  onClick: (event: MouseEvent, d: (number | Prob)[]) => void;
  onMouseEnter: (event: MouseEvent, d: (number | Prob)[]) => void;
  onMouseLeave: (event: MouseEvent) => void;
}

export const useScatterPlotRenderer = (
  svgRef: React.RefObject<SVGSVGElement>,
  data: SelectedData,
  forgetClass: number,
  scales: {
    x: d3.ScaleLinear<number, number>;
    y: d3.ScaleLinear<number, number>;
    z: d3.ScaleOrdinal<number, string>;
  },
  config: RendererConfig,
  handlers: RendererHandlers
) => {
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

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, config.width, config.height])
      .attr("width", config.width)
      .attr("height", config.height)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const gMain = svg.append("g");
    gMainRef.current = gMain;

    gMain
      .append("rect")
      .attr("width", config.width)
      .attr("height", config.height)
      .style("fill", "none")
      .style("pointer-events", "all");

    const gDot = gMain.append("g");

    const circles = gDot
      .selectAll<SVGCircleElement, (number | Prob)[]>("circle")
      .data(data.filter((d) => d[2] !== forgetClass))
      .join("circle")
      .attr("cx", (d) => scales.x(d[0] as number))
      .attr("cy", (d) => scales.y(d[1] as number))
      .attr("r", config.dotSize)
      .attr("fill", (d) => scales.z(d[3] as number))
      .style("cursor", "pointer")
      .style("opacity", config.defaultCircleOpacity)
      .style("vector-effect", "non-scaling-stroke");

    const crosses = gDot
      .selectAll<SVGPathElement, (number | Prob)[]>("path")
      .data(data.filter((d) => d[2] === forgetClass))
      .join("path")
      .attr(
        "transform",
        (d) =>
          `translate(${scales.x(d[0] as number)},${scales.y(
            d[1] as number
          )}) rotate(45)`
      )
      .attr(
        "d",
        d3
          .symbol()
          .type(d3.symbolCross)
          .size(Math.pow(config.crossSize / config.XSizeDivider, 2))
      )
      .attr("fill", (d) => scales.z(d[3] as number))
      .attr("stroke", (d) => {
        const color = d3.color(scales.z(d[3] as number));
        return color ? color.darker().toString() : "black";
      })
      .attr("stroke-width", config.XStrokeWidth)
      .style("cursor", "pointer")
      .style("opacity", config.defaultCrossOpacity);

    circles
      .on("click", handlers.onClick)
      .on("mouseenter", handlers.onMouseEnter)
      .on("mouseleave", handlers.onMouseLeave);

    crosses
      .on("click", handlers.onClick)
      .on("mouseenter", handlers.onMouseEnter)
      .on("mouseleave", handlers.onMouseLeave);

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
  }, [data, forgetClass, scales, config, handlers, svgRef]);

  return {
    circlesRef,
    crossesRef,
    gMainRef,
  };
};
