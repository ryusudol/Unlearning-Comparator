import { useEffect, useRef } from "react";
import * as d3 from "d3";

import { COLORS } from "../../constants/colors";
import { PieDataPoint } from "../../types/privacy-attack";

const RETRAIN = "Retrain";
const GA3 = "GA3";
const CONFIG = {
  WIDTH: 100,
  HEIGHT: 100,
  RADIUS: Math.min(100, 100) / 2.1,
};

interface Props {
  variant: "success" | "failure";
  data: { type: "retrain" | "ga3"; value: number }[];
  isBaseline: boolean;
}

export default function PieChart({ variant, data, isBaseline }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const processedData: PieDataPoint[] = processData(data, isBaseline);

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
      .attr("fill", (d) => d.data.color)
      .attr("fill-opacity", (d) => {
        if (
          (variant === "success" && d.data.label === RETRAIN) ||
          (variant === "failure" && d.data.label === GA3)
        ) {
          return 0.5;
        }
        return 1;
      });
  }, [data, isBaseline, variant]);

  return (
    <div className="flex flex-col items-center">
      <span className="text-[15px]">
        {variant === "success"
          ? "False Positive Ratio"
          : "False Negative Ratio"}
      </span>
      <svg ref={svgRef} width={CONFIG.WIDTH} height={CONFIG.HEIGHT}></svg>
    </div>
  );
}

function processData(
  data: { type: "retrain" | "ga3"; value: number }[],
  isBaseline: boolean
): PieDataPoint[] {
  const retrainCount = data.filter((d) => d.type === "retrain").length;
  const ga3Count = data.filter((d) => d.type === "ga3").length;

  return [
    {
      label: RETRAIN,
      value: retrainCount,
      color: COLORS.DARK_GRAY,
    },
    {
      label: GA3,
      value: ga3Count,
      color: isBaseline ? COLORS.PURPLE : COLORS.EMERALD,
    },
  ];
}
