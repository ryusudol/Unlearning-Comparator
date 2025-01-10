import { TABLEAU10 } from "./colors";
import { type ChartConfig } from "../components/UI/chart";

export const VERTICAL_BAR_CHART_CONFIG = {
  value: {
    label: "Gap",
  },
  A: {
    label: "airplane",
    color: TABLEAU10[0],
  },
  B: {
    label: "automobile",
    color: TABLEAU10[1],
  },
  C: {
    label: "bird",
    color: TABLEAU10[2],
  },
  D: {
    label: "cat",
    color: TABLEAU10[3],
  },
  E: {
    label: "deer",
    color: TABLEAU10[4],
  },
  F: {
    label: "dog",
    color: TABLEAU10[5],
  },
  G: {
    label: "frog",
    color: TABLEAU10[6],
  },
  H: {
    label: "horse",
    color: TABLEAU10[7],
  },
  I: {
    label: "ship",
    color: TABLEAU10[8],
  },
  J: {
    label: "truck",
    color: TABLEAU10[9],
  },
} satisfies ChartConfig;
