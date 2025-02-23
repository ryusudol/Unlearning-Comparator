interface LineGraphLegendData {
  color: string;
  label: string;
}

interface ThresholdStrategy {
  strategy: string;
  explanation: string;
}

export const THRESHOLD_STRATEGIES: ThresholdStrategy[] = [
  {
    strategy: "MAX ATTACK SCORE",
    explanation: "Maximizes a quality score from FPR and FNR",
  },
  {
    strategy: "MAX SUCCESS RATE",
    explanation: "Targets the highest overall attack accuracy",
  },
  {
    strategy: "COMMON THRESHOLD",
    explanation:
      "Uses a single threshold for both models, maximizing quality score sum",
  },
];

export const LINE_GRAPH_LEGEND_DATA: LineGraphLegendData[] = [
  { color: "red", label: "Attack Score" },
  { color: "blue", label: "False Positive Rate" },
  { color: "green", label: "False Negative Rate" },
];
