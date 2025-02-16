interface BinData {
  values: number[];
  range: number[];
  bins: number;
  max_display: number;
}

export interface ExperimentJsonData {
  confidence: BinData;
  entropy: BinData;
}

export interface AttackData {
  threshold: number;
  fpr: number;
  fnr: number;
  attack_score: number;
}

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
