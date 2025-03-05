import * as d3 from "d3";

export const TABLEAU10 = [
  "#4E79A7",
  "#F28E2B",
  "#E15759",
  "#76B7B2",
  "#59A14F",
  "#EDC948",
  "#B07AA1",
  "#FF9DA7",
  "#9C755F",
  "#BAB0AC",
];

export const COLORS = {
  WHITE: "#FFF",
  BLACK: "#000",

  PURPLE: "#A855F7",

  EMERALD: "#10B981",

  GRAY: "#777",
  DARK_GRAY: "#6a6a6a",

  GRID_COLOR: "#EFEFEF",

  BUTTON_BG_COLOR: "#585858",
  HOVERED_BUTTON_BG_COLOR: "#696969",
} as const;

export const bubbleColorScale = Array.from({ length: 256 }, (_, i) => {
  return d3.interpolateTurbo(i / 255);
});
