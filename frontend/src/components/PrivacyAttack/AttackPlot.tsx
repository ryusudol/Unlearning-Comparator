import { useRef, useEffect, useContext, useCallback } from "react";
import * as d3 from "d3";

import {
  NeuralNetworkIcon,
  BaselineNeuralNetworkIcon,
  ComparisonNeuralNetworkIcon,
} from "../UI/icons";
import { COLORS } from "../../constants/colors";
import { LINE_GRAPH_LEGEND_DATA } from "../../constants/privacyAttack";
import { useForgetClass } from "../../hooks/useForgetClass";
import { AttackResult } from "../../types/data";
import { BaselineComparisonContext } from "../../store/baseline-comparison-context";
import { UNLEARN, Metric } from "../../views/PrivacyAttack";
import { Bin, Data } from "./AttackAnalytics";

const CONFIG = {
  FONT_FAMILY: "Roboto Condensed",
  FONT_SIZE: "10",
  LABEL_FONT_SIZE: "12",
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
  BUTTERFLY_CIRCLE_RADIUS: 3,
  OPACITY_ABOVE_THRESHOLD: 1,
  OPACITY_BELOW_THRESHOLD: 0.3,
  BUTTERFLY_CHART_X_AXIS_TICK_STEP: 10,
  BUTTERFLY_CHART_LEGEND_VERTICAL_SPACING: 12,
  BUTTERFLY_CHART_LEGEND_TEXT_GAP: 3,
  BUTTERFLY_CHART_LEGEND_SQUARE_SIZE: 10,
  BUTTERFLY_CHART_LEGEND_SQUARE_POSITIONS: [-6, 6],
  BUTTERFLY_CHART_WIDTH: 460,
  LINE_CHART_WIDTH: 168,
  HEIGHT: 360,
  LINE_WIDTH: 2,
  STROKE_WIDTH: 0.8,
  BUTTERFLY_MARGIN: { top: 6, right: 9, bottom: 28, left: 54 },
  LINE_MARGIN: { top: 6, right: 3, bottom: 28, left: 10 },
  STANDARD_ATTACK_SCORE_FOR_INFO_GROUP: 0.5,
} as const;

interface Props {
  mode: "Baseline" | "Comparison";
  metric: Metric;
  thresholdValue: number;
  aboveThreshold: string;
  data: Data;
  setThresholdValue: (value: number) => void;
  onUpdateAttackScore: (score: number) => void;
}

export default function ButterflyPlot({
  mode,
  metric,
  thresholdValue,
  aboveThreshold,
  data,
  setThresholdValue,
  onUpdateAttackScore,
}: Props) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);
  const { forgetClassNumber } = useForgetClass();

  const butterflyRef = useRef<SVGSVGElement | null>(null);
  const lineRef = useRef<SVGSVGElement | null>(null);
  const chartInitialized = useRef<boolean>(false);
  const attackDataRef = useRef<AttackResult[]>([]);

  const retrainJson = data?.retrainData;
  const unlearnJson = data?.unlearnData;
  const attackData = data?.lineChartData;

  const isBaseline = mode === "Baseline";
  const isMetricEntropy = metric === "entropy";
  const isAboveThresholdUnlearn = aboveThreshold === UNLEARN;

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
        const binsMap: Record<string, number[]> = {};
        bins.forEach((bin) => {
          const key = (Math.floor(bin.value / binSize) * binSize).toFixed(2);
          if (!binsMap[key]) binsMap[key] = [];
          binsMap[key].push(bin.value);
        });
        return Object.keys(binsMap)
          .map((key) => ({ threshold: +key, values: binsMap[key] }))
          .sort((a, b) => a.threshold - b.threshold);
      };

      const retrainBins = createBins(data.retrainData);
      const unlearnBins = createBins(data.unlearnData);
      const maxCountRetrain = d3.max(retrainBins, (d) => d.values.length) || 0;
      const maxCountUnlearn = d3.max(unlearnBins, (d) => d.values.length) || 0;
      const maxDisplayCircles = Math.floor(wB / 2 / circleDiameter);

      const extraRetrain =
        maxCountRetrain > maxDisplayCircles
          ? maxCountRetrain - maxDisplayCircles
          : 0;
      const extraUnlearn =
        maxCountUnlearn > maxDisplayCircles
          ? maxCountUnlearn - maxDisplayCircles
          : 0;

      const halfCircles = wB / 2 / circleDiameter;
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
        .range([-wB / 2, wB / 2]);

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
          `translate(${CONFIG.BUTTERFLY_MARGIN.left + wB / 2}, ${
            CONFIG.BUTTERFLY_MARGIN.top
          })`
        );

      // Draw circles for the retrain data on the y-axis corresponding to the threshold value
      retrainBins.forEach((bin) => {
        const yPos = yScaleB(bin.threshold + binSize / 2);
        const displayingWidth = wB / 2 - CONFIG.BUTTERFLY_CIRCLE_RADIUS;
        const maxDisplayCount =
          Math.floor(displayingWidth / circleDiameter) + 1;
        const displayCount = Math.min(maxDisplayCount, bin.values.length);
        const extraCount = bin.values.length - displayCount;

        for (let i = 0; i < displayCount; i++) {
          const j = bin.values.length - displayCount + i;
          const d = bin.values[j];
          const cx =
            -circleDiameter / 2 - (displayCount - 1 - i) * circleDiameter;
          const opacity = getCircleOpacity(yPos, yScaleB(thresholdValue));

          gB.append("circle")
            .datum({ value: d })
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
            .attr("stroke-opacity", opacity);
        }

        // mark the number of extra circles that extend beyond the x-axis
        if (extraCount > 0) {
          const markerCx =
            -CONFIG.BUTTERFLY_CIRCLE_RADIUS - displayCount * circleDiameter;

          gB.append("text")
            .attr("x", markerCx)
            .attr("y", yPos)
            .attr("text-anchor", "end")
            .attr("font-size", CONFIG.FONT_SIZE)
            .attr("fill", "black")
            .text(`+${extraCount}`);
        }
      });

      // Draw circles for the unlearn data on the y-axis corresponding to the threshold value
      unlearnBins.forEach((bin) => {
        const yPos = yScaleB(bin.threshold + binSize / 2);
        const color = isBaseline ? COLORS.PURPLE : COLORS.EMERALD;

        const displayingWidth = wB / 2 - CONFIG.BUTTERFLY_CIRCLE_RADIUS;
        const maxDisplayCount =
          Math.floor(displayingWidth / circleDiameter) + 1;
        const displayCount = Math.min(maxDisplayCount, bin.values.length);
        const extraCount = bin.values.length - displayCount;

        for (let i = 0; i < displayCount; i++) {
          const d = bin.values[i];
          const cx = circleDiameter / 2 + i * circleDiameter;
          const opacity = getCircleOpacity(yPos, yScaleB(thresholdValue));

          gB.append("circle")
            .datum({ value: d })
            .attr("class", "unlearn-circle")
            .attr("fill", color)
            .attr("cx", cx)
            .attr("cy", yPos)
            .attr("r", CONFIG.BUTTERFLY_CIRCLE_RADIUS)
            .attr("fill-opacity", opacity)
            .attr("stroke", d3.color(color)?.darker().toString() ?? color)
            .attr("stroke-width", CONFIG.STROKE_WIDTH)
            .attr("stroke-opacity", opacity);
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
            .attr("font-size", CONFIG.FONT_SIZE)
            .attr("fill", "black")
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
        .attr("x", 1.5)
        .attr("y", 15)
        .attr("font-size", CONFIG.LABEL_FONT_SIZE)
        .attr("font-family", CONFIG.FONT_FAMILY)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("← Retrain Samples | Unlearn Samples →");
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
        .attr("transform", `translate(${-wB / 2}, 0)`)
        .call((g) => d3.axisLeft(yScaleB).ticks(isMetricEntropy ? 5 : 6)(g));
      gB.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -hB / 2)
        .attr("y", -226)
        .attr("font-size", CONFIG.LABEL_FONT_SIZE)
        .attr("font-family", CONFIG.FONT_FAMILY)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text(metric === "entropy" ? "Entropy" : "Confidence");

      // mark the total number of extra bins
      if (extraRetrain > 0) {
        gB.append("text")
          .attr("x", xScaleB(-maxDisplayCircles))
          .attr("y", hB + +CONFIG.FONT_SIZE)
          .attr("text-anchor", "end")
          .attr("font-size", CONFIG.FONT_SIZE)
          .attr("fill", "black")
          .text(`+${extraRetrain}`);
      }
      if (extraUnlearn > 0) {
        gB.append("text")
          .attr("x", xScaleB(maxDisplayCircles))
          .attr("y", hB + +CONFIG.FONT_SIZE)
          .attr("text-anchor", "start")
          .attr("font-size", CONFIG.FONT_SIZE)
          .attr("fill", "black")
          .text(`+${extraUnlearn}`);
      }

      // create a legend for butterfly charts
      const butterflyLegendData = [
        {
          label: "From Retrain / Pred. Unlearn",
          side: "left",
          color: COLORS.DARK_GRAY,
        },
        {
          label: "From Retrain / Pred. Retrain",
          side: "left",
          color: "#D4D4D4",
        },
        {
          label: "From Unlearn / Pred. Unlearn",
          side: "right",
          color: isBaseline ? COLORS.PURPLE : COLORS.EMERALD,
        },
        {
          label: "From Unlearn / Pred. Retrain",
          side: "right",
          color: isBaseline ? "#E6D0FD" : "#C8EADB",
        },
      ];

      const butterflyLegendGroup = gB
        .append("g")
        .attr("class", "butterfly-legend-group")
        .attr("transform", "translate(-5, 20)");

      butterflyLegendGroup
        .insert("rect", ":first-child")
        .attr("x", -130)
        .attr("y", -16)
        .attr("width", 270)
        .attr("height", 31)
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
          yPos =
            leftCounter === 0
              ? -CONFIG.BUTTERFLY_CHART_LEGEND_VERTICAL_SPACING / 2
              : CONFIG.BUTTERFLY_CHART_LEGEND_VERTICAL_SPACING / 2;
          leftCounter++;
        } else {
          xPos = CONFIG.BUTTERFLY_CHART_LEGEND_SQUARE_POSITIONS[1];
          yPos =
            rightCounter === 0
              ? -CONFIG.BUTTERFLY_CHART_LEGEND_VERTICAL_SPACING / 2
              : CONFIG.BUTTERFLY_CHART_LEGEND_VERTICAL_SPACING / 2;
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
            .attr("font-size", CONFIG.FONT_SIZE)
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
            .attr("font-size", CONFIG.FONT_SIZE)
            .text(item.label);
        }
      });

      // create a threshold line for butterfly charts
      const threshGroupB = gB
        .append("g")
        .attr("class", "threshold-group")
        .attr("transform", `translate(0, ${yScaleB(thresholdValue)})`)
        .attr("cursor", "ns-resize")
        .call(
          d3.drag<SVGGElement, unknown>().on("drag", (event) => {
            const [, newY] = d3.pointer(event, gB.node());
            const newThresholdRaw = yScaleB.invert(newY);
            const newThresholdRounded =
              Math.round(newThresholdRaw / thresholdStep) * thresholdStep;
            if (
              newThresholdRounded >= thresholdMin &&
              newThresholdRounded <= thresholdMax
            ) {
              setThresholdValue(newThresholdRounded);
            }
          }) as any
        );
      threshGroupB
        .append("rect")
        .attr("x", -wB / 2)
        .attr("y", -5)
        .attr("width", wB)
        .attr("height", 20)
        .attr("fill", "transparent");
      threshGroupB
        .append("line")
        .attr("class", "threshold-line")
        .attr("stroke", "black")
        .attr("stroke-width", CONFIG.THRESHOLD_LINE_WIDTH)
        .attr("stroke-dasharray", CONFIG.THRESHOLD_LINE_DASH)
        .attr("stroke-linecap", "round")
        .attr("x1", -wB / 2)
        .attr("x2", wB / 2)
        .attr("y1", 0)
        .attr("y2", 0);
      threshGroupB
        .append("text")
        .attr("class", "threshold-label-up")
        .attr("x", -195)
        .attr("y", -4)
        .attr("text-anchor", "start")
        .attr("font-size", CONFIG.FONT_SIZE)
        .attr("fill", "black")
        .attr("opacity", isAboveThresholdUnlearn ? 1 : 0.5)
        .text(
          isAboveThresholdUnlearn ? "↑ Pred as Unlearn" : "↑ Pred as Retrain"
        );
      threshGroupB
        .append("text")
        .attr("class", "threshold-label-down")
        .attr("x", -195)
        .attr("y", 10)
        .attr("text-anchor", "start")
        .attr("font-size", CONFIG.FONT_SIZE)
        .attr("fill", "black")
        .attr("opacity", isAboveThresholdUnlearn ? 0.5 : 1)
        .text(
          isAboveThresholdUnlearn ? "↓ Pred as Retrain" : "↓ Pred as Unlearn"
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
        .range([hL, 0]);

      // create a function for the glare effect
      const defs = gL.append("defs");
      const glowFilter = defs
        .append("filter")
        .attr("id", "glow")
        .attr("width", "300%")
        .attr("height", "300%");
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
        .attr("stroke", CONFIG.RED)
        .attr("stroke-width", CONFIG.LINE_WIDTH)
        .attr("stroke-opacity", upperOpacity)
        .attr("d", attackLine)
        .attr("clip-path", `url(#aboveThreshold-${mode})`)
        .attr("filter", "url(#glow)");
      gL.append("path")
        .datum(attackData)
        .attr("class", "line-attack-below")
        .attr("fill", "none")
        .attr("stroke", CONFIG.RED)
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
        .attr("stroke", CONFIG.BLUE)
        .attr("stroke-width", CONFIG.LINE_WIDTH)
        .attr("stroke-opacity", upperOpacity)
        .attr("d", fprLine)
        .attr("clip-path", `url(#aboveThreshold-${mode})`);
      gL.append("path")
        .datum(attackData)
        .attr("class", "line-fpr-below")
        .attr("fill", "none")
        .attr("stroke", CONFIG.BLUE)
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
        .attr("stroke", CONFIG.GREEN)
        .attr("stroke-width", CONFIG.LINE_WIDTH)
        .attr("stroke-opacity", upperOpacity)
        .attr("d", fnrLine)
        .attr("clip-path", `url(#aboveThreshold-${mode})`);
      gL.append("path")
        .datum(attackData)
        .attr("class", "line-fnr-below")
        .attr("fill", "none")
        .attr("stroke", CONFIG.GREEN)
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
        .attr("font-size", CONFIG.LABEL_FONT_SIZE)
        .attr("font-family", CONFIG.FONT_FAMILY)
        .attr("fill", "black")
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
        .attr("stroke", "black")
        .attr("stroke-width", 1);

      // Threshold line's drag event handler
      const dragLineL = d3
        .drag<SVGGElement, any>()
        .subject(() => ({ y: yScaleL(thresholdValue) }))
        .on("drag", function (event) {
          const newThresholdRaw = yScaleL.invert(event.y);
          const newThresholdRounded =
            Math.round(newThresholdRaw / thresholdStep) * thresholdStep;
          if (
            newThresholdRounded >= thresholdMin &&
            newThresholdRounded <= thresholdMax
          ) {
            setThresholdValue(newThresholdRounded);
            d3.select(this).attr(
              "transform",
              `translate(0, ${yScaleL(newThresholdRounded)})`
            );
          }
        });
      const threshGroupL = gL
        .append("g")
        .attr("class", "threshold-group")
        .attr("transform", `translate(0, ${yScaleL(thresholdValue)})`)
        .attr("cursor", "ns-resize")
        .call(dragLineL as any);
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
        .attr("stroke", "black")
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
        .attr("transform", `translate(${wL - 37}, 4)`);
      lineChartLegendGroup
        .append("rect")
        .attr("x", -98)
        .attr("y", 0)
        .attr("width", 110)
        .attr("height", 35)
        .attr("fill", "white")
        .attr("opacity", 0.6)
        .attr("stroke", "#d6d6d6")
        .attr("stroke-width", 1.5)
        .attr("rx", 2)
        .attr("ry", 2);
      LINE_GRAPH_LEGEND_DATA.forEach((item, i) => {
        const yPos = 8 + i * 10;
        const legendItemGroup = lineChartLegendGroup
          .append("g")
          .attr("transform", `translate(-91, ${yPos})`);
        const lineElement = legendItemGroup
          .append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 14)
          .attr("y2", 0)
          .attr("stroke", item.color)
          .attr("stroke-width", 2);

        if (item.color === CONFIG.RED) {
          lineElement.attr("filter", "url(#glow)");
        }

        legendItemGroup
          .append("text")
          .attr("x", 20)
          .attr("y", 3)
          .attr("font-size", CONFIG.FONT_SIZE)
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
          .attr("stroke", "black")
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
          .attr("stroke", "black")
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
          .attr("stroke", "black")
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
          `translate(${infoGroupXPos + 2}, ${infoGroupYPos - 42})`
        );
      infoGroup
        .append("text")
        .attr("text-anchor", "start")
        .attr("font-size", CONFIG.FONT_SIZE)
        .text(`Threshold: ${thresholdValue.toFixed(2)}`);
      infoGroup
        .append("text")
        .attr("text-anchor", "start")
        .attr("font-size", CONFIG.FONT_SIZE)
        .attr("dy", "1.2em")
        .text(`Attack Score: ${currentData.attack_score.toFixed(3)}`);
      infoGroup
        .append("text")
        .attr("text-anchor", "start")
        .attr("font-size", CONFIG.FONT_SIZE)
        .attr("dy", "2.4em")
        .text(`FPR: ${currentData.fpr.toFixed(3)}`);
      infoGroup
        .append("text")
        .attr("text-anchor", "start")
        .attr("font-size", CONFIG.FONT_SIZE)
        .attr("dy", "3.6em")
        .text(`FNR: ${currentData.fnr.toFixed(3)}`);

      onUpdateAttackScore(currentData.attack_score);

      chartInitialized.current = true;
    } else {
      if (attackData) {
        attackDataRef.current = attackData;
      }

      const svgB = d3.select(butterflyRef.current);
      const gB = svgB.select<SVGGElement>("g");
      const yScaleB = d3
        .scaleLinear()
        .domain([thresholdMin, thresholdMax])
        .range([hB, 0]);

      const updateCircles = (
        g: d3.Selection<SVGGElement, unknown, null, undefined>,
        yScale: d3.ScaleLinear<number, number>,
        th: number
      ) => {
        const opacityFunction = function (this: SVGCircleElement) {
          const cy = +d3.select(this).attr("cy");
          return getCircleOpacity(cy, yScale(th));
        };

        g.selectAll<SVGCircleElement, unknown>(
          ".retrain-circle, .unlearn-circle"
        )
          .attr("fill-opacity", opacityFunction)
          .attr("stroke-opacity", opacityFunction);
      };

      updateCircles(gB, yScaleB, thresholdValue);

      gB.select(".threshold-group").remove();

      // Draw a new threshold line based on the threshold value
      const newThreshGroupB = gB
        .append("g")
        .attr("class", "threshold-group")
        .attr("transform", `translate(0, ${yScaleB(thresholdValue)})`)
        .attr("cursor", "ns-resize")
        .call(
          d3.drag<SVGGElement, unknown>().on("drag", (event) => {
            const [, newY] = d3.pointer(event, gB.node());
            const newThresholdRaw = yScaleB.invert(newY);
            const newThresholdRounded =
              Math.round(newThresholdRaw / thresholdStep) * thresholdStep;
            if (
              newThresholdRounded >= thresholdMin &&
              newThresholdRounded <= thresholdMax
            ) {
              setThresholdValue(newThresholdRounded);
            }
          })
        );
      newThreshGroupB
        .append("rect")
        .attr("x", -wB / 2)
        .attr("y", -5)
        .attr("width", wB)
        .attr("height", 20)
        .attr("fill", "transparent");
      newThreshGroupB
        .append("line")
        .attr("class", "threshold-line")
        .attr("stroke", "black")
        .attr("stroke-width", CONFIG.THRESHOLD_LINE_WIDTH)
        .attr("stroke-dasharray", CONFIG.THRESHOLD_LINE_DASH)
        .attr("stroke-linecap", "round")
        .attr("x1", -wB / 2)
        .attr("x2", wB / 2)
        .attr("y1", 0)
        .attr("y2", 0);
      newThreshGroupB
        .append("text")
        .attr("class", "threshold-label-up")
        .attr("x", -195)
        .attr("y", -4)
        .attr("text-anchor", "start")
        .attr("font-size", CONFIG.FONT_SIZE)
        .attr("fill", "black")
        .attr("opacity", isAboveThresholdUnlearn ? 1 : 0.5)
        .text(
          isAboveThresholdUnlearn ? "↑ Pred as Unlearn" : "↑ Pred as Retrain"
        );
      newThreshGroupB
        .append("text")
        .attr("class", "threshold-label-down")
        .attr("x", -195)
        .attr("y", 10)
        .attr("text-anchor", "start")
        .attr("font-size", CONFIG.FONT_SIZE)
        .attr("fill", "black")
        .attr("opacity", isAboveThresholdUnlearn ? 0.5 : 1)
        .text(
          isAboveThresholdUnlearn ? "↓ Pred as Retrain" : "↓ Pred as Unlearn"
        );

      // Draw a new y-axis for a butterfly chart based on the metric value
      gB.select(".y-axis")
        .transition()
        .call((g: any) =>
          d3.axisLeft(yScaleB).ticks(isMetricEntropy ? 5 : 6)(g)
        );

      // line chart
      const svgL = d3.select(lineRef.current);
      const gL = svgL.select<SVGGElement>("g");

      const xScaleL = d3.scaleLinear().domain([0, 1.05]).range([0, wL]);
      const yScaleL = d3
        .scaleLinear()
        .domain([thresholdMin, thresholdMax])
        .range([hL, 0]);

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
          .attr("stroke", "black")
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
          .attr("stroke", "black")
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
          .attr("stroke", "black")
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
          currentData.attack_score >=
          CONFIG.STANDARD_ATTACK_SCORE_FOR_INFO_GROUP
        ) {
          infoGroupXPos = xScaleL(CONFIG.STANDARD_ATTACK_SCORE_FOR_INFO_GROUP);
        }

        const infoGroupYPos = yScaleL(thresholdValue);

        infoGroup.attr(
          "transform",
          `translate(${infoGroupXPos + 2}, ${infoGroupYPos - 42})`
        );
        infoGroup
          .select("text:nth-child(1)")
          .text(`Threshold: ${thresholdValue.toFixed(2)}`);
        infoGroup
          .select("text:nth-child(2)")
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
    }
  }, [
    attackData,
    binSize,
    circleDiameter,
    data,
    getCircleOpacity,
    hB,
    hL,
    isAboveThresholdUnlearn,
    isBaseline,
    isMetricEntropy,
    lowerOpacity,
    metric,
    mode,
    onUpdateAttackScore,
    retrainJson,
    setThresholdValue,
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
  }, [metric, baseline, comparison]);

  useEffect(() => {
    const thresholdStroke = "#000000";
    const strokeOpacity = isAboveThresholdUnlearn ? 1 : 0.3;

    d3.select(butterflyRef.current)
      .selectAll(".threshold-line")
      .attr("stroke", thresholdStroke)
      .attr("stroke-opacity", strokeOpacity);

    d3.select(lineRef.current)
      .selectAll(".threshold-line")
      .attr("stroke", thresholdStroke)
      .attr("stroke-opacity", strokeOpacity);
  }, [isAboveThresholdUnlearn]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center text-[15px]">
        <div className="flex items-center">
          <NeuralNetworkIcon color={COLORS.DARK_GRAY} className="mr-1" />
          <span>Retrain (a00{forgetClassNumber})</span>
        </div>
        <span className="mx-1.5">vs</span>
        <div className="flex items-center">
          {isBaseline ? (
            <BaselineNeuralNetworkIcon className="mr-1" />
          ) : (
            <ComparisonNeuralNetworkIcon className="mr-1" />
          )}
          <span>
            {mode} ({isBaseline ? baseline : comparison})
          </span>
        </div>
      </div>
      <div className="flex">
        <svg ref={butterflyRef}></svg>
        <svg ref={lineRef} className="relative right-3.5"></svg>
      </div>
    </div>
  );
}
