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
      "Manually set the threshold by dragging a slider for custom control.",
    length: 150,
  },
  {
    strategy: "Max Attack Score",
    explanation:
      "Maximizes the attack score based on false positive and false negative rates.",
    length: 155,
  },
  {
    strategy: "Max Success Rate",
    explanation:
      "Maximizes the probability of correctly identifying the model's type as retrained or unlearned.",
    length: 150,
  },
  {
    strategy: "Common Threshold",
    explanation:
      "Sets a single threshold that maximizes the sum of attack scores across two different models.",
    length: 160,
  },
];

export const LINE_GRAPH_LEGEND_DATA: LineGraphLegendData[] = [
  { color: TABLEAU10[2], label: "Attack Score" }, // red
  { color: TABLEAU10[0], label: "False Positive Rate" }, // blue
  { color: TABLEAU10[4], label: "False Negative Rate" }, // green
];
