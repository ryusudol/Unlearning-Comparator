import React from "react";

import { TooltipProps } from "recharts";
import { CONFIG } from "./LineChart";
import { COLORS } from "../../../constants/colors";

export default function Tooltip({
  active,
  payload,
}: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{ zIndex: CONFIG.zIndex }}
        className="rounded-lg border border-border/50 bg-white px-2.5 py-1.5 text-sm shadow-xl"
      >
        <p className="leading-5">
          <span style={{ color: COLORS.EMERALD }}>Model A </span>(Retain):{" "}
          <span className="font-semibold">{Number(payload[1].value).toFixed(3)}</span>
        </p>
        <p className="leading-5">
          <span style={{ color: COLORS.PURPLE }}>Model B </span>(Retain):{" "}
          <span className="font-semibold">{Number(payload[3].value).toFixed(3)}</span>
        </p>
        <p className="leading-5">
          <span style={{ color: COLORS.EMERALD }}>Model A </span>(Forget):{" "}
          <span className="font-semibold">{Number(payload[0].value).toFixed(3)}</span>
        </p>
        <p className="leading-5">
          <span style={{ color: COLORS.PURPLE }}>Model B </span>(Forget):{" "}
          <span className="font-semibold">{Number(payload[2].value).toFixed(3)}</span>
        </p>
      </div>
    );
  }
  return null;
}
