export interface LineGraphLegendData {
  color: string;
  label: string;
}

export interface ThresholdStrategy {
  strategy: string;
  explanation: string;
}

export type PieDataPoint = {
  label: string;
  value: number;
  color: string;
};
