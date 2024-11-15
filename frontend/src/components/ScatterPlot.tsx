import React, {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
  useContext,
} from "react";
import * as d3 from "d3";

import { useScatterPlotScales } from "../hooks/useScatterPlotScales";
import { useZoom } from "../hooks/useZoom";
import { useTooltip } from "../hooks/useTooltip";
import { useScatterPlotRenderer } from "../hooks/useScatterPlotRenderer";
import { ForgetClassContext } from "../store/forget-class-context";
import { Mode, Prob, SelectedData, HovereInstance } from "../views/Embeddings";

const CONFIG = {
  width: 672,
  height: 672,
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

      const scales = useScatterPlotScales(
        data,
        CONFIG.width,
        CONFIG.height,
        CONFIG.paddingRatio
      );

      const handleZoom = (transform: d3.ZoomTransform) => {
        if (rendererRefs.gMainRef.current) {
          rendererRefs.gMainRef.current.attr("transform", transform.toString());

          if (rendererRefs.circlesRef.current) {
            rendererRefs.circlesRef.current.attr(
              "r",
              CONFIG.dotSize / transform.k
            );
          }

          if (rendererRefs.crossesRef.current) {
            rendererRefs.crossesRef.current.attr("transform", (d) => {
              const xPos = scales.x(d[0] as number);
              const yPos = scales.y(d[1] as number);
              const scale = 1 / transform.k;
              return `translate(${xPos},${yPos}) scale(${scale}) rotate(45)`;
            });
          }
        }
      };

      const { resetZoom } = useZoom(
        svgRef,
        { minZoom: CONFIG.minZoom, maxZoom: CONFIG.maxZoom },
        { onZoom: handleZoom }
      );

      const { handleTooltip, hideTooltip } = useTooltip(mode, hoveredInstance, {
        containerRef,
        tooltipXSize: CONFIG.tooltipXSize,
        tooltipYSize: CONFIG.tooltipYSize,
      });

      const handleClick = (event: MouseEvent, d: (number | Prob)[]) => {
        onHover(d[4] as number, mode, d[5] as Prob);
        handleTooltip(event, d);
      };

      const handleMouseEnter = (event: MouseEvent, d: (number | Prob)[]) => {
        onHover(d[4] as number, mode);
        const element = event.currentTarget as Element;
        d3.select(element)
          .attr("stroke", "black")
          .attr("stroke-width", CONFIG.hoveredStrokeWidth)
          .raise();
      };

      const handleMouseLeave = (event: MouseEvent) => {
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
          const color = d3.color(scales.z((selection.datum() as any)[3]));
          selection
            .attr("stroke", color ? color.darker().toString() : "black")
            .attr("stroke-width", CONFIG.XStrokeWidth)
            .style("opacity", CONFIG.defaultCrossOpacity);
        }
      };

      const rendererRefs = useScatterPlotRenderer(
        svgRef,
        data,
        forgetClass ?? -1,
        scales,
        CONFIG,
        {
          onClick: handleClick,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        }
      );

      useImperativeHandle(ref, () => ({
        reset: resetZoom,
        getInstancePosition: (imgIdx: number) => {
          const datum = data.find((d) => d[4] === imgIdx);
          if (datum && svgRef.current) {
            const svgElement = svgRef.current;
            const point = svgElement.createSVGPoint();

            const svgX = scales.x(datum[0] as number);
            const svgY = scales.y(datum[1] as number);

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
        if (
          !rendererRefs.circlesRef.current &&
          !rendererRefs.crossesRef.current
        )
          return;

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

        if (rendererRefs.circlesRef.current) {
          updateOpacity(rendererRefs.circlesRef.current);
        }
        if (rendererRefs.crossesRef.current) {
          updateOpacity(rendererRefs.crossesRef.current);
        }
      }, [forgetClass, viewMode, rendererRefs]);

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
