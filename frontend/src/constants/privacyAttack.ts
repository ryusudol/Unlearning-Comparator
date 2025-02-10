import {
  ThresholdStrategy,
  LineGraphLegendData,
} from "../types/privacy-attack";

export const ATTACK_METHODS = ["Logit Entropy", "Max Confidence"];

export const THRESHOLD_STRATEGIES: ThresholdStrategy[] = [
  {
    strategy: "MAX ATTACK SCORE",
    introduction: "Maximizes a quality score from FPR and FNR",
    explanation:
      "A single threshold is applied to compare models fairly under the same decision boundary. By optimizing their combined measure, we see how each model’s forgetting potential fares without giving either one a customized advantage.",
  },
  {
    strategy: "MAX SUCCESS RATE",
    introduction: "Targets the highest overall attack accuracy",
    explanation:
      "This strategy focuses on a measure penalizing both false positives and false negatives. By choosing the highest forgetting score, it highlights how the model effectively “forgets” removed samples, revealing potential membership inference vulnerability.",
  },
  {
    strategy: "COMMON THRESHOLD",
    introduction:
      "Uses a single threshold for both models, maximizing quality score sum",
    explanation:
      "This approach centers on maximizing correct classification of whether a sample came from the retrain or the unlearned model, highlighting how easily an attacker can identify membership. It underscores the model’s immediate privacy risk",
  },
];

export const LINE_GRAPH_LEGEND_DATA: LineGraphLegendData[] = [
  { color: "red", label: "Attack Score" },
  { color: "blue", label: "False Positive Rate" },
  { color: "green", label: "False Negative Rate" },
];
