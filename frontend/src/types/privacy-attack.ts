interface Confidence {
  values: number[];
  range: number[];
  bins: number;
  max_display: number;
}

type Entropy = Confidence;

export interface ExperimentJsonData {
  confidence: Confidence;
  entropy: Entropy;
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
