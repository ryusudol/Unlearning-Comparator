import { ViewMode } from "../types/embeddings";

export const VIEW_MODES: ViewMode[] = [
  {
    label: "All",
    explanation:
      "Shows the entire dataset, including both retain and forget classes.",
    length: 50,
  },
  {
    label: "Target to Forget",
    explanation:
      "Shows all instances of the forget class, which the model should unlearn.",
    length: 125,
  },
  {
    label: "Correctly Forgotten",
    explanation:
      "Shows forget class instances successfully unlearned; the model no longer correctly classifies them.",
    length: 145,
  },
  {
    label: "Not Forgotten",
    explanation:
      "Shows forget class instances that the model has not forgotten; it still correctly classifies them.",
    length: 110,
  },
  {
    label: "Overly Forgotten",
    explanation:
      "Shows retain class instances mistakenly unlearned; the model should still recognize them.",
    length: 130,
  },
];
