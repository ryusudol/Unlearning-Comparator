import { useRef, useState, useEffect } from "react";
import * as d3 from "d3";

import { COLORS } from "../../constants/colors";

const CONFIG = {
  HIGH_OPACITY: 1,
  LOW_OPACITY: 0.3,
  CIRCLE_RADIUS: 3,
  CELL_SIZE: 3 * 2 + 1,
  MAX_COLUMNS: 20,
  STROKE_WIDTH: 0.8,
  TOTAL_DATA_COUNT: 400,
} as const;

interface AttackSuccessFailureProps {
  mode: "Baseline" | "Comparison";
  threshold: number;
  retrainJson: any;
  ga3Json: any;
}

export default function AttackSuccessFailure({
  mode,
  threshold,
  retrainJson,
  ga3Json,
}: AttackSuccessFailureProps) {
  const correctRef = useRef<SVGSVGElement | null>(null);
  const incorrectRef = useRef<SVGSVGElement | null>(null);

  const [correctPct, setCorrectPct] = useState<number>(0);
  const [incorrectPct, setIncorrectPct] = useState<number>(0);

  const isBaseline = mode === "Baseline";

  const groupByBin = (data: number[]) => {
    const bins: Record<number, number[]> = {};
    data.forEach((v) => {
      const bin = Math.floor(v / 0.05) * 0.05;
      if (!bins[bin]) bins[bin] = [];
      bins[bin].push(v);
    });
    const sortedBins = Object.keys(bins)
      .map((k) => parseFloat(k))
      .sort((a, b) => a - b);
    return sortedBins.flatMap((bin) => bins[bin]);
  };

  useEffect(() => {
    if (!retrainJson || !ga3Json) return;

    const retrainValues: number[] = retrainJson.entropy
      ? retrainJson.entropy.values
      : [];
    const ga3Values: number[] = ga3Json.entropy ? ga3Json.entropy.values : [];
    const correctRetrain = groupByBin(
      retrainValues.filter((v) => v < threshold)
    );
    const correctGA3 = groupByBin(ga3Values.filter((v) => v > threshold));
    const incorrectGA3 = groupByBin(ga3Values.filter((v) => v < threshold));
    const incorrectRetrain = groupByBin(
      retrainValues.filter((v) => v > threshold)
    );
    const correctGroup = [
      ...correctRetrain.map((v) => ({ type: "retrain", value: v })),
      ...correctGA3.map((v) => ({ type: "ga3", value: v })),
    ];
    const incorrectGroup = [
      ...incorrectGA3.map((v) => ({ type: "ga3", value: v })),
      ...incorrectRetrain.map((v) => ({ type: "retrain", value: v })),
    ];

    const computedCorrectPct = parseFloat(
      ((correctGroup.length / CONFIG.TOTAL_DATA_COUNT) * 100).toFixed(1)
    );
    const computedIncorrectPct = parseFloat(
      ((incorrectGroup.length / CONFIG.TOTAL_DATA_COUNT) * 100).toFixed(1)
    );
    setCorrectPct(computedCorrectPct);
    setIncorrectPct(computedIncorrectPct);

    const correctSVG = d3.select(correctRef.current);
    correctSVG.selectAll("*").remove();
    const correctCols = CONFIG.MAX_COLUMNS;
    const correctRows = Math.ceil(correctGroup.length / CONFIG.MAX_COLUMNS);
    const correctSVGWidth = correctCols * CONFIG.CELL_SIZE;
    const correctSVGHeight = correctRows * CONFIG.CELL_SIZE;
    correctSVG.attr("width", correctSVGWidth).attr("height", correctSVGHeight);
    correctSVG
      .selectAll("circle")
      .data(correctGroup)
      .enter()
      .append("circle")
      .attr(
        "cx",
        (_, i) =>
          (i % CONFIG.MAX_COLUMNS) * CONFIG.CELL_SIZE + CONFIG.CIRCLE_RADIUS
      )
      .attr(
        "cy",
        (_, i) =>
          Math.floor(i / CONFIG.MAX_COLUMNS) * CONFIG.CELL_SIZE +
          CONFIG.CIRCLE_RADIUS
      )
      .attr("r", CONFIG.CIRCLE_RADIUS)
      .attr("fill", (d) =>
        d.type === "retrain"
          ? COLORS.DARK_GRAY
          : isBaseline
          ? COLORS.PURPLE
          : COLORS.EMERALD
      )
      .attr("fill-opacity", (d) =>
        d.type === "retrain" ? CONFIG.LOW_OPACITY : CONFIG.HIGH_OPACITY
      )
      .attr("stroke", (d) => {
        const fillColor =
          d.type === "retrain"
            ? COLORS.DARK_GRAY
            : isBaseline
            ? COLORS.PURPLE
            : COLORS.EMERALD;
        return d3.color(fillColor)?.darker().toString() ?? fillColor;
      })
      .attr("stroke-opacity", (d) =>
        d.type === "retrain" ? CONFIG.LOW_OPACITY : CONFIG.HIGH_OPACITY
      )
      .attr("stroke-width", CONFIG.STROKE_WIDTH);

    const incorrectSVG = d3.select(incorrectRef.current);
    incorrectSVG.selectAll("*").remove();
    const incorrectCols = CONFIG.MAX_COLUMNS;
    const incorrectRows = Math.ceil(incorrectGroup.length / CONFIG.MAX_COLUMNS);
    const incorrectSVGWidth = incorrectCols * CONFIG.CELL_SIZE;
    const incorrectSVGHeight = incorrectRows * CONFIG.CELL_SIZE;
    incorrectSVG
      .attr("width", incorrectSVGWidth)
      .attr("height", incorrectSVGHeight);
    incorrectSVG
      .selectAll("circle")
      .data(incorrectGroup)
      .enter()
      .append("circle")
      .attr(
        "cx",
        (_, i) =>
          (i % CONFIG.MAX_COLUMNS) * CONFIG.CELL_SIZE + CONFIG.CIRCLE_RADIUS
      )
      .attr(
        "cy",
        (_, i) =>
          Math.floor(i / CONFIG.MAX_COLUMNS) * CONFIG.CELL_SIZE +
          CONFIG.CIRCLE_RADIUS
      )
      .attr("r", CONFIG.CIRCLE_RADIUS)
      .attr("fill", (d) =>
        d.type === "ga3"
          ? isBaseline
            ? COLORS.PURPLE
            : COLORS.EMERALD
          : COLORS.DARK_GRAY
      )
      .attr("fill-opacity", (d) =>
        d.type === "ga3" ? CONFIG.LOW_OPACITY : CONFIG.HIGH_OPACITY
      )
      .attr("stroke", (d) => {
        const fillColor =
          d.type === "ga3"
            ? isBaseline
              ? COLORS.PURPLE
              : COLORS.EMERALD
            : COLORS.DARK_GRAY;
        return d3.color(fillColor)?.darker().toString() ?? fillColor;
      })
      .attr("stroke-opacity", (d) =>
        d.type === "ga3" ? CONFIG.LOW_OPACITY : CONFIG.HIGH_OPACITY
      )
      .attr("stroke-width", CONFIG.STROKE_WIDTH);
  }, [ga3Json, isBaseline, retrainJson, threshold]);

  return (
    <div className="relative h-full flex flex-col mt-5">
      <div className="flex items-start justify-around">
        <div>
          <div className="flex items-center">
            <p className="text-[17px] mb-0.5">Attack Success</p>
            <p className="ml-1 text-sm font-light w-11 text-center">
              {correctPct}%
            </p>
          </div>
          <svg ref={correctRef}></svg>
        </div>
        <div>
          <div className="flex items-center">
            <p className="text-[17px] mb-0.5">Attack Failure</p>
            <p className="ml-1 text-sm font-light w-11 text-center">
              {incorrectPct}%
            </p>
          </div>
          <svg ref={incorrectRef}></svg>
        </div>
      </div>
      <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-lg font-medium text-center">
        Forgetting Quality Score: 0.395
      </p>
    </div>
  );
}
