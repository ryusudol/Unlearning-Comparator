import { useRef, useEffect } from "react";
import { createRoot, Root } from "react-dom/client";

import Tooltip from "../components/EmbeddingTooltip";
import { API_URL } from "../constants/common";
import { Mode, Prob, HovereInstance } from "../views/Embeddings";

interface TooltipConfig {
  containerRef: React.RefObject<HTMLDivElement>;
  tooltipXSize: number;
  tooltipYSize: number;
}

export const useTooltip = (
  mode: Mode,
  hoveredInstance: HovereInstance | null,
  config: TooltipConfig
) => {
  return {
    handleTooltip,
    hideTooltip,
  };
};
