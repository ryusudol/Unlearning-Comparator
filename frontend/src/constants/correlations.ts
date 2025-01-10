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
    color: COLORS.PURPLE,
  },
  baselineOtherCka: {
    label: "Baseline (Remain Classes)",
    color: COLORS.PURPLE,
  },
  comparisonForgetCka: {
    label: "Comparison (Forget Class)",
    color: COLORS.EMERALD,
  },
  comparisonOtherCka: {
    label: "Comparison (Remain Classes)",
    color: COLORS.EMERALD,
  },
} satisfies ChartConfig;
