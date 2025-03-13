import { TABLEAU10 } from "./colors";

interface LineGraphLegendData {
  color: string;
  label: string;
}

interface ThresholdStrategy {
  strategy: string;
  explanation: string;
  length: number;
}

export const THRESHOLD_STRATEGIES: ThresholdStrategy[] = [
  {
    strategy: "Custom Threshold",
    explanation:
      "Manually set the threshold using a slider for custom control.",
    length: 145,
  },
  {
    strategy: "Max Attack Score",
    explanation:
      "Maximizes the attack score by balancing false positive and false negative rates.",
    length: 150,
  },
  {
    strategy: "Max Success Rate",
    explanation:
      "Aims to maximize the probability of correctly identifying the model's type as retrained or trained.",
    length: 145,
  },
  {
    strategy: "Common Threshold",
    explanation:
      "Sets a single threshold that maximizes the sum of attack scores across different models.",
    length: 155,
  },
];

export const LINE_GRAPH_LEGEND_DATA: LineGraphLegendData[] = [
  { color: TABLEAU10[2], label: "Attack Score" }, // red
  { color: TABLEAU10[0], label: "False Positive Rate" }, // blue
  { color: TABLEAU10[4], label: "False Negative Rate" }, // green
];
