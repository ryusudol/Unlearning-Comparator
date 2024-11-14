import { useRef, useEffect } from "react";
import * as d3 from "d3";

interface ZoomConfig {
  minZoom: number;
  maxZoom: number;
}

interface ZoomHandlers {
  onZoom: (transform: d3.ZoomTransform) => void;
}

export const useZoom = (
  svgRef: React.RefObject<SVGSVGElement>,
  config: ZoomConfig,
  handlers: ZoomHandlers
) => {
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, undefined>>();

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;

    const zoom = d3
      .zoom<SVGSVGElement, undefined>()
      .scaleExtent([config.minZoom, config.maxZoom])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, undefined>) => {
        handlers.onZoom(event.transform);
      });

    zoomRef.current = zoom;
    d3.select<SVGSVGElement, undefined>(svg).call(zoom);

    return () => {
      d3.select(svg).on(".zoom", null);
    };
  }, [config, svgRef, handlers]);

  const resetZoom = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call(zoomRef.current.transform as any, d3.zoomIdentity);
    }
  };

  return {
    resetZoom,
  };
};
