import { useRef, useMemo, useEffect } from "react";
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
  attackScore: number;
}

export default function AttackSuccessFailure({
  mode,
  threshold,
  retrainJson,
  ga3Json,
  attackScore,
}: AttackSuccessFailureProps) {
  const successRef = useRef<SVGSVGElement | null>(null);
  const failureRef = useRef<SVGSVGElement | null>(null);

  const isBaseline = mode === "Baseline";
  const forgettingQualityScore = 1 - attackScore;

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

  const {
    successGroupComputed,
    failureGroupComputed,
    computedSuccessPct,
    computedFailurePct,
  } = useMemo(() => {
    const retrainValues: number[] = retrainJson?.entropy?.values || [];
    const ga3Values: number[] = ga3Json?.entropy?.values || [];

    if (!retrainValues.length && !ga3Values.length) {
      return {
        successGroupComputed: [],
        failureGroupComputed: [],
        computedSuccessPct: 0,
        computedFailurePct: 0,
      };
    }

    const successRetrain = groupByBin(
      retrainValues.filter((v) => v < threshold)
    );
    const successGA3 = groupByBin(ga3Values.filter((v) => v > threshold));
    const failureGA3 = groupByBin(ga3Values.filter((v) => v <= threshold));
    const failureRetrain = groupByBin(
      retrainValues.filter((v) => v >= threshold)
    );

    const successGroupComputed = [
      ...successRetrain.map((v) => ({ type: "retrain" as const, value: v })),
      ...successGA3.map((v) => ({ type: "ga3" as const, value: v })),
    ];
    const failureGroupComputed = [
      ...failureGA3.map((v) => ({ type: "ga3" as const, value: v })),
      ...failureRetrain.map((v) => ({ type: "retrain" as const, value: v })),
    ];

    const computedSuccessPct = parseFloat(
      ((successGroupComputed.length / CONFIG.TOTAL_DATA_COUNT) * 100).toFixed(2)
    );
    const computedFailurePct = parseFloat(
      ((failureGroupComputed.length / CONFIG.TOTAL_DATA_COUNT) * 100).toFixed(2)
    );

    return {
      successGroupComputed,
      failureGroupComputed,
      computedSuccessPct,
      computedFailurePct,
    };
  }, [retrainJson, ga3Json, threshold]);

  useEffect(() => {
    const successSVG = d3.select(successRef.current);
    successSVG.selectAll("*").remove();
    const successCols = CONFIG.MAX_COLUMNS;
    const successRows = Math.ceil(
      successGroupComputed.length / CONFIG.MAX_COLUMNS
    );
    const successSVGWidth = successCols * CONFIG.CELL_SIZE;
    const successSVGHeight = successRows * CONFIG.CELL_SIZE;
    successSVG.attr("width", successSVGWidth).attr("height", successSVGHeight);
    successSVG
      .selectAll("circle")
      .data(successGroupComputed)
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

    const failureSVG = d3.select(failureRef.current);
    failureSVG.selectAll("*").remove();
    const failureCols = CONFIG.MAX_COLUMNS;
    const failureRows = Math.ceil(
      failureGroupComputed.length / CONFIG.MAX_COLUMNS
    );
    const failureSVGWidth = failureCols * CONFIG.CELL_SIZE;
    const failureSVGHeight = failureRows * CONFIG.CELL_SIZE;
    failureSVG.attr("width", failureSVGWidth).attr("height", failureSVGHeight);
    failureSVG
      .selectAll("circle")
      .data(failureGroupComputed)
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
  }, [successGroupComputed, failureGroupComputed, isBaseline]);

  return (
    <div className="relative h-full flex flex-col items-center mt-1">
      <div className="flex gap-[38px]">
        <div className="flex gap-[38px]">
          <div>
            <div className="flex items-center">
              <span className="text-[15px]">Attack Success</span>
              <span className="ml-1.5 text-[15px] font-light w-11">
                {computedSuccessPct.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs font-light leading-[14px] mb-1">
              Non-members from Retrain
              <br />
              identified as Retrain, members
              <br />
              from Unlearn identified as Unlearn
            </p>
            <svg ref={successRef}></svg>
          </div>
          <div>
            <div className="flex items-center">
              <span className="text-[15px] mb-0.5">Attack Failure</span>
              <span className="ml-4 text-[15px] font-light w-11">
                {computedFailurePct.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs font-light leading-[14px] mb-1">
              Non-members from Retrain
              <br />
              identified as Unlearn, members
              <br />
              from Unlearn identified as Retrain
            </p>
            <svg ref={failureRef}></svg>
          </div>
        </div>
      </div>
      <p className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[17px] font-medium text-center">
        Forgetting Quality Score:{" "}
        {forgettingQualityScore === 1 ? 1 : forgettingQualityScore.toFixed(3)}
      </p>
    </div>
  );
}
