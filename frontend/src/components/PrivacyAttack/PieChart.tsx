import { useEffect, useRef } from "react";
import * as d3 from "d3";

import { COLORS } from "../../constants/colors";
import { PieDataPoint } from "../../types/privacy-attack";

const CONFIG = {
  WIDTH: 160,
  HEIGHT: 160,
  RADIUS: Math.min(160, 160) / 2.5,
};

interface Props {
  data: any[];
  threshold: number;
}

export default function PieChartDisplay({ data, threshold }: Props) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const processedData = processData(data, threshold);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${CONFIG.WIDTH / 2}, ${CONFIG.HEIGHT / 2})`
      );

    const pie = d3
      .pie<PieDataPoint>()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<PieDataPoint>>()
      .innerRadius(0)
      .outerRadius(CONFIG.RADIUS);

    g.selectAll("path")
      .data(pie(processedData))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => d.data.color);
  }, [data, threshold]);

  return <svg ref={svgRef} width={CONFIG.WIDTH} height={CONFIG.HEIGHT}></svg>;
}

function processData(data: any[], threshold: number) {
  return [
    {
      label: "",
      value: data.filter((d) => d.entropy < threshold && d.type === "default")
        .length,
      color: COLORS.DARK_GRAY,
    },
    {
      label: "",
      value: data.filter((d) => d.entropy < threshold && d.type === "payback")
        .length,
      color: COLORS.DARK_GRAY,
    },
    {
      label: "",
      value: data.filter((d) => d.entropy >= threshold && d.type === "default")
        .length,
      color: COLORS.PURPLE,
    },
    {
      label: "",
      value: data.filter((d) => d.entropy >= threshold && d.type === "payback")
        .length,
      color: COLORS.PURPLE,
    },
  ];
}
