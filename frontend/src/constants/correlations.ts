import { COLORS } from "./colors";
import { ChartConfig } from "../components/UI/chart";

export const CKA_DATA_KEYS = [
  "baselineForgetCka",
  "baselineOtherCka",
  "comparisonForgetCka",
  "comparisonOtherCka",
];

export const LINE_CHART_TICK_STYLE = `
  .recharts-cartesian-axis-tick text {
    fill: ${COLORS.BLACK} !important;
    }
    `;

export const LINE_CHART_CONFIG = {
  layer: {
    label: "Layer",
    color: "#000",
  },
  baselineForgetCka: {
    label: "Baseline (Forget Class)",
    color: COLORS.EMERALD,
  },
  baselineOtherCka: {
    label: "Baseline (Remain Classes)",
    color: COLORS.EMERALD,
  },
  comparisonForgetCka: {
    label: "Comparison (Forget Class)",
    color: COLORS.PURPLE,
  },
  comparisonOtherCka: {
    label: "Comparison (Remain Classes)",
    color: COLORS.PURPLE,
  },
} satisfies ChartConfig;

export const LINE_CHART_LEGEND_DATA = [
  {
    type: "circle",
    color: COLORS.EMERALD,
    label: "Model A",
    spacing: "py-0.5",
  },
  {
    type: "circle",
    color: COLORS.PURPLE,
    label: "Model B",
    spacing: "py-0.5",
  },
  {
    type: "cross",
    color: COLORS.EMERALD,
    label: "Model A",
    spacing: "py-0.5",
  },
  {
    type: "cross",
    color: COLORS.PURPLE,
    label: "Model B",
    spacing: "py-0.5",
  },
] as const;
