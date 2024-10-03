import {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
  useCallback,
} from "react";
import * as d3 from "d3";

interface Props {
  data: number[][];
  width: number;
  height: number;
}

const Chart = forwardRef(({ data, width, height }: Props, ref) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const k = height / width;

  const x = d3.scaleLinear().domain([-4.5, 4.5]).range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([-4.5 * k, 4.5 * k])
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

  const zoomRef = useRef<d3.ZoomBehavior<SVGRectElement, undefined>>();
  const svgSelectionRef =
    useRef<d3.Selection<SVGSVGElement, undefined, null, undefined>>();

  useEffect(() => {
    const chart = () => {
      const svgElement = d3
        .create<SVGSVGElement>("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .attr("preserveAspectRatio", "xMidYMid meet");

      const gMain = svgElement.append("g");

      const rect = svgElement
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all");

      const gDot = gMain
        .append("g")
        .attr("fill", "none")
        .attr("stroke-linecap", "round");

      gDot
        .selectAll("path")
        .data(data as [number, number, number][])
        .join("path")
        .attr("d", (d) => `M${x(d[0])},${y(d[1])}h0`)
        .attr("stroke", (d) => z(d[2]))
        .style("pointer-events", "visiblePainted");

      const gx = gMain.append("g");
      const gy = gMain.append("g");

      function zoomed(event: d3.D3ZoomEvent<SVGRectElement, undefined>) {
        const transform = event.transform;
        gMain.attr("transform", transform.toString());
        gDot.attr("stroke-width", 4 / transform.k);
        const zx = transform.rescaleX(x).interpolate(d3.interpolateRound);
        const zy = transform.rescaleY(y).interpolate(d3.interpolateRound);
        gx.call(xAxis, zx);
        gy.call(yAxis, zy);
      }

      const zoom = d3
        .zoom<SVGRectElement, undefined>()
        .scaleExtent([0.5, 32])
        .on("zoom", zoomed);

      zoomRef.current = zoom;

      rect.call(zoom);

      svgSelectionRef.current = svgElement;

      return svgElement.node() as SVGSVGElement;
    };

    const svgElement = chart();

    if (svgRef.current) {
      svgRef.current.appendChild(svgElement);
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
});

export default Chart;
