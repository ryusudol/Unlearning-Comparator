import { ViewMode } from "../types/embeddings";

export const VIEW_MODES: ViewMode[] = [
  {
    label: "All",
    explanation: "Shows all instances from both retain and forget classes.",
    length: 60,
  },
  {
    label: "Target to Forget",
    explanation:
      "Shows all forget class instances that the model is supposed to unlearn.",
    length: 125,
  },
  {
    label: "Correctly Forgotten",
    explanation:
      "Shows forget class instances that the model successfully unlearned and now misclassifies.",
    length: 145,
  },
  {
    label: "Not Forgotten",
    explanation:
      "Shows forget class instances that the model failed to unlearn and still correctly classifies.",
    length: 110,
  },
  {
    label: "Overly Forgotten",
    explanation:
      "Shows retain class instances that the model was not supposed to unlearn but did.",
    length: 130,
  },
];
