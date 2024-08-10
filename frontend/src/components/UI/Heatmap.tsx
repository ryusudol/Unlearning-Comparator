import { useState } from "react";
import styles from "./Heatmap.module.css";

import { Renderer } from "./Renderer";
import { Tooltip } from "./Tooltip";
import { HeatmapProps, InteractionData } from "../../types/archives";

export const Heatmap = ({ width, height, data }: HeatmapProps) => {
  const [hoveredCell, setHoveredCell] = useState<InteractionData | null>(null);

  return (
    <div className={styles["heatmap-wrapper"]}>
      <Renderer
        width={width}
        height={height}
        data={data}
        setHoveredCell={setHoveredCell}
      />
      <Tooltip interactionData={hoveredCell} width={width} height={height} />
    </div>
  );
};
