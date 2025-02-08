export type PieDataPoint = {
  label: string;
  value: number;
  color: string;
};

export interface RetrainData {
  entropy: number;
}

export interface AttackData {
  threshold: number;
  fpr: number;
  fnr: number;
  attack_score: number;
}
