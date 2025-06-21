import { COLORS } from "./colors";
import { ChartConfig } from "../components/UI/chart";

export const CKA_DATA_KEYS = [
  "modelAForgetCka",
  "modelAOtherCka",
  "modelBForgetCka",
  "modelBOtherCka",
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
  modelAForgetCka: {
    color: COLORS.EMERALD,
  },
  modelAOtherCka: {
    color: COLORS.EMERALD,
  },
  modelBForgetCka: {
    color: COLORS.PURPLE,
  },
  modelBOtherCka: {
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

export const COMPARE_ORIGINAL = "original";
export const COMPARE_RETRAIN = "retrain";
