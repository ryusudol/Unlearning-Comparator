import { useRef, useState, useEffect } from "react";
import * as d3 from "d3";

import { COLORS } from "../../constants/colors";

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

    const totalData = 400;
    const computedCorrectPct = parseFloat(
      ((correctGroup.length / totalData) * 100).toFixed(1)
    );
    const computedIncorrectPct = parseFloat(
      ((incorrectGroup.length / totalData) * 100).toFixed(1)
    );
    setCorrectPct(computedCorrectPct);
    setIncorrectPct(computedIncorrectPct);

    const circleRadius = 3;
    const circleDiameter = circleRadius * 2;
    const cellSpacing = 1;
    const cellSize = circleDiameter + cellSpacing;
    const maxColumns = 20;

    const correctSVG = d3.select(correctRef.current);
    correctSVG.selectAll("*").remove();
    const correctCols = maxColumns;
    const correctRows = Math.ceil(correctGroup.length / maxColumns);
    const correctSVGWidth = correctCols * cellSize;
    const correctSVGHeight = correctRows * cellSize;
    correctSVG.attr("width", correctSVGWidth).attr("height", correctSVGHeight);
    correctSVG
      .selectAll("circle")
      .data(correctGroup)
      .enter()
      .append("circle")
      .attr("cx", (_, i) => (i % maxColumns) * cellSize + circleRadius)
      .attr(
        "cy",
        (_, i) => Math.floor(i / maxColumns) * cellSize + circleRadius
      )
      .attr("r", circleRadius)
      .attr("fill", (d) =>
        d.type === "retrain"
          ? COLORS.DARK_GRAY
          : isBaseline
          ? COLORS.PURPLE
          : COLORS.EMERALD
      )
      .attr("fill-opacity", (d) => (d.type === "retrain" ? 0.5 : 1));

    const incorrectSVG = d3.select(incorrectRef.current);
    incorrectSVG.selectAll("*").remove();
    const incorrectCols = maxColumns;
    const incorrectRows = Math.ceil(incorrectGroup.length / maxColumns);
    const incorrectSVGWidth = incorrectCols * cellSize;
    const incorrectSVGHeight = incorrectRows * cellSize;
    incorrectSVG
      .attr("width", incorrectSVGWidth)
      .attr("height", incorrectSVGHeight);
    incorrectSVG
      .selectAll("circle")
      .data(incorrectGroup)
      .enter()
      .append("circle")
      .attr("cx", (_, i) => (i % maxColumns) * cellSize + circleRadius)
      .attr(
        "cy",
        (_, i) => Math.floor(i / maxColumns) * cellSize + circleRadius
      )
      .attr("r", circleRadius)
      .attr("fill", (d) =>
        d.type === "ga3"
          ? isBaseline
            ? COLORS.PURPLE
            : COLORS.EMERALD
          : COLORS.DARK_GRAY
      )
      .attr("fill-opacity", (d) => (d.type === "ga3" ? 0.5 : 1));
  }, [ga3Json, isBaseline, retrainJson, threshold]);

  return (
    <div className="mt-2">
      <div className="flex items-start justify-around">
        <div>
          <div className="flex items-center">
            <p className="text-[17px]">Attack Success</p>
            <span className="ml-3 text-sm font-light">{correctPct}%</span>
          </div>
          <p className="text-sm w-[200px]">
            Retrain / Pred Retrain (Light Gray) + Unlearn / Pred Unlearn (Dark
            Purple)
          </p>
        </div>
        <div>
          <div className="flex items-center">
            <p className="text-[17px]">Attack Failure</p>
            <span className="ml-3 text-sm font-light">{incorrectPct}%</span>
          </div>
          <p className="text-sm w-[200px]">
            Retrain / Pred Retrain (Dark Gray) + Unlearn / Pred Unlearn (Light
            Purple)
          </p>
        </div>
      </div>
      <div className="flex justify-center gap-4 mt-2">
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium mb-1">Correct</span>
          <svg ref={correctRef}></svg>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium mb-1">Incorrect</span>
          <svg ref={incorrectRef}></svg>
        </div>
      </div>
    </div>
  );
}
