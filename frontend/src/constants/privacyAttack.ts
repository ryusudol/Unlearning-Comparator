import { COLORS } from "./colors";

export const LEGEND_DATA = [
  {
    label: "denied loan / would default",
    color: COLORS.LIGHT_GRAY,
    align: "left",
  },
  {
    label: "granted loan / defaults",
    color: COLORS.LIGHT_BLUE,
    align: "right",
  },
  {
    label: "denied loan / would pay back",
    color: COLORS.DARK_GRAY,
    align: "left",
  },
  {
    label: "granted loan / pays back",
    color: COLORS.DARK_BLUE,
    align: "right",
  },
];
