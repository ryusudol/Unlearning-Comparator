import { AttackResult } from "./data";

export interface Bin {
  img_idx: number;
  value: number;
}

export type Data = {
  retrainData: Bin[];
  unlearnData: Bin[];
  lineChartData: AttackResult[];
} | null;

export type CategoryType = "unlearn" | "retrain";

export interface Image {
  index: number;
  base64: string;
}

export interface TooltipData {
  img_idx: number;
  value: number;
  type: CategoryType;
}

export interface TooltipPosition {
  x: number;
  y: number;
}
