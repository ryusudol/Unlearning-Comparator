import { useEffect, useRef } from "react";
import * as d3 from "d3";

import { COLORS } from "../../constants/colors";
import { PieDataPoint } from "../../types/privacy-attack";

const RETRAIN = "Retrain";
const GA3 = "GA3";
const CONFIG = {
  WIDTH: 75,
  HEIGHT: 75,
  RADIUS: Math.min(75, 75) / 2.1,
};

interface Props {
  variant: "fpr" | "fnr";
  data: { type: "retrain" | "ga3"; value: number }[];
  isBaseline: boolean;
}

export default function PieChart({ variant, data, isBaseline }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const processedData: PieDataPoint[] = processData(data, isBaseline);
  const total = processedData.reduce((acc, d) => acc + d.value, 0);
  let percentage = 0;
  if (total > 0) {
    if (variant === "fpr") {
      const ga3Value = processedData.find((d) => d.label === GA3)?.value || 0;
      percentage = (ga3Value / total) * 100;
    } else {
      const retrainValue =
        processedData.find((d) => d.label === RETRAIN)?.value || 0;
      percentage = (retrainValue / total) * 100;
    }
  }

  useEffect(() => {
    if (!svgRef.current) return;

    const processed = processData(data, isBaseline);

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
      .data(pie(processed))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => d.data.color)
      .attr("fill-opacity", (d) => {
        if (
          (variant === "fpr" && d.data.label === RETRAIN) ||
          (variant === "fnr" && d.data.label === GA3)
        ) {
          return 0.3;
        }
        return 1;
      });
  }, [data, isBaseline, variant]);

  const pieExplanation =
    variant === "fpr" ? (
      <p className="text-xs font-extralight">
        Members from
        <br />
        Unlearn identified
        <br />
        as Retrain
      </p>
    ) : (
      <p className="text-xs font-extralight">
        Non-members from
        <br />
        Retrain identified as
        <br />
        Unlearn
      </p>
    );

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <span className="text-[15px]">
          {variant === "fpr" ? "False Positive Rate" : "False Negative Rate"}
        </span>
        <span className="ml-4 text-[15px] font-light w-11">
          {percentage.toFixed(2)}%
        </span>
      </div>
      <div className="flex gap-2">
        <svg ref={svgRef} width={CONFIG.WIDTH} height={CONFIG.HEIGHT}></svg>
        {pieExplanation}
      </div>
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
