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
    explanation: "Set threshold manually with a slider",
    length: 135,
  },
  {
    strategy: "Max Attack Score",
    explanation: "Maximizes the attack score based on FPR and FNR",
    length: 140,
  },
  {
    strategy: "Max Success Rate",
    explanation: "Targets the highest attack success rate",
    length: 135,
  },
  {
    strategy: "Common Threshold",
    explanation: "A single threshold that maximizes attack scores",
    length: 145,
  },
];

export const LINE_GRAPH_LEGEND_DATA: LineGraphLegendData[] = [
  { color: TABLEAU10[2], label: "Attack Score" }, // red
  { color: TABLEAU10[0], label: "False Positive Rate" }, // blue
  { color: TABLEAU10[4], label: "False Negative Rate" }, // green
];
