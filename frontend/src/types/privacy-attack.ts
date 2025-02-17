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

export type Image = {
  index: number;
  base64: string;
};
