import styles from "./Tooltip.module.css";

import { TooltipProps, TooltipRowProps } from "../../types/archives";

export const Tooltip = ({ interactionData, width, height }: TooltipProps) => {
  if (!interactionData) {
    return null;
  }

  return (
    <div
      style={{
        width,
        height,
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    >
      <div
        className={styles.tooltip}
        style={{
          position: "absolute",
          left: interactionData.xPos,
          top: interactionData.yPos,
        }}
      >
        <TooltipRow label={"x"} value={interactionData.xLabel} />
        <TooltipRow label={"y"} value={interactionData.yLabel} />
        <TooltipRow label={"value"} value={String(interactionData.value)} />
      </div>
    </div>
  );
};

const TooltipRow = ({ label, value }: TooltipRowProps) => (
  <div>
    <b>{label}</b>
    <span>: </span>
    <span>{value}</span>
  </div>
);
