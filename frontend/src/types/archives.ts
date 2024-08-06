export interface HeatmapProps {
  width: number;
  height: number;
  data: { x: string; y: string; value: number }[];
}

export interface InteractionData {
  xLabel: string;
  yLabel: string;
  xPos: number;
  yPos: number;
  value: number;
}

export interface RendererProps {
  width: number;
  height: number;
  data: { x: string; y: string; value: number }[];
  setHoveredCell: (hoveredCell: InteractionData | null) => void;
}

export interface TooltipProps {
  interactionData: InteractionData | null;
  width: number;
  height: number;
}

export interface HeatmapData {
  x: string;
  y: string;
  value: number;
}

export interface TooltipRowProps {
  label: string;
  value: string;
}
