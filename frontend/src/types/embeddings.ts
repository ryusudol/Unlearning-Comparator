export type Coordinate = { x: number; y: number };

export type Position = {
  from: Coordinate | null;
  to: Coordinate | null;
};

export type Mode = "Baseline" | "Comparison";

export type HoverInstance = {
  imgIdx: number;
  source: Mode;
  baselineProb?: Prob;
  comparisonProb?: Prob;
} | null;

export type Prob = { [key: string]: number };

export type SelectedData = (number | Prob)[][];

export type ViewModeType =
  | "All Instances"
  | "Forgetting Target"
  | "Forgetting Failed";
