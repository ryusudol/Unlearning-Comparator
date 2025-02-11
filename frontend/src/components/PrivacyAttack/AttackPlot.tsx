import { useRef, useEffect, useContext } from "react";
import * as d3 from "d3";

import {
  NeuralNetworkIcon,
  BaselineNeuralNetworkIcon,
  ComparisonNeuralNetworkIcon,
} from "../UI/icons";
import { COLORS } from "../../constants/colors";
import { LINE_GRAPH_LEGEND_DATA } from "../../constants/privacyAttack";
import { useForgetClass } from "../../hooks/useForgetClass";
import { ExperimentJsonData, AttackData } from "../../types/privacy-attack";
import { BaselineComparisonContext } from "../../store/baseline-comparison-context";

const CONFIG = {
  FONT_FAMILY: "Roboto Condensed",
  FONT_SIZE: "10",
  LABEL_FONT_SIZE: "12",
  RED: "#e41a1c",
  BLUE: "#377eb8",
  GREEN: "#4daf4a",
  GRAY: "#6a6a6a",
  VERTICAL_LINE_COLOR: "#efefef",
  THRESHOLD_LINE_COLOR: "#a5a5a5",
  THRESHOLD_LINE_DASH: "5,2",
  THRESHOLD_LINE_WIDTH: 1.2,
  THRESHOLD_STEP: 0.05,
  BUTTERFLY_CIRCLE_RADIUS: 3,
  ADDITIONAL_CIRCLE_X_GAP: 0,
  OPACITY_ABOVE_THRESHOLD: 1,
  OPACITY_BELOW_THRESHOLD: 0.3,
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
  STANDARD_ATTACK_SCORE_FOR_INFO_GROUP: 0.45,
} as const;

type EntropyData = { entropy: number };

interface Props {
  mode: "Baseline" | "Comparison";
  threshold: number;
  setThreshold: (value: number) => void;
  retrainJson: ExperimentJsonData;
  ga3Json: ExperimentJsonData;
  attackData: AttackData[];
  onUpdateAttackScore: (score: number) => void;
}

export default function ButterflyPlot({
  mode,
  threshold,
  setThreshold,
  retrainJson,
  ga3Json,
  attackData,
  onUpdateAttackScore,
}: Props) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);
  const { forgetClassNumber } = useForgetClass();

  const butterflyRef = useRef<SVGSVGElement | null>(null);
  const lineRef = useRef<SVGSVGElement | null>(null);
  const chartInitialized = useRef<boolean>(false);
  const attackDataRef = useRef<AttackData[]>([]);

  const isBaseline = mode === "Baseline";

  const updateThresholdCircles = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    yScale: d3.ScaleLinear<number, number>,
    th: number
  ) => {
    const opacityFunction = function (this: SVGCircleElement) {
      const cy = +d3.select(this).attr("cy");
      return cy < yScale(th)
        ? CONFIG.OPACITY_ABOVE_THRESHOLD
        : CONFIG.OPACITY_BELOW_THRESHOLD;
    };

    g.selectAll<SVGCircleElement, { entropy: number }>(
      ".circle-retrain, .circle-unlearn"
    )
      .attr("fill-opacity", opacityFunction)
      .attr("stroke-opacity", opacityFunction);
  };

  useEffect(() => {
    if (!chartInitialized.current) {
      if (!retrainJson || !ga3Json || !attackData) return;

      attackDataRef.current = attackData;

      const retrainValues: number[] = retrainJson.entropy
        ? retrainJson.entropy.values
        : [];
      const ga3Values: number[] = ga3Json.entropy ? ga3Json.entropy.values : [];

      const retrainData = retrainValues.map((v: number) => ({ entropy: v }));
      const ga3Data = ga3Values.map((v: number) => ({ entropy: v }));

      const svgB = d3
        .select(butterflyRef.current)
        .attr("width", CONFIG.BUTTERFLY_CHART_WIDTH)
        .attr("height", CONFIG.HEIGHT);
      svgB.selectAll("*").remove();

      const innerW =
        CONFIG.BUTTERFLY_CHART_WIDTH -
        CONFIG.BUTTERFLY_MARGIN.left -
        CONFIG.BUTTERFLY_MARGIN.right;
      const innerH =
        CONFIG.HEIGHT -
        CONFIG.BUTTERFLY_MARGIN.top -
        CONFIG.BUTTERFLY_MARGIN.bottom;

      const gB = svgB
        .append("g")
        .attr(
          "transform",
          `translate(${CONFIG.BUTTERFLY_MARGIN.left + innerW / 2}, ${
            CONFIG.BUTTERFLY_MARGIN.top
          })`
        );

      const yScaleB = d3.scaleLinear().domain([0, 2.5]).range([innerH, 0]);
      const circleDiameter =
        2 * CONFIG.BUTTERFLY_CIRCLE_RADIUS + CONFIG.STROKE_WIDTH;
      const xSpacing = circleDiameter + CONFIG.ADDITIONAL_CIRCLE_X_GAP;
      const binSize = 0.05;
      const createBins = (data: EntropyData[]) => {
        const binsMap: Record<string, EntropyData[]> = {};
        data.forEach((d) => {
          const key = (Math.floor(d.entropy / binSize) * binSize).toFixed(2);
          if (!binsMap[key]) binsMap[key] = [];
          binsMap[key].push(d);
        });
        return Object.keys(binsMap)
          .map((k) => ({ bin: +k, values: binsMap[k] }))
          .sort((a, b) => a.bin - b.bin);
      };
      const retrainBins = createBins(retrainData);
      const ga3Bins = createBins(ga3Data);
      const maxCountRetrain = d3.max(retrainBins, (d) => d.values.length) || 0;
      const maxCountGa3 = d3.max(ga3Bins, (d) => d.values.length) || 0;

      retrainBins.forEach((bin) => {
        const yPos = yScaleB(bin.bin + binSize / 2);
        const availableWidth = innerW / 2 - CONFIG.BUTTERFLY_CIRCLE_RADIUS;
        const maxDisplayCount = Math.floor(availableWidth / xSpacing) + 1;
        const displayCount = Math.min(maxDisplayCount, bin.values.length);
        const extraCount = bin.values.length - displayCount;
        for (let i = 0; i < displayCount; i++) {
          const j = bin.values.length - displayCount + i;
          const d = bin.values[j];
          const cx = -xSpacing / 2 - (displayCount - 1 - i) * xSpacing;
          const fillOpacityValue =
            yPos < yScaleB(threshold)
              ? CONFIG.OPACITY_ABOVE_THRESHOLD
              : CONFIG.OPACITY_BELOW_THRESHOLD;
          gB.append("circle")
            .datum({ entropy: d.entropy })
            .attr("class", "circle-retrain")
            .attr("fill", CONFIG.GRAY)
            .attr("cx", cx)
            .attr("cy", yPos)
            .attr("r", CONFIG.BUTTERFLY_CIRCLE_RADIUS)
            .attr("fill-opacity", fillOpacityValue)
            .attr(
              "stroke",
              d3.color(CONFIG.GRAY)?.darker().toString() ?? CONFIG.GRAY
            )
            .attr("stroke-width", CONFIG.STROKE_WIDTH)
            .attr("stroke-opacity", fillOpacityValue);
        }
        if (extraCount > 0) {
          const markerCx =
            -CONFIG.BUTTERFLY_CIRCLE_RADIUS - displayCount * xSpacing;
          gB.append("text")
            .attr("x", markerCx)
            .attr("y", yPos + CONFIG.BUTTERFLY_CIRCLE_RADIUS / 2)
            .attr("text-anchor", "end")
            .attr("font-size", CONFIG.FONT_SIZE)
            .attr("fill", "black")
            .text(`+${extraCount}`);
        }
      });

      ga3Bins.forEach((bin) => {
        const yPos = yScaleB(bin.bin + binSize / 2);
        const color = isBaseline ? COLORS.PURPLE : COLORS.EMERALD;

        bin.values.forEach((d, i) => {
          const cx = xSpacing / 2 + i * xSpacing;
          const fillOpacityValue =
            yPos < yScaleB(threshold)
              ? CONFIG.OPACITY_ABOVE_THRESHOLD
              : CONFIG.OPACITY_BELOW_THRESHOLD;
          gB.append("circle")
            .datum({ entropy: d.entropy })
            .attr("class", "circle-unlearn")
            .attr("fill", color)
            .attr("cx", cx)
            .attr("cy", yPos)
            .attr("r", CONFIG.BUTTERFLY_CIRCLE_RADIUS)
            .attr("fill-opacity", fillOpacityValue)
            .attr("stroke", d3.color(color)?.darker().toString() ?? color)
            .attr("stroke-width", CONFIG.STROKE_WIDTH)
            .attr("stroke-opacity", fillOpacityValue);
        });
      });

      const maxDisplayCircles = Math.floor(innerW / 2 / xSpacing);

      const extraRetrain =
        maxCountRetrain > maxDisplayCircles
          ? maxCountRetrain - maxDisplayCircles
          : 0;
      const extraGa3 =
        maxCountGa3 > maxDisplayCircles ? maxCountGa3 - maxDisplayCircles : 0;

      const halfCircles = innerW / 2 / xSpacing;
      const xAxisScaleB = d3
        .scaleLinear()
        .domain([-halfCircles, halfCircles])
        .range([-innerW / 2, innerW / 2]);

      const tickStep = 10;
      const tickMin = Math.ceil(-halfCircles / tickStep) * tickStep;
      const tickMax = Math.floor(halfCircles / tickStep) * tickStep;
      const ticks = d3.range(tickMin, tickMax + tickStep, tickStep);

      const xAxisB = gB
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${innerH})`)
        .call(
          d3
            .axisBottom(xAxisScaleB)
            .tickSize(0)
            .tickValues(ticks)
            .tickFormat((d) => Math.abs(+d).toString())
        );
      xAxisB
        .append("text")
        .attr("class", "axis-label")
        .attr("x", 0)
        .attr("y", 15)
        .attr("font-size", CONFIG.LABEL_FONT_SIZE)
        .attr("font-family", CONFIG.FONT_FAMILY)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Count");
      xAxisB
        .selectAll(".tick")
        .append("line")
        .attr("class", "grid-line")
        .attr("y1", -innerH)
        .attr("y2", 0)
        .attr("stroke", CONFIG.VERTICAL_LINE_COLOR);
      xAxisB.lower();
      xAxisB.selectAll("text").attr("dy", "10px");
      const yAxisB = d3.axisLeft(yScaleB).tickValues(d3.range(0, 2.51, 0.5));
      gB.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${-innerW / 2}, 0)`)
        .call(yAxisB);
      gB.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerH / 2)
        .attr("y", -222)
        .attr("font-size", CONFIG.LABEL_FONT_SIZE)
        .attr("font-family", CONFIG.FONT_FAMILY)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Entropy");

      if (extraRetrain > 0) {
        gB.append("text")
          .attr("x", xAxisScaleB(-maxDisplayCircles))
          .attr("y", innerH + +CONFIG.FONT_SIZE)
          .attr("text-anchor", "end")
          .attr("font-size", CONFIG.FONT_SIZE)
          .attr("fill", "black")
          .text(`+${extraRetrain}`);
      }
      if (extraGa3 > 0) {
        gB.append("text")
          .attr("x", xAxisScaleB(maxDisplayCircles))
          .attr("y", innerH + +CONFIG.FONT_SIZE)
          .attr("text-anchor", "start")
          .attr("font-size", CONFIG.FONT_SIZE)
          .attr("fill", "black")
          .text(`+${extraGa3}`);
      }

      const butterflyLegendData = [
        {
          label: "From Retrain / Pred. Unlearn",
          side: "left",
          color: COLORS.DARK_GRAY,
        },
        {
          label: "From Retrain / Pred. Retrain",
          side: "left",
          color: "#D4D4D4", // COLORS.DARK_GRAY with opacity 0.5
        },
        {
          label: "From Unlearn / Pred. Unlearn",
          side: "right",
          color: isBaseline ? COLORS.PURPLE : COLORS.EMERALD,
        },
        {
          label: "From Unlearn / Pred. Retrain",
          side: "right",
          color: isBaseline ? "#E6D0FD" : "#C8EADB", // COLORS.PURPLE or COLORS.EMERALD with opacity 0.5
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

      const dragLineB = d3.drag<SVGGElement, unknown>().on("drag", (event) => {
        const [, newY] = d3.pointer(event, gB.node());
        const newThresholdRaw = yScaleB.invert(newY);
        const newThresholdRounded =
          Math.round(newThresholdRaw / CONFIG.THRESHOLD_STEP) *
          CONFIG.THRESHOLD_STEP;
        if (newThresholdRounded >= 0 && newThresholdRounded <= 2.5) {
          setThreshold(newThresholdRounded);
        }
      });
      const threshGroupB = gB
        .append("g")
        .attr("class", "threshold-group")
        .attr("transform", `translate(0, ${yScaleB(threshold)})`)
        .attr("cursor", "ns-resize")
        .call(dragLineB as any);
      threshGroupB
        .append("rect")
        .attr("x", -innerW / 2)
        .attr("y", -5)
        .attr("width", innerW)
        .attr("height", 20)
        .attr("fill", "transparent");
      threshGroupB
        .append("line")
        .attr("class", "threshold-line")
        .attr("stroke", CONFIG.THRESHOLD_LINE_COLOR)
        .attr("stroke-width", CONFIG.THRESHOLD_LINE_WIDTH)
        .attr("stroke-dasharray", CONFIG.THRESHOLD_LINE_DASH)
        .attr("stroke-linecap", "round")
        .attr("x1", -innerW / 2)
        .attr("x2", innerW / 2)
        .attr("y1", 0)
        .attr("y2", 0);

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
      const wL =
        CONFIG.LINE_CHART_WIDTH -
        CONFIG.LINE_MARGIN.left -
        CONFIG.LINE_MARGIN.right;
      const hL =
        CONFIG.HEIGHT - CONFIG.LINE_MARGIN.top - CONFIG.LINE_MARGIN.bottom;
      const lineXScale = d3.scaleLinear().domain([0, 1.05]).range([0, wL]);
      const lineYScale = d3.scaleLinear().domain([0, 2.5]).range([hL, 0]);

      const defs = gL.append("defs");
      defs
        .append("clipPath")
        .attr("id", `aboveThreshold-${mode}`)
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", wL)
        .attr("height", lineYScale(threshold));
      defs
        .append("clipPath")
        .attr("id", `belowThreshold-${mode}`)
        .append("rect")
        .attr("x", 0)
        .attr("y", lineYScale(threshold))
        .attr("width", wL)
        .attr("height", hL - lineYScale(threshold));

      const lineAttack = d3
        .line<AttackData>()
        .x((d) => lineXScale(d.attack_score))
        .y((d) => lineYScale(d.threshold));
      const lineFpr = d3
        .line<AttackData>()
        .x((d) => lineXScale(d.fpr))
        .y((d) => lineYScale(d.threshold));
      const lineFnr = d3
        .line<AttackData>()
        .x((d) => lineXScale(d.fnr))
        .y((d) => lineYScale(d.threshold));

      gL.append("path")
        .datum(attackData)
        .attr("class", "line-attack-above")
        .attr("fill", "none")
        .attr("stroke", CONFIG.RED)
        .attr("stroke-width", CONFIG.LINE_WIDTH)
        .attr("d", lineAttack)
        .attr("clip-path", `url(#aboveThreshold-${mode})`);
      gL.append("path")
        .datum(attackData)
        .attr("class", "line-attack-below")
        .attr("fill", "none")
        .attr("stroke", CONFIG.RED)
        .attr("stroke-width", CONFIG.LINE_WIDTH)
        .attr("stroke-opacity", CONFIG.OPACITY_BELOW_THRESHOLD)
        .attr("d", lineAttack)
        .attr("clip-path", `url(#belowThreshold-${mode})`);

      gL.append("path")
        .datum(attackData)
        .attr("class", "line-fpr-above")
        .attr("fill", "none")
        .attr("stroke", CONFIG.BLUE)
        .attr("stroke-width", CONFIG.LINE_WIDTH)
        .attr("d", lineFpr)
        .attr("clip-path", `url(#aboveThreshold-${mode})`);
      gL.append("path")
        .datum(attackData)
        .attr("class", "line-fpr-below")
        .attr("fill", "none")
        .attr("stroke", CONFIG.BLUE)
        .attr("stroke-width", CONFIG.LINE_WIDTH)
        .attr("stroke-opacity", CONFIG.OPACITY_BELOW_THRESHOLD)
        .attr("d", lineFpr)
        .attr("clip-path", `url(#belowThreshold-${mode})`);

      gL.append("path")
        .datum(attackData)
        .attr("class", "line-fnr-above")
        .attr("fill", "none")
        .attr("stroke", CONFIG.GREEN)
        .attr("stroke-width", CONFIG.LINE_WIDTH)
        .attr("d", lineFnr)
        .attr("clip-path", `url(#aboveThreshold-${mode})`);
      gL.append("path")
        .datum(attackData)
        .attr("class", "line-fnr-below")
        .attr("fill", "none")
        .attr("stroke", CONFIG.GREEN)
        .attr("stroke-width", CONFIG.LINE_WIDTH)
        .attr("stroke-opacity", CONFIG.OPACITY_BELOW_THRESHOLD)
        .attr("d", lineFnr)
        .attr("clip-path", `url(#belowThreshold-${mode})`);

      const xAxisL = gL
        .append("g")
        .attr("transform", `translate(0, ${hL})`)
        .call(
          d3
            .axisBottom(lineXScale)
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
      gL.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", hL)
        .attr("stroke", "black")
        .attr("stroke-width", 1);

      const dragLineL = d3.drag<SVGGElement, unknown>().on("drag", (event) => {
        const [, newY] = d3.pointer(event, gL.node());
        const newThresholdRaw = lineYScale.invert(newY);
        const newThresholdRounded =
          Math.round(newThresholdRaw / CONFIG.THRESHOLD_STEP) *
          CONFIG.THRESHOLD_STEP;
        if (newThresholdRounded >= 0 && newThresholdRounded <= 2.5) {
          setThreshold(newThresholdRounded);

          gL.select(".threshold-group").attr(
            "transform",
            `translate(0, ${lineYScale(newThresholdRounded)})`
          );
        }
      });
      const threshGroupL = gL
        .append("g")
        .attr("class", "threshold-group")
        .attr("transform", `translate(0, ${lineYScale(threshold)})`)
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
        .attr("stroke", CONFIG.THRESHOLD_LINE_COLOR)
        .attr("stroke-width", CONFIG.THRESHOLD_LINE_WIDTH)
        .attr("stroke-dasharray", CONFIG.THRESHOLD_LINE_DASH)
        .attr("stroke-linecap", "round")
        .attr("x1", -3)
        .attr("x2", wL)
        .attr("y1", 0)
        .attr("y2", 0);

      const currentData = attackData.reduce(
        (prev, curr) =>
          Math.abs(curr.threshold - threshold) <
          Math.abs(prev.threshold - threshold)
            ? curr
            : prev,
        attackData[0]
      );

      const lineChartLegendGroup = gL
        .append("g")
        .attr("transform", `translate(${wL - 20}, 4)`);
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
          .attr("transform", `translate(-90, ${yPos})`);
        legendItemGroup
          .append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 14)
          .attr("y2", 0)
          .attr("stroke", item.color)
          .attr("stroke-width", 2);
        legendItemGroup
          .append("text")
          .attr("x", 20)
          .attr("y", 3)
          .attr("font-size", CONFIG.FONT_SIZE)
          .text(item.label);
      });

      const intGroup = gL.append("g").attr("class", "intersection-group");

      const getIntersections = (
        data: AttackData[],
        xAccessor: (d: AttackData) => number,
        lineXScale: d3.ScaleLinear<number, number>,
        lineYScale: d3.ScaleLinear<number, number>,
        th: number
      ) => {
        const intersections: { x: number; y: number }[] = [];
        const yTh = lineYScale(th);
        for (let i = 0; i < data.length - 1; i++) {
          const d1 = data[i];
          const d2 = data[i + 1];
          const y1 = lineYScale(d1.threshold);
          const y2 = lineYScale(d2.threshold);
          if ((y1 - yTh) * (y2 - yTh) < 0) {
            const x1 = lineXScale(xAccessor(d1));
            const x2 = lineXScale(xAccessor(d2));
            const t = (yTh - y1) / (y2 - y1);
            const xIntersect = x1 + t * (x2 - x1);
            intersections.push({ x: xIntersect, y: yTh });
          } else if (y1 === yTh) {
            intersections.push({ x: lineXScale(xAccessor(d1)), y: yTh });
          }
        }
        return intersections;
      };

      const redInts = getIntersections(
        attackData,
        (d) => d.attack_score,
        lineXScale,
        lineYScale,
        threshold
      );
      redInts.forEach((pt) => {
        intGroup
          .append("circle")
          .attr("cx", pt.x)
          .attr("cy", pt.y)
          .attr("r", CONFIG.BUTTERFLY_CIRCLE_RADIUS)
          .attr("fill", CONFIG.RED)
          .attr("stroke", "black")
          .attr("stroke-width", 1);
      });

      const attackIntersection =
        redInts.length > 0
          ? redInts[0]
          : { x: lineXScale(0), y: lineYScale(threshold) };

      let infoGroupX = attackIntersection.x;
      if (
        currentData.attack_score >= CONFIG.STANDARD_ATTACK_SCORE_FOR_INFO_GROUP
      ) {
        infoGroupX = lineXScale(CONFIG.STANDARD_ATTACK_SCORE_FOR_INFO_GROUP);
      }

      const infoGroupY =
        threshold >= 2.1 ? lineYScale(2.1) : attackIntersection.y;

      const infoGroup = gL
        .append("g")
        .attr("class", "info-group")
        .attr("transform", `translate(${infoGroupX + 2}, ${infoGroupY - 42})`);
      infoGroup
        .append("text")
        .attr("text-anchor", "start")
        .attr("font-size", CONFIG.FONT_SIZE)
        .text(`Threshold: ${threshold.toFixed(2)}`);
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

      const blueInts = getIntersections(
        attackData,
        (d) => d.fpr,
        lineXScale,
        lineYScale,
        threshold
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
        attackData,
        (d) => d.fnr,
        lineXScale,
        lineYScale,
        threshold
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

      onUpdateAttackScore(currentData.attack_score);

      chartInitialized.current = true;
    } else {
      const svgB = d3.select(butterflyRef.current);
      const gB = svgB.select<SVGGElement>("g");
      const innerH =
        CONFIG.HEIGHT -
        CONFIG.BUTTERFLY_MARGIN.top -
        CONFIG.BUTTERFLY_MARGIN.bottom;
      const yScaleB = d3.scaleLinear().domain([0, 2.5]).range([innerH, 0]);
      updateThresholdCircles(gB, yScaleB, threshold);
      gB.select(".threshold-group").attr(
        "transform",
        `translate(0, ${yScaleB(threshold)})`
      );

      const svgL = d3.select(lineRef.current);
      const gL = svgL.select<SVGGElement>("g");
      const wL =
        CONFIG.LINE_CHART_WIDTH -
        CONFIG.LINE_MARGIN.left -
        CONFIG.LINE_MARGIN.right;
      const hL =
        CONFIG.HEIGHT - CONFIG.LINE_MARGIN.top - CONFIG.LINE_MARGIN.bottom;
      const lineXScale = d3.scaleLinear().domain([0, 1.05]).range([0, wL]);
      const lineYScale = d3.scaleLinear().domain([0, 2.5]).range([hL, 0]);
      gL.select(".threshold-group").attr(
        "transform",
        `translate(0, ${lineYScale(threshold)})`
      );
      const defs = gL.select("defs");
      defs
        .select(`#aboveThreshold-${mode} rect`)
        .attr("height", lineYScale(threshold));
      defs
        .select(`#belowThreshold-${mode} rect`)
        .attr("y", lineYScale(threshold))
        .attr("height", hL - lineYScale(threshold));

      let intGroup = gL.select<SVGGElement>(".intersection-group");
      if (intGroup.empty()) {
        intGroup = gL.append("g").attr("class", "intersection-group");
      }
      intGroup.selectAll("circle").remove();

      const getIntersections = (
        data: AttackData[],
        xAccessor: (d: AttackData) => number,
        lineXScale: d3.ScaleLinear<number, number>,
        lineYScale: d3.ScaleLinear<number, number>,
        th: number
      ) => {
        const intersections: { x: number; y: number }[] = [];
        const yTh = lineYScale(th);
        for (let i = 0; i < data.length - 1; i++) {
          const d1 = data[i];
          const d2 = data[i + 1];
          const y1 = lineYScale(d1.threshold);
          const y2 = lineYScale(d2.threshold);
          if ((y1 - yTh) * (y2 - yTh) < 0) {
            const x1 = lineXScale(xAccessor(d1));
            const x2 = lineXScale(xAccessor(d2));
            const t = (yTh - y1) / (y2 - y1);
            const xIntersect = x1 + t * (x2 - x1);
            intersections.push({ x: xIntersect, y: yTh });
          } else if (y1 === yTh) {
            intersections.push({ x: lineXScale(xAccessor(d1)), y: yTh });
          }
        }
        return intersections;
      };

      const redInts = getIntersections(
        attackDataRef.current,
        (d) => d.attack_score,
        d3.scaleLinear().domain([0, 1.05]).range([0, wL]),
        lineYScale,
        threshold
      );
      redInts.forEach((pt) => {
        intGroup
          .append("circle")
          .attr("cx", pt.x)
          .attr("cy", pt.y)
          .attr("r", CONFIG.BUTTERFLY_CIRCLE_RADIUS)
          .attr("fill", CONFIG.RED)
          .attr("stroke", "black")
          .attr("stroke-width", 1);
      });

      const infoGroup = gL.select(".info-group");
      if (!infoGroup.empty() && attackDataRef.current.length > 0) {
        const currentData = attackDataRef.current.reduce(
          (prev, curr) =>
            Math.abs(curr.threshold - threshold) <
            Math.abs(prev.threshold - threshold)
              ? curr
              : prev,
          attackDataRef.current[0]
        );
        const attackIntersection =
          redInts.length > 0
            ? redInts[0]
            : { x: lineXScale(0), y: lineYScale(threshold) };

        let infoGroupX = attackIntersection.x;
        if (
          currentData.attack_score >=
          CONFIG.STANDARD_ATTACK_SCORE_FOR_INFO_GROUP
        ) {
          infoGroupX = d3.scaleLinear().domain([0, 1.05]).range([0, wL])(
            CONFIG.STANDARD_ATTACK_SCORE_FOR_INFO_GROUP
          );
        }

        const infoGroupY =
          threshold >= 2.1 ? lineYScale(2.1) : attackIntersection.y;

        infoGroup.attr(
          "transform",
          `translate(${infoGroupX + 2}, ${infoGroupY - 42})`
        );
        infoGroup
          .select("text:nth-child(1)")
          .text(`Threshold: ${threshold.toFixed(2)}`);
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

      const blueInts = getIntersections(
        attackDataRef.current,
        (d) => d.fpr,
        d3.scaleLinear().domain([0, 1.05]).range([0, wL]),
        lineYScale,
        threshold
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
        d3.scaleLinear().domain([0, 1.05]).range([0, wL]),
        lineYScale,
        threshold
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
    }
  }, [
    attackData,
    ga3Json,
    isBaseline,
    mode,
    onUpdateAttackScore,
    retrainJson,
    setThreshold,
    threshold,
  ]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center text-[15px]">
        <div className="flex items-center">
          <NeuralNetworkIcon color={CONFIG.GRAY} className="mr-1" />
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
