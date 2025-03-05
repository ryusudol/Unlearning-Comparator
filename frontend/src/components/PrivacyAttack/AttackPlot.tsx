import { useRef, useEffect, useCallback } from "react";
import * as d3 from "d3";

import {
  LINE_GRAPH_LEGEND_DATA,
  THRESHOLD_STRATEGIES,
} from "../../constants/privacyAttack";
import {
  useModelAExperiment,
  useModelBExperiment,
} from "../../stores/experimentsStore";
import { COLORS, TABLEAU10 } from "../../constants/colors";
import { FONT_CONFIG } from "../../constants/common";
import { AttackResult } from "../../types/data";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { useModelDataStore } from "../../stores/modelDataStore";
import { UNLEARN, RETRAIN, ENTROPY, Metric } from "../../views/PrivacyAttack";
import { Bin, Data, CategoryType } from "../../types/attack";

const CONFIG = {
  FONT_FAMILY: "Roboto Condensed",
  BLACK: "black",
  RED: "#e41a1c",
  BLUE: "#377eb8",
  GREEN: "#4daf4a",
  VERTICAL_LINE_COLOR: "#efefef",
  THRESHOLD_LINE_COLOR: "#a5a5a5",
  THRESHOLD_LINE_DASH: "5,2",
  THRESHOLD_LINE_WIDTH: 1.2,
  ENTROPY_SCOPE_MIN: 0,
  ENTROPY_SCOPE_MAX: 2.5,
  ENTROPY_THRESHOLD_STEP: 0.05,
  CONFIDENCE_SCOPE_MIN: -2.5,
  CONFIDENCE_SCOPE_MAX: 10,
  CONFIDENCE_THRESHOLD_STEP: 0.25,
  BUTTERFLY_CIRCLE_RADIUS: 3.3,
  OPACITY_ABOVE_THRESHOLD: 1,
  OPACITY_BELOW_THRESHOLD: 0.3,
  BUTTERFLY_CHART_X_AXIS_TICK_STEP: 10,
  BUTTERFLY_CHART_LEGEND_VERTICAL_SPACING: 14,
  BUTTERFLY_CHART_LEGEND_TEXT_GAP: 6,
  BUTTERFLY_CHART_LEGEND_SQUARE_SIZE: 12,
  BUTTERFLY_CHART_LEGEND_SQUARE_POSITIONS: [-7, 7],
  BUTTERFLY_CHART_WIDTH: 450,
  LINE_CHART_WIDTH: 170,
  HEIGHT: 396,
  LINE_WIDTH: 2,
  STROKE_WIDTH: 0.8,
  BUTTERFLY_MARGIN: { top: 16, right: 9, bottom: 28, left: 36 },
  LINE_MARGIN: { top: 16, right: 6, bottom: 28, left: 10 },
  STANDARD_ATTACK_SCORE_FOR_INFO_GROUP: 0.5,
} as const;

interface Props {
  mode: "A" | "B";
  metric: Metric;
  thresholdValue: number;
  direction: string;
  strategy: string;
  hoveredId: number | null;
  data: Data;
  onThresholdLineDrag: (value: number) => void;
  onUpdateAttackScore: (score: number) => void;
  setHoveredId: (val: number | null) => void;
  onElementClick: (
    event: React.MouseEvent,
    elementData: Bin & { type: CategoryType }
  ) => void;
}

export default function AttackPlot({
  mode,
  metric,
  thresholdValue,
  direction,
  strategy,
  hoveredId,
  data,
  onThresholdLineDrag,
  onUpdateAttackScore,
  setHoveredId,
  onElementClick,
}: Props) {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelA = useModelDataStore((state) => state.modelA);
  const modelB = useModelDataStore((state) => state.modelB);
  const modelAExperiment = useModelAExperiment();
  const modelBExperiment = useModelBExperiment();

  const butterflyRef = useRef<SVGSVGElement | null>(null);
  const lineRef = useRef<SVGSVGElement | null>(null);
  const chartInitialized = useRef<boolean>(false);
  const attackDataRef = useRef<AttackResult[]>([]);

  const retrainJson = data?.retrainData;
  const unlearnJson = data?.unlearnData;
  const attackData = data?.lineChartData;

  const isModelA = mode === "A";
  const isMetricEntropy = metric === ENTROPY;
  const isAboveThresholdUnlearn = direction === UNLEARN;
  const isStrategyCustom = strategy === THRESHOLD_STRATEGIES[0].strategy;

  const thresholdMin = isMetricEntropy
    ? CONFIG.ENTROPY_SCOPE_MIN
    : CONFIG.CONFIDENCE_SCOPE_MIN;
  const thresholdMax = isMetricEntropy
    ? CONFIG.ENTROPY_SCOPE_MAX
    : CONFIG.CONFIDENCE_SCOPE_MAX;
  const thresholdStep = isMetricEntropy
    ? CONFIG.ENTROPY_THRESHOLD_STEP
    : CONFIG.CONFIDENCE_THRESHOLD_STEP;

  const upperOpacity = isAboveThresholdUnlearn
    ? CONFIG.OPACITY_ABOVE_THRESHOLD
    : CONFIG.OPACITY_BELOW_THRESHOLD;
  const lowerOpacity = isAboveThresholdUnlearn
    ? CONFIG.OPACITY_BELOW_THRESHOLD
    : CONFIG.OPACITY_ABOVE_THRESHOLD;

  const wB =
    CONFIG.BUTTERFLY_CHART_WIDTH -
    CONFIG.BUTTERFLY_MARGIN.left -
    CONFIG.BUTTERFLY_MARGIN.right;
  const halfWB = wB / 2;
  const hB =
    CONFIG.HEIGHT -
    CONFIG.BUTTERFLY_MARGIN.top -
    CONFIG.BUTTERFLY_MARGIN.bottom;

  const wL =
    CONFIG.LINE_CHART_WIDTH -
    CONFIG.LINE_MARGIN.left -
    CONFIG.LINE_MARGIN.right;
  const hL = CONFIG.HEIGHT - CONFIG.LINE_MARGIN.top - CONFIG.LINE_MARGIN.bottom;

  const binSize = isMetricEntropy
    ? CONFIG.ENTROPY_THRESHOLD_STEP
    : CONFIG.CONFIDENCE_THRESHOLD_STEP;
  const circleDiameter =
    2 * CONFIG.BUTTERFLY_CIRCLE_RADIUS + CONFIG.STROKE_WIDTH;

  const getCircleOpacity = useCallback(
    (yPos: number, th: number) => {
      const isCircleAboveThreshold = yPos < th;
      return isAboveThresholdUnlearn
        ? isCircleAboveThreshold
          ? CONFIG.OPACITY_ABOVE_THRESHOLD
          : CONFIG.OPACITY_BELOW_THRESHOLD
        : isCircleAboveThreshold
        ? CONFIG.OPACITY_BELOW_THRESHOLD
        : CONFIG.OPACITY_ABOVE_THRESHOLD;
    },
    [isAboveThresholdUnlearn]
  );

  useEffect(() => {
    if (!data) return;

    if (!chartInitialized.current) {
      if (!retrainJson || !unlearnJson || !attackData) return;

      // get data ready
      attackDataRef.current = attackData;

      const createBins = (bins: Bin[]) => {
        const binsMap: Record<string, Bin[]> = {};
        bins.forEach((bin) => {
          const clampedValue = isMetricEntropy
            ? bin.value
            : Math.min(bin.value, thresholdMax);
          const key = (Math.floor(clampedValue / binSize) * binSize).toFixed(2);
          if (!binsMap[key]) binsMap[key] = [];
          binsMap[key].push(bin);
        });
        return Object.keys(binsMap)
          .map((key) => ({ threshold: +key, bins: binsMap[key] }))
          .sort((a, b) => a.threshold - b.threshold);
      };

      const retrainBins = createBins(data.retrainData);
      const unlearnBins = createBins(data.unlearnData);
      const maxCountRetrain = d3.max(retrainBins, (d) => d.bins.length) || 0;
      const maxCountUnlearn = d3.max(unlearnBins, (d) => d.bins.length) || 0;
      const halfCircles = halfWB / circleDiameter;
      const maxDisplayCircles = Math.floor(halfCircles);

      const extraRetrain =
        maxCountRetrain > maxDisplayCircles
          ? maxCountRetrain - maxDisplayCircles
          : 0;
      const extraUnlearn =
        maxCountUnlearn > maxDisplayCircles
          ? maxCountUnlearn - maxDisplayCircles
          : 0;

      const tickMin =
        Math.ceil(-halfCircles / CONFIG.BUTTERFLY_CHART_X_AXIS_TICK_STEP) *
        CONFIG.BUTTERFLY_CHART_X_AXIS_TICK_STEP;
      const tickMax =
        Math.floor(halfCircles / CONFIG.BUTTERFLY_CHART_X_AXIS_TICK_STEP) *
        CONFIG.BUTTERFLY_CHART_X_AXIS_TICK_STEP;
      const ticks = d3.range(
        tickMin,
        tickMax + CONFIG.BUTTERFLY_CHART_X_AXIS_TICK_STEP,
        CONFIG.BUTTERFLY_CHART_X_AXIS_TICK_STEP
      );

      const xScaleB = d3
        .scaleLinear()
        .domain([-halfCircles, halfCircles])
        .range([-halfWB, halfWB]);

      const yScaleB = d3
        .scaleLinear()
        .domain([thresholdMin, thresholdMax])
        .range([hB, 0]);

      // create svg for butterfly chart
      const svgB = d3
        .select(butterflyRef.current)
        .attr("width", CONFIG.BUTTERFLY_CHART_WIDTH)
        .attr("height", CONFIG.HEIGHT);

      svgB.selectAll("*").remove();

      const gB = svgB
        .append("g")
        .attr(
          "transform",
          `translate(${CONFIG.BUTTERFLY_MARGIN.left + halfWB}, ${
            CONFIG.BUTTERFLY_MARGIN.top
          })`
        );

      // Draw circles for the retrain data on the y-axis corresponding to the threshold value
      retrainBins.forEach((bin) => {
        const yPos = yScaleB(bin.threshold + binSize / 2);
        const displayingWidth = halfWB - CONFIG.BUTTERFLY_CIRCLE_RADIUS;
        const maxDisplayCount =
          Math.floor(displayingWidth / circleDiameter) + 1;
        const displayCount = Math.min(maxDisplayCount, bin.bins.length);
        const extraCount = bin.bins.length - displayCount;

        for (let i = 0; i < displayCount; i++) {
          const currentBin = bin.bins[i];
          const opacity =
            hoveredId !== null
              ? currentBin.img_idx === hoveredId
                ? CONFIG.OPACITY_ABOVE_THRESHOLD
                : CONFIG.OPACITY_BELOW_THRESHOLD
              : getCircleOpacity(yPos, yScaleB(thresholdValue));
          const cx =
            -circleDiameter / 2 - (displayCount - 1 - i) * circleDiameter;

          gB.append("circle")
            .datum(currentBin)
            .attr("class", "retrain-circle")
            .attr("fill", COLORS.DARK_GRAY)
            .attr("cx", cx)
            .attr("cy", yPos)
            .attr("r", CONFIG.BUTTERFLY_CIRCLE_RADIUS)
            .attr("fill-opacity", opacity)
            .attr(
              "stroke",
              d3.color(COLORS.DARK_GRAY)?.darker().toString() ??
                COLORS.DARK_GRAY
            )
            .attr("stroke-width", CONFIG.STROKE_WIDTH)
            .attr("stroke-opacity", opacity)
            .attr("cursor", "pointer")
            .on("mouseover", (_, d) => setHoveredId(d.img_idx))
            .on("mouseout", () => setHoveredId(null))
            .on("click", (event, d) => {
              onElementClick(event, { ...d, type: RETRAIN });
            });
        }

        // mark the number of extra circles that extend beyond the x-axis
        if (extraCount > 0) {
          const markerCx =
            -CONFIG.BUTTERFLY_CIRCLE_RADIUS - displayCount * circleDiameter;

          gB.append("text")
            .attr("x", markerCx)
            .attr("y", yPos)
            .attr("text-anchor", "end")
            .attr("font-size", FONT_CONFIG.FONT_SIZE_10)
            .attr("fill", CONFIG.BLACK)
            .text(`+${extraCount}`);
        }
      });

      // Draw circles for the unlearn data on the y-axis corresponding to the threshold value
      unlearnBins.forEach((bin) => {
        const yPos = yScaleB(bin.threshold + binSize / 2);
        const color = isModelA ? COLORS.EMERALD : COLORS.PURPLE;

        const displayingWidth = halfWB - CONFIG.BUTTERFLY_CIRCLE_RADIUS;
        const maxDisplayCount =
          Math.floor(displayingWidth / circleDiameter) + 1;
        const displayCount = Math.min(maxDisplayCount, bin.bins.length);
        const extraCount = bin.bins.length - displayCount;

        for (let i = 0; i < displayCount; i++) {
          const currentBin = bin.bins[i];
          const opacity =
            hoveredId !== null
              ? currentBin.img_idx === hoveredId
                ? CONFIG.OPACITY_ABOVE_THRESHOLD
                : CONFIG.OPACITY_BELOW_THRESHOLD
              : getCircleOpacity(yPos, yScaleB(thresholdValue));
          const cx = circleDiameter / 2 + i * circleDiameter;

          gB.append("circle")
            .datum(currentBin)
            .attr("class", "unlearn-circle")
            .attr("fill", color)
            .attr("cx", cx)
            .attr("cy", yPos)
            .attr("r", CONFIG.BUTTERFLY_CIRCLE_RADIUS)
            .attr("fill-opacity", opacity)
            .attr("stroke", d3.color(color)?.darker().toString() ?? color)
            .attr("stroke-width", CONFIG.STROKE_WIDTH)
            .attr("stroke-opacity", opacity)
            .attr("cursor", "pointer")
            .on("mouseover", (_, d) => setHoveredId(d.img_idx))
            .on("mouseout", () => setHoveredId(null))
            .on("click", (event, d) => {
              onElementClick(event, { ...d, type: UNLEARN });
            });
        }

        if (extraCount > 0) {
          const markerCx =
            circleDiameter / 2 +
            displayCount * circleDiameter +
            CONFIG.BUTTERFLY_CIRCLE_RADIUS;
          gB.append("text")
            .attr("x", markerCx - 6)
            .attr("y", yPos)
            .attr("text-anchor", "start")
            .attr("font-size", FONT_CONFIG.FONT_SIZE_10)
            .attr("fill", CONFIG.BLACK)
            .text(`+${extraCount}`);
        }
      });

      // draw the x-axis for a butterfly chart
      const xAxisB = gB
        .append("g")
        .attr("class", "x-axis-b")
        .attr("transform", `translate(0, ${hB})`)
        .call(
          d3
            .axisBottom(xScaleB)
            .tickSize(0)
            .tickValues(ticks)
            .tickFormat((d) => Math.abs(+d).toString())
        );
      xAxisB
        .append("text")
        .attr("class", "x-axis-label-b")
        .attr("x", -107)
        .attr("y", 15)
        .attr("font-size", FONT_CONFIG.FONT_SIZE_13)
        .attr("font-family", CONFIG.FONT_FAMILY)
        .attr("fill", CONFIG.BLACK)
        .attr("text-anchor", "middle")
        .text("← ");

      xAxisB
        .append("text")
        .attr("class", "x-axis-label-b")
        .attr("x", -89)
        .attr("y", 15)
        .attr("font-size", FONT_CONFIG.FONT_SIZE_13)
        .attr("font-family", CONFIG.FONT_FAMILY)
        .attr("fill", COLORS.DARK_GRAY)
        .attr("text-anchor", "middle")
        .attr("dx", "1em")
        .text("Retrained");

      xAxisB
        .append("text")
        .attr("class", "x-axis-label-b")
        .attr("x", -23.5)
        .attr("y", 15)
        .attr("font-size", FONT_CONFIG.FONT_SIZE_13)
        .attr("font-family", CONFIG.FONT_FAMILY)
        .attr("fill", CONFIG.BLACK)
        .attr("text-anchor", "middle")
        .text(" Samples | ");

      xAxisB
        .append("text")
        .attr("class", "x-axis-label-b")
        .attr("x", 26)
        .attr("y", 15)
        .attr("font-size", FONT_CONFIG.FONT_SIZE_13)
        .attr("font-family", CONFIG.FONT_FAMILY)
        .attr("fill", isModelA ? COLORS.EMERALD : COLORS.PURPLE)
        .attr("text-anchor", "middle")
        .text(`${isModelA ? "Model A" : "Model B"}`);
      xAxisB
        .append("text")
        .attr("class", "x-axis-label-b")
        .attr("x", 78)
        .attr("y", 15)
        .attr("font-size", FONT_CONFIG.FONT_SIZE_13)
        .attr("font-family", CONFIG.FONT_FAMILY)
        .attr("fill", COLORS.BLACK)
        .attr("text-anchor", "middle")
        .text(" Samples →");
      xAxisB
        .selectAll(".tick")
        .append("line")
        .attr("class", "grid-line")
        .attr("y1", -hB)
        .attr("y2", 0)
        .attr("stroke", CONFIG.VERTICAL_LINE_COLOR);
      xAxisB.lower();
      xAxisB.selectAll("text").attr("dy", "10px");

      // draw the y-axis
      gB.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${-halfWB}, 0)`)
        .call((g) => d3.axisLeft(yScaleB).ticks(isMetricEntropy ? 5 : 6)(g));
      gB.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -hB / 2 - 1)
        .attr("y", -218)
        .attr("font-size", FONT_CONFIG.FONT_SIZE_13)
        .attr("font-family", CONFIG.FONT_FAMILY)
        .attr("fill", CONFIG.BLACK)
        .attr("text-anchor", "middle")
        .text(isMetricEntropy ? "Entropy" : "Confidence");

      // mark the total number of extra bins
      if (extraRetrain > 0) {
        gB.append("text")
          .attr("x", xScaleB(-maxDisplayCircles))
          .attr("y", hB + FONT_CONFIG.FONT_SIZE_10)
          .attr("text-anchor", "end")
          .attr("font-size", FONT_CONFIG.FONT_SIZE_10)
          .attr("fill", CONFIG.BLACK)
          .text(`+${extraRetrain}`);
      }
      if (extraUnlearn > 0) {
        gB.append("text")
          .attr("x", xScaleB(maxDisplayCircles))
          .attr("y", hB + FONT_CONFIG.FONT_SIZE_10)
          .attr("text-anchor", "start")
          .attr("font-size", FONT_CONFIG.FONT_SIZE_10)
          .attr("fill", CONFIG.BLACK)
          .text(`+${extraUnlearn}`);
      }

      // create a legend for butterfly charts
      const butterflyLegendData = [
        {
          label: `From Retrained / Pred. ${isModelA ? "Model A" : "Model B"}`,
          side: "left",
          color: COLORS.DARK_GRAY,
        },
        {
          label: "From Retrained / Pred. Retrained",
          side: "left",
          color: "#D4D4D4",
        },
        {
          label: `From ${isModelA ? "Model A" : "Model B"} / Pred. ${
            isModelA ? "Model A" : "Model B"
          }`,
          side: "right",
          color: isModelA ? COLORS.EMERALD : COLORS.PURPLE,
        },
        {
          label: `From ${isModelA ? "Model A" : "Model B"} / Pred. Retrained`,
          side: "right",
          color: isModelA ? "#C8EADB" : "#E6D0FD",
        },
      ];

      const butterflyLegendGroup = gB
        .append("g")
        .attr("class", "butterfly-legend-group")
        .attr("transform", "translate(-6.5, 21)");

      butterflyLegendGroup
        .insert("rect", ":first-child")
        .attr("x", -172)
        .attr("y", -18.5)
        .attr("width", 350)
        .attr("height", 36)
        .attr("fill", "white")
        .attr("opacity", 0.6)
        .attr("stroke", "#d6d6d6")
        .attr("stroke-width", 1.5)
        .attr("rx", 2)
        .attr("ry", 2);

      let leftCounter = 0;
      let rightCounter = 0;
      butterflyLegendData.forEach((item) => {
        let xPos, yPos;
        if (item.side === "left") {
          xPos = CONFIG.BUTTERFLY_CHART_LEGEND_SQUARE_POSITIONS[0];
          if (isAboveThresholdUnlearn) {
            yPos =
              leftCounter === 0
                ? -CONFIG.BUTTERFLY_CHART_LEGEND_VERTICAL_SPACING / 2
                : CONFIG.BUTTERFLY_CHART_LEGEND_VERTICAL_SPACING / 2;
          } else {
            yPos =
              leftCounter === 0
                ? CONFIG.BUTTERFLY_CHART_LEGEND_VERTICAL_SPACING / 2
                : -CONFIG.BUTTERFLY_CHART_LEGEND_VERTICAL_SPACING / 2;
          }
          leftCounter++;
        } else {
          xPos = CONFIG.BUTTERFLY_CHART_LEGEND_SQUARE_POSITIONS[1];
          if (isAboveThresholdUnlearn) {
            yPos =
              rightCounter === 0
                ? -CONFIG.BUTTERFLY_CHART_LEGEND_VERTICAL_SPACING / 2
                : CONFIG.BUTTERFLY_CHART_LEGEND_VERTICAL_SPACING / 2;
          } else {
            yPos =
              rightCounter === 0
                ? CONFIG.BUTTERFLY_CHART_LEGEND_VERTICAL_SPACING / 2
                : -CONFIG.BUTTERFLY_CHART_LEGEND_VERTICAL_SPACING / 2;
          }
          rightCounter++;
        }

        butterflyLegendGroup
          .append("rect")
          .attr("x", xPos)
          .attr("y", yPos - CONFIG.BUTTERFLY_CHART_LEGEND_SQUARE_SIZE / 2)
          .attr("width", CONFIG.BUTTERFLY_CHART_LEGEND_SQUARE_SIZE)
          .attr("height", CONFIG.BUTTERFLY_CHART_LEGEND_SQUARE_SIZE)
          .attr("fill", item.color);

        if (item.side === "left") {
          butterflyLegendGroup
            .append("text")
            .attr("x", xPos - CONFIG.BUTTERFLY_CHART_LEGEND_TEXT_GAP)
            .attr("y", yPos)
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", FONT_CONFIG.FONT_SIZE_12)
            .text(item.label);
        } else {
          butterflyLegendGroup
            .append("text")
            .attr(
              "x",
              xPos +
                CONFIG.BUTTERFLY_CHART_LEGEND_SQUARE_SIZE +
                CONFIG.BUTTERFLY_CHART_LEGEND_TEXT_GAP
            )
            .attr("y", yPos)
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "middle")
            .attr("font-size", FONT_CONFIG.FONT_SIZE_12)
            .text(item.label);
        }
      });

      // create a threshold line for butterfly charts
      const threshGroupB = gB
        .append("g")
        .attr("class", "threshold-group")
        .attr("transform", `translate(0, ${yScaleB(thresholdValue)})`)
        .style("cursor", isStrategyCustom ? "ns-resize" : "default");

      if (isStrategyCustom) {
        threshGroupB.call(
          d3.drag<SVGGElement, unknown>().on("drag", (event) => {
            const [, newY] = d3.pointer(event, gB.node());
            const newThresholdRaw = yScaleB.invert(newY);
            const newThresholdRounded =
              Math.round(newThresholdRaw / thresholdStep) * thresholdStep;
            if (
              newThresholdRounded >= thresholdMin &&
              newThresholdRounded <= thresholdMax
            ) {
              onThresholdLineDrag(newThresholdRounded);
            }
          }) as any
        );
      }

      threshGroupB
        .append("rect")
        .attr("x", -halfWB)
        .attr("y", -5)
        .attr("width", wB)
        .attr("height", 10)
        .attr("fill", "transparent");
      threshGroupB
        .append("line")
        .attr("class", "threshold-line")
        .attr("stroke", CONFIG.BLACK)
        .attr("stroke-width", CONFIG.THRESHOLD_LINE_WIDTH)
        .attr("stroke-dasharray", CONFIG.THRESHOLD_LINE_DASH)
        .attr("stroke-linecap", "round")
        .attr("x1", -halfWB)
        .attr("x2", halfWB)
        .attr("y1", 0)
        .attr("y2", 0);
      const upText = threshGroupB
        .append("text")
        .attr("class", "threshold-label-up")
        .attr("x", -198)
        .attr("y", -4.5)
        .attr("text-anchor", "start")
        .attr("font-size", FONT_CONFIG.FONT_SIZE_12);
      upText.append("tspan").attr("fill", CONFIG.BLACK).text("↑ Pred as ");
      upText
        .append("tspan")
        .attr(
          "fill",
          isAboveThresholdUnlearn
            ? isModelA
              ? COLORS.EMERALD
              : COLORS.PURPLE
            : COLORS.DARK_GRAY
        )
        .text(
          isAboveThresholdUnlearn
            ? isModelA
              ? "Model A"
              : "Model B"
            : "Retrained"
        );
      const downText = threshGroupB
        .append("text")
        .attr("class", "threshold-label-down")
        .attr("x", -198)
        .attr("y", 12)
        .attr("text-anchor", "start")
        .attr("font-size", FONT_CONFIG.FONT_SIZE_12);
      downText.append("tspan").attr("fill", CONFIG.BLACK).text("↓ Pred as ");
      downText
        .append("tspan")
        .attr(
          "fill",
          isAboveThresholdUnlearn
            ? COLORS.DARK_GRAY
            : isModelA
            ? COLORS.EMERALD
            : COLORS.PURPLE
        )
        .text(
          isAboveThresholdUnlearn
            ? "Retrained"
            : isModelA
            ? "Model A"
            : "Model B"
        );

      // create a svg for a line chart
      const svgL = d3
        .select(lineRef.current)
        .attr("width", CONFIG.LINE_CHART_WIDTH)
        .attr("height", CONFIG.HEIGHT);

      svgL.selectAll("*").remove();

      const gL = svgL
        .append("g")
        .attr(
          "transform",
          `translate(${CONFIG.LINE_MARGIN.left},${CONFIG.LINE_MARGIN.top})`
        );

      const xScaleL = d3.scaleLinear().domain([0, 1.05]).range([0, wL]);
      const yScaleL = d3
        .scaleLinear()
        .domain([thresholdMin, thresholdMax])
        .range([hL, 0])
        .clamp(true);

      // create a function for the glare effect
      const defs = gL.append("defs");
      const glowFilter = defs
        .append("filter")
        .attr("id", "glow")
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%")
        .attr("filterUnits", "userSpaceOnUse");
      glowFilter
        .append("feGaussianBlur")
        .attr("in", "SourceGraphic")
        .attr("stdDeviation", "3")
        .attr("result", "coloredBlur");

      const feMerge = glowFilter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "coloredBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");

      // Separate a line chart into two parts: above threshold and below threshold
      defs
        .append("clipPath")
        .attr("id", `aboveThreshold-${mode}`)
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", wL)
        .attr("height", yScaleL(thresholdValue));
      defs
        .append("clipPath")
        .attr("id", `belowThreshold-${mode}`)
        .append("rect")
        .attr("x", 0)
        .attr("y", yScaleL(thresholdValue))
        .attr("width", wL)
        .attr("height", hL - yScaleL(thresholdValue));

      // Draw attack lines
      const attackLine = d3
        .line<AttackResult>()
        .x((d) => xScaleL(d.attack_score))
        .y((d) => yScaleL(d.threshold));

      gL.append("path")
        .datum(attackData)
        .attr("class", "line-attack-above")
        .attr("fill", "none")
        .attr("stroke", TABLEAU10[2]) // red
        .attr("stroke-width", CONFIG.LINE_WIDTH)
        .attr("stroke-opacity", upperOpacity)
        .attr("d", attackLine)
        .attr("clip-path", `url(#aboveThreshold-${mode})`)
        .attr("filter", "url(#glow)");
      gL.append("path")
        .datum(attackData)
        .attr("class", "line-attack-below")
        .attr("fill", "none")
        .attr("stroke", TABLEAU10[2]) // red
        .attr("stroke-width", CONFIG.LINE_WIDTH)
        .attr("stroke-opacity", lowerOpacity)
        .attr("d", attackLine)
        .attr("clip-path", `url(#belowThreshold-${mode})`)
        .attr("filter", "url(#glow)");

      // Draw FPR lines
      const fprLine = d3
        .line<AttackResult>()
        .x((d) => xScaleL(d.fpr))
        .y((d) => yScaleL(d.threshold));

      gL.append("path")
        .datum(attackData)
        .attr("class", "line-fpr-above")
        .attr("fill", "none")
        .attr("stroke", TABLEAU10[0]) // blue
        .attr("stroke-width", CONFIG.LINE_WIDTH)
        .attr("stroke-opacity", upperOpacity)
        .attr("d", fprLine)
        .attr("clip-path", `url(#aboveThreshold-${mode})`);
      gL.append("path")
        .datum(attackData)
        .attr("class", "line-fpr-below")
        .attr("fill", "none")
        .attr("stroke", TABLEAU10[0]) // blue
        .attr("stroke-width", CONFIG.LINE_WIDTH)
        .attr("stroke-opacity", lowerOpacity)
        .attr("d", fprLine)
        .attr("clip-path", `url(#belowThreshold-${mode})`);

      // Draw FNR lines
      const fnrLine = d3
        .line<AttackResult>()
        .x((d) => xScaleL(d.fnr))
        .y((d) => yScaleL(d.threshold));

      gL.append("path")
        .datum(attackData)
        .attr("class", "line-fnr-above")
        .attr("fill", "none")
        .attr("stroke", TABLEAU10[4]) // green
        .attr("stroke-width", CONFIG.LINE_WIDTH)
        .attr("stroke-opacity", upperOpacity)
        .attr("d", fnrLine)
        .attr("clip-path", `url(#aboveThreshold-${mode})`);
      gL.append("path")
        .datum(attackData)
        .attr("class", "line-fnr-below")
        .attr("fill", "none")
        .attr("stroke", TABLEAU10[4]) // green
        .attr("stroke-width", CONFIG.LINE_WIDTH)
        .attr("stroke-opacity", lowerOpacity)
        .attr("d", fnrLine)
        .attr("clip-path", `url(#belowThreshold-${mode})`);

      // Draw the x-axis for a line chart
      const xAxisL = gL
        .append("g")
        .attr("transform", `translate(0, ${hL})`)
        .call(
          d3
            .axisBottom(xScaleL)
            .tickSize(0)
            .tickSizeOuter(0)
            .tickValues(d3.range(0, 1.0001, 0.25))
            .tickFormat(d3.format(".2f"))
        );
      xAxisL
        .append("text")
        .attr("class", "axis-label")
        .attr("x", wL / 2)
        .attr("y", 15)
        .attr("font-size", FONT_CONFIG.FONT_SIZE_13)
        .attr("font-family", CONFIG.FONT_FAMILY)
        .attr("fill", CONFIG.BLACK)
        .attr("text-anchor", "middle")
        .text("Value");
      xAxisL
        .selectAll(".tick")
        .append("line")
        .attr("class", "grid-line")
        .attr("y1", -hL)
        .attr("y2", 0)
        .attr("stroke", CONFIG.VERTICAL_LINE_COLOR);
      xAxisL.lower();
      xAxisL.selectAll("text").attr("dy", "10px");

      // Draw a line for the y-axis of a line chart
      gL.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", hL)
        .attr("stroke", CONFIG.BLACK)
        .attr("stroke-width", 1);

      // Threshold line's drag event
      const threshGroupL = gL
        .append("g")
        .attr("class", "threshold-group")
        .attr("transform", `translate(0, ${yScaleL(thresholdValue)})`)
        .style("cursor", isStrategyCustom ? "ns-resize" : "default");

      if (isStrategyCustom) {
        threshGroupL.call(
          d3
            .drag<SVGGElement, any>()
            .subject(() => ({ y: yScaleL(thresholdValue) }))
            .on("drag", function (event) {
              const [, newY] = d3.pointer(event, gL.node());
              const newThresholdRaw = yScaleL.invert(newY);
              const newThresholdRounded =
                Math.round(newThresholdRaw / thresholdStep) * thresholdStep;
              if (
                newThresholdRounded >= thresholdMin &&
                newThresholdRounded <= thresholdMax
              ) {
                onThresholdLineDrag(newThresholdRounded);
              }
            })
        );
      }

      threshGroupL
        .append("rect")
        .attr("x", -3)
        .attr("y", -5)
        .attr("width", wL + 3)
        .attr("height", 10)
        .attr("fill", "transparent");
      threshGroupL
        .append("line")
        .attr("class", "threshold-line")
        .attr("stroke", CONFIG.BLACK)
        .attr("stroke-width", CONFIG.THRESHOLD_LINE_WIDTH)
        .attr("stroke-dasharray", CONFIG.THRESHOLD_LINE_DASH)
        .attr("stroke-linecap", "round")
        .attr("x1", -3)
        .attr("x2", wL)
        .attr("y1", 0)
        .attr("y2", 0);

      // Draw a legend for a line chart
      const lineChartLegendGroup = gL
        .append("g")
        .attr("transform", `translate(${wL - 37}, -1.5)`);
      lineChartLegendGroup
        .append("rect")
        .attr("x", -104)
        .attr("y", 0)
        .attr("width", 122)
        .attr("height", 42)
        .attr("fill", "white")
        .attr("opacity", 0.6)
        .attr("stroke", "#d6d6d6")
        .attr("stroke-width", 1.5)
        .attr("rx", 2)
        .attr("ry", 2);
      LINE_GRAPH_LEGEND_DATA.forEach((item, i) => {
        const yPos = 10 + i * 12;
        const legendItemGroup = lineChartLegendGroup
          .append("g")
          .attr("transform", `translate(-98, ${yPos})`);
        const lineElement = legendItemGroup
          .append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 14)
          .attr("y2", 0)
          .attr("stroke", item.color)
          .attr("stroke-width", 2);

        if (item.color === "red") {
          lineElement.attr("filter", "url(#glow)");
        }

        legendItemGroup
          .append("text")
          .attr("class", "line-legend-" + item.color)
          .attr("x", 20)
          .attr("y", 3)
          .attr("font-size", FONT_CONFIG.FONT_SIZE_12)
          .text(item.label);
      });

      // Draw circles to indicate the intersections between the lines and the threshold line
      const currentData = attackData.reduce(
        (prev, curr) =>
          Math.abs(curr.threshold - thresholdValue) <
          Math.abs(prev.threshold - thresholdValue)
            ? curr
            : prev,
        attackData[0]
      );

      const intGroup = gL.append("g").attr("class", "intersection-group");

      const getIntersections = (
        data: AttackResult[],
        xAccessor: (d: AttackResult) => number,
        th: number
      ) => {
        const intersections: { x: number; y: number }[] = [];
        const yTh = yScaleL(th);
        for (let i = 0; i < data.length - 1; i++) {
          const d1 = data[i];
          const d2 = data[i + 1];
          const y1 = yScaleL(d1.threshold);
          const y2 = yScaleL(d2.threshold);
          if ((y1 - yTh) * (y2 - yTh) < 0) {
            const x1 = xScaleL(xAccessor(d1));
            const x2 = xScaleL(xAccessor(d2));
            const t = (yTh - y1) / (y2 - y1);
            const xIntersect = x1 + t * (x2 - x1);
            intersections.push({ x: xIntersect, y: yTh });
          } else if (y1 === yTh) {
            intersections.push({ x: xScaleL(xAccessor(d1)), y: yTh });
          }
        }
        return intersections;
      };

      // Intersecting point with attack score
      const redInts = getIntersections(
        attackData,
        (d) => d.attack_score,
        thresholdValue
      );
      redInts.forEach((pt) => {
        intGroup
          .append("circle")
          .attr("class", "intersection-red")
          .attr("cx", pt.x)
          .attr("cy", pt.y)
          .attr("r", CONFIG.BUTTERFLY_CIRCLE_RADIUS)
          .attr("fill", CONFIG.RED)
          .attr("stroke", CONFIG.BLACK)
          .attr("stroke-width", 1);
      });

      // Intersecting point with FPR
      const blueInts = getIntersections(
        attackData,
        (d) => d.fpr,
        thresholdValue
      );
      blueInts.forEach((pt) => {
        intGroup
          .append("circle")
          .attr("cx", pt.x)
          .attr("cy", pt.y)
          .attr("r", CONFIG.BUTTERFLY_CIRCLE_RADIUS)
          .attr("fill", CONFIG.BLUE)
          .attr("stroke", CONFIG.BLACK)
          .attr("stroke-width", 1);
      });

      // Intersecting point with FNR
      const greenInts = getIntersections(
        attackData,
        (d) => d.fnr,
        thresholdValue
      );
      greenInts.forEach((pt) => {
        intGroup
          .append("circle")
          .attr("cx", pt.x)
          .attr("cy", pt.y)
          .attr("r", CONFIG.BUTTERFLY_CIRCLE_RADIUS)
          .attr("fill", CONFIG.GREEN)
          .attr("stroke", CONFIG.BLACK)
          .attr("stroke-width", 1);
      });

      intGroup.selectAll(".intersection-red").raise();

      // create a info group
      const attackIntersectPos =
        redInts.length > 0
          ? redInts[0]
          : { x: xScaleL(0), y: yScaleL(thresholdValue) };

      const infoGroupXPos =
        currentData.attack_score >= CONFIG.STANDARD_ATTACK_SCORE_FOR_INFO_GROUP
          ? xScaleL(CONFIG.STANDARD_ATTACK_SCORE_FOR_INFO_GROUP)
          : attackIntersectPos.x;
      const infoGroupYPos = yScaleL(thresholdValue);

      const infoGroup = gL
        .append("g")
        .attr("class", "info-group")
        .attr(
          "transform",
          `translate(${infoGroupXPos + 4}, ${infoGroupYPos - 47})`
        );
      infoGroup
        .append("text")
        .attr("text-anchor", "start")
        .attr(
          "fill",
          strategy === THRESHOLD_STRATEGIES[3].strategy ? "red" : CONFIG.BLACK
        )
        .attr("font-size", FONT_CONFIG.FONT_SIZE_12)
        .text(`Threshold: ${thresholdValue.toFixed(2)}`);
      infoGroup
        .append("text")
        .attr("text-anchor", "start")
        .attr(
          "fill",
          strategy === THRESHOLD_STRATEGIES[1].strategy ? "red" : CONFIG.BLACK
        )
        .attr("font-size", FONT_CONFIG.FONT_SIZE_12)
        .attr("dy", "1.2em")
        .text(`Attack Score: ${currentData.attack_score.toFixed(3)}`);
      infoGroup
        .append("text")
        .attr("text-anchor", "start")
        .attr("font-size", FONT_CONFIG.FONT_SIZE_12)
        .attr("dy", "2.4em")
        .text(`FPR: ${currentData.fpr.toFixed(3)}`);
      infoGroup
        .append("text")
        .attr("text-anchor", "start")
        .attr("font-size", FONT_CONFIG.FONT_SIZE_12)
        .attr("dy", "3.6em")
        .text(`FNR: ${currentData.fnr.toFixed(3)}`);

      onUpdateAttackScore(currentData.attack_score);

      chartInitialized.current = true;
    } else if (attackData) {
      attackDataRef.current = attackData;
    }

    const svgB = d3.select(butterflyRef.current);
    const gB = svgB.select<SVGGElement>("g");
    const yScaleB = d3
      .scaleLinear()
      .domain([thresholdMin, thresholdMax])
      .range([hB, 0]);

    // update circles
    gB.selectAll<SVGCircleElement, Bin>("circle")
      .attr("fill-opacity", function (d) {
        if (hoveredId !== null) {
          return d.img_idx === hoveredId
            ? CONFIG.OPACITY_ABOVE_THRESHOLD
            : CONFIG.OPACITY_BELOW_THRESHOLD;
        }
        return getCircleOpacity(
          +d3.select(this).attr("cy"),
          yScaleB(thresholdValue)
        );
      })
      .attr("stroke-opacity", function (d) {
        if (hoveredId !== null) {
          return d.img_idx === hoveredId
            ? CONFIG.OPACITY_ABOVE_THRESHOLD
            : CONFIG.OPACITY_BELOW_THRESHOLD;
        }
        return getCircleOpacity(
          +d3.select(this).attr("cy"),
          yScaleB(thresholdValue)
        );
      });

    // Render the values of hovered circles
    gB.selectAll(".hovered-label").remove();
    if (hoveredId !== null) {
      gB.selectAll<SVGCircleElement, Bin>("circle")
        .filter(function (d) {
          return d.img_idx === hoveredId;
        })
        .each(function (d: Bin) {
          const cx = d3.select(this).attr("cx");
          const cy = d3.select(this).attr("cy");
          const cxNum = parseFloat(cx);
          const offset = 4;
          const textAnchor = cxNum < 0 ? "end" : "start";
          const labelX = cxNum < 0 ? cxNum - offset : cxNum + offset;
          const labelY = Number(cy) - offset;

          gB.append("text")
            .attr("class", "hovered-label")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", textAnchor)
            .attr("font-size", "11px")
            .attr("fill", CONFIG.BLACK)
            .text(
              `${metric.charAt(0).toUpperCase() + metric.slice(1)}: ${d.value}`
            );
        });
    }

    // Draw a new threshold line based on the threshold value
    gB.select(".threshold-group").remove();
    const newThreshGroupB = gB
      .append("g")
      .attr("class", "threshold-group")
      .attr("transform", `translate(0, ${yScaleB(thresholdValue)})`)
      .style("cursor", isStrategyCustom ? "ns-resize" : "default");

    if (isStrategyCustom) {
      newThreshGroupB.call(
        d3.drag<SVGGElement, unknown>().on("drag", (event) => {
          const [, newY] = d3.pointer(event, gB.node());
          const newThresholdRaw = yScaleB.invert(newY);
          const newThresholdRounded =
            Math.round(newThresholdRaw / thresholdStep) * thresholdStep;
          if (
            newThresholdRounded >= thresholdMin &&
            newThresholdRounded <= thresholdMax
          ) {
            onThresholdLineDrag(newThresholdRounded);
          }
        })
      );
    }

    newThreshGroupB
      .append("rect")
      .attr("x", -halfWB)
      .attr("y", -5)
      .attr("width", wB)
      .attr("height", 10)
      .attr("fill", "transparent");
    newThreshGroupB
      .append("line")
      .attr("class", "threshold-line")
      .attr("stroke", CONFIG.BLACK)
      .attr("stroke-width", CONFIG.THRESHOLD_LINE_WIDTH)
      .attr("stroke-dasharray", CONFIG.THRESHOLD_LINE_DASH)
      .attr("stroke-linecap", "round")
      .attr("x1", -halfWB)
      .attr("x2", halfWB)
      .attr("y1", 0)
      .attr("y2", 0);
    const newUpText = newThreshGroupB
      .append("text")
      .attr("class", "threshold-label-up")
      .attr("x", -198)
      .attr("y", -4.5)
      .attr("text-anchor", "start")
      .attr("font-size", FONT_CONFIG.FONT_SIZE_12);
    newUpText.append("tspan").attr("fill", CONFIG.BLACK).text("↑ Pred as ");
    newUpText
      .append("tspan")
      .attr(
        "fill",
        isAboveThresholdUnlearn
          ? isModelA
            ? COLORS.EMERALD
            : COLORS.PURPLE
          : COLORS.DARK_GRAY
      )
      .text(
        isAboveThresholdUnlearn
          ? isModelA
            ? "Model A"
            : "Model B"
          : "Retrained"
      );
    const newDownText = newThreshGroupB
      .append("text")
      .attr("class", "threshold-label-down")
      .attr("x", -198)
      .attr("y", 12)
      .attr("text-anchor", "start")
      .attr("font-size", FONT_CONFIG.FONT_SIZE_12);
    newDownText.append("tspan").attr("fill", CONFIG.BLACK).text("↓ Pred as ");
    newDownText
      .append("tspan")
      .attr(
        "fill",
        isAboveThresholdUnlearn
          ? COLORS.DARK_GRAY
          : isModelA
          ? COLORS.EMERALD
          : COLORS.PURPLE
      )
      .text(
        isAboveThresholdUnlearn ? "Retrained" : isModelA ? "Model A" : "Model B"
      );

    // Draw a new y-axis for a butterfly chart based on the metric value
    gB.select(".y-axis").call((g: any) =>
      d3.axisLeft(yScaleB).ticks(isMetricEntropy ? 5 : 6)(g)
    );

    // line chart
    const svgL = d3.select(lineRef.current);
    const gL = svgL.select<SVGGElement>("g");

    const xScaleL = d3.scaleLinear().domain([0, 1.05]).range([0, wL]);
    const yScaleL = d3
      .scaleLinear()
      .domain([thresholdMin, thresholdMax])
      .range([hL, 0])
      .clamp(true);

    const attackLine = d3
      .line<AttackResult>()
      .x((d) => xScaleL(d.attack_score))
      .y((d) => yScaleL(d.threshold));
    const fprLine = d3
      .line<AttackResult>()
      .x((d) => xScaleL(d.fpr))
      .y((d) => yScaleL(d.threshold));
    const fnrLine = d3
      .line<AttackResult>()
      .x((d) => xScaleL(d.fnr))
      .y((d) => yScaleL(d.threshold));

    const safeAttackData = attackData ?? [];
    gL.select(".line-attack-above")
      .attr("d", attackLine(safeAttackData) || "")
      .attr("stroke-opacity", upperOpacity);
    gL.select(".line-attack-below")
      .attr("d", attackLine(safeAttackData) || "")
      .attr("stroke-opacity", lowerOpacity);

    gL.select(".line-fpr-above")
      .attr("d", fprLine(safeAttackData) || "")
      .attr("stroke-opacity", upperOpacity);
    gL.select(".line-fpr-below")
      .attr("d", fprLine(safeAttackData) || "")
      .attr("stroke-opacity", lowerOpacity);

    gL.select(".line-fnr-above")
      .attr("d", fnrLine(safeAttackData) || "")
      .attr("stroke-opacity", upperOpacity);
    gL.select(".line-fnr-below")
      .attr("d", fnrLine(safeAttackData) || "")
      .attr("stroke-opacity", lowerOpacity);

    // threshold line in the line chart
    gL.select(".threshold-group").attr(
      "transform",
      `translate(0, ${yScaleL(thresholdValue)})`
    );
    const defs = gL.select("defs");
    defs
      .select(`#aboveThreshold-${mode} rect`)
      .attr("height", yScaleL(thresholdValue));
    defs
      .select(`#belowThreshold-${mode} rect`)
      .attr("y", yScaleL(thresholdValue))
      .attr("height", hL - yScaleL(thresholdValue));

    // intersection group
    let intGroup = gL.select<SVGGElement>(".intersection-group");
    if (intGroup.empty()) {
      intGroup = gL.append("g").attr("class", "intersection-group");
    }
    intGroup.selectAll("circle").remove();

    const getIntersections = (
      data: AttackResult[],
      xAccessor: (d: AttackResult) => number,
      th: number
    ) => {
      const intersections: { x: number; y: number }[] = [];
      const yTh = yScaleL(th);
      for (let i = 0; i < data.length - 1; i++) {
        const d1 = data[i];
        const d2 = data[i + 1];
        const y1 = yScaleL(d1.threshold);
        const y2 = yScaleL(d2.threshold);
        if ((y1 - yTh) * (y2 - yTh) < 0) {
          const x1 = xScaleL(xAccessor(d1));
          const x2 = xScaleL(xAccessor(d2));
          const t = (yTh - y1) / (y2 - y1);
          const xIntersect = x1 + t * (x2 - x1);
          intersections.push({ x: xIntersect, y: yTh });
        } else if (y1 === yTh) {
          intersections.push({ x: xScaleL(xAccessor(d1)), y: yTh });
        }
      }
      return intersections;
    };

    const redInts = getIntersections(
      attackDataRef.current,
      (d) => d.attack_score,
      thresholdValue
    );
    redInts.forEach((pt) => {
      intGroup
        .append("circle")
        .attr("class", "intersection-red")
        .attr("cx", pt.x)
        .attr("cy", pt.y)
        .attr("r", CONFIG.BUTTERFLY_CIRCLE_RADIUS)
        .attr("fill", CONFIG.RED)
        .attr("stroke", CONFIG.BLACK)
        .attr("stroke-width", 1);
    });

    const blueInts = getIntersections(
      attackDataRef.current,
      (d) => d.fpr,
      thresholdValue
    );
    blueInts.forEach((pt) => {
      intGroup
        .append("circle")
        .attr("cx", pt.x)
        .attr("cy", pt.y)
        .attr("r", CONFIG.BUTTERFLY_CIRCLE_RADIUS)
        .attr("fill", CONFIG.BLUE)
        .attr("stroke", CONFIG.BLACK)
        .attr("stroke-width", 1);
    });

    const greenInts = getIntersections(
      attackDataRef.current,
      (d) => d.fnr,
      thresholdValue
    );
    greenInts.forEach((pt) => {
      intGroup
        .append("circle")
        .attr("cx", pt.x)
        .attr("cy", pt.y)
        .attr("r", CONFIG.BUTTERFLY_CIRCLE_RADIUS)
        .attr("fill", CONFIG.GREEN)
        .attr("stroke", CONFIG.BLACK)
        .attr("stroke-width", 1);
    });

    intGroup.selectAll(".intersection-red").raise();

    const newLabel = isMetricEntropy ? "Entropy" : "Confidence";
    svgB.select("text.y-axis-label").text(newLabel);

    const infoGroup = gL.select(".info-group");
    if (!infoGroup.empty() && attackDataRef.current.length > 0) {
      const currentData = attackDataRef.current.reduce(
        (prev, curr) =>
          Math.abs(curr.threshold - thresholdValue) <
          Math.abs(prev.threshold - thresholdValue)
            ? curr
            : prev,
        attackDataRef.current[0]
      );
      const attackIntersectPos =
        redInts.length > 0
          ? redInts[0]
          : { x: xScaleL(0), y: yScaleL(thresholdValue) };

      let infoGroupXPos = attackIntersectPos.x;
      if (
        currentData.attack_score >= CONFIG.STANDARD_ATTACK_SCORE_FOR_INFO_GROUP
      ) {
        infoGroupXPos = xScaleL(CONFIG.STANDARD_ATTACK_SCORE_FOR_INFO_GROUP);
      }

      const infoGroupYPos = yScaleL(thresholdValue);

      infoGroup.attr(
        "transform",
        `translate(${infoGroupXPos + 4}, ${infoGroupYPos - 47})`
      );
      infoGroup
        .select("text:nth-child(1)")
        .attr(
          "fill",
          strategy === THRESHOLD_STRATEGIES[3].strategy ? "red" : CONFIG.BLACK
        )
        .text(`Threshold: ${thresholdValue.toFixed(2)}`);
      infoGroup
        .select("text:nth-child(2)")
        .attr(
          "fill",
          strategy === THRESHOLD_STRATEGIES[1].strategy ? "red" : CONFIG.BLACK
        )
        .text(`Attack Score: ${currentData.attack_score.toFixed(3)}`);
      infoGroup
        .select("text:nth-child(3)")
        .text(`FPR: ${currentData.fpr.toFixed(3)}`);
      infoGroup
        .select("text:nth-child(4)")
        .text(`FNR: ${currentData.fnr.toFixed(3)}`);

      onUpdateAttackScore(currentData.attack_score);
    }

    gL.select(".line-attack-above").raise();
    gL.select(".line-attack-below").raise();

    infoGroup.raise();
  }, [
    attackData,
    binSize,
    circleDiameter,
    data,
    getCircleOpacity,
    hB,
    hL,
    halfWB,
    hoveredId,
    isAboveThresholdUnlearn,
    isMetricEntropy,
    isModelA,
    isStrategyCustom,
    lowerOpacity,
    metric,
    mode,
    onElementClick,
    onThresholdLineDrag,
    onUpdateAttackScore,
    retrainJson,
    setHoveredId,
    strategy,
    thresholdMax,
    thresholdMin,
    thresholdStep,
    thresholdValue,
    unlearnJson,
    upperOpacity,
    wB,
    wL,
  ]);

  useEffect(() => {
    chartInitialized.current = false;
  }, [metric, direction, modelA, modelB, strategy]);

  useEffect(() => {
    const strokeOpacity = isAboveThresholdUnlearn
      ? CONFIG.OPACITY_ABOVE_THRESHOLD
      : CONFIG.OPACITY_BELOW_THRESHOLD;

    d3.select(butterflyRef.current)
      .selectAll(".threshold-line")
      .attr("stroke", CONFIG.BLACK)
      .attr("stroke-opacity", strokeOpacity);

    d3.select(lineRef.current)
      .selectAll(".threshold-line")
      .attr("stroke", CONFIG.BLACK)
      .attr("stroke-opacity", strokeOpacity);
  }, [isAboveThresholdUnlearn]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center relative bottom-[7px] px-3.5 bg-white z-10">
        <span style={{ color: COLORS.DARK_GRAY }}>
          Retrained Model (a00{forgetClass})
        </span>
        <span className="mx-1.5">vs.</span>
        <span style={{ color: isModelA ? COLORS.EMERALD : COLORS.PURPLE }}>
          {isModelA ? "Model A" : "Model B"} (
          {isModelA ? modelAExperiment.Type : modelBExperiment.Type}
          {", "}
          {isModelA ? modelA : modelB})
        </span>
      </div>
      <div className="flex relative bottom-[7px]">
        <svg ref={butterflyRef}></svg>
        <svg ref={lineRef} className="relative right-3.5"></svg>
      </div>
    </div>
  );
}
