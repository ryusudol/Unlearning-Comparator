import { COLORS } from "../../constants/colors";

export function getButterflyLegendData(
  isAboveThresholdUnlearn: boolean,
  isModelA: boolean
) {
  return isAboveThresholdUnlearn
    ? [
        {
          label: "From Retrained / Pred. Retrained",
          side: "left",
          color: COLORS.LIGHT_GRAY,
        },
        {
          label: `From ${isModelA ? "Model A" : "Model B"} / Pred. Retrained`,
          side: "right",
          color: isModelA ? COLORS.LIGHT_EMERALD : COLORS.LIGHT_PURPLE,
        },
        {
          label: `From Retrained / Pred. ${isModelA ? "Model A" : "Model B"}`,
          side: "left",
          color: COLORS.DARK_GRAY,
        },
        {
          label: `From ${isModelA ? "Model A" : "Model B"} / Pred. ${
            isModelA ? "Model A" : "Model B"
          }`,
          side: "right",
          color: isModelA ? COLORS.EMERALD : COLORS.PURPLE,
        },
      ]
    : [
        {
          label: `From Retrained / Pred. ${isModelA ? "Model A" : "Model B"}`,
          side: "left",
          color: COLORS.DARK_GRAY,
        },
        {
          label: `From ${isModelA ? "Model A" : "Model B"} / Pred. ${
            isModelA ? "Model A" : "Model B"
          }`,
          side: "right",
          color: isModelA ? COLORS.EMERALD : COLORS.PURPLE,
        },
        {
          label: "From Retrained / Pred. Retrained",
          side: "left",
          color: COLORS.LIGHT_GRAY,
        },
        {
          label: `From ${isModelA ? "Model A" : "Model B"} / Pred. Retrained`,
          side: "right",
          color: isModelA ? COLORS.LIGHT_EMERALD : COLORS.LIGHT_PURPLE,
        },
      ];
}
